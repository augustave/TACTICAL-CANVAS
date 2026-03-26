import { motion } from 'motion/react';
import type { AlertLevel, MissionState } from '../types';
import { buildMissionAlerts } from '../utils/mission';

const AlertTriangleIcon = ({ size = 14, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className={className}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const InfoIcon = ({ size = 14, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const ShieldAlertIcon = ({ size = 14, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const ICON_MAP: Record<AlertLevel, typeof InfoIcon> = {
  CRITICAL: ShieldAlertIcon,
  WARNING: AlertTriangleIcon,
  INFO: InfoIcon,
};

const COLOR_MAP: Record<AlertLevel, string> = {
  CRITICAL: 'text-alert-red',
  WARNING: 'text-acid-yellow',
  INFO: 'text-radar-blue',
};

interface Props {
  mission: MissionState;
  onSelectAsset?: (id: string | null) => void;
}

export function AlertsWidget({ mission, onSelectAsset }: Props) {
  const sortedAlerts = buildMissionAlerts(mission);
  const missionAssetId = mission.currentTask?.assetId ?? mission.selectedAssetId;
  const missionTargetId = mission.currentTask?.targetId ?? mission.selectedTargetId;

  return (
    <div className="w-full h-full min-h-[200px] bg-[#111] border border-[#333] flex flex-col font-mono text-xs text-archival-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-black border-b border-[#333]">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-alert-red rounded-full animate-ping" />
          <span className="font-bold tracking-widest text-[#888]">SYSTEM ALERTS</span>
        </div>
        {(missionAssetId || missionTargetId) && (
          <span className="text-[0.5rem] text-acid-yellow">
            FOCUS: {missionAssetId ?? 'NO ASSET'} / {missionTargetId ?? 'NO TARGET'}
          </span>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-2 space-y-1">
        {sortedAlerts.map((alert, i) => {
          const Icon = ICON_MAP[alert.level];
          const color = alert.level === 'INFO' && !alert.assetId ? 'text-[#888]' : COLOR_MAP[alert.level];
          const isLinked = Boolean(
            (missionAssetId && alert.assetId === missionAssetId) ||
            (missionTargetId && alert.targetId === missionTargetId),
          );

          return (
            <motion.div
              key={alert.id}
              layout
              initial={{ opacity: 0, x: 10 }}
              animate={{
                opacity: 1,
                x: 0,
                backgroundColor: isLinked ? 'rgba(229,255,0,0.06)' : 'rgba(26,26,26,1)',
              }}
              transition={{ delay: i * 0.1, layout: { type: 'spring', stiffness: 300, damping: 30 } }}
              onClick={() => alert.assetId && onSelectAsset?.(alert.assetId)}
              className={`flex gap-2 p-2 border cursor-pointer transition-colors group ${
                isLinked
                  ? 'border-acid-yellow/30'
                  : 'border-[#2a2a2a] hover:bg-[#222] hover:border-[#444]'
              }`}
            >
              <Icon size={14} className={`mt-0.5 ${color}`} />
              <div className="flex flex-col flex-1">
                <div className="flex justify-between items-center">
                  <span className={`text-[0.55rem] font-bold ${color}`}>{alert.level}</span>
                  <div className="flex items-center gap-2">
                    {alert.assetId && (
                      <span className="text-[0.45rem] text-[#555] border border-[#333] px-1 py-0.5">
                        {alert.assetId}
                      </span>
                    )}
                    {alert.targetId && (
                      <span className="text-[0.45rem] text-[#6d3c44] border border-target-red/30 px-1 py-0.5 text-target-red">
                        {alert.targetId}
                      </span>
                    )}
                    <span className="text-[0.5rem] text-[#666]">{alert.time}</span>
                  </div>
                </div>
                <span className="text-[0.6rem] text-[#aaa] mt-0.5 leading-tight group-hover:text-white transition-colors">
                  {alert.msg}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
