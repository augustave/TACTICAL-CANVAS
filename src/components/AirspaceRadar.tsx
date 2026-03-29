import { motion } from 'motion/react';
import { ASSETS, TARGETS } from '../data';
import type { MissionTask } from '../types';
import { getMissionFirstAction, getMissionThreadState } from '../utils/mission';
import { RadarSurface } from './RadarSurface';

const CrosshairIcon = ({ size = 14, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
  </svg>
);

const PlaneIcon = ({ size = 14, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className={className}>
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6L3 8l6 5-3 3-3-1-2 2 4 4 2-2-1-3 3-3 5 6 1.2-.7c.4-.2.7-.6.6-1.1z" />
  </svg>
);

const NavigationIcon = ({ size = 14, className = "", style, fill }: { size?: number, className?: string, style?: React.CSSProperties, fill?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill || "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className={className} style={style}>
    <polygon points="3 11 22 2 13 21 11 13 3 11" />
  </svg>
);

interface Props {
  selectedAssetId?: string | null;
  selectedTargetId?: string | null;
  currentTask?: MissionTask | null;
  onSelectAsset?: (id: string | null) => void;
}

export function AirspaceRadar({
  selectedAssetId = null,
  selectedTargetId = null,
  currentTask = null,
  onSelectAsset,
}: Props) {
  const mission = { selectedAssetId, selectedTargetId, currentTask };
  const threadState = getMissionThreadState(mission);
  const isIdle = threadState === 'idle';
  const selectedAsset = selectedAssetId ? ASSETS.find((asset) => asset.id === selectedAssetId) ?? null : null;
  const selectedTarget = selectedTargetId ? TARGETS.find((target) => target.id === selectedTargetId) ?? null : null;
  const linkedTargetId = currentTask?.targetId ?? selectedTarget?.id ?? null;
  const stripLeadLabel = currentTask
    ? 'TASK ORDER'
    : threadState === 'correlated'
      ? 'TASKING READY'
      : threadState === 'asset-selected' || threadState === 'target-selected'
        ? 'CORRELATING'
        : 'THREAD IDLE';
  const stripLeadClass = currentTask
    ? 'text-acid-yellow'
    : isIdle
      ? 'text-radar-blue'
      : 'text-[#8a948f]';
  const targetTitle = linkedTargetId ?? 'No target nominated';
  const targetDetail = currentTask
    ? 'Committed task target'
    : selectedTarget
      ? `${selectedTarget.type} / ${selectedTarget.dist}`
      : selectedAsset
        ? 'Nominate a target to continue'
        : 'Correlation dormant';
  const assetTitle = selectedAsset
    ? selectedAsset.id
    : isIdle
      ? 'Select asset to begin Observe'
      : 'Assign asset to continue';
  const assetDetail = selectedAsset
    ? `${selectedAsset.type} / ${selectedAsset.status} / FUEL ${selectedAsset.fuel}%`
    : isIdle
      ? 'Platforms available, none committed'
      : 'Asset lane open';
  const radarModeLabel = currentTask
    ? 'Task Track'
    : threadState === 'correlated'
      ? 'Task Queue'
      : threadState === 'asset-selected'
        ? 'Target Search'
        : threadState === 'target-selected'
          ? 'Asset Search'
          : 'Wide Search';
  const radarModeClass = currentTask
    ? 'text-acid-yellow'
    : isIdle
      ? 'text-[#8ab7d8]'
      : 'text-radar-blue';
  const gateStatus = currentTask
    ? 'Priority Intercept'
    : isIdle
      ? 'Standby Coverage'
      : 'Thread Formation';
  const footerLabel = currentTask
    ? `TASK ${currentTask.assetId} -> ${currentTask.targetId}`
    : isIdle
      ? 'THREAD IDLE | SELECT ASSET'
      : `${stripLeadLabel} | ${getMissionFirstAction(mission).toUpperCase()}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="radar-frame relative w-full aspect-[4/3] overflow-hidden border-2 border-ink bg-[#050809] shadow-[4px_6px_15px_rgba(0,0,0,0.6)] font-mono"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(16,34,37,0.88)_0%,rgba(4,9,12,0.96)_62%,rgba(0,0,0,1)_100%)]" />
      <RadarSurface taskBias={currentTask ? 1 : 0} />
      <div className="absolute inset-[3.5%] rounded-[50%] border border-[rgba(229,255,0,0.08)] shadow-[inset_0_0_60px_rgba(74,144,226,0.08)] pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.08),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.08),transparent_28%),repeating-linear-gradient(180deg,rgba(255,255,255,0.028)_0,rgba(255,255,255,0.028)_1px,transparent_1px,transparent_4px)] mix-blend-screen opacity-45" />
      <div className="absolute left-[8%] top-[14%] z-10 hidden md:flex items-center gap-2 border border-[rgba(74,144,226,0.25)] bg-black/45 px-2 py-1 text-[0.5rem] uppercase tracking-[0.26em] text-[#8ab7d8] backdrop-blur-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-radar-blue shadow-[0_0_8px_rgba(74,144,226,0.9)]" />
        Volume Scan
      </div>
      <div className="absolute right-[8%] top-[16%] z-10 hidden md:flex items-center gap-3 border border-[rgba(229,255,0,0.18)] bg-black/45 px-2 py-1 text-[0.48rem] uppercase tracking-[0.22em] text-[#87918e] backdrop-blur-sm">
        <span>Range 240nm</span>
        <span className={radarModeClass}>{radarModeLabel}</span>
      </div>
      <div className="absolute left-1/2 top-1/2 z-[5] h-[82%] w-[82%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(255,255,255,0.03)] shadow-[0_0_0_1px_rgba(255,255,255,0.02),inset_0_0_35px_rgba(0,0,0,0.55)] pointer-events-none" />
      <div className="absolute left-1/2 top-1/2 z-[5] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-acid-yellow/35 bg-black/25 shadow-[0_0_14px_rgba(229,255,0,0.12)] pointer-events-none" />
      <div className="absolute left-1/2 top-[12%] z-[5] h-[76%] w-px -translate-x-1/2 bg-[linear-gradient(180deg,transparent,rgba(229,255,0,0.16),transparent)] pointer-events-none" />
      <div className="absolute left-[12%] top-1/2 z-[5] h-px w-[76%] -translate-y-1/2 bg-[linear-gradient(90deg,transparent,rgba(229,255,0,0.16),transparent)] pointer-events-none" />

      <div className="absolute top-4 left-1/2 z-50 flex w-[min(92%,820px)] -translate-x-1/2 items-stretch bg-black/90 border border-[#333] text-archival-white text-xs whitespace-nowrap shadow-[0_14px_32px_rgba(0,0,0,0.32)] backdrop-blur-sm">
        <div className={`hidden border-r border-[#333] px-3 py-2 text-[0.55rem] uppercase tracking-[0.24em] sm:flex sm:items-center ${stripLeadClass}`}>
          {stripLeadLabel}
        </div>
        <div className={`flex min-w-0 flex-1 items-center gap-2 border-r border-[#333] px-3 py-2 ${selectedTarget ? 'bg-[#151010]' : 'bg-transparent'}`}>
          <CrosshairIcon size={14} className={linkedTargetId ? 'text-target-red' : 'text-[#666]'} />
          <div className="min-w-0 flex-1 leading-none">
            <div className={`truncate text-[0.65rem] font-bold uppercase tracking-[0.16em] ${linkedTargetId ? 'text-target-red' : 'text-[#848484]'}`}>
              {targetTitle}
            </div>
            <div className="mt-1 truncate text-[0.5rem] uppercase tracking-[0.18em] text-[#666]">
              {targetDetail}
            </div>
          </div>
          {currentTask && (
            <span className="border border-acid-yellow/40 bg-acid-yellow/10 px-1.5 py-0.5 text-[0.45rem] text-acid-yellow">
              {currentTask.status}
            </span>
          )}
        </div>
        <div className={`flex min-w-0 flex-[1.15] items-center gap-2 px-3 py-2 ${selectedAsset ? 'bg-[#0f1519]' : 'bg-transparent'}`}>
          <PlaneIcon size={14} className={selectedAsset ? 'text-radar-blue' : 'text-[#666]'} />
          <div className="min-w-0 flex flex-col leading-none">
            <span className={`truncate text-[0.65rem] font-bold uppercase tracking-[0.16em] ${selectedAsset ? 'text-radar-blue' : 'text-[#9ba7ac]'}`}>
              {assetTitle}
            </span>
            <span className="mt-1 truncate text-[0.5rem] uppercase tracking-[0.18em] text-[#666]">
              {assetDetail}
            </span>
          </div>
        </div>
        {selectedAsset && onSelectAsset && (
          <div
            onClick={() => onSelectAsset(null)}
            className="flex cursor-pointer items-center border-l border-[#333] px-2 py-2 hover:bg-target-red hover:text-white transition-colors"
          >
            ✕
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute bottom-[13%] left-[7%] z-10 hidden md:flex flex-col gap-1 border border-[rgba(255,255,255,0.08)] bg-black/35 px-2 py-2 text-[0.45rem] uppercase tracking-[0.22em] text-[#7c8886] backdrop-blur-sm">
        <span className="text-[#b5c2bf]">Gate A</span>
        <span>Altitude Stack</span>
        <span>{gateStatus}</span>
      </div>
      <div className="pointer-events-none absolute bottom-[15%] right-[8%] z-10 hidden md:flex flex-col items-end gap-1 text-[0.45rem] uppercase tracking-[0.24em] text-[#86908d]">
        <span>090</span>
        <span>180</span>
        <span>270</span>
      </div>

      {/* Flight Markers — driven from shared ASSETS data */}
      {ASSETS.map((asset) => {
        const isSelected = selectedAssetId === asset.id;
        const isTasked = currentTask?.assetId === asset.id;
        const markerClass = isSelected
          ? 'text-acid-yellow drop-shadow-[0_0_8px_rgba(229,255,0,1)]'
          : isTasked
            ? 'text-target-red drop-shadow-[0_0_8px_rgba(208,2,27,1)]'
            : asset.status === 'ACTIVE'
              ? 'text-radar-blue drop-shadow-[0_0_4px_rgba(74,144,226,0.75)]'
              : asset.status === 'LOITER'
                ? 'text-[#b9ad58] drop-shadow-[0_0_4px_rgba(185,173,88,0.55)]'
                : asset.status === 'RTB'
                  ? 'text-alert-red drop-shadow-[0_0_4px_rgba(208,2,27,0.45)]'
                  : 'text-[#7f8a8e]';
        const labelClass = isSelected
          ? 'text-acid-yellow font-bold'
          : isTasked
            ? 'text-target-red font-bold'
            : asset.status === 'ACTIVE'
              ? 'text-radar-blue font-semibold'
              : 'text-[#b6c0be]';

        return (
            <div
              key={asset.id}
              onClick={() => onSelectAsset?.(asset.id)}
            className="absolute z-20 flex cursor-pointer flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${asset.radarX}%`, top: `${asset.radarY}%` }}
          >
            <motion.div
              className="relative"
              animate={{
                scale: isSelected ? 1.4 : 1,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              <NavigationIcon
                size={14}
                className={markerClass}
                style={{ transform: `rotate(${asset.heading}deg)` }}
                fill="currentColor"
              />
              {(isSelected || isTasked) && (
                <div className={`absolute inset-0 animate-ping rounded-full opacity-40 ${isTasked ? 'bg-target-red' : 'bg-acid-yellow'}`} />
              )}
              {/* Selection ring */}
              {isSelected && (
                <motion.div
                  className="absolute -inset-3 border border-acid-yellow rounded-full"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.6 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                />
              )}
              {isTasked && (
                <motion.div
                  className="absolute -inset-5 border border-target-red rounded-full"
                  initial={{ scale: 0.8, opacity: 0.2 }}
                  animate={{ scale: 1.15, opacity: 0.7 }}
                  transition={{ repeat: Infinity, repeatType: 'reverse', duration: 1.2 }}
                />
              )}
            </motion.div>
            <div className={`flex flex-col items-center leading-none ${labelClass}`}>
              <span className="text-[0.6rem] tracking-wider bg-black/50 px-1 rounded">{asset.id}</span>
              <span className="text-[0.5rem] text-[#888] bg-black/50 px-1 rounded mt-0.5">
                FL{Math.floor(200 + asset.heading * 0.5)}
              </span>
            </div>
          </div>
        );
      })}

      {/* Bottom Right Info */}
      <div className="absolute bottom-4 right-4 bg-black border border-[#333] px-3 py-1 text-archival-white text-[0.6rem] flex items-center gap-2">
        <span className={isIdle ? 'text-[#8fa9b8]' : ''}>{footerLabel}</span>
        <div className="w-3 h-3 border border-[#666] flex items-center justify-center">
          <div className={`w-1.5 h-1.5 ${currentTask ? 'bg-acid-yellow' : isIdle ? 'bg-radar-blue' : 'bg-[#888]'}`} />
        </div>
      </div>
    </motion.div>
  );
}
