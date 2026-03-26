import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import maplibregl, { type Map as MapLibreMap, type StyleSpecification } from 'maplibre-gl';
import type { LayerDefinition, MapFeatureRef, MapFocusRequest, MapViewportState } from '../types';
import { computeFeatureCollectionBounds, computeFeatureBounds, getFeatureByRef, getLayerById } from '../utils/geojson';

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
  hoveredFeatureRef: MapFeatureRef | null;
  focusRequest: MapFocusRequest | null;
  viewport: MapViewportState;
  onActiveLayerChange: (layerId: string) => void;
  onSelectedFeatureChange: (featureRef: MapFeatureRef | null) => void;
  onHoveredFeatureChange: (featureRef: MapFeatureRef | null) => void;
  onViewportChange: (viewport: MapViewportState) => void;
  onFocusRequestHandled: (token: number) => void;
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

export function TacticalCanvas({
  layers,
  activeLayerId,
  selectedFeatureRef,
  hoveredFeatureRef,
  focusRequest,
  viewport,
  onActiveLayerChange,
  onSelectedFeatureChange,
  onHoveredFeatureChange,
  onViewportChange,
  onFocusRequestHandled,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const initialViewportRef = useRef(viewport);
  const hasFramedInitialViewRef = useRef(false);
  const runtimeLayerIdsRef = useRef<string[]>([]);
  const runtimeSourceIdsRef = useRef<string[]>([]);
  const interactiveLayerIdsRef = useRef<string[]>([]);
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

  const [cursorState, setCursorState] = useState({
    lng: viewport.center[0],
    lat: viewport.center[1],
    x: 0,
    y: 0,
  });

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASE_STYLE,
      center: initialViewportRef.current.center,
      zoom: initialViewportRef.current.zoom,
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
      const center = map.getCenter();
      onViewportChange({
        center: [center.lng, center.lat],
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
      });
    };

    map.on('moveend', syncViewport);

    const handleInteraction = (event: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(event.point, { layers: interactiveLayerIdsRef.current });
      const feature = features[0];

      setCursorState({
        lng: event.lngLat.lng,
        lat: event.lngLat.lat,
        x: event.point.x,
        y: event.point.y,
      });

      if (!feature?.source || feature.id == null) {
        onHoveredFeatureChange(null);
        map.getCanvas().style.cursor = '';
        return;
      }

      const sourceId = String(feature.source);
      const layerId = sourceId.replace('geo-source-', '');
      onHoveredFeatureChange({ layerId, featureId: String(feature.id) });
      map.getCanvas().style.cursor = 'pointer';
    };

    const handleClick = (event: maplibregl.MapMouseEvent) => {
      const features = map.queryRenderedFeatures(event.point, { layers: interactiveLayerIdsRef.current });
      const feature = features[0];

      if (!feature?.source || feature.id == null) {
        onSelectedFeatureChange(null);
        return;
      }

      const sourceId = String(feature.source);
      const layerId = sourceId.replace('geo-source-', '');
      onActiveLayerChange(layerId);
      onSelectedFeatureChange({ layerId, featureId: String(feature.id) });
    };

    map.on('mousemove', handleInteraction);
    map.on('click', handleClick);
    map.on('mouseout', () => {
      map.getCanvas().style.cursor = '';
      onHoveredFeatureChange(null);
    });

    mapRef.current = map;

    const resizeMap = () => {
      map.resize();
    };

    const resizeObserver = typeof ResizeObserver !== 'undefined' && containerRef.current
      ? new ResizeObserver(() => {
          resizeMap();
        })
      : null;

    if (resizeObserver && containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    const resizeFrame = window.requestAnimationFrame(resizeMap);
    window.addEventListener('resize', resizeMap);

    return () => {
      window.cancelAnimationFrame(resizeFrame);
      window.removeEventListener('resize', resizeMap);
      resizeObserver?.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, [onActiveLayerChange, onHoveredFeatureChange, onSelectedFeatureChange, onViewportChange]);

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
          data: layer.data as any,
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
        fitBoundsFromBox(map, bbox);
      }
    } else {
      const feature = getFeatureByRef(layers, { layerId: focusRequest.layerId, featureId: focusRequest.featureId ?? '' });
      const bbox = feature ? (feature.bbox ?? computeFeatureBounds(feature)) : undefined;
      if (bbox) {
        fitBoundsFromBox(map, bbox);
      }
    }

    onFocusRequestHandled(focusRequest.token);
  }, [focusRequest, layers, onFocusRequestHandled]);

  const hoveredFeature = getFeatureByRef(layers, hoveredFeatureRef);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.45, ease: 'easeOut' }}
      className="relative w-full overflow-hidden border-2 border-ink bg-[#0c1113] shadow-[4px_6px_15px_rgba(0,0,0,0.6)]"
    >
      <div ref={containerRef} className="h-[560px] w-full" />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_32%_28%,rgba(255,255,255,0.05),transparent_28%),linear-gradient(180deg,rgba(74,144,226,0.06),transparent_22%),repeating-linear-gradient(0deg,rgba(255,255,255,0.018)_0,rgba(255,255,255,0.018)_1px,transparent_1px,transparent_42px),repeating-linear-gradient(90deg,rgba(255,255,255,0.018)_0,rgba(255,255,255,0.018)_1px,transparent_1px,transparent_42px)]" />

      <div className="pointer-events-none absolute left-3 top-3 z-10 border border-[#2d3940] bg-black/55 px-3 py-2 font-mono text-[0.56rem] uppercase tracking-[0.22em] text-[#8ea0a8] backdrop-blur-sm">
        <div>Prototype Layer Engine</div>
        <div className="mt-1 text-acid-yellow">{activeLayerId ? `ACTIVE ${activeLayerId.replace(/-/g, ' ')}` : 'NO ACTIVE LAYER'}</div>
      </div>

      <div className="pointer-events-none absolute bottom-3 left-3 z-10 border border-[#2d3940] bg-black/55 px-3 py-2 font-mono text-[0.55rem] text-[#9aaab0] backdrop-blur-sm">
        <div>LAT {cursorState.lat.toFixed(5)}</div>
        <div>LNG {cursorState.lng.toFixed(5)}</div>
      </div>

      {hoveredFeature && (
        <div
          className="pointer-events-none absolute z-20 border border-[#30404a] bg-black/80 px-3 py-2 font-mono text-[0.58rem] text-archival-white shadow-[0_8px_18px_rgba(0,0,0,0.35)]"
          style={{ left: Math.min(cursorState.x + 18, 620), top: Math.min(cursorState.y + 18, 500) }}
        >
          <div className="uppercase tracking-[0.22em] text-radar-blue">{hoveredFeature.geometry.type}</div>
          <div className="mt-1 text-[0.72rem] font-semibold">{hoveredFeature.properties.name ?? hoveredFeature.id}</div>
          {hoveredFeature.properties.description && (
            <div className="mt-1 max-w-[220px] text-[#95a3a9]">{hoveredFeature.properties.description}</div>
          )}
        </div>
      )}
    </motion.div>
  );
}
