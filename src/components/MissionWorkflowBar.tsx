import { motion } from 'motion/react';
import { ASSETS, TARGETS } from '../data';
import type { ActiveModule, MissionState } from '../types';

interface Props {
  activeModule: ActiveModule;
  mission: MissionState;
}

const PHASES = ['Observe', 'Correlate', 'Task', 'Assess'] as const;

function getPhaseIndex(mission: MissionState) {
  if (mission.currentTask) {
    return 3;
  }

  if (mission.selectedAssetId && mission.selectedTargetId) {
    return 2;
  }

  if (mission.selectedAssetId || mission.selectedTargetId) {
    return 1;
  }

  return 0;
}

function getStatusCopy(mission: MissionState) {
  if (mission.currentTask) {
    return `${mission.currentTask.assetId} tasked to ${mission.currentTask.targetId}`;
  }

  if (mission.selectedAssetId && mission.selectedTargetId) {
    return 'Selections correlated. Tasking is ready.';
  }

  if (mission.selectedAssetId) {
    return 'Asset selected. Choose a target to continue.';
  }

  if (mission.selectedTargetId) {
    return 'Target selected. Choose an asset to continue.';
  }

  return 'No task chain established. Select an asset and a target.';
}

export function MissionWorkflowBar({ activeModule, mission }: Props) {
  const phaseIndex = getPhaseIndex(mission);
  const selectedAsset = mission.selectedAssetId
    ? ASSETS.find((asset) => asset.id === mission.selectedAssetId)
    : null;
  const selectedTarget = mission.selectedTargetId
    ? TARGETS.find((target) => target.id === mission.selectedTargetId)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-[#333] bg-[linear-gradient(90deg,rgba(17,17,17,1)_0%,rgba(25,31,25,1)_50%,rgba(17,17,17,1)_100%)] px-4 py-3 md:px-8"
    >
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 font-mono">
            <span className="text-[0.55rem] font-bold uppercase tracking-[0.25em] text-[#777]">
              Mission Thread
            </span>
            <span className="border border-acid-yellow/40 bg-acid-yellow/10 px-2 py-1 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-acid-yellow">
              {activeModule}
            </span>
            <span className="text-[0.75rem] text-archival-white">
              {getStatusCopy(mission)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-[0.6rem]">
            <span className={`border px-2 py-1 ${selectedAsset ? 'border-radar-blue/50 text-radar-blue' : 'border-[#333] text-[#666]'}`}>
              ASSET: {selectedAsset?.id ?? 'NONE'}
            </span>
            <span className={`border px-2 py-1 ${selectedTarget ? 'border-target-red/50 text-target-red' : 'border-[#333] text-[#666]'}`}>
              TARGET: {selectedTarget?.id ?? 'NONE'}
            </span>
            <span className={`border px-2 py-1 ${mission.currentTask ? 'border-acid-yellow/50 text-acid-yellow' : 'border-[#333] text-[#666]'}`}>
              TASK: {mission.currentTask ? `${mission.currentTask.assetId} -> ${mission.currentTask.targetId}` : 'STANDBY'}
            </span>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-4">
          {PHASES.map((phase, index) => {
            const isActive = index <= phaseIndex;
            const isCurrent = index === phaseIndex;

            return (
              <div
                key={phase}
                className={`relative overflow-hidden border px-3 py-2 font-mono ${
                  isActive ? 'border-acid-yellow/40 bg-acid-yellow/8' : 'border-[#2a2a2a] bg-black/40'
                }`}
              >
                {isCurrent && (
                  <motion.div
                    layoutId="mission-phase-highlight"
                    className="absolute inset-y-0 left-0 w-1 bg-acid-yellow"
                  />
                )}
                <div className="pl-2">
                  <div className={`text-[0.5rem] uppercase tracking-[0.25em] ${isActive ? 'text-[#888]' : 'text-[#555]'}`}>
                    Phase {index + 1}
                  </div>
                  <div className={`text-[0.85rem] font-bold uppercase tracking-[0.18em] ${isActive ? 'text-archival-white' : 'text-[#777]'}`}>
                    {phase}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
