import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { type Map as MapLibreMap, type StyleSpecification } from 'maplibre-gl';
import type {
  LayerDefinition,
  MapFeatureRef,
  MapFocusRequest,
  MapHealthState,
  MapViewportState,
} from '../types';
import { computeFeatureBounds, computeFeatureCollectionBounds, getFeatureByRef, getLayerById } from '../utils/geojson';

const BASE_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#111916',
      },
    },
  ],
};

interface Props {
  layers: LayerDefinition[];
  activeLayerId: string | null;
  selectedFeatureRef: MapFeatureRef | null;
  focusRequest: MapFocusRequest | null;
  initialViewport: MapViewportState;
  onActiveLayerChange: (layerId: string) => void;
  onSelectedFeatureChange: (featureRef: MapFeatureRef | null) => void;
  onViewportSnapshotChange?: (viewport: MapViewportState) => void;
  onMapHealthChange?: (state: MapHealthState, details?: string) => void;
  onFocusRequestHandled: (token: number) => void;
  onReloadRequest: () => void;
}

function getSourceId(layerId: string) {
  return `geo-source-${layerId}`;
}

function getRuntimeLayerId(layerId: string, mode: 'circle' | 'line' | 'fill' | 'select-circle' | 'select-line' | 'select-fill') {
  return `geo-layer-${layerId}-${mode}`;
}

function fitBoundsFromBox(map: MapLibreMap, bbox: [number, number, number, number]) {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  if (minLng === maxLng && minLat === maxLat) {
    map.easeTo({ center: [minLng, minLat], zoom: Math.max(map.getZoom(), 14.5), duration: 700 });
    return;
  }

  map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
    padding: 60,
    duration: 700,
    maxZoom: 15,
  });
}

function padBBox(bbox: [number, number, number, number], factor = 0.18): [number, number, number, number] {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const lngSpan = maxLng - minLng;
  const latSpan = maxLat - minLat;
  const lngPad = Math.max(lngSpan * factor, 0.01);
  const latPad = Math.max(latSpan * factor, 0.01);

  return [
    minLng - lngPad,
    minLat - latPad,
    maxLng + lngPad,
    maxLat + latPad,
  ];
}

function getRefKey(featureRef: MapFeatureRef | null) {
  return featureRef ? `${featureRef.layerId}:${featureRef.featureId}` : '';
}

function createViewportSnapshot(map: MapLibreMap): MapViewportState {
  const center = map.getCenter();
  return {
    center: [center.lng, center.lat],
    zoom: map.getZoom(),
    bearing: map.getBearing(),
    pitch: map.getPitch(),
  };
}

export function TacticalCanvas({
  layers,
  activeLayerId,
  selectedFeatureRef,
  focusRequest,
  initialViewport,
  onActiveLayerChange,
  onSelectedFeatureChange,
  onViewportSnapshotChange,
  onMapHealthChange,
  onFocusRequestHandled,
  onReloadRequest,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const hasFramedInitialViewRef = useRef(false);
  const runtimeLayerIdsRef = useRef<string[]>([]);
  const runtimeSourceIdsRef = useRef<string[]>([]);
  const interactiveLayerIdsRef = useRef<string[]>([]);
  const hoverAnimationFrameRef = useRef<number | null>(null);
  const pendingCursorRef = useRef<{ lng: number; lat: number; x: number; y: number } | null>(null);
  const lastHoveredKeyRef = useRef('');
  const [cursorState, setCursorState] = useState({
    lng: initialViewport.center[0],
    lat: initialViewport.center[1],
    x: 0,
    y: 0,
  });
  const [hoveredFeatureRef, setHoveredFeatureRef] = useState<MapFeatureRef | null>(null);
  const [fatalMessage, setFatalMessage] = useState<string | null>(null);

  const interactiveLayerIds = useMemo(
    () => layers.flatMap((layer) => {
      const ids: string[] = [];
      if (layer.displayModes.includes('fill')) ids.push(getRuntimeLayerId(layer.id, 'fill'));
      if (layer.displayModes.includes('line')) ids.push(getRuntimeLayerId(layer.id, 'line'));
      if (layer.displayModes.includes('circle')) ids.push(getRuntimeLayerId(layer.id, 'circle'));
      return ids;
    }),
    [layers],
  );

  useEffect(() => {
    interactiveLayerIdsRef.current = interactiveLayerIds;
  }, [interactiveLayerIds]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('geointMapFailure') === '1') {
      const forcedFailure = 'Layer engine unavailable (forced recovery test).';
      setFatalMessage(forcedFailure);
      onMapHealthChange?.('failed', forcedFailure);
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASE_STYLE,
      center: initialViewport.center,
      zoom: initialViewport.zoom,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
      maxPitch: 0,
      renderWorldCopies: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showZoom: true, visualizePitch: false }), 'bottom-right');
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();

    const syncViewport = () => {
      onViewportSnapshotChange?.(createViewportSnapshot(map));
    };

    const flushCursor = () => {
      hoverAnimationFrameRef.current = null;
      if (pendingCursorRef.current) {
        setCursorState(pendingCursorRef.current);
      }
    };

    const scheduleCursor = (nextCursor: typeof cursorState) => {
      pendingCursorRef.current = nextCursor;
      if (hoverAnimationFrameRef.current == null) {
        hoverAnimationFrameRef.current = window.requestAnimationFrame(flushCursor);
      }
    };

    const handleInteraction = (event: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(event.point, { layers: interactiveLayerIdsRef.current });
      const feature = features[0];
      const nextFeatureRef =
        feature?.source && feature.id != null
          ? {
              layerId: String(feature.source).replace('geo-source-', ''),
              featureId: String(feature.id),
            }
          : null;

      scheduleCursor({
        lng: event.lngLat.lng,
        lat: event.lngLat.lat,
        x: event.point.x,
        y: event.point.y,
      });

      const nextKey = getRefKey(nextFeatureRef);
      if (nextKey !== lastHoveredKeyRef.current) {
        lastHoveredKeyRef.current = nextKey;
        setHoveredFeatureRef(nextFeatureRef);
      }

      map.getCanvas().style.cursor = nextFeatureRef ? 'pointer' : '';
    };

    const handleClick = (event: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(event.point, { layers: interactiveLayerIdsRef.current });
      const feature = features[0];

      if (!feature?.source || feature.id == null) {
        onSelectedFeatureChange(null);
        return;
      }

      const layerId = String(feature.source).replace('geo-source-', '');
      onActiveLayerChange(layerId);
      onSelectedFeatureChange({ layerId, featureId: String(feature.id) });
    };

    const markHealth = (state: MapHealthState, details?: string) => {
      onMapHealthChange?.(state, details);
    };

    const handleMapError = (event: { error?: Error }) => {
      const message = event.error?.message ?? 'Layer engine runtime error.';
      if (message.toLowerCase().includes('webgl')) {
        setFatalMessage(message);
        markHealth('failed', message);
        return;
      }

      markHealth('degraded', message);
    };

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      const message = 'WebGL context lost. Reload the layer engine pane.';
      setFatalMessage(message);
      markHealth('failed', message);
    };

    const handleContextRestored = () => {
      setFatalMessage(null);
      markHealth('ready');
      map.resize();
      syncViewport();
    };

    map.on('load', () => {
      markHealth('ready');
      syncViewport();
    });
    map.on('moveend', syncViewport);
    map.on('mousemove', handleInteraction);
    map.on('click', handleClick);
    map.on('mouseout', () => {
      lastHoveredKeyRef.current = '';
      setHoveredFeatureRef(null);
      map.getCanvas().style.cursor = '';
    });
    map.on('error', handleMapError as never);

    const canvas = map.getCanvas();
    canvas.addEventListener('webglcontextlost', handleContextLost);
    canvas.addEventListener('webglcontextrestored', handleContextRestored);

    mapRef.current = map;

    const resizeMap = () => {
      map.resize();
    };

    const resizeFrame = window.requestAnimationFrame(resizeMap);
    window.addEventListener('resize', resizeMap);

    return () => {
      if (hoverAnimationFrameRef.current != null) {
        window.cancelAnimationFrame(hoverAnimationFrameRef.current);
      }
      window.cancelAnimationFrame(resizeFrame);
      window.removeEventListener('resize', resizeMap);
      canvas.removeEventListener('webglcontextlost', handleContextLost);
      canvas.removeEventListener('webglcontextrestored', handleContextRestored);
      map.remove();
      mapRef.current = null;
    };
  }, [
    initialViewport,
    onActiveLayerChange,
    onMapHealthChange,
    onSelectedFeatureChange,
    onViewportSnapshotChange,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const clearRuntimeLayers = () => {
      [...runtimeLayerIdsRef.current].reverse().forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
      });
      runtimeLayerIdsRef.current = [];

      runtimeSourceIdsRef.current.forEach((sourceId) => {
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      });
      runtimeSourceIdsRef.current = [];
    };

    const applyLayers = () => {
      clearRuntimeLayers();

      const sortedLayers = [...layers]
        .filter((layer) => layer.visible)
        .sort((a, b) => a.zIndex - b.zIndex);

      const sceneBounds = sortedLayers
        .map((layer) => computeFeatureCollectionBounds(layer.data))
        .filter((bbox): bbox is [number, number, number, number] => Array.isArray(bbox))
        .reduce<[number, number, number, number] | null>((acc, bbox) => {
          if (!acc) {
            return [...bbox] as [number, number, number, number];
          }

          return [
            Math.min(acc[0], bbox[0]),
            Math.min(acc[1], bbox[1]),
            Math.max(acc[2], bbox[2]),
            Math.max(acc[3], bbox[3]),
          ];
        }, null);

      if (sceneBounds) {
        const paddedBounds = padBBox(sceneBounds);
        map.setMaxBounds([
          [paddedBounds[0], paddedBounds[1]],
          [paddedBounds[2], paddedBounds[3]],
        ]);
      } else {
        map.setMaxBounds(null);
      }

      sortedLayers.forEach((layer) => {
        const sourceId = getSourceId(layer.id);
        map.addSource(sourceId, {
          type: 'geojson',
          data: layer.data as never,
        });
        runtimeSourceIdsRef.current.push(sourceId);

        if (layer.displayModes.includes('fill')) {
          const fillId = getRuntimeLayerId(layer.id, 'fill');
          map.addLayer({
            id: fillId,
            type: 'fill',
            source: sourceId,
            minzoom: layer.minZoom,
            maxzoom: layer.maxZoom,
            filter: ['==', ['geometry-type'], 'Polygon'],
            paint: {
              'fill-color': layer.style.color,
              'fill-opacity': layer.opacity * (layer.style.fillOpacity ?? 0.22),
              'fill-outline-color': layer.style.outlineColor ?? layer.style.color,
            },
          });
          runtimeLayerIdsRef.current.push(fillId);
        }

        if (layer.displayModes.includes('line')) {
          const lineId = getRuntimeLayerId(layer.id, 'line');
          map.addLayer({
            id: lineId,
            type: 'line',
            source: sourceId,
            minzoom: layer.minZoom,
            maxzoom: layer.maxZoom,
            filter: ['==', ['geometry-type'], 'LineString'],
            paint: {
              'line-color': layer.style.color,
              'line-opacity': layer.opacity,
              'line-width': layer.style.width ?? 3,
              'line-dasharray': layer.style.lineDasharray ?? [1, 0],
            },
          });
          runtimeLayerIdsRef.current.push(lineId);
        }

        if (layer.displayModes.includes('circle')) {
          const circleId = getRuntimeLayerId(layer.id, 'circle');
          map.addLayer({
            id: circleId,
            type: 'circle',
            source: sourceId,
            minzoom: layer.minZoom,
            maxzoom: layer.maxZoom,
            filter: ['==', ['geometry-type'], 'Point'],
            paint: {
              'circle-radius': layer.style.radius ?? 5,
              'circle-color': layer.style.color,
              'circle-opacity': layer.opacity,
              'circle-stroke-width': 1,
              'circle-stroke-color': layer.style.outlineColor ?? '#151515',
            },
          });
          runtimeLayerIdsRef.current.push(circleId);
        }

        if (selectedFeatureRef?.layerId === layer.id) {
          const selectedId = selectedFeatureRef.featureId;

          if (layer.displayModes.includes('fill')) {
            const selectedFillId = getRuntimeLayerId(layer.id, 'select-fill');
            map.addLayer({
              id: selectedFillId,
              type: 'fill',
              source: sourceId,
              filter: ['all', ['==', ['geometry-type'], 'Polygon'], ['==', '$id', selectedId]],
              paint: {
                'fill-color': '#E5FF00',
                'fill-opacity': 0.36,
              },
            });
            runtimeLayerIdsRef.current.push(selectedFillId);
          }

          if (layer.displayModes.includes('line')) {
            const selectedLineId = getRuntimeLayerId(layer.id, 'select-line');
            map.addLayer({
              id: selectedLineId,
              type: 'line',
              source: sourceId,
              filter: ['all', ['==', ['geometry-type'], 'LineString'], ['==', '$id', selectedId]],
              paint: {
                'line-color': '#E5FF00',
                'line-width': (layer.style.width ?? 3) + 2,
              },
            });
            runtimeLayerIdsRef.current.push(selectedLineId);
          }

          if (layer.displayModes.includes('circle')) {
            const selectedCircleId = getRuntimeLayerId(layer.id, 'select-circle');
            map.addLayer({
              id: selectedCircleId,
              type: 'circle',
              source: sourceId,
              filter: ['all', ['==', ['geometry-type'], 'Point'], ['==', '$id', selectedId]],
              paint: {
                'circle-radius': (layer.style.radius ?? 5) + 3,
                'circle-color': '#E5FF00',
                'circle-stroke-width': 2,
                'circle-stroke-color': '#151515',
              },
            });
            runtimeLayerIdsRef.current.push(selectedCircleId);
          }
        }
      });

      if (!hasFramedInitialViewRef.current && sortedLayers.length > 0) {
        const activeLayer = sortedLayers.find((layer) => layer.id === activeLayerId) ?? sortedLayers[sortedLayers.length - 1];
        const bbox = computeFeatureCollectionBounds(activeLayer.data);
        if (bbox) {
          fitBoundsFromBox(map, padBBox(bbox));
          hasFramedInitialViewRef.current = true;
        }
      }
    };

    if (map.loaded()) {
      applyLayers();
      return clearRuntimeLayers;
    }

    const handleLoad = () => {
      applyLayers();
    };

    map.once('load', handleLoad);
    return clearRuntimeLayers;
  }, [activeLayerId, layers, selectedFeatureRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusRequest) {
      return;
    }

    if (focusRequest.kind === 'layer') {
      const layer = getLayerById(layers, focusRequest.layerId);
      const bbox = layer ? computeFeatureCollectionBounds(layer.data) : undefined;
      if (bbox) {
        fitBoundsFromBox(map, padBBox(bbox));
      }
    } else {
      const feature = getFeatureByRef(layers, { layerId: focusRequest.layerId, featureId: focusRequest.featureId ?? '' });
      const bbox = feature ? (feature.bbox ?? computeFeatureBounds(feature)) : undefined;
      if (bbox) {
        fitBoundsFromBox(map, padBBox(bbox));
      }
    }

    onFocusRequestHandled(focusRequest.token);
  }, [focusRequest, layers, onFocusRequestHandled]);

  const hoveredFeature = getFeatureByRef(layers, hoveredFeatureRef);

  return (
    <div
      data-testid="geoint-layer-engine"
      className="relative w-full overflow-hidden border-2 border-ink bg-[#0c1113] shadow-[4px_6px_15px_rgba(0,0,0,0.6)]"
    >
      <div ref={containerRef} className="h-[560px] w-full" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_32%_28%,rgba(255,255,255,0.05),transparent_28%),linear-gradient(180deg,rgba(74,144,226,0.06),transparent_22%),repeating-linear-gradient(0deg,rgba(255,255,255,0.018)_0,rgba(255,255,255,0.018)_1px,transparent_1px,transparent_42px),repeating-linear-gradient(90deg,rgba(255,255,255,0.018)_0,rgba(255,255,255,0.018)_1px,transparent_1px,transparent_42px)]" />

      <div className="pointer-events-none absolute left-3 top-3 z-10 border border-[#2d3940] bg-black/72 px-3 py-2 font-mono text-[0.56rem] uppercase tracking-[0.22em] text-[#8ea0a8]">
        <div>Prototype Layer Engine</div>
        <div className="mt-1 text-acid-yellow">{activeLayerId ? `ACTIVE ${activeLayerId.replace(/-/g, ' ')}` : 'NO ACTIVE LAYER'}</div>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 z-10 border border-[#2d3940] bg-black/72 px-3 py-2 font-mono text-[0.55rem] text-[#9aaab0]">
        <div>LAT {cursorState.lat.toFixed(5)}</div>
        <div>LNG {cursorState.lng.toFixed(5)}</div>
      </div>

      {hoveredFeature && !fatalMessage && (
        <div
          className="pointer-events-none absolute z-20 border border-[#30404a] bg-black/88 px-3 py-2 font-mono text-[0.58rem] text-archival-white shadow-[0_8px_18px_rgba(0,0,0,0.35)]"
          style={{ left: Math.min(cursorState.x + 18, 620), top: Math.min(cursorState.y + 18, 500) }}
        >
          <div className="uppercase tracking-[0.22em] text-radar-blue">{hoveredFeature.geometry.type}</div>
          <div className="mt-1 text-[0.72rem] font-semibold">{hoveredFeature.properties.name ?? hoveredFeature.id}</div>
          {hoveredFeature.properties.description && (
            <div className="mt-1 max-w-[220px] text-[#95a3a9]">{hoveredFeature.properties.description}</div>
          )}
        </div>
      )}

      {fatalMessage && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#090d10]/94 px-6">
          <div className="max-w-[360px] border border-alert-red/45 bg-black/72 p-5 font-mono text-archival-white shadow-[0_20px_40px_rgba(0,0,0,0.45)]">
            <div className="text-[0.56rem] uppercase tracking-[0.24em] text-alert-red">Layer Engine Halted</div>
            <div className="mt-3 text-[0.9rem] font-semibold">Legacy tactical view remains available.</div>
            <div className="mt-2 text-[0.68rem] leading-[1.7] text-[#98a5ab]">{fatalMessage}</div>
            <button
              type="button"
              onClick={onReloadRequest}
              className="mt-4 border border-acid-yellow/45 px-3 py-2 text-[0.58rem] uppercase tracking-[0.22em] text-acid-yellow transition-colors hover:bg-acid-yellow hover:text-ink"
            >
              Reload Layer Engine
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
