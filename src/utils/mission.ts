import { ALERTS, ASSETS, TARGETS } from '../data';
import type { Alert, Asset, MissionState, TargetMarker } from '../types';

export interface MissionMetric {
  label: string;
  value: number;
  tone: 'blue' | 'yellow' | 'red';
  detail: string;
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
  const hasCorrelation = Boolean(mission.selectedAssetId && mission.selectedTargetId);
  const targetComplexity = target?.size === 'lg' ? 84 : target?.size === 'md' ? 72 : target ? 58 : 34;
  const fuelWindow = asset ? Math.max(18, Math.round(asset.fuel * 0.92)) : 36;
  const linkIntegrity = mission.currentTask ? 96 : hasCorrelation ? 78 : asset || target ? 54 : 30;
  const routeCommit = mission.currentTask ? 93 : hasCorrelation ? 66 : 24;
  const sensorFocus = asset ? Math.min(95, 52 + Math.round(asset.heading / 6)) : 40;
  const riskIndex = target
    ? target.type === 'Building'
      ? 68
      : target.type === 'Infrastructure'
        ? 61
        : 42
    : 26;

  return [
    {
      label: 'Sensor',
      value: sensorFocus,
      tone: asset ? 'blue' : 'yellow',
      detail: asset ? `${asset.type} vector locked` : 'No platform selected',
    },
    {
      label: 'Link',
      value: linkIntegrity,
      tone: mission.currentTask ? 'yellow' : 'blue',
      detail: mission.currentTask ? 'Task data link hardened' : hasCorrelation ? 'Cross-module chain present' : 'Correlation incomplete',
    },
    {
      label: 'Window',
      value: fuelWindow,
      tone: fuelWindow > 60 ? 'blue' : fuelWindow > 35 ? 'yellow' : 'red',
      detail: asset ? `${asset.fuel}% fuel remaining` : 'Time-on-station unknown',
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
      detail: mission.currentTask ? `${mission.currentTask.assetId} committed` : 'Awaiting task order',
    },
    {
      label: 'Risk',
      value: riskIndex,
      tone: riskIndex > 60 ? 'red' : riskIndex > 40 ? 'yellow' : 'blue',
      detail: target ? `Collateral exposure ${riskIndex}%` : 'Risk unscored',
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
