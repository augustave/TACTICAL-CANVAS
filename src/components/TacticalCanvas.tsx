import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import maplibregl, { type MapGeoJSONFeature, type Map as MapLibreMap, type StyleSpecification } from 'maplibre-gl';
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
      center: viewport.center,
      zoom: viewport.zoom,
      pitch: viewport.pitch,
      bearing: viewport.bearing,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showZoom: true, visualizePitch: true }), 'bottom-right');
    map.dragRotate.enable();
    map.touchZoomRotate.enableRotation();

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

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [interactiveLayerIds, onActiveLayerChange, onHoveredFeatureChange, onSelectedFeatureChange, onViewportChange, viewport]);

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
            filter: ['==', '$type', 'Polygon'],
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
            filter: ['==', '$type', 'LineString'],
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
            filter: ['==', '$type', 'Point'],
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
              filter: ['all', ['==', '$type', 'Polygon'], ['==', '$id', selectedId]],
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
              filter: ['all', ['==', '$type', 'LineString'], ['==', '$id', selectedId]],
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
              filter: ['all', ['==', '$type', 'Point'], ['==', '$id', selectedId]],
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
  }, [layers, selectedFeatureRef]);

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
