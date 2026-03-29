import { motion } from 'motion/react';
import { ASSETS, TARGETS } from '../data';
import type { ActiveModule, MissionState } from '../types';
import {
  getMissionFirstAction,
  getMissionPhaseIndex,
  getMissionStatusCopy,
  getMissionThreadState,
} from '../utils/mission';

interface Props {
  activeModule: ActiveModule;
  mission: MissionState;
}

const PHASES = ['Observe', 'Correlate', 'Task', 'Assess'] as const;

export function MissionWorkflowBar({ activeModule, mission }: Props) {
  const phaseIndex = getMissionPhaseIndex(mission);
  const threadState = getMissionThreadState(mission);
  const isIdle = threadState === 'idle';
  const selectedAsset = mission.selectedAssetId
    ? ASSETS.find((asset) => asset.id === mission.selectedAssetId)
    : null;
  const selectedTarget = mission.selectedTargetId
    ? TARGETS.find((target) => target.id === mission.selectedTargetId)
    : null;
  const taskLabel = mission.currentTask
    ? `${mission.currentTask.assetId} -> ${mission.currentTask.targetId}`
    : isIdle
      ? 'NONE'
      : 'PENDING';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-[#333] bg-[linear-gradient(90deg,rgba(17,17,17,1)_0%,rgba(25,31,25,1)_50%,rgba(17,17,17,1)_100%)] px-4 py-3 md:px-8"
    >
      <div className="mx-auto flex max-w-[1600px] flex-col gap-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3 font-mono">
            <span className="text-[0.55rem] font-bold uppercase tracking-[0.25em] text-[#777]">
              Mission Thread
            </span>
            <span className="border border-acid-yellow/40 bg-acid-yellow/10 px-2 py-1 text-[0.6rem] font-bold uppercase tracking-[0.18em] text-acid-yellow">
              {activeModule}
            </span>
            <div className="flex flex-col gap-1">
              <span className="text-[0.75rem] text-archival-white">
                {getMissionStatusCopy(mission)}
              </span>
              <span className={`inline-flex w-fit items-center gap-2 border px-2 py-1 text-[0.5rem] font-bold uppercase tracking-[0.18em] ${
                isIdle
                  ? 'border-radar-blue/35 bg-radar-blue/10 text-radar-blue'
                  : 'border-[#333] bg-black/40 text-[#8c9693]'
              }`}>
                <span className="text-[#666]">Next</span>
                <span>{getMissionFirstAction(mission)}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 font-mono text-[0.6rem]">
            <span className={`border px-2 py-1 ${selectedAsset ? 'border-radar-blue/50 text-radar-blue' : 'border-[#333] text-[#666]'}`}>
              ASSET: {selectedAsset?.id ?? 'NONE'}
            </span>
            <span className={`border px-2 py-1 ${selectedTarget ? 'border-target-red/50 text-target-red' : 'border-[#333] text-[#666]'}`}>
              TARGET: {selectedTarget?.id ?? 'NONE'}
            </span>
            <span className={`border px-2 py-1 ${mission.currentTask ? 'border-acid-yellow/50 text-acid-yellow' : 'border-[#333] text-[#666]'}`}>
              TASK: {taskLabel}
            </span>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-4">
          {PHASES.map((phase, index) => {
            const isReady = isIdle && index === 0;
            const isComplete = !isIdle && index < phaseIndex;
            const isCurrent = !isIdle && index === phaseIndex;
            const phaseClass = isCurrent
              ? 'border-acid-yellow/40 bg-acid-yellow/8'
              : isComplete
                ? 'border-acid-yellow/25 bg-acid-yellow/5'
                : isReady
                  ? 'border-radar-blue/35 bg-radar-blue/8'
                  : 'border-[#2a2a2a] bg-black/40';
            const phaseMetaClass = isCurrent
              ? 'text-[#888]'
              : isComplete
                ? 'text-[#777]'
                : isReady
                  ? 'text-radar-blue'
                  : 'text-[#555]';
            const phaseLabelClass = isCurrent
              ? 'text-archival-white'
              : isComplete
                ? 'text-[#d5d8cf]'
                : isReady
                  ? 'text-radar-blue'
                  : 'text-[#777]';
            const phaseStateLabel = isCurrent ? 'ACTIVE' : isComplete ? 'COMPLETE' : isReady ? 'READY' : 'DORMANT';

            return (
              <div
                key={phase}
                className={`relative overflow-hidden border px-3 py-2 font-mono ${phaseClass}`}
              >
                {(isCurrent || isReady) && (
                  <motion.div
                    layoutId={isCurrent ? 'mission-phase-highlight' : undefined}
                    className={`absolute inset-y-0 left-0 w-1 ${isReady ? 'bg-radar-blue' : 'bg-acid-yellow'}`}
                  />
                )}
                <div className="pl-2">
                  <div className={`flex items-center justify-between text-[0.5rem] uppercase tracking-[0.25em] ${phaseMetaClass}`}>
                    Phase {index + 1}
                    <span>{phaseStateLabel}</span>
                  </div>
                  <div className={`text-[0.85rem] font-bold uppercase tracking-[0.18em] ${phaseLabelClass}`}>
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
