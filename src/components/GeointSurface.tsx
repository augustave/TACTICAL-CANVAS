import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import type { BBox, GeoJsonFeature, GeoJsonGeometry, GeoJsonPosition, GeointViewportState, LayerDefinition, MapFeatureRef, MapFocusRequest } from '../types';
import { computeFeatureBounds, computeFeatureCollectionBounds, getFeatureByRef, getLayerById } from '../utils/geojson';

interface Props {
  layers: LayerDefinition[];
  activeLayerId: string | null;
  selectedFeatureRef: MapFeatureRef | null;
  focusRequest: MapFocusRequest | null;
  onActiveLayerChange: (layerId: string) => void;
  onSelectedFeatureChange: (featureRef: MapFeatureRef | null) => void;
  onViewportChange: (viewport: GeointViewportState) => void;
  onFocusRequestHandled: (token: number) => void;
}

const DEFAULT_BBOX: BBox = [-73.995, 40.71, -73.93, 40.78];

function expandBBox(bbox: BBox, factor = 0.1): BBox {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const lngSpan = maxLng - minLng || 0.02;
  const latSpan = maxLat - minLat || 0.02;
  const lngPad = Math.max(lngSpan * factor, 0.004);
  const latPad = Math.max(latSpan * factor, 0.004);
  return [minLng - lngPad, minLat - latPad, maxLng + lngPad, maxLat + latPad];
}

function mergeBounds(bounds: BBox[]): BBox {
  return bounds.reduce<BBox>(
    (acc, bbox) => [
      Math.min(acc[0], bbox[0]),
      Math.min(acc[1], bbox[1]),
      Math.max(acc[2], bbox[2]),
      Math.max(acc[3], bbox[3]),
    ],
    [...bounds[0]] as BBox,
  );
}

function collectSceneBounds(layers: LayerDefinition[]) {
  const visibleBounds = layers
    .filter((layer) => layer.visible)
    .map((layer) => computeFeatureCollectionBounds(layer.data))
    .filter((bbox): bbox is BBox => Array.isArray(bbox));

  if (!visibleBounds.length) {
    return DEFAULT_BBOX;
  }

  return expandBBox(mergeBounds(visibleBounds), 0.08);
}

function projectPosition(position: GeoJsonPosition, bbox: BBox) {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const x = ((position[0] - minLng) / (maxLng - minLng || 1)) * 100;
  const y = (1 - (position[1] - minLat) / (maxLat - minLat || 1)) * 100;
  return {
    x: Math.max(1.2, Math.min(98.8, x)),
    y: Math.max(1.2, Math.min(98.8, y)),
  };
}

function geometryToSvgPaths(geometry: GeoJsonGeometry, bbox: BBox) {
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

function bboxCenter(bbox: BBox): [number, number] {
  return [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
}

function bboxZoom(sceneBounds: BBox, viewportBounds: BBox) {
  const sceneLngSpan = sceneBounds[2] - sceneBounds[0] || 0.001;
  const sceneLatSpan = sceneBounds[3] - sceneBounds[1] || 0.001;
  const viewportLngSpan = viewportBounds[2] - viewportBounds[0] || 0.001;
  const viewportLatSpan = viewportBounds[3] - viewportBounds[1] || 0.001;
  const spanRatio = Math.max(sceneLngSpan / viewportLngSpan, sceneLatSpan / viewportLatSpan);
  return Number((Math.log2(Math.max(spanRatio, 1)) + 1).toFixed(2));
}

function toViewportState(sceneBounds: BBox, viewportBounds: BBox): GeointViewportState {
  return {
    bbox: viewportBounds,
    center: bboxCenter(viewportBounds),
    zoom: bboxZoom(sceneBounds, viewportBounds),
  };
}

function pointToGeo(xRatio: number, yRatio: number, bbox: BBox) {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  return {
    lng: minLng + xRatio * (maxLng - minLng),
    lat: maxLat - yRatio * (maxLat - minLat),
  };
}

function translateBBox(bbox: BBox, dxRatio: number, dyRatio: number): BBox {
  const lngSpan = bbox[2] - bbox[0];
  const latSpan = bbox[3] - bbox[1];
  const lngShift = -dxRatio * lngSpan;
  const latShift = dyRatio * latSpan;
  return [bbox[0] + lngShift, bbox[1] + latShift, bbox[2] + lngShift, bbox[3] + latShift];
}

function zoomBBox(bbox: BBox, xRatio: number, yRatio: number, scaleFactor: number): BBox {
  const lngSpan = bbox[2] - bbox[0];
  const latSpan = bbox[3] - bbox[1];
  const nextLngSpan = lngSpan * scaleFactor;
  const nextLatSpan = latSpan * scaleFactor;
  const focus = pointToGeo(xRatio, yRatio, bbox);

  const nextMinLng = focus.lng - xRatio * nextLngSpan;
  const nextMaxLng = nextMinLng + nextLngSpan;
  const nextMaxLat = focus.lat + yRatio * nextLatSpan;
  const nextMinLat = nextMaxLat - nextLatSpan;

  return [nextMinLng, nextMinLat, nextMaxLng, nextMaxLat];
}

export function GeointSurface({
  layers,
  activeLayerId,
  selectedFeatureRef,
  focusRequest,
  onActiveLayerChange,
  onSelectedFeatureChange,
  onViewportChange,
  onFocusRequestHandled,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; bbox: BBox } | null>(null);
  const draggingRef = useRef(false);
  const suppressClickRef = useRef(false);

  const [cursor, setCursor] = useState({ x: 0, y: 0, show: false, lat: 0, lng: 0 });
  const [hoveredFeature, setHoveredFeature] = useState<{ layerId: string; feature: GeoJsonFeature; mouseX: number; mouseY: number } | null>(null);
  const [gridDensity, setGridDensity] = useState<'sparse' | 'normal' | 'dense'>('normal');
  const [gridColorTheme, setGridColorTheme] = useState<'white' | 'yellow' | 'blue'>('white');
  const [openDropdown, setOpenDropdown] = useState<'density' | 'color' | null>(null);
  const [showWeather, setShowWeather] = useState(false);
  const [viewportBounds, setViewportBounds] = useState<BBox>(DEFAULT_BBOX);

  const visibleLayers = useMemo(
    () => [...layers].filter((layer) => layer.visible).sort((a, b) => a.zIndex - b.zIndex),
    [layers],
  );
  const sceneBounds = useMemo(() => collectSceneBounds(layers), [layers]);
  const selectedFeature = useMemo(() => getFeatureByRef(layers, selectedFeatureRef), [layers, selectedFeatureRef]);

  useEffect(() => {
    setViewportBounds(sceneBounds);
  }, [sceneBounds[0], sceneBounds[1], sceneBounds[2], sceneBounds[3]]);

  useEffect(() => {
    onViewportChange(toViewportState(sceneBounds, viewportBounds));
  }, [onViewportChange, sceneBounds, viewportBounds]);

  useEffect(() => {
    if (!focusRequest) {
      return;
    }

    if (focusRequest.kind === 'layer') {
      const layer = getLayerById(layers, focusRequest.layerId);
      const bbox = layer ? computeFeatureCollectionBounds(layer.data) : undefined;
      if (bbox) {
        setViewportBounds(expandBBox(bbox, 0.12));
      }
    } else {
      const feature = getFeatureByRef(layers, { layerId: focusRequest.layerId, featureId: focusRequest.featureId ?? '' });
      const bbox = feature ? (feature.bbox ?? computeFeatureBounds(feature)) : undefined;
      if (bbox) {
        setViewportBounds(expandBBox(bbox, 0.4));
      }
    }

    onFocusRequestHandled(focusRequest.token);
  }, [focusRequest, layers, onFocusRequestHandled]);

  useEffect(() => {
    const handleWindowMouseMove = (event: MouseEvent) => {
      if (!dragStartRef.current || !containerRef.current) {
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const dxRatio = (event.clientX - dragStartRef.current.x) / rect.width;
      const dyRatio = (event.clientY - dragStartRef.current.y) / rect.height;

      if (Math.abs(dxRatio) > 0.004 || Math.abs(dyRatio) > 0.004) {
        draggingRef.current = true;
        suppressClickRef.current = true;
      }

      setViewportBounds(translateBBox(dragStartRef.current.bbox, dxRatio, dyRatio));
    };

    const handleWindowMouseUp = () => {
      dragStartRef.current = null;
      setTimeout(() => {
        draggingRef.current = false;
        suppressClickRef.current = false;
      }, 0);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, []);

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

  const updateCursor = (event: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const xRatio = x / rect.width;
    const yRatio = y / rect.height;
    const point = pointToGeo(xRatio, yRatio, viewportBounds);
    setCursor({ x, y, show: true, lat: point.lat, lng: point.lng });

    if (hoveredFeature) {
      setHoveredFeature({ ...hoveredFeature, mouseX: x, mouseY: y });
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    updateCursor(event);
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest('[data-geoint-control="true"]')) {
      return;
    }
    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      bbox: viewportBounds,
    };
  };

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const xRatio = (event.clientX - rect.left) / rect.width;
    const yRatio = (event.clientY - rect.top) / rect.height;
    const scaleFactor = event.deltaY < 0 ? 0.86 : 1.18;
    setViewportBounds((current) => zoomBBox(current, xRatio, yRatio, scaleFactor));
  };

  const zoomFromCenter = (direction: 'in' | 'out') => {
    setViewportBounds((current) => zoomBBox(current, 0.5, 0.5, direction === 'in' ? 0.86 : 1.18));
  };

  return (
    <motion.div
      data-testid="geoint-surface"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}
      className="relative w-full aspect-[4/3] cursor-crosshair overflow-hidden border-2 border-ink bg-terrain-grey shadow-[4px_6px_15px_rgba(0,0,0,0.6)] tactical-canvas-bg"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        setCursor((prev) => ({ ...prev, show: false }));
        setHoveredFeature(null);
      }}
      onWheel={handleWheel}
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
        className="absolute left-3 top-3 z-[100] flex flex-col gap-1.5 pointer-events-auto"
        data-geoint-control="true"
        onMouseMove={(event) => event.stopPropagation()}
        onMouseLeave={() => setOpenDropdown(null)}
      >
        <div className="border border-[#384347] bg-black/72 px-3 py-2 font-mono text-[0.56rem] uppercase tracking-[0.22em] text-[#9cabb0]">
          <div>2D Tactical Surface</div>
          <div className="mt-1 text-acid-yellow">{activeLayerId ? `ACTIVE ${activeLayerId.replace(/-/g, ' ')}` : 'NO ACTIVE LAYER'}</div>
        </div>

        <div className="relative">
          <button
            onClick={() => setOpenDropdown(openDropdown === 'density' ? null : 'density')}
            className="flex w-[112px] items-center justify-between border border-[#394246] bg-black/72 px-2 py-1 text-[0.55rem] font-bold uppercase tracking-widest text-archival-white"
          >
            <span>GRID: {gridDensity.charAt(0)}</span>
            <span className="text-[0.4rem] opacity-70">▼</span>
          </button>
          {openDropdown === 'density' && (
            <div className="absolute left-0 top-full mt-0.5 flex w-full flex-col border border-[#394246] bg-ink shadow-md z-[110]">
              {(['sparse', 'normal', 'dense'] as const).map((density) => (
                <button
                  key={density}
                  onClick={() => {
                    setGridDensity(density);
                    setOpenDropdown(null);
                  }}
                  className={`px-2 py-1.5 text-left text-[0.55rem] uppercase tracking-widest ${gridDensity === density ? 'bg-acid-yellow text-ink' : 'text-archival-white hover:bg-white/10'}`}
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
            className="flex w-[112px] items-center justify-between border border-[#394246] bg-black/72 px-2 py-1 text-[0.55rem] font-bold uppercase tracking-widest text-archival-white"
          >
            <span>TINT: {gridColorTheme.substring(0, 3)}</span>
            <span className="text-[0.4rem] opacity-70">▼</span>
          </button>
          {openDropdown === 'color' && (
            <div className="absolute left-0 top-full mt-0.5 flex w-full flex-col border border-[#394246] bg-ink shadow-md z-[110]">
              {(['white', 'yellow', 'blue'] as const).map((theme) => (
                <button
                  key={theme}
                  onClick={() => {
                    setGridColorTheme(theme);
                    setOpenDropdown(null);
                  }}
                  className={`px-2 py-1.5 text-left text-[0.55rem] uppercase tracking-widest ${gridColorTheme === theme ? 'bg-acid-yellow text-ink' : 'text-archival-white hover:bg-white/10'}`}
                >
                  {theme}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowWeather((value) => !value)}
          className={`w-[112px] border px-2 py-1 text-[0.55rem] font-bold uppercase tracking-widest ${showWeather ? 'border-acid-yellow bg-acid-yellow text-ink' : 'border-[#394246] bg-black/72 text-archival-white'}`}
        >
          WX DATA
        </button>
      </div>

      <div className="absolute right-3 top-3 z-[100] flex flex-col gap-1.5" data-geoint-control="true">
        <button
          type="button"
          onClick={() => zoomFromCenter('in')}
          className="border border-[#394246] bg-black/72 px-3 py-2 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-archival-white hover:border-acid-yellow hover:text-acid-yellow"
        >
          Zoom +
        </button>
        <button
          type="button"
          onClick={() => zoomFromCenter('out')}
          className="border border-[#394246] bg-black/72 px-3 py-2 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-archival-white hover:border-acid-yellow hover:text-acid-yellow"
        >
          Zoom -
        </button>
        <button
          type="button"
          onClick={() => setViewportBounds(sceneBounds)}
          className="border border-[#394246] bg-black/72 px-3 py-2 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-archival-white hover:border-radar-blue hover:text-radar-blue"
        >
          Reset
        </button>
      </div>

      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 z-20 h-full w-full"
        onClick={() => {
          if (!draggingRef.current && !suppressClickRef.current) {
            onSelectedFeatureChange(null);
          }
        }}
      >
        {visibleLayers.map((layer) => (
          <g key={layer.id} opacity={layer.opacity}>
            {layer.data.features.flatMap((feature) =>
              geometryToSvgPaths(feature.geometry, viewportBounds).map((shape, index) => {
                const isSelected = selectedFeatureRef?.layerId === layer.id && selectedFeatureRef.featureId === feature.id;
                const stroke = isSelected ? '#E5FF00' : layer.style.outlineColor ?? layer.style.color;
                const fill = isSelected ? 'rgba(229,255,0,0.28)' : layer.style.color;
                const activeStroke = activeLayerId === layer.id ? '#F0F0F0' : stroke;

                const handleSelect = () => {
                  if (suppressClickRef.current) {
                    return;
                  }
                  onActiveLayerChange(layer.id);
                  onSelectedFeatureChange({ layerId: layer.id, featureId: feature.id });
                };

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
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSelect();
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
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSelect();
                      }}
                    />
                  );
                }

                return (
                  <polygon
                    key={`${feature.id}-poly-${index}`}
                    points={shape.positions}
                    fill={isSelected ? 'rgba(229,255,0,0.22)' : layer.style.color}
                    opacity={isSelected ? 0.9 : layer.style.fillOpacity ?? 0.22}
                    stroke={activeStroke}
                    strokeWidth={isSelected ? 0.65 : 0.35}
                    onMouseEnter={() => setHoveredFeature({ layerId: layer.id, feature, mouseX: cursor.x, mouseY: cursor.y })}
                    onClick={(event) => {
                      event.stopPropagation();
                      handleSelect();
                    }}
                  />
                );
              }),
            )}
          </g>
        ))}
      </svg>

      <div className="pointer-events-none absolute bottom-3 left-3 z-[100] border border-[#394246] bg-black/72 px-3 py-2 font-mono text-[0.55rem] text-[#9aaab0]">
        <div>LAT {cursor.show ? cursor.lat.toFixed(5) : '---.-----'}</div>
        <div>LNG {cursor.show ? cursor.lng.toFixed(5) : '---.-----'}</div>
        <div>ZOOM {bboxZoom(sceneBounds, viewportBounds).toFixed(2)}</div>
      </div>

      {showWeather && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute bottom-3 right-3 z-[100] flex min-w-[148px] flex-col gap-2 border border-acid-yellow bg-[#111513] p-3 font-mono text-[0.6rem] text-acid-yellow shadow-[0_0_15px_rgba(229,255,0,0.12)]"
          data-geoint-control="true"
        >
          <div className="mb-1 flex justify-between border-b border-acid-yellow/30 pb-1 font-bold tracking-widest">
            <span>LOCAL WX</span>
            <span className="opacity-70 animate-pulse">LIVE</span>
          </div>
          <div className="flex items-center justify-between"><span className="opacity-70">TEMP</span><span className="font-bold text-archival-white">18°C</span></div>
          <div className="flex items-center justify-between"><span className="opacity-70">WIND SPD</span><span className="font-bold text-archival-white">12 KT</span></div>
          <div className="flex items-center justify-between"><span className="opacity-70">WIND DIR</span><span className="font-bold text-archival-white">NW (315°)</span></div>
        </motion.div>
      )}

      {hoveredFeature && (
        <div
          className="pointer-events-none absolute z-[200] whitespace-nowrap border border-acid-yellow bg-ink px-2 py-1 font-mono text-[0.55rem] tracking-[0.5px] text-acid-yellow shadow-[0_0_12px_rgba(229,255,0,0.2)]"
          style={{ left: hoveredFeature.mouseX + 12, top: hoveredFeature.mouseY - 20 }}
        >
          {hoveredFeature.feature.properties.name ?? hoveredFeature.feature.id} | {hoveredFeature.feature.geometry.type}
        </div>
      )}

      {selectedFeature && (
        <div className="absolute bottom-3 right-3 z-[110] border border-radar-blue/30 bg-black/72 px-3 py-2 font-mono text-[0.55rem] text-archival-white">
          <div className="uppercase tracking-[0.22em] text-radar-blue">Selected</div>
          <div className="mt-1">{selectedFeature.properties.name ?? selectedFeature.id}</div>
        </div>
      )}
    </motion.div>
  );
}
