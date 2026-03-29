import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMissionMetrics,
  getMissionFirstAction,
  getMissionStatusCopy,
  getMissionThreadState,
} from './mission';
import type { MissionState } from '../types';

function makeMissionState(overrides: Partial<MissionState> = {}): MissionState {
  return {
    selectedAssetId: null,
    selectedTargetId: null,
    currentTask: null,
    ...overrides,
  };
}

test('idle mission state stays explicitly uncommitted', () => {
  const mission = makeMissionState();

  assert.equal(getMissionThreadState(mission), 'idle');
  assert.equal(getMissionStatusCopy(mission), 'No thread established. Observe lane is open.');
  assert.equal(getMissionFirstAction(mission), 'Select an asset to begin.');

  const metrics = buildMissionMetrics(mission);
  assert.equal(metrics.find((metric) => metric.label === 'Sensor')?.tone, 'blue');
  assert.equal(metrics.find((metric) => metric.label === 'Task')?.detail, 'No task order in thread');
});

test('correlated mission state points the operator toward tasking', () => {
  const mission = makeMissionState({
    selectedAssetId: 'Dragnet71',
    selectedTargetId: 'Bridge',
  });

  assert.equal(getMissionThreadState(mission), 'correlated');
  assert.equal(getMissionStatusCopy(mission), 'Selections correlated. Task order can be issued.');
  assert.equal(getMissionFirstAction(mission), 'Issue tasking when ready.');
});

test('tasked mission state reports the committed chain', () => {
  const mission = makeMissionState({
    selectedAssetId: 'Dragnet71',
    selectedTargetId: 'Bridge',
    currentTask: {
      assetId: 'Dragnet71',
      targetId: 'Bridge',
      status: 'ACTIVE',
      createdAt: '2026-03-28T00:00:00.000Z',
    },
  });

  assert.equal(getMissionThreadState(mission), 'tasked');
  assert.equal(getMissionStatusCopy(mission), 'Dragnet71 tasked to Bridge. Assessment lane is live.');
  assert.equal(getMissionFirstAction(mission), 'Monitor task execution and assess outcome.');
});
