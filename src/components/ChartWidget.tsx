import { motion } from 'motion/react';
import type { MissionState } from '../types';
import {
  buildMissionMetrics,
  getMissionAsset,
  getMissionFirstAction,
  getMissionStatusCopy,
  getMissionTarget,
  getMissionThreadState,
} from '../utils/mission';

const TONE_CLASS = {
  active: {
    blue: 'bg-radar-blue/45 border-radar-blue hover:bg-radar-blue',
    yellow: 'bg-acid-yellow/35 border-acid-yellow hover:bg-acid-yellow hover:text-ink',
    red: 'bg-alert-red/45 border-alert-red hover:bg-alert-red',
  },
  idle: {
    blue: 'bg-radar-blue/18 border-radar-blue/40 hover:bg-radar-blue/30',
    yellow: 'bg-acid-yellow/16 border-acid-yellow/30 hover:bg-acid-yellow/24',
    red: 'bg-alert-red/16 border-alert-red/30 hover:bg-alert-red/24',
  },
} as const;

interface Props {
  mission: MissionState;
}

export function ChartWidget({ mission }: Props) {
  const metrics = buildMissionMetrics(mission);
  const asset = getMissionAsset(mission);
  const target = getMissionTarget(mission);
  const threadState = getMissionThreadState(mission);
  const isIdle = threadState === 'idle';
  const headerLabel = mission.currentTask
    ? 'ACTIVE TASK'
    : threadState === 'correlated'
      ? 'TASKING READY'
      : threadState === 'asset-selected' || threadState === 'target-selected'
        ? 'THREAD FORMING'
        : 'PRE-TASK HOLD';
  const barToneMap = isIdle ? TONE_CLASS.idle : TONE_CLASS.active;

  return (
    <div className="w-full h-full min-h-[200px] bg-[#111] border border-[#333] flex flex-col font-mono text-xs text-archival-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-black border-b border-[#333]">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${mission.currentTask ? 'bg-acid-yellow' : isIdle ? 'bg-radar-blue' : 'bg-[#8c9996]'}`} />
          <span className="font-bold tracking-widest text-[#888]">MISSION READINESS</span>
        </div>
        <span className={`text-[0.6rem] ${mission.currentTask ? 'text-acid-yellow' : isIdle ? 'text-radar-blue' : 'text-[#8c9996]'}`}>{headerLabel}</span>
      </div>

      <div className="grid gap-2 border-b border-[#1e2325] bg-black/35 px-3 py-2 md:grid-cols-[1.3fr_1fr]">
        <div className="min-w-0">
          <div className="text-[0.45rem] uppercase tracking-[0.24em] text-[#666]">Thread State</div>
          <div className="truncate pt-1 text-[0.62rem] text-[#c1c8c6]">{getMissionStatusCopy(mission)}</div>
        </div>
        <div className="min-w-0 text-left md:text-right">
          <div className="text-[0.45rem] uppercase tracking-[0.24em] text-[#666]">First Action</div>
          <div className={`truncate pt-1 text-[0.58rem] uppercase tracking-[0.18em] ${isIdle ? 'text-radar-blue' : 'text-[#a8b0ad]'}`}>
            {getMissionFirstAction(mission)}
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 p-4 flex flex-col justify-end gap-3 relative">
        {/* Y-Axis lines */}
        <div className="absolute inset-x-4 top-4 bottom-4 flex flex-col justify-between pointer-events-none opacity-20">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-full h-px bg-white" />
          ))}
        </div>
        
        {/* Bars */}
        <div className="flex items-end justify-between h-full gap-1 z-10">
          {metrics.map((metric, i) => (
            <motion.div 
              key={metric.label}
              initial={{ height: 0 }}
              animate={{ height: `${metric.value}%` }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className={`flex-1 border transition-colors relative group ${barToneMap[metric.tone]}`}
            >
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-[0.45rem] opacity-0 group-hover:opacity-100 transition-opacity bg-black px-1.5 py-1 border border-[#333] whitespace-nowrap text-center">
                <div>{metric.value}%</div>
                <div className="text-[#777]">{metric.detail}</div>
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* X-Axis labels */}
        <div className="grid grid-cols-6 gap-1 text-[0.45rem] text-[#666] mt-1">
          {metrics.map((metric) => (
            <span key={metric.label} className="text-center uppercase tracking-[0.16em]">
              {metric.label}
            </span>
          ))}
        </div>

        <div className="border-t border-[#222] pt-2 text-[0.5rem] text-[#777] flex items-center justify-between gap-3">
          <span>{asset ? `Asset ${asset.id}` : 'Asset lane dormant'}</span>
          <span>{target ? `Target ${target.id}` : 'Target lane dormant'}</span>
        </div>
      </div>
    </div>
  );
}
