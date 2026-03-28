import { ALERTS, ASSETS, TARGETS } from '../data';
import type { Alert, Asset, MissionState, TargetMarker } from '../types';

export interface MissionMetric {
  label: string;
  value: number;
  tone: 'blue' | 'yellow' | 'red';
  detail: string;
}

export type MissionThreadState = 'idle' | 'asset-selected' | 'target-selected' | 'correlated' | 'tasked';

export function getMissionThreadState(mission: MissionState): MissionThreadState {
  if (mission.currentTask) {
    return 'tasked';
  }

  if (mission.selectedAssetId && mission.selectedTargetId) {
    return 'correlated';
  }

  if (mission.selectedAssetId) {
    return 'asset-selected';
  }

  if (mission.selectedTargetId) {
    return 'target-selected';
  }

  return 'idle';
}

export function getMissionPhaseIndex(mission: MissionState) {
  const threadState = getMissionThreadState(mission);

  switch (threadState) {
    case 'tasked':
      return 3;
    case 'correlated':
      return 2;
    case 'asset-selected':
    case 'target-selected':
      return 1;
    case 'idle':
    default:
      return 0;
  }
}

export function getMissionStatusCopy(mission: MissionState) {
  switch (getMissionThreadState(mission)) {
    case 'tasked':
      return `${mission.currentTask?.assetId} tasked to ${mission.currentTask?.targetId}. Assessment lane is live.`;
    case 'correlated':
      return 'Selections correlated. Task order can be issued.';
    case 'asset-selected':
      return `Asset ${mission.selectedAssetId} selected. Nominate a target to continue correlation.`;
    case 'target-selected':
      return `Target ${mission.selectedTargetId} nominated. Assign an asset to continue correlation.`;
    case 'idle':
    default:
      return 'No thread established. Observe lane is open.';
  }
}

export function getMissionFirstAction(mission: MissionState) {
  switch (getMissionThreadState(mission)) {
    case 'tasked':
      return 'Monitor task execution and assess outcome.';
    case 'correlated':
      return 'Issue tasking when ready.';
    case 'asset-selected':
      return 'Select a target.';
    case 'target-selected':
      return 'Select an asset.';
    case 'idle':
    default:
      return 'Select an asset to begin.';
  }
}

export function getMissionAsset(mission: MissionState): Asset | null {
  const assetId = mission.currentTask?.assetId ?? mission.selectedAssetId;
  return assetId ? ASSETS.find((asset) => asset.id === assetId) ?? null : null;
}

export function getMissionTarget(mission: MissionState): TargetMarker | null {
  const targetId = mission.currentTask?.targetId ?? mission.selectedTargetId;
  return targetId ? TARGETS.find((target) => target.id === targetId) ?? null : null;
}

export function buildMissionMetrics(mission: MissionState): MissionMetric[] {
  const asset = getMissionAsset(mission);
  const target = getMissionTarget(mission);
  const threadState = getMissionThreadState(mission);
  const isIdle = threadState === 'idle';
  const hasCorrelation = Boolean(mission.selectedAssetId && mission.selectedTargetId);
  const targetComplexity = target?.size === 'lg' ? 84 : target?.size === 'md' ? 72 : target ? 58 : isIdle ? 18 : 34;
  const fuelWindow = asset ? Math.max(18, Math.round(asset.fuel * 0.92)) : isIdle ? 22 : 36;
  const linkIntegrity = mission.currentTask ? 96 : hasCorrelation ? 78 : asset || target ? 54 : 22;
  const routeCommit = mission.currentTask ? 93 : hasCorrelation ? 66 : isIdle ? 12 : 24;
  const sensorFocus = asset ? Math.min(95, 52 + Math.round(asset.heading / 6)) : isIdle ? 18 : 40;
  const riskIndex = target
    ? target.type === 'Building'
      ? 68
      : target.type === 'Infrastructure'
        ? 61
        : 42
    : isIdle ? 14 : 26;

  return [
    {
      label: 'Sensor',
      value: sensorFocus,
      tone: asset ? 'blue' : isIdle ? 'blue' : 'yellow',
      detail: asset ? `${asset.type} vector locked` : isIdle ? 'Observe lane awaiting selection' : 'No platform selected',
    },
    {
      label: 'Link',
      value: linkIntegrity,
      tone: mission.currentTask ? 'yellow' : 'blue',
      detail: mission.currentTask ? 'Task data link hardened' : hasCorrelation ? 'Cross-module chain present' : isIdle ? 'No thread continuity yet' : 'Correlation incomplete',
    },
    {
      label: 'Window',
      value: fuelWindow,
      tone: asset ? (fuelWindow > 60 ? 'blue' : fuelWindow > 35 ? 'yellow' : 'red') : isIdle ? 'blue' : 'yellow',
      detail: asset ? `${asset.fuel}% fuel remaining` : isIdle ? 'Task window not committed' : 'Time-on-station unknown',
    },
    {
      label: 'Target',
      value: targetComplexity,
      tone: target ? 'yellow' : 'blue',
      detail: target ? `${target.type} package under review` : 'No target nominated',
    },
    {
      label: 'Task',
      value: routeCommit,
      tone: mission.currentTask ? 'yellow' : 'blue',
      detail: mission.currentTask ? `${mission.currentTask.assetId} committed` : isIdle ? 'No task order in thread' : 'Awaiting task order',
    },
    {
      label: 'Risk',
      value: riskIndex,
      tone: riskIndex > 60 ? 'red' : riskIndex > 40 ? 'yellow' : 'blue',
      detail: target ? `Collateral exposure ${riskIndex}%` : isIdle ? 'Risk posture unscored' : 'Risk unscored',
    },
  ];
}

export function buildMissionAlerts(mission: MissionState): Alert[] {
  const contextual: Alert[] = [];
  const asset = getMissionAsset(mission);
  const target = getMissionTarget(mission);

  if (mission.currentTask && asset && target) {
    contextual.push({
      id: 'TASK-01',
      level: 'INFO',
      msg: `TASK ORDER ACTIVE: ${asset.id} ASSIGNED TO ${target.id.toUpperCase()}`,
      time: 'LIVE',
      assetId: asset.id,
      targetId: target.id,
    });

    contextual.push({
      id: 'TASK-02',
      level: asset.fuel < 45 ? 'WARNING' : 'INFO',
      msg: asset.fuel < 45 ? 'TASK WINDOW CONSTRAINED BY FUEL STATE' : 'ASSET FUEL SUPPORTS CURRENT TASK WINDOW',
      time: 'LIVE',
      assetId: asset.id,
      targetId: target.id,
    });
  } else if (asset && target) {
    contextual.push({
      id: 'TASK-03',
      level: 'WARNING',
      msg: `CORRELATION READY: AUTHORIZE ${asset.id} FOR ${target.id.toUpperCase()}`,
      time: 'LIVE',
      assetId: asset.id,
      targetId: target.id,
    });
  } else if (asset) {
    contextual.push({
      id: 'TASK-04',
      level: 'INFO',
      msg: `${asset.id} SELECTED. NOMINATE TARGET TO COMPLETE THE CHAIN`,
      time: 'LIVE',
      assetId: asset.id,
    });
  } else if (target) {
    contextual.push({
      id: 'TASK-05',
      level: 'INFO',
      msg: `${target.id.toUpperCase()} NOMINATED. ASSIGN AN ASSET TO PROCEED`,
      time: 'LIVE',
      targetId: target.id,
    });
  }

  const missionAlerts = [...contextual, ...ALERTS];

  return missionAlerts.sort((a, b) => {
    const aPriority = getAlertPriority(a, mission);
    const bPriority = getAlertPriority(b, mission);
    return bPriority - aPriority;
  });
}

function getAlertPriority(alert: Alert, mission: MissionState) {
  const missionAssetId = mission.currentTask?.assetId ?? mission.selectedAssetId;
  const missionTargetId = mission.currentTask?.targetId ?? mission.selectedTargetId;
  const levelWeight = alert.level === 'CRITICAL' ? 3 : alert.level === 'WARNING' ? 2 : 1;
  const contextualWeight = alert.id.startsWith('TASK-') ? 5 : 0;
  const assetWeight = alert.assetId && alert.assetId === missionAssetId ? 2 : 0;
  const targetWeight = alert.targetId && alert.targetId === missionTargetId ? 2 : 0;

  return contextualWeight + assetWeight + targetWeight + levelWeight;
}
