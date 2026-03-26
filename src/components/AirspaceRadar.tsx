import { motion } from 'motion/react';
import { ASSETS } from '../data';
import type { MissionTask } from '../types';

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
  const selectedAsset = selectedAssetId ? ASSETS.find(a => a.id === selectedAssetId) : null;
  const linkedTargetId = currentTask?.targetId ?? selectedTargetId;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative w-full aspect-[4/3] bg-[#111] border-2 border-ink overflow-hidden shadow-[4px_6px_15px_rgba(0,0,0,0.6)] font-mono"
    >
      {/* Top Assignment Bar — shows selected asset context */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center bg-black border border-[#333] text-archival-white text-xs whitespace-nowrap">
        <div className="px-3 py-1.5 text-[#888] border-r border-[#333] hidden sm:block">
          {currentTask ? 'TASKED TO:' : selectedAsset ? 'CORRELATING:' : 'ASSIGN ASSET:'}
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 border-r border-[#333] hover:bg-[#222] cursor-pointer">
          <CrosshairIcon size={14} className="text-target-red" />
          <span>{linkedTargetId ?? 'Select Target'}</span>
          {currentTask && (
            <span className="text-[0.5rem] text-acid-yellow ml-1">{currentTask.status}</span>
          )}
          <span className="text-[#666] ml-2">&gt;</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-[#222] cursor-pointer">
          <PlaneIcon size={14} className="text-radar-blue" />
          <div className="flex flex-col leading-none">
            <span>{selectedAsset ? `${selectedAsset.type} / ${selectedAsset.status}` : 'Dragnet71-11-2'}</span>
            <span className="text-[0.5rem] text-[#666]">{selectedAsset ? `FUEL: ${selectedAsset.fuel}%` : 'Flight'}</span>
          </div>
        </div>
        {selectedAsset && onSelectAsset && (
          <div
            onClick={() => onSelectAsset(null)}
            className="px-2 py-1.5 border-l border-[#333] hover:bg-target-red hover:text-white cursor-pointer transition-colors"
          >
            ✕
          </div>
        )}
      </div>

      {/* Radar Grid & Rings */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <radialGradient id="radar-sweep" cx="0%" cy="0%" r="100%">
            <stop offset="0%" stopColor="rgba(100, 150, 255, 0.4)" />
            <stop offset="100%" stopColor="rgba(100, 150, 255, 0)" />
          </radialGradient>
        </defs>
        <pattern id="radar-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
        </pattern>
        <rect width="100%" height="100%" fill="url(#radar-grid)" />

        {/* Concentric Rings */}
        <g transform="translate(600, 400)">
          {[100, 200, 300, 400, 500, 600].map((r, i) => (
            <circle key={i} cx="0" cy="0" r={r} fill="none" stroke="rgba(229,255,0,0.4)" strokeWidth="1" />
          ))}
          <line x1="-800" y1="0" x2="800" y2="0" stroke="rgba(229,255,0,0.2)" strokeWidth="1" />
          <line x1="0" y1="-800" x2="0" y2="800" stroke="rgba(229,255,0,0.2)" strokeWidth="1" />

          <line x1="-300" y1="-200" x2="0" y2="0" stroke="rgba(229,255,0,0.8)" strokeWidth="2" strokeDasharray="4 4" />
          <line x1="0" y1="0" x2="0" y2="400" stroke="rgba(229,255,0,0.8)" strokeWidth="2" strokeDasharray="4 4" />

          {/* Radar Sweep Arc */}
          <g className="origin-center animate-[spin_4s_linear_infinite]">
            <path d="M 0 0 L 0 -800 A 800 800 0 0 1 400 -692 Z" fill="url(#radar-sweep)" />
            <line x1="0" y1="0" x2="0" y2="-800" stroke="rgba(100, 150, 255, 0.8)" strokeWidth="2" />
          </g>
        </g>

        {/* Secondary Radar Site */}
        <g transform="translate(100, 700)">
          {[100, 200, 300].map((r, i) => (
            <circle key={i} cx="0" cy="0" r={r} fill="none" stroke="rgba(255,51,51,0.3)" strokeWidth="1" />
          ))}
        </g>
      </svg>

      {/* Flight Markers — driven from shared ASSETS data */}
      {ASSETS.map((asset) => {
        const isSelected = selectedAssetId === asset.id;
        const isActive = isSelected || asset.id === 'Dragnet71'; // Dragnet71 always active by default
        const isTasked = currentTask?.assetId === asset.id;

        return (
          <div
            key={asset.id}
            onClick={() => onSelectAsset?.(asset.id)}
            className="absolute flex flex-col items-center gap-1 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
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
                className={
                  isSelected
                    ? "text-acid-yellow drop-shadow-[0_0_8px_rgba(229,255,0,1)]"
                    : isTasked
                      ? "text-target-red drop-shadow-[0_0_8px_rgba(208,2,27,1)]"
                    : isActive
                      ? "text-acid-yellow drop-shadow-[0_0_5px_rgba(229,255,0,0.8)]"
                      : "text-radar-blue drop-shadow-[0_0_5px_rgba(100,150,255,0.8)]"
                }
                style={{ transform: `rotate(${asset.heading}deg)` }}
                fill="currentColor"
              />
              {(isActive || isSelected || isTasked) && (
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
            <div className={`flex flex-col items-center leading-none ${isSelected ? 'text-acid-yellow font-bold' : isTasked ? 'text-target-red font-bold' : isActive ? 'text-acid-yellow font-bold' : 'text-archival-white'}`}>
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
        <span>{currentTask ? `TASK ${currentTask.assetId} -> ${currentTask.targetId}` : new Date().toISOString().replace('T', ' ').slice(0, 19) + 'Z'}</span>
        <div className="w-3 h-3 border border-[#666] flex items-center justify-center">
          <div className="w-1.5 h-1.5 bg-acid-yellow" />
        </div>
      </div>
    </motion.div>
  );
}
