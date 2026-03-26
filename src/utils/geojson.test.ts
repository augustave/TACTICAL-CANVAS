import test from 'node:test';
import assert from 'node:assert/strict';
import { computeFeatureCollectionBounds, normalizeGeoJsonInput } from './geojson';

test('normalizeGeoJsonInput wraps a single feature into a feature collection and assigns bbox', () => {
  const collection = normalizeGeoJsonInput({
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [
        [-73.99, 40.72],
        [-73.94, 40.76],
      ],
    },
    properties: {
      category: 'pathway',
      name: 'Test route',
    },
  });

  assert.equal(collection.type, 'FeatureCollection');
  assert.equal(collection.features.length, 1);
  assert.equal(collection.features[0].id, 'feature-1');
  assert.deepEqual(collection.bbox, [-73.99, 40.72, -73.94, 40.76]);
});

test('computeFeatureCollectionBounds aggregates multiple geometry types', () => {
  const collection = normalizeGeoJsonInput({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 'zone-1',
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [-73.98, 40.71],
            [-73.95, 40.71],
            [-73.95, 40.74],
            [-73.98, 40.74],
            [-73.98, 40.71],
          ]],
        },
        properties: { category: 'zone' },
      },
      {
        type: 'Feature',
        id: 'point-1',
        geometry: {
          type: 'Point',
          coordinates: [-73.93, 40.78],
        },
        properties: { category: 'infrastructure' },
      },
    ],
  });

  assert.deepEqual(computeFeatureCollectionBounds(collection), [-73.98, 40.71, -73.93, 40.78]);
});
