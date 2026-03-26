import React, { useState, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { projectToCanvas, canvasToCoord, BBOX } from '../utils/geo';
import type { GeoFeature, FilterState, FeatureType } from '../types';

const sizeMap: Record<FeatureType, number> = {
  infrastructure: 3,
  pathway: 4,
  organic: 5,
  zone: 5
};

const colorMap: Record<FeatureType, string> = {
  infrastructure: '#151515',
  pathway: '#FF6600',
  organic: '#FF007F',
  zone: '#E5FF00'
};

const order = ['infrastructure', 'pathway', 'organic', 'zone'];

function GeoCircle({ centerLng, centerLat, radiusKm, cssClass, delay }: any) {
  const latPerKm = 1 / 111;
  const lngPerKm = 1 / (111 * Math.cos(centerLat * Math.PI / 180));

  const radiusLat = radiusKm * latPerKm;
  const radiusLng = radiusKm * lngPerKm;

  const center = projectToCanvas(centerLng, centerLat);

  const pxRadiusX = (radiusLng / (BBOX.maxLng - BBOX.minLng)) * 100;
  const pxRadiusY = (radiusLat / (BBOX.maxLat - BBOX.minLat)) * 100;
  const avgRadius = (pxRadiusX + pxRadiusY) / 2;

  let borderClass = '';
  let bgClass = 'bg-transparent';
  let shadowClass = '';

  if (cssClass === 'radius-orange') {
    borderClass = 'border-flare-orange';
    shadowClass = 'shadow-[0_0_8px_rgba(255,102,0,0.3)]';
  } else if (cssClass === 'radius-pink') {
    borderClass = 'border-marker-pink';
    shadowClass = 'shadow-[0_0_8px_rgba(255,0,127,0.3)]';
  } else if (cssClass === 'radius-blue') {
    borderClass = 'border-tension-blue';
    shadowClass = 'shadow-[0_0_8px_rgba(0,85,212,0.3)]';
  } else if (cssClass === 'fill-zone') {
    borderClass = 'border-acid-yellow';
    bgClass = 'bg-[rgba(229,255,0,0.06)]';
  }

  return (
    <div 
      className={`absolute rounded-full border-[1.5px] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40 opacity-0 animate-circle-appear ${borderClass} ${bgClass} ${shadowClass}`}
      style={{
        left: `${center.x}%`,
        top: `${center.y}%`,
        width: `${avgRadius * 2}%`,
        height: `${avgRadius * 2}%`,
        animationDelay: `${delay}s`
      }}
    />
  );
}

interface HoveredNode extends GeoFeature {
  id: number;
  mouseX: number;
  mouseY: number;
}

export function TacticalCanvas({ features, activeFilters, toggleFilter }: { features: GeoFeature[], activeFilters: FilterState, toggleFilter?: (type: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0, show: false, lat: 0, lng: 0 });
  const [hoveredNode, setHoveredNode] = useState<HoveredNode | null>(null);

  const [gridDensity, setGridDensity] = useState<'sparse' | 'normal' | 'dense'>('normal');
  const [gridColorTheme, setGridColorTheme] = useState<'white' | 'yellow' | 'blue'>('white');
  const [openDropdown, setOpenDropdown] = useState<'density' | 'color' | 'features' | null>(null);
  const [hoveredIntersection, setHoveredIntersection] = useState<{x: number, y: number, lat: number, lng: number} | null>(null);
  const [showWeather, setShowWeather] = useState(false);

  const sortedFeatures = useMemo(() => {
    return [...features].sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
  }, [features]);

  const gridSettings = {
    sparse: { major: '20%', minor: '4%' },
    normal: { major: '10%', minor: '2%' },
    dense: { major: '5%', minor: '1%' }
  };
  
  const colorSettings = {
    white: { major: 'rgba(255,255,255,0.08)', minor: 'rgba(255,255,255,0.02)' },
    yellow: { major: 'rgba(229,255,0,0.15)', minor: 'rgba(229,255,0,0.04)' },
    blue: { major: 'rgba(0,85,212,0.2)', minor: 'rgba(0,85,212,0.05)' }
  };

  const currentGrid = gridSettings[gridDensity];
  const currentColor = colorSettings[gridColorTheme];

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const xPct = (x / rect.width) * 100;
    const yPct = (y / rect.height) * 100;
    
    const coord = canvasToCoord(xPct, yPct);
    setCursor({ x, y, show: true, lat: coord.lat, lng: coord.lng });

    if (hoveredNode) {
      setHoveredNode({ ...hoveredNode, mouseX: x, mouseY: y });
    }

    const spacing = parseFloat(currentGrid.minor);
    const snapXPct = Math.round(xPct / spacing) * spacing;
    const snapYPct = Math.round(yPct / spacing) * spacing;
    const snapX = (snapXPct / 100) * rect.width;
    const snapY = (snapYPct / 100) * rect.height;
    const dist = Math.hypot(x - snapX, y - snapY);

    if (dist < 10) {
      const snapCoord = canvasToCoord(snapXPct, snapYPct);
      setHoveredIntersection({ x: snapX, y: snapY, lat: snapCoord.lat, lng: snapCoord.lng });
    } else {
      setHoveredIntersection(null);
    }
  };

  const handleMouseLeave = () => {
    setCursor(prev => ({ ...prev, show: false }));
    setHoveredNode(null);
    setHoveredIntersection(null);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
      className="relative w-full aspect-[4/3] bg-terrain-grey border-2 border-ink overflow-hidden shadow-[4px_6px_15px_rgba(0,0,0,0.6)] rotate-[0.3deg] cursor-crosshair tactical-canvas-bg"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Dynamic Grid Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          backgroundImage: `
            linear-gradient(${currentColor.major} 1px, transparent 1px),
            linear-gradient(90deg, ${currentColor.major} 1px, transparent 1px),
            linear-gradient(${currentColor.minor} 1px, transparent 1px),
            linear-gradient(90deg, ${currentColor.minor} 1px, transparent 1px)
          `,
          backgroundSize: `
            ${currentGrid.major} ${currentGrid.major},
            ${currentGrid.major} ${currentGrid.major},
            ${currentGrid.minor} ${currentGrid.minor},
            ${currentGrid.minor} ${currentGrid.minor}
          `,
          backgroundPosition: '-1px -1px'
        }}
      />

      {/* Grid Controls */}
      <div 
        className="absolute top-2.5 left-3 z-[100] flex flex-col gap-1.5 pointer-events-auto"
        onMouseMove={(e) => e.stopPropagation()}
        onMouseLeave={() => setOpenDropdown(null)}
      >
        <div className="relative">
          <button 
            onClick={() => setOpenDropdown(openDropdown === 'density' ? null : 'density')}
            className="flex items-center justify-between w-[85px] bg-[rgba(93,104,92,0.85)] px-2 py-1 shadow-sm text-[0.55rem] font-mono font-bold text-ink uppercase tracking-widest hover:bg-[rgba(93,104,92,1)] transition-colors"
          >
            <span>GRID: {gridDensity.charAt(0)}</span>
            <span className="text-[0.4rem] opacity-70">▼</span>
          </button>
          
          {openDropdown === 'density' && (
            <div className="absolute top-full left-0 mt-0.5 w-full bg-ink border border-[rgba(93,104,92,0.85)] shadow-md flex flex-col z-[110]">
              {(['sparse', 'normal', 'dense'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => { setGridDensity(d); setOpenDropdown(null); }}
                  className={`text-left px-2 py-1.5 text-[0.55rem] font-mono uppercase tracking-widest transition-colors ${gridDensity === d ? 'bg-acid-yellow text-ink' : 'text-archival-white hover:bg-[rgba(255,255,255,0.1)]'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button 
            onClick={() => setOpenDropdown(openDropdown === 'color' ? null : 'color')}
            className="flex items-center justify-between w-[85px] bg-[rgba(93,104,92,0.85)] px-2 py-1 shadow-sm text-[0.55rem] font-mono font-bold text-ink uppercase tracking-widest hover:bg-[rgba(93,104,92,1)] transition-colors"
          >
            <span>TINT: {gridColorTheme.substring(0,3)}</span>
            <span className="text-[0.4rem] opacity-70">▼</span>
          </button>
          
          {openDropdown === 'color' && (
            <div className="absolute top-full left-0 mt-0.5 w-full bg-ink border border-[rgba(93,104,92,0.85)] shadow-md flex flex-col z-[110]">
              {(['white', 'yellow', 'blue'] as const).map(c => (
                <button
                  key={c}
                  onClick={() => { setGridColorTheme(c); setOpenDropdown(null); }}
                  className={`text-left px-2 py-1.5 text-[0.55rem] font-mono uppercase tracking-widest transition-colors ${gridColorTheme === c ? 'bg-acid-yellow text-ink' : 'text-archival-white hover:bg-[rgba(255,255,255,0.1)]'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button 
            onClick={() => setOpenDropdown(openDropdown === 'features' ? null : 'features')}
            className="flex items-center justify-between w-[85px] bg-[rgba(93,104,92,0.85)] px-2 py-1 shadow-sm text-[0.55rem] font-mono font-bold text-ink uppercase tracking-widest hover:bg-[rgba(93,104,92,1)] transition-colors"
          >
            <span>LAYERS</span>
            <span className="text-[0.4rem] opacity-70">▼</span>
          </button>
          
          {openDropdown === 'features' && toggleFilter && (
            <div className="absolute top-full left-0 mt-0.5 w-full bg-ink border border-[rgba(93,104,92,0.85)] shadow-md flex flex-col z-[110]">
              {order.map(type => (
                <button
                  key={type}
                  onClick={() => toggleFilter(type)}
                  className="flex items-center justify-between px-2 py-1.5 text-[0.55rem] font-mono uppercase tracking-widest transition-colors text-archival-white hover:bg-[rgba(255,255,255,0.1)]"
                >
                  <span>{type.substring(0, 4)}</span>
                  <div className={`w-2 h-2 rounded-sm border ${activeFilters[type] ? 'bg-acid-yellow border-acid-yellow' : 'border-[#666]'}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative mt-1">
          <button 
            onClick={() => setShowWeather(!showWeather)}
            className={`flex items-center justify-center w-[85px] px-2 py-1 shadow-sm text-[0.55rem] font-mono font-bold uppercase tracking-widest transition-colors ${showWeather ? 'bg-acid-yellow text-ink' : 'bg-[rgba(93,104,92,0.85)] text-ink hover:bg-[rgba(93,104,92,1)]'}`}
          >
            WX DATA
          </button>
        </div>
      </div>

      <div className="absolute bottom-2.5 left-3 text-ink text-[0.6rem] font-bold tracking-[1px] uppercase z-[100] bg-[rgba(93,104,92,0.85)] px-2 py-0.5 font-mono pointer-events-none">
        Fig. 1 — GeoJSON Scatter • Palantir Circle Protocol
      </div>
      
      <div className={`absolute top-2.5 right-3 font-mono text-right leading-[1.6] pointer-events-none transition-all duration-200 z-[100] ${hoveredIntersection ? 'text-archival-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] scale-110 origin-top-right font-bold text-[0.6rem]' : 'text-acid-yellow drop-shadow-[0_0_4px_rgba(229,255,0,0.3)] font-semibold text-[0.55rem] tracking-[0.5px]'}`}>
        LAT: {cursor.show ? (hoveredIntersection ? hoveredIntersection.lat.toFixed(6) : cursor.lat.toFixed(6)) : '---.------'}<br/>
        LNG: {cursor.show ? (hoveredIntersection ? hoveredIntersection.lng.toFixed(6) : cursor.lng.toFixed(6)) : '---.------'}
      </div>

      {cursor.show && (
        <>
          <div className="absolute h-[1px] left-0 right-0 bg-[rgba(229,255,0,0.15)] pointer-events-none z-50" style={{ top: cursor.y }} />
          <div className="absolute w-[1px] top-0 bottom-0 bg-[rgba(229,255,0,0.15)] pointer-events-none z-50" style={{ left: cursor.x }} />
        </>
      )}

      {/* Weather Data Overlay */}
      {showWeather && (
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute bottom-3 right-3 bg-ink/90 border border-acid-yellow p-3 font-mono text-acid-yellow text-[0.6rem] z-[100] shadow-[0_0_15px_rgba(229,255,0,0.15)] backdrop-blur-sm flex flex-col gap-2 min-w-[140px] pointer-events-none"
        >
          <div className="font-bold tracking-widest border-b border-acid-yellow/30 pb-1 mb-1 flex justify-between">
            <span>LOCAL WX</span>
            <span className="opacity-70 animate-pulse">LIVE</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="opacity-70">TEMP</span>
            <span className="font-bold text-archival-white">18°C</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="opacity-70">WIND SPD</span>
            <span className="font-bold text-archival-white">12 KT</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="opacity-70">WIND DIR</span>
            <span className="font-bold text-archival-white">NW (315°)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="opacity-70">HUMIDITY</span>
            <span className="font-bold text-archival-white">42%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="opacity-70">PRECIP</span>
            <span className="font-bold text-archival-white">0.0 mm/h</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="opacity-70">VIS</span>
            <span className="font-bold text-archival-white">10+ SM</span>
          </div>
        </motion.div>
      )}

      {/* Intersection Highlight & Tooltip */}
      {hoveredIntersection && !hoveredNode && (
        <>
          <div 
            className="absolute w-4 h-4 border border-archival-white rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[150] shadow-[0_0_8px_rgba(255,255,255,0.6)] animate-pulse"
            style={{ left: hoveredIntersection.x, top: hoveredIntersection.y }} 
          />
          <div 
            className="absolute w-1 h-1 bg-archival-white rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[150]"
            style={{ left: hoveredIntersection.x, top: hoveredIntersection.y }} 
          />
          <div 
            className="absolute bg-archival-white text-ink text-[0.55rem] font-bold font-mono px-2 py-1 pointer-events-none z-[200] whitespace-nowrap tracking-[0.5px] shadow-[0_0_12px_rgba(255,255,255,0.4)]"
            style={{ left: hoveredIntersection.x + 12, top: hoveredIntersection.y + 12 }}
          >
            GRID INT | {hoveredIntersection.lat.toFixed(6)}, {hoveredIntersection.lng.toFixed(6)}
          </div>
        </>
      )}

      {/* Circles */}
      <GeoCircle centerLng={-73.955} centerLat={40.735} radiusKm={0.8} cssClass="radius-pink" delay={0.8} />
      <GeoCircle centerLng={-73.980} centerLat={40.755} radiusKm={1.0} cssClass="radius-blue" delay={1.0} />
      <GeoCircle centerLng={-73.950} centerLat={40.750} radiusKm={1.5} cssClass="fill-zone" delay={1.2} />
      <GeoCircle centerLng={-73.965} centerLat={40.740} radiusKm={0.6} cssClass="radius-orange" delay={1.4} />

      {/* Nodes */}
      {sortedFeatures.map((f, i) => {
        const isVisible = activeFilters[f.type];
        const pos = projectToCanvas(f.lng, f.lat);
        const size = sizeMap[f.type] || 4;
        const color = colorMap[f.type];
        const isHovered = hoveredNode?.id === i;

        return (
          <div
            key={i}
            className={`absolute rounded-full -translate-x-1/2 -translate-y-1/2 z-30 transition-transform duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] ${isVisible ? 'scale-100' : 'scale-0'}`}
            style={{
              width: size,
              height: size,
              backgroundColor: color,
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: isHovered ? 'translate(-50%, -50%) scale(3)' : 'translate(-50%, -50%) scale(1)',
              boxShadow: isHovered ? `0 0 8px ${color}` : 'none'
            }}
            onMouseEnter={() => setHoveredNode({ id: i, ...f, mouseX: cursor.x, mouseY: cursor.y })}
            onMouseLeave={() => setHoveredNode(null)}
          />
        );
      })}

      {/* Tooltip */}
      {hoveredNode && (
        <div 
          className="absolute bg-ink text-acid-yellow text-[0.55rem] font-mono px-2 py-1 border border-acid-yellow pointer-events-none z-[200] whitespace-nowrap tracking-[0.5px] shadow-[0_0_12px_rgba(229,255,0,0.2)]"
          style={{
            left: hoveredNode.mouseX + 12,
            top: hoveredNode.mouseY - 20
          }}
        >
          {hoveredNode.type.toUpperCase()} | {hoveredNode.lat.toFixed(6)}, {hoveredNode.lng.toFixed(6)}
        </div>
      )}
    </motion.div>
  );
}
