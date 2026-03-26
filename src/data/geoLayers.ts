import type { GeoFeature, GeoJsonFeatureCollection, LayerDefinition } from '../types';
import { getDefaultLayerStyle, getDisplayModesForCollection, normalizeGeoJsonInput } from '../utils/geojson';

function createPointCollection(features: GeoFeature[], categoryLabel: string): GeoJsonFeatureCollection {
  return normalizeGeoJsonInput({
    type: 'FeatureCollection',
    features: features.map((feature, index) => ({
      type: 'Feature',
      id: `${categoryLabel}-${index + 1}`,
      geometry: {
        type: 'Point',
        coordinates: [feature.lng, feature.lat],
      },
      properties: {
        category: feature.type,
        name: `${categoryLabel} Node ${index + 1}`,
        description: `Synthetic ${feature.type} observation point`,
      },
    })),
  });
}

const PATHWAY_NETWORK = normalizeGeoJsonInput({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'route-alpha',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-73.989, 40.772],
          [-73.977, 40.761],
          [-73.966, 40.751],
          [-73.952, 40.738],
          [-73.939, 40.725],
        ],
      },
      properties: {
        category: 'pathway',
        name: 'Route Alpha',
        description: 'Primary logistics corridor',
      },
    },
    {
      type: 'Feature',
      id: 'route-bravo',
      geometry: {
        type: 'MultiLineString',
        coordinates: [
          [
            [-73.992, 40.733],
            [-73.979, 40.736],
            [-73.965, 40.742],
            [-73.951, 40.748],
          ],
          [
            [-73.969, 40.747],
            [-73.956, 40.758],
            [-73.944, 40.769],
          ],
        ],
      },
      properties: {
        category: 'pathway',
        name: 'Route Bravo',
        description: 'Segmented corridor with split branches',
      },
    },
  ],
});

const ZONE_COLLECTION = normalizeGeoJsonInput({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'zone-south-bank',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-73.983, 40.719],
          [-73.955, 40.719],
          [-73.948, 40.736],
          [-73.976, 40.739],
          [-73.983, 40.719],
        ]],
      },
      properties: {
        category: 'zone',
        name: 'South Bank Zone',
        description: 'Restricted operating envelope',
      },
    },
    {
      type: 'Feature',
      id: 'zone-river-crossing',
      geometry: {
        type: 'MultiPolygon',
        coordinates: [
          [[
            [-73.972, 40.752],
            [-73.955, 40.752],
            [-73.952, 40.764],
            [-73.969, 40.766],
            [-73.972, 40.752],
          ]],
          [[
            [-73.947, 40.741],
            [-73.936, 40.741],
            [-73.935, 40.751],
            [-73.946, 40.751],
            [-73.947, 40.741],
          ]],
        ],
      },
      properties: {
        category: 'zone',
        name: 'River Crossing Zone',
        description: 'Multi-sector control area',
      },
    },
  ],
});

const MISSION_OVERLAY = normalizeGeoJsonInput({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'overlay-task-point',
      geometry: {
        type: 'Point',
        coordinates: [-73.962, 40.744],
      },
      properties: {
        category: 'infrastructure',
        name: 'Task Relay',
        description: 'Shared mission overlay point',
      },
    },
    {
      type: 'Feature',
      id: 'overlay-task-route',
      geometry: {
        type: 'LineString',
        coordinates: [
          [-73.987, 40.746],
          [-73.973, 40.746],
          [-73.960, 40.742],
          [-73.944, 40.742],
        ],
      },
      properties: {
        category: 'pathway',
        name: 'Task Route',
        description: 'Mixed-geometry mission overlay path',
      },
    },
    {
      type: 'Feature',
      id: 'overlay-task-zone',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [-73.971, 40.732],
          [-73.949, 40.732],
          [-73.946, 40.745],
          [-73.970, 40.746],
          [-73.971, 40.732],
        ]],
      },
      properties: {
        category: 'zone',
        name: 'Task Envelope',
        description: 'Mixed-geometry mission overlay area',
      },
    },
  ],
});

function makeLayer(partial: Omit<LayerDefinition, 'displayModes' | 'style' | 'opacity' | 'visible' | 'locked' | 'minZoom' | 'maxZoom' | 'status'>, index: number, overrides?: Partial<LayerDefinition>): LayerDefinition {
  const displayModes = getDisplayModesForCollection(partial.data);
  return {
    ...partial,
    displayModes,
    style: getDefaultLayerStyle(partial.data, index),
    visible: true,
    opacity: 1,
    locked: false,
    minZoom: 0,
    maxZoom: 24,
    status: 'ready',
    ...overrides,
  };
}

export function buildInitialGeoLayers(features: GeoFeature[]): LayerDefinition[] {
  const infrastructurePoints = createPointCollection(features.filter((feature) => feature.type === 'infrastructure'), 'Infrastructure');
  const organicPoints = createPointCollection(features.filter((feature) => feature.type === 'organic'), 'Organic');

  return [
    makeLayer({
      id: 'infrastructure-observations',
      name: 'Infrastructure Observations',
      sourceType: 'sample',
      sourceConfig: { label: 'Synthetic infrastructure source' },
      data: infrastructurePoints,
      zIndex: 10,
    }, 0, {
      style: { color: '#DDE5E8', outlineColor: '#151515', radius: 4 },
    }),
    makeLayer({
      id: 'organic-signatures',
      name: 'Organic Signatures',
      sourceType: 'sample',
      sourceConfig: { label: 'Synthetic organic source' },
      data: organicPoints,
      zIndex: 20,
    }, 1, {
      style: { color: '#FF007F', outlineColor: '#151515', radius: 5 },
    }),
    makeLayer({
      id: 'pathway-network',
      name: 'Pathway Network',
      sourceType: 'sample',
      sourceConfig: { label: 'Synthetic pathway source' },
      data: PATHWAY_NETWORK,
      zIndex: 30,
    }, 2, {
      opacity: 0.9,
      style: { color: '#FF6600', width: 3, lineDasharray: [1, 1.4] },
    }),
    makeLayer({
      id: 'zone-control',
      name: 'Zone Control',
      sourceType: 'sample',
      sourceConfig: { label: 'Synthetic zone source' },
      data: ZONE_COLLECTION,
      zIndex: 40,
    }, 3, {
      opacity: 0.92,
      style: { color: '#E5FF00', outlineColor: '#F0F0F0', width: 2, fillOpacity: 0.24 },
    }),
    makeLayer({
      id: 'mission-overlay',
      name: 'Mission Overlay',
      sourceType: 'sample',
      sourceConfig: { label: 'Synthetic mixed-geometry source' },
      data: MISSION_OVERLAY,
      zIndex: 50,
    }, 4, {
      opacity: 0.95,
      style: { color: '#29A5FF', outlineColor: '#F0F0F0', radius: 5, width: 2, fillOpacity: 0.18 },
    }),
  ];
}
