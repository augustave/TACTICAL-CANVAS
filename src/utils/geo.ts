import type { GeoFeature, FeatureType } from '../types';

export const BBOX = {
  minLng: -73.995, maxLng: -73.930,
  minLat: 40.710, maxLat: 40.780
};

export function projectToCanvas(lng: number, lat: number) {
  const x = ((lng - BBOX.minLng) / (BBOX.maxLng - BBOX.minLng)) * 100;
  const y = (1 - (lat - BBOX.minLat) / (BBOX.maxLat - BBOX.minLat)) * 100;
  return { x: Math.max(2, Math.min(98, x)), y: Math.max(2, Math.min(98, y)) };
}

export function canvasToCoord(xPct: number, yPct: number) {
  const lng = BBOX.minLng + (xPct / 100) * (BBOX.maxLng - BBOX.minLng);
  const lat = BBOX.minLat + (1 - yPct / 100) * (BBOX.maxLat - BBOX.minLat);
  return { lng, lat };
}

export function generateGeoJSON(features: GeoFeature[]) {
  return {
    type: "FeatureCollection" as const,
    features: features.map((f, i) => ({
      type: "Feature" as const,
      id: i,
      geometry: {
        type: "Point" as const,
        coordinates: [f.lng, f.lat]
      },
      properties: {
        category: f.type,
        timestamp: new Date().toISOString()
      }
    }))
  };
}

export function generateCluster(type: FeatureType, baseLng: number, baseLat: number, count: number, spreadKm: number): GeoFeature[] {
  const cluster: GeoFeature[] = [];
  const latSpread = spreadKm / 111;
  const lngSpread = spreadKm / (111 * Math.cos(baseLat * Math.PI / 180));

  for (let i = 0; i < count; i++) {
    const rLng = (Math.random() + Math.random() + Math.random()) / 3;
    const rLat = (Math.random() + Math.random() + Math.random()) / 3;

    cluster.push({
      type,
      lng: baseLng + (rLng - 0.5) * lngSpread * 2,
      lat: baseLat + (rLat - 0.5) * latSpread * 2
    });
  }
  return cluster;
}
