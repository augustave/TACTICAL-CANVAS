// ─────────────────────────────────────────────────────────────────────────────
// TacticalCanvas — Shared Scenario Data
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for all synthetic mission data.
// Every widget reads from here. No component defines its own hardcoded arrays.
// ─────────────────────────────────────────────────────────────────────────────

import type { Asset, Alert, TargetMarker } from './types';

/**
 * SCENARIO: Airspace monitoring and asset coordination exercise.
 * All data is synthetic. Nothing here represents real operations.
 */

export const ASSETS: Asset[] = [
  { id: 'F-16CM-50',  type: 'Fighter',  status: 'ACTIVE',  fuel: 85,  radarX: 30, radarY: 25, heading: 120 },
  { id: 'Tanker LGP', type: 'Support',  status: 'LOITER',  fuel: 40,  radarX: 45, radarY: 35, heading: 90  },
  { id: 'Dragnet71',  type: 'AWACS',    status: 'ACTIVE',  fuel: 92,  radarX: 60, radarY: 50, heading: 180 },
  { id: 'Tornado GR4', type: 'Strike',  status: 'RTB',     fuel: 15,  radarX: 55, radarY: 55, heading: 210 },
  { id: 'Cargo Ship', type: 'Naval',    status: 'TRACKED', fuel: 100, radarX: 40, radarY: 60, heading: 45  },
  { id: 'AV-8B+',     type: 'Fighter',  status: 'ACTIVE',  fuel: 60,  radarX: 25, radarY: 45, heading: 300 },
  { id: 'MQ-9 Reaper', type: 'UAV',     status: 'LOITER',  fuel: 75,  radarX: 70, radarY: 30, heading: 160 },
  { id: 'E-3 Sentry', type: 'AWACS',    status: 'ACTIVE',  fuel: 88,  radarX: 35, radarY: 70, heading: 270 },
];

export const ALERTS: Alert[] = [
  { id: 'ALT-01', level: 'CRITICAL', msg: 'UNAUTHORIZED AIRSPACE INCURSION',    time: '-02m', assetId: 'Dragnet71' },
  { id: 'ALT-02', level: 'WARNING',  msg: 'ASSET FUEL LOW: TORNADO GR4',       time: '-15m', assetId: 'Tornado GR4' },
  { id: 'ALT-03', level: 'INFO',     msg: 'DATA LINK ESTABLISHED',             time: '-45m' },
  { id: 'ALT-04', level: 'WARNING',  msg: 'WEATHER ANOMALY DETECTED',          time: '-1h' },
  { id: 'ALT-05', level: 'INFO',     msg: 'SHIFT CHANGE COMPLETED',            time: '-2h' },
];

export const TARGETS: TargetMarker[] = [
  { id: 'Transloading Facility', type: 'Building',        x: 40, y: 60, size: 'lg', dist: '53.9m' },
  { id: 'Containers',           type: 'Asset',            x: 20, y: 40, size: 'md', dist: '108.5m' },
  { id: 'Bridge',               type: 'Infrastructure',   x: 60, y: 30, size: 'sm', dist: '2.1nm' },
  { id: 'Vessel',               type: 'Vehicle',          x: 55, y: 35, size: 'sm', dist: '6.0nm' },
];
