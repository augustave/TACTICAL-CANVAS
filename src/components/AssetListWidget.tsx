import { motion, AnimatePresence } from 'motion/react';
import { ASSETS } from '../data';
import type { AssetStatus } from '../types';

const PlaneIcon = ({ size = 14, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className={className}>
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.2-1.1.6L3 8l6 5-3 3-3-1-2 2 4 4 2-2-1-3 3-3 5 6 1.2-.7c.4-.2.7-.6.6-1.1z" />
  </svg>
);

const ShieldIcon = ({ size = 14, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const TargetIcon = ({ size = 14, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

const NavigationIcon = ({ size = 14, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className={className}>
    <polygon points="3 11 22 2 13 21 11 13 3 11" />
  </svg>
);

const ActivityIcon = ({ size = 14, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className={className}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const ICON_MAP: Record<string, typeof PlaneIcon> = {
  Fighter: PlaneIcon,
  Support: ActivityIcon,
  AWACS: ShieldIcon,
  Strike: TargetIcon,
  Naval: NavigationIcon,
  UAV: TargetIcon,
};

const STATUS_COLOR: Record<AssetStatus, string> = {
  ACTIVE: 'border-radar-blue text-radar-blue',
  RTB: 'border-alert-red text-alert-red',
  LOITER: 'border-acid-yellow text-acid-yellow',
  TRACKED: 'border-[#666] text-[#666]',
};

const ICON_COLOR: Record<AssetStatus, string> = {
  ACTIVE: 'text-radar-blue',
  RTB: 'text-alert-red',
  LOITER: 'text-acid-yellow',
  TRACKED: 'text-[#888]',
};

interface Props {
  selectedAssetId: string | null;
  onSelectAsset: (id: string | null) => void;
}

export function AssetListWidget({ selectedAssetId, onSelectAsset }: Props) {
  return (
    <div className="w-full h-full min-h-[400px] bg-[#111] border border-[#333] flex flex-col font-mono text-xs text-archival-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-black border-b border-[#333]">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-acid-yellow rounded-full animate-pulse" />
          <span className="font-bold tracking-widest text-[#888]">ACTIVE ASSETS</span>
        </div>
        <div className="flex items-center gap-2">
          {selectedAssetId && (
            <button
              onClick={() => onSelectAsset(null)}
              className="text-[0.5rem] text-[#888] hover:text-archival-white border border-[#444] px-1.5 py-0.5 transition-colors"
            >
              CLEAR
            </button>
          )}
          <span className="text-[0.6rem] text-[#666]">[{ASSETS.length}]</span>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide p-2 space-y-1">
        {ASSETS.map((asset, i) => {
          const isSelected = selectedAssetId === asset.id;
          const Icon = ICON_MAP[asset.type] || PlaneIcon;

          return (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{
                opacity: 1,
                x: 0,
                backgroundColor: isSelected ? 'rgba(229,255,0,0.08)' : 'rgba(26,26,26,1)',
              }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelectAsset(asset.id)}
              className={`flex flex-col gap-1 p-2 border cursor-pointer transition-colors group ${
                isSelected
                  ? 'border-acid-yellow/50 shadow-[0_0_8px_rgba(229,255,0,0.1)]'
                  : 'border-[#2a2a2a] hover:bg-[#222] hover:border-[#444]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon size={12} className={ICON_COLOR[asset.status]} />
                  <span className={`font-bold transition-colors ${isSelected ? 'text-acid-yellow' : 'group-hover:text-acid-yellow'}`}>
                    {asset.id}
                  </span>
                </div>
                <span className={`text-[0.55rem] px-1.5 py-0.5 border ${STATUS_COLOR[asset.status]}`}>
                  {asset.status}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-1">
                <span className="text-[0.55rem] text-[#666] w-12">{asset.type}</span>
                <div className="flex-1 h-1 bg-black overflow-hidden">
                  <motion.div
                    className={`h-full ${
                      asset.fuel > 50 ? 'bg-radar-blue' :
                      asset.fuel > 20 ? 'bg-acid-yellow' : 'bg-alert-red'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${asset.fuel}%` }}
                    transition={{ delay: i * 0.05 + 0.3, duration: 0.6 }}
                  />
                </div>
                <span className="text-[0.55rem] text-[#888] w-6 text-right">{asset.fuel}%</span>
              </div>

              {/* Selection detail — only when selected */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="flex justify-between text-[0.5rem] text-[#888] mt-1 pt-1 border-t border-[#333]">
                      <span>HDG: {asset.heading}°</span>
                      <span>POS: {asset.radarX},{asset.radarY}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-2 bg-black border-t border-[#333] text-[0.5rem] text-[#666] flex justify-between">
        <span>DATA LINK: SECURE</span>
        <span>LATENCY: 12ms</span>
      </div>
    </div>
  );
}
