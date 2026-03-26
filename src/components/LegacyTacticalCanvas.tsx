import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { GeoJsonFeature, GeoJsonGeometry, GeoJsonPosition, LayerDefinition, MapFeatureRef } from '../types';
import { computeFeatureCollectionBounds, getFeatureByRef } from '../utils/geojson';

interface Props {
  layers: LayerDefinition[];
  activeLayerId: string | null;
  selectedFeatureRef: MapFeatureRef | null;
  onActiveLayerChange: (layerId: string) => void;
  onSelectedFeatureChange: (featureRef: MapFeatureRef | null) => void;
}

const DEFAULT_BBOX: [number, number, number, number] = [-73.995, 40.71, -73.93, 40.78];

function collectBounds(layers: LayerDefinition[]) {
  const visible = layers.filter((layer) => layer.visible);
  if (!visible.length) return DEFAULT_BBOX;

  const boxes = visible
    .map((layer) => computeFeatureCollectionBounds(layer.data))
    .filter((bbox): bbox is [number, number, number, number] => Array.isArray(bbox));

  if (!boxes.length) return DEFAULT_BBOX;

  return boxes.reduce<[number, number, number, number]>(
    (acc, bbox) => [
      Math.min(acc[0], bbox[0]),
      Math.min(acc[1], bbox[1]),
      Math.max(acc[2], bbox[2]),
      Math.max(acc[3], bbox[3]),
    ],
    [...boxes[0]] as [number, number, number, number],
  );
}

function projectPosition(position: GeoJsonPosition, bbox: [number, number, number, number]) {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const x = ((position[0] - minLng) / (maxLng - minLng || 1)) * 100;
  const y = (1 - (position[1] - minLat) / (maxLat - minLat || 1)) * 100;
  return {
    x: Math.max(2, Math.min(98, x)),
    y: Math.max(2, Math.min(98, y)),
  };
}

function geometryToSvgPaths(geometry: GeoJsonGeometry, bbox: [number, number, number, number]) {
  const makePath = (positions: GeoJsonPosition[]) =>
    positions.map((position) => {
      const projected = projectPosition(position, bbox);
      return `${projected.x},${projected.y}`;
    }).join(' ');

  switch (geometry.type) {
    case 'Point':
      return [{ kind: 'point' as const, positions: [projectPosition(geometry.coordinates, bbox)] }];
    case 'MultiPoint':
      return geometry.coordinates.map((position) => ({ kind: 'point' as const, positions: [projectPosition(position, bbox)] }));
    case 'LineString':
      return [{ kind: 'line' as const, positions: makePath(geometry.coordinates) }];
    case 'MultiLineString':
      return geometry.coordinates.map((line) => ({ kind: 'line' as const, positions: makePath(line) }));
    case 'Polygon':
      return geometry.coordinates.map((ring) => ({ kind: 'polygon' as const, positions: makePath(ring) }));
    case 'MultiPolygon':
      return geometry.coordinates.flatMap((polygon) => polygon.map((ring) => ({ kind: 'polygon' as const, positions: makePath(ring) })));
  }
}

export function LegacyTacticalCanvas({
  layers,
  activeLayerId,
  selectedFeatureRef,
  onActiveLayerChange,
  onSelectedFeatureChange,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState({ x: 0, y: 0, show: false, lat: 0, lng: 0 });
  const [hoveredIntersection, setHoveredIntersection] = useState<{ x: number; y: number; lat: number; lng: number } | null>(null);
  const [gridDensity, setGridDensity] = useState<'sparse' | 'normal' | 'dense'>('normal');
  const [gridColorTheme, setGridColorTheme] = useState<'white' | 'yellow' | 'blue'>('white');
  const [openDropdown, setOpenDropdown] = useState<'density' | 'color' | null>(null);
  const [showWeather, setShowWeather] = useState(false);
  const [hoveredFeature, setHoveredFeature] = useState<{ layerId: string; feature: GeoJsonFeature; mouseX: number; mouseY: number } | null>(null);

  const visibleLayers = useMemo(
    () => [...layers].filter((layer) => layer.visible).sort((a, b) => a.zIndex - b.zIndex),
    [layers],
  );
  const bbox = useMemo(() => collectBounds(visibleLayers), [visibleLayers]);
  const selectedFeature = useMemo(() => getFeatureByRef(layers, selectedFeatureRef), [layers, selectedFeatureRef]);

  const gridSettings = {
    sparse: { major: '20%', minor: '4%' },
    normal: { major: '10%', minor: '2%' },
    dense: { major: '5%', minor: '1%' },
  };

  const colorSettings = {
    white: { major: 'rgba(255,255,255,0.08)', minor: 'rgba(255,255,255,0.02)' },
    yellow: { major: 'rgba(229,255,0,0.15)', minor: 'rgba(229,255,0,0.04)' },
    blue: { major: 'rgba(0,85,212,0.2)', minor: 'rgba(0,85,212,0.05)' },
  };

  const currentGrid = gridSettings[gridDensity];
  const currentColor = colorSettings[gridColorTheme];

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const xPct = (x / rect.width) * 100;
    const yPct = (y / rect.height) * 100;

    const lng = bbox[0] + (xPct / 100) * (bbox[2] - bbox[0]);
    const lat = bbox[1] + (1 - yPct / 100) * (bbox[3] - bbox[1]);
    setCursor({ x, y, show: true, lat, lng });

    if (hoveredFeature) {
      setHoveredFeature({ ...hoveredFeature, mouseX: x, mouseY: y });
    }

    const spacing = parseFloat(currentGrid.minor);
    const snapXPct = Math.round(xPct / spacing) * spacing;
    const snapYPct = Math.round(yPct / spacing) * spacing;
    const snapX = (snapXPct / 100) * rect.width;
    const snapY = (snapYPct / 100) * rect.height;
    const dist = Math.hypot(x - snapX, y - snapY);

    if (dist < 10) {
      const snapLng = bbox[0] + (snapXPct / 100) * (bbox[2] - bbox[0]);
      const snapLat = bbox[1] + (1 - snapYPct / 100) * (bbox[3] - bbox[1]);
      setHoveredIntersection({ x: snapX, y: snapY, lat: snapLat, lng: snapLng });
    } else {
      setHoveredIntersection(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.5, ease: 'easeOut' }}
      className="relative w-full aspect-[4/3] bg-terrain-grey border-2 border-ink overflow-hidden shadow-[4px_6px_15px_rgba(0,0,0,0.6)] rotate-[0.15deg] cursor-crosshair tactical-canvas-bg"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        setCursor((prev) => ({ ...prev, show: false }));
        setHoveredFeature(null);
        setHoveredIntersection(null);
      }}
    >
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
          backgroundPosition: '-1px -1px',
        }}
      />

      <div
        className="absolute top-2.5 left-3 z-[100] flex flex-col gap-1.5 pointer-events-auto"
        onMouseMove={(event) => event.stopPropagation()}
        onMouseLeave={() => setOpenDropdown(null)}
      >
        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'density' ? null : 'density')}
            className="flex items-center justify-between w-[92px] bg-[rgba(93,104,92,0.85)] px-2 py-1 shadow-sm text-[0.55rem] font-mono font-bold text-ink uppercase tracking-widest"
          >
            <span>GRID: {gridDensity.charAt(0)}</span>
            <span className="text-[0.4rem] opacity-70">▼</span>
          </button>
          {openDropdown === 'density' && (
            <div className="absolute top-full left-0 mt-0.5 w-full bg-ink border border-[rgba(93,104,92,0.85)] shadow-md flex flex-col z-[110]">
              {(['sparse', 'normal', 'dense'] as const).map((density) => (
                <button
                  key={density}
                  onClick={() => {
                    setGridDensity(density);
                    setOpenDropdown(null);
                  }}
                  className={`text-left px-2 py-1.5 text-[0.55rem] font-mono uppercase tracking-widest transition-colors ${gridDensity === density ? 'bg-acid-yellow text-ink' : 'text-archival-white hover:bg-[rgba(255,255,255,0.1)]'}`}
                >
                  {density}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'color' ? null : 'color')}
            className="flex items-center justify-between w-[92px] bg-[rgba(93,104,92,0.85)] px-2 py-1 shadow-sm text-[0.55rem] font-mono font-bold text-ink uppercase tracking-widest"
          >
            <span>TINT: {gridColorTheme.substring(0, 3)}</span>
            <span className="text-[0.4rem] opacity-70">▼</span>
          </button>
          {openDropdown === 'color' && (
            <div className="absolute top-full left-0 mt-0.5 w-full bg-ink border border-[rgba(93,104,92,0.85)] shadow-md flex flex-col z-[110]">
              {(['white', 'yellow', 'blue'] as const).map((theme) => (
                <button
                  key={theme}
                  onClick={() => {
                    setGridColorTheme(theme);
                    setOpenDropdown(null);
                  }}
                  className={`text-left px-2 py-1.5 text-[0.55rem] font-mono uppercase tracking-widest transition-colors ${gridColorTheme === theme ? 'bg-acid-yellow text-ink' : 'text-archival-white hover:bg-[rgba(255,255,255,0.1)]'}`}
                >
                  {theme}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowWeather((value) => !value)}
          className={`flex items-center justify-center w-[92px] px-2 py-1 shadow-sm text-[0.55rem] font-mono font-bold uppercase tracking-widest transition-colors ${showWeather ? 'bg-acid-yellow text-ink' : 'bg-[rgba(93,104,92,0.85)] text-ink'}`}
        >
          WX DATA
        </button>
      </div>

      <svg viewBox="0 0 100 100" className="absolute inset-0 z-20 h-full w-full">
        {visibleLayers.map((layer) => (
          <g key={layer.id} opacity={layer.opacity}>
            {layer.data.features.flatMap((feature) =>
              geometryToSvgPaths(feature.geometry, bbox).map((shape, index) => {
                const isSelected = selectedFeatureRef?.layerId === layer.id && selectedFeatureRef.featureId === feature.id;
                const stroke = isSelected ? '#E5FF00' : layer.style.outlineColor ?? layer.style.color;
                const fill = isSelected ? 'rgba(229,255,0,0.28)' : layer.style.color;
                const activeStroke = activeLayerId === layer.id ? '#F0F0F0' : stroke;

                if (shape.kind === 'point') {
                  const point = shape.positions[0];
                  return (
                    <circle
                      key={`${feature.id}-point-${index}`}
                      cx={point.x}
                      cy={point.y}
                      r={isSelected ? (layer.style.radius ?? 5) * 0.42 : (layer.style.radius ?? 5) * 0.32}
                      fill={fill}
                      stroke={activeStroke}
                      strokeWidth={isSelected ? 0.45 : 0.22}
                      onMouseEnter={() => setHoveredFeature({ layerId: layer.id, feature, mouseX: cursor.x, mouseY: cursor.y })}
                      onClick={() => {
                        onActiveLayerChange(layer.id);
                        onSelectedFeatureChange({ layerId: layer.id, featureId: feature.id });
                      }}
                    />
                  );
                }

                if (shape.kind === 'line') {
                  return (
                    <polyline
                      key={`${feature.id}-line-${index}`}
                      points={shape.positions}
                      fill="none"
                      stroke={isSelected ? '#E5FF00' : layer.style.color}
                      strokeWidth={isSelected ? 0.75 : 0.48}
                      strokeDasharray={layer.style.lineDasharray?.join(' ') ?? undefined}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                      onMouseEnter={() => setHoveredFeature({ layerId: layer.id, feature, mouseX: cursor.x, mouseY: cursor.y })}
                      onClick={() => {
                        onActiveLayerChange(layer.id);
                        onSelectedFeatureChange({ layerId: layer.id, featureId: feature.id });
                      }}
                    />
                  );
                }

                return (
                  <polygon
                    key={`${feature.id}-poly-${index}`}
                    points={shape.positions}
                    fill={isSelected ? 'rgba(229,255,0,0.22)' : `${layer.style.color}${layer.style.fillOpacity ? '' : ''}`}
                    opacity={isSelected ? 0.9 : layer.style.fillOpacity ?? 0.22}
                    stroke={activeStroke}
                    strokeWidth={isSelected ? 0.65 : 0.35}
                    onMouseEnter={() => setHoveredFeature({ layerId: layer.id, feature, mouseX: cursor.x, mouseY: cursor.y })}
                    onClick={() => {
                      onActiveLayerChange(layer.id);
                      onSelectedFeatureChange({ layerId: layer.id, featureId: feature.id });
                    }}
                  />
                );
              }),
            )}
          </g>
        ))}
      </svg>

      <div className="absolute bottom-2.5 left-3 text-ink text-[0.6rem] font-bold tracking-[1px] uppercase z-[100] bg-[rgba(93,104,92,0.85)] px-2 py-0.5 font-mono pointer-events-none">
        Fig. 2 — Legacy Tactical Overlay
      </div>

      <div className={`absolute top-2.5 right-3 font-mono text-right leading-[1.6] pointer-events-none transition-all duration-200 z-[100] ${hoveredIntersection ? 'text-archival-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] scale-110 origin-top-right font-bold text-[0.6rem]' : 'text-acid-yellow drop-shadow-[0_0_4px_rgba(229,255,0,0.3)] font-semibold text-[0.55rem] tracking-[0.5px]'}`}>
        LAT: {cursor.show ? (hoveredIntersection ? hoveredIntersection.lat.toFixed(6) : cursor.lat.toFixed(6)) : '---.------'}<br />
        LNG: {cursor.show ? (hoveredIntersection ? hoveredIntersection.lng.toFixed(6) : cursor.lng.toFixed(6)) : '---.------'}
      </div>

      {cursor.show && (
        <>
          <div className="absolute h-[1px] left-0 right-0 bg-[rgba(229,255,0,0.15)] pointer-events-none z-50" style={{ top: cursor.y }} />
          <div className="absolute w-[1px] top-0 bottom-0 bg-[rgba(229,255,0,0.15)] pointer-events-none z-50" style={{ left: cursor.x }} />
        </>
      )}

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
          <div className="flex justify-between items-center"><span className="opacity-70">TEMP</span><span className="font-bold text-archival-white">18°C</span></div>
          <div className="flex justify-between items-center"><span className="opacity-70">WIND SPD</span><span className="font-bold text-archival-white">12 KT</span></div>
          <div className="flex justify-between items-center"><span className="opacity-70">WIND DIR</span><span className="font-bold text-archival-white">NW (315°)</span></div>
        </motion.div>
      )}

      {hoveredFeature && (
        <div
          className="absolute bg-ink text-acid-yellow text-[0.55rem] font-mono px-2 py-1 border border-acid-yellow pointer-events-none z-[200] whitespace-nowrap tracking-[0.5px] shadow-[0_0_12px_rgba(229,255,0,0.2)]"
          style={{ left: hoveredFeature.mouseX + 12, top: hoveredFeature.mouseY - 20 }}
        >
          {hoveredFeature.feature.properties.name ?? hoveredFeature.feature.id} | {hoveredFeature.feature.geometry.type}
        </div>
      )}

      {selectedFeature && (
        <div className="absolute right-3 bottom-3 z-[110] border border-radar-blue/30 bg-black/55 px-3 py-2 font-mono text-[0.55rem] text-archival-white">
          <div className="uppercase tracking-[0.22em] text-radar-blue">Selected</div>
          <div className="mt-1">{selectedFeature.properties.name ?? selectedFeature.id}</div>
        </div>
      )}
    </motion.div>
  );
}
