import type {
  BBox,
  FeatureSummary,
  GeoJsonFeature,
  GeoJsonFeatureCollection,
  GeoJsonGeometry,
  GeoJsonPosition,
  LayerDefinition,
  LayerDisplayMode,
  LayerFeatureProperties,
  LayerStyle,
  MapFeatureRef,
} from '../types';

const DEFAULT_LAYER_COLORS = ['#4A90E2', '#FF6600', '#FF007F', '#E5FF00', '#A6927E'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPosition(value: unknown): value is GeoJsonPosition {
  return Array.isArray(value) &&
    (value.length === 2 || value.length === 3) &&
    value.every((item) => typeof item === 'number');
}

function normalizeGeometry(input: unknown): GeoJsonGeometry {
  if (!isRecord(input) || typeof input.type !== 'string') {
    throw new Error('GeoJSON geometry is missing a valid type.');
  }

  switch (input.type) {
    case 'Point':
      if (!isPosition(input.coordinates)) {
        throw new Error('Invalid Point coordinates.');
      }
      return { type: 'Point', coordinates: input.coordinates };
    case 'MultiPoint':
      if (!Array.isArray(input.coordinates) || !input.coordinates.every(isPosition)) {
        throw new Error('Invalid MultiPoint coordinates.');
      }
      return { type: 'MultiPoint', coordinates: input.coordinates };
    case 'LineString':
      if (!Array.isArray(input.coordinates) || !input.coordinates.every(isPosition)) {
        throw new Error('Invalid LineString coordinates.');
      }
      return { type: 'LineString', coordinates: input.coordinates };
    case 'MultiLineString':
      if (!Array.isArray(input.coordinates) || !input.coordinates.every((line) => Array.isArray(line) && line.every(isPosition))) {
        throw new Error('Invalid MultiLineString coordinates.');
      }
      return { type: 'MultiLineString', coordinates: input.coordinates };
    case 'Polygon':
      if (!Array.isArray(input.coordinates) || !input.coordinates.every((ring) => Array.isArray(ring) && ring.every(isPosition))) {
        throw new Error('Invalid Polygon coordinates.');
      }
      return { type: 'Polygon', coordinates: input.coordinates };
    case 'MultiPolygon':
      if (!Array.isArray(input.coordinates) || !input.coordinates.every((polygon) => Array.isArray(polygon) && polygon.every((ring) => Array.isArray(ring) && ring.every(isPosition)))) {
        throw new Error('Invalid MultiPolygon coordinates.');
      }
      return { type: 'MultiPolygon', coordinates: input.coordinates };
    default:
      throw new Error(`Unsupported GeoJSON geometry type: ${input.type}`);
  }
}

function normalizeFeature(input: unknown, index: number): GeoJsonFeature {
  if (!isRecord(input) || input.type !== 'Feature') {
    throw new Error('GeoJSON feature must have type "Feature".');
  }

  const geometry = normalizeGeometry(input.geometry);
  const properties = isRecord(input.properties) ? input.properties as LayerFeatureProperties : {};
  const id = typeof input.id === 'string' || typeof input.id === 'number'
    ? String(input.id)
    : `feature-${index + 1}`;

  const feature: GeoJsonFeature = {
    type: 'Feature',
    id,
    geometry,
    properties,
  };

  const bbox = computeFeatureBounds(feature);
  if (bbox) {
    feature.bbox = bbox;
  }

  return feature;
}

export function normalizeGeoJsonInput(input: unknown): GeoJsonFeatureCollection {
  if (!isRecord(input) || typeof input.type !== 'string') {
    throw new Error('Unsupported GeoJSON input.');
  }

  if (input.type === 'FeatureCollection') {
    if (!Array.isArray(input.features)) {
      throw new Error('GeoJSON FeatureCollection is missing a valid features array.');
    }

    const features = input.features.map((feature, index) => normalizeFeature(feature, index));
    return {
      type: 'FeatureCollection',
      features,
      bbox: computeFeatureCollectionBounds({ type: 'FeatureCollection', features }),
    };
  }

  if (input.type === 'Feature') {
    const feature = normalizeFeature(input, 0);
    return {
      type: 'FeatureCollection',
      features: [feature],
      bbox: computeFeatureCollectionBounds({ type: 'FeatureCollection', features: [feature] }),
    };
  }

  const geometry = normalizeGeometry(input);
  return normalizeGeoJsonInput({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 'feature-1',
        geometry,
        properties: {},
      },
    ],
  });
}

function visitGeometryCoordinates(geometry: GeoJsonGeometry, visit: (position: GeoJsonPosition) => void) {
  switch (geometry.type) {
    case 'Point':
      visit(geometry.coordinates);
      break;
    case 'MultiPoint':
    case 'LineString':
      geometry.coordinates.forEach(visit);
      break;
    case 'MultiLineString':
    case 'Polygon':
      geometry.coordinates.forEach((line) => line.forEach(visit));
      break;
    case 'MultiPolygon':
      geometry.coordinates.forEach((polygon) => polygon.forEach((ring) => ring.forEach(visit)));
      break;
  }
}

export function computeFeatureBounds(feature: GeoJsonFeature): BBox | undefined {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  visitGeometryCoordinates(feature.geometry, ([lng, lat]) => {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  });

  if (!Number.isFinite(minLng) || !Number.isFinite(minLat) || !Number.isFinite(maxLng) || !Number.isFinite(maxLat)) {
    return undefined;
  }

  return [minLng, minLat, maxLng, maxLat];
}

export function computeFeatureCollectionBounds(collection: GeoJsonFeatureCollection): BBox | undefined {
  const bounds = collection.features
    .map((feature) => feature.bbox ?? computeFeatureBounds(feature))
    .filter((bbox): bbox is BBox => Array.isArray(bbox));

  if (!bounds.length) {
    return undefined;
  }

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

export function getGeometryCounts(collection: GeoJsonFeatureCollection) {
  const counts = {
    point: 0,
    line: 0,
    polygon: 0,
  };

  collection.features.forEach((feature) => {
    switch (feature.geometry.type) {
      case 'Point':
      case 'MultiPoint':
        counts.point += 1;
        break;
      case 'LineString':
      case 'MultiLineString':
        counts.line += 1;
        break;
      case 'Polygon':
      case 'MultiPolygon':
        counts.polygon += 1;
        break;
    }
  });

  return counts;
}

export function getDisplayModesForCollection(collection: GeoJsonFeatureCollection): LayerDisplayMode[] {
  const counts = getGeometryCounts(collection);
  const modes: LayerDisplayMode[] = [];

  if (counts.polygon) {
    modes.push('fill');
  }
  if (counts.line) {
    modes.push('line');
  }
  if (counts.point) {
    modes.push('circle');
  }

  return modes;
}

export function getDefaultLayerStyle(collection: GeoJsonFeatureCollection, index = 0): LayerStyle {
  const counts = getGeometryCounts(collection);
  const color = DEFAULT_LAYER_COLORS[index % DEFAULT_LAYER_COLORS.length];

  if (counts.polygon) {
    return {
      color,
      outlineColor: '#F0F0F0',
      fillOpacity: 0.28,
      width: 2,
    };
  }

  if (counts.line) {
    return {
      color,
      width: 3,
      lineDasharray: [1, 0],
    };
  }

  return {
    color,
    outlineColor: '#151515',
    radius: 5,
  };
}

export function getLayerFeatureSummary(layers: LayerDefinition[]): FeatureSummary {
  return layers.reduce<FeatureSummary>((summary, layer) => {
    if (!layer.visible) {
      return summary;
    }

    layer.data.features.forEach((feature) => {
      summary.total += 1;
      const category = feature.properties.category;
      if (category && category in summary) {
        summary[category] += 1;
      }
    });

    return summary;
  }, {
    total: 0,
    infrastructure: 0,
    pathway: 0,
    organic: 0,
    zone: 0,
  });
}

export function getLayerById(layers: LayerDefinition[], layerId: string | null) {
  return layerId ? layers.find((layer) => layer.id === layerId) ?? null : null;
}

export function getFeatureByRef(layers: LayerDefinition[], ref: MapFeatureRef | null) {
  if (!ref) {
    return null;
  }

  const layer = getLayerById(layers, ref.layerId);
  if (!layer) {
    return null;
  }

  return layer.data.features.find((feature) => feature.id === ref.featureId) ?? null;
}

export function stringifyGeoJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}
