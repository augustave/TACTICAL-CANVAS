import { motion, AnimatePresence } from 'motion/react';
import { TARGETS } from '../data';

const CrosshairIcon = ({ size = 14, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
  </svg>
);

const SendIcon = ({ size = 14, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className={className}>
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const LayersIcon = ({ size = 14, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className={className}>
    <polygon points="12 2 2 7 12 12 22 7 12 2" />
    <polyline points="2 12 12 17 22 12" />
    <polyline points="2 17 12 22 22 17" />
  </svg>
);

interface Props {
  selectedTargetId?: string | null;
  onSelectTarget?: (id: string | null) => void;
}

export function Targeting3D({ selectedTargetId = null, onSelectTarget }: Props) {
  const selectedTarget = selectedTargetId ? TARGETS.find(t => t.id === selectedTargetId) : TARGETS[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative w-full aspect-[4/3] bg-[#111] border-2 border-ink overflow-hidden shadow-[4px_6px_15px_rgba(0,0,0,0.6)] font-mono perspective-1000"
    >
      {/* Top Action Bar — reflects selection state */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center bg-[#1a1a1a] border border-[#444] text-archival-white text-xs shadow-lg whitespace-nowrap">
        <div className="px-3 py-2 text-[#888] border-r border-[#444] font-bold hidden sm:block">SELECTED:</div>
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedTarget?.id || 'none'}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-2 px-3 py-2 border-r border-[#444] bg-[#2a2a2a]"
          >
            <CrosshairIcon size={16} className="text-target-red" />
            <div className="flex flex-col leading-none">
              <span className="font-bold">{selectedTarget?.id || '—'}</span>
              <span className="text-[0.5rem] text-[#888]">{selectedTarget?.type || '—'}</span>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="flex items-center gap-3 px-4 py-2 border-r border-[#444] text-[#888]">
          <CrosshairIcon size={14} className="hover:text-white cursor-pointer" />
          <LayersIcon size={14} className="hover:text-white cursor-pointer" />
          <SendIcon size={14} className="hover:text-white cursor-pointer" />
        </div>
        <div className="px-4 py-2 border-r border-[#444] text-[#aaa]">
          Aimpoints ({TARGETS.length}x)
        </div>
        <div className="px-4 py-2 text-acid-yellow font-bold hover:bg-[#333] cursor-pointer flex items-center gap-2">
          Task Asset <span className="text-lg leading-none">→</span>
        </div>
        {selectedTargetId && onSelectTarget && (
          <div
            onClick={() => onSelectTarget(null)}
            className="px-3 py-2 border-l border-[#444] hover:bg-target-red hover:text-white cursor-pointer transition-colors"
          >
            ✕
          </div>
        )}
      </div>

      {/* 3D World Container */}
      <div className="absolute inset-0 preserve-3d">
        {/* Tilted Map Plane */}
        <div
          className="absolute w-[200%] h-[200%] -left-1/2 -top-1/2 bg-[#1a201a] origin-center"
          style={{
            transform: 'rotateX(65deg) rotateZ(-15deg) translateY(20%)',
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }}
        >
          <div className="absolute top-[40%] left-[30%] w-[40%] h-[20%] bg-[#2a302a] rounded-full blur-3xl opacity-50" />
          <div className="absolute top-[20%] left-[50%] w-[10%] h-[60%] bg-[#151a15] blur-2xl opacity-80" />
          <div className="absolute top-[60%] left-[40%] w-[200px] h-[200px] -translate-x-1/2 -translate-y-1/2 border-2 border-acid-yellow rounded-full opacity-60 shadow-[0_0_15px_rgba(229,255,0,0.3)]" />
        </div>

        {/* 3D Markers — selection-aware */}
        <div className="absolute inset-0 preserve-3d">
          {TARGETS.map((marker, i) => {
            const isSelected = selectedTargetId === marker.id || (!selectedTargetId && i === 0);

            return (
              <div
                key={i}
                className="absolute preserve-3d"
                style={{
                  left: `${marker.x}%`,
                  top: `${marker.y}%`,
                  transform: 'translateZ(0)'
                }}
                onClick={() => onSelectTarget?.(marker.id)}
              >
                <motion.div
                  className="relative -translate-x-1/2 -translate-y-full flex flex-col items-center group cursor-pointer"
                  animate={{
                    scale: isSelected ? 1.1 : 1,
                    y: isSelected ? -4 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  {/* Glow effect — stronger when selected */}
                  <div className={`absolute inset-0 bg-target-red blur-xl transition-opacity rounded-full ${
                    isSelected ? 'opacity-30' : 'opacity-0 group-hover:opacity-20'
                  }`} />

                  <svg
                    width={marker.size === 'lg' ? 60 : marker.size === 'md' ? 40 : 25}
                    height={marker.size === 'lg' ? 100 : marker.size === 'md' ? 65 : 40}
                    viewBox="0 0 100 160"
                    className="drop-shadow-[0_15px_15px_rgba(255,0,0,0.3)] transition-transform group-hover:scale-110 group-hover:-translate-y-2"
                  >
                    <defs>
                      <linearGradient id={`grad-left-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(255, 51, 51, 0.8)" />
                        <stop offset="100%" stopColor="rgba(200, 0, 0, 0.4)" />
                      </linearGradient>
                      <linearGradient id={`grad-right-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(200, 0, 0, 0.4)" />
                        <stop offset="100%" stopColor="rgba(150, 0, 0, 0.8)" />
                      </linearGradient>
                      <linearGradient id={`grad-bottom-left-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(200, 0, 0, 0.6)" />
                        <stop offset="100%" stopColor="rgba(150, 0, 0, 0.2)" />
                      </linearGradient>
                      <linearGradient id={`grad-bottom-right-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="rgba(150, 0, 0, 0.2)" />
                        <stop offset="100%" stopColor="rgba(100, 0, 0, 0.6)" />
                      </linearGradient>
                    </defs>

                    <polygon points="50,0 50,80 0,80" fill={`url(#grad-left-${i})`} stroke={isSelected ? "#ffaaaa" : "#ff6666"} strokeWidth={isSelected ? 2 : 1} />
                    <polygon points="50,0 100,80 50,80" fill={`url(#grad-right-${i})`} stroke={isSelected ? "#ff6666" : "#ff3333"} strokeWidth={isSelected ? 2 : 1} />
                    <polygon points="50,160 0,80 50,80" fill={`url(#grad-bottom-left-${i})`} stroke="#cc0000" strokeWidth="1" />
                    <polygon points="50,160 100,80 50,80" fill={`url(#grad-bottom-right-${i})`} stroke="#990000" strokeWidth="1" />

                    <line x1="50" y1="0" x2="50" y2="160" stroke="#ff9999" strokeWidth="2" opacity="0.8" />
                    <line x1="0" y1="80" x2="100" y2="80" stroke="#ff9999" strokeWidth="1.5" opacity="0.6" />
                  </svg>

                  <div className="w-[1px] h-8 bg-gradient-to-b from-target-red to-transparent opacity-50" />
                  <div className="w-4 h-1 bg-target-red rounded-[100%] blur-[2px] opacity-60" />

                  {/* Label */}
                  <div className="absolute top-[40%] left-full ml-3 -translate-y-1/2 whitespace-nowrap pointer-events-none">
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-[1px] ${isSelected ? 'bg-acid-yellow' : 'bg-target-red'} opacity-50`} />
                      <div>
                        <div className={`text-[0.65rem] font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-wider ${
                          isSelected ? 'text-acid-yellow' : 'text-archival-white'
                        }`}>
                          {marker.id}
                        </div>
                        {marker.dist && (
                          <div className="text-acid-yellow text-[0.55rem] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{marker.dist}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Toolbar */}
      <div className="absolute top-0 right-0 bottom-0 w-10 bg-[#111] border-l border-[#333] flex flex-col items-center py-4 gap-4 z-50">
        <div className="p-1.5 text-[#888] hover:text-white cursor-pointer"><CrosshairIcon size={16} /></div>
        <div className="p-1.5 text-[#888] hover:text-white cursor-pointer"><LayersIcon size={16} /></div>
        <div className="w-6 h-[1px] bg-[#333] my-2" />
        <div className="relative w-8 h-8 rounded-full border border-[#555] flex items-center justify-center mt-auto mb-4">
          <div className="absolute top-0 text-[0.4rem] text-[#888]">N</div>
          <div className="w-0.5 h-3 bg-target-red -translate-y-1" />
        </div>
      </div>
    </motion.div>
  );
}
