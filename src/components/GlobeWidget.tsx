import { motion } from 'motion/react';
import { ASSETS } from '../data';

interface Props {
  selectedAssetId?: string | null;
}

export function GlobeWidget({ selectedAssetId = null }: Props) {
  const selectedAsset = selectedAssetId ? ASSETS.find(a => a.id === selectedAssetId) : null;

  return (
    <div className="relative w-full h-full min-h-[300px] bg-black border border-[#333] overflow-hidden flex items-center justify-center">
      {/* Starry/Dark background */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: 'radial-gradient(circle at 50% 50%, #333 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }} />

      {/* The Globe */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative w-[280px] h-[280px] rounded-full overflow-hidden shadow-[0_0_40px_rgba(100,150,255,0.1)] border border-[#333]"
        style={{
          background: 'radial-gradient(circle at 30% 30%, #1a2035 0%, #050a15 80%, #000 100%)',
          boxShadow: 'inset -20px -20px 40px rgba(0,0,0,0.8), 0 0 20px rgba(100,150,255,0.2)'
        }}
      >
        {/* Latitude / Longitude lines */}
        <div className="absolute inset-0 opacity-20">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="49" fill="none" stroke="#fff" strokeWidth="0.5" />
            <ellipse cx="50" cy="50" rx="25" ry="49" fill="none" stroke="#fff" strokeWidth="0.5" />
            <ellipse cx="50" cy="50" rx="10" ry="49" fill="none" stroke="#fff" strokeWidth="0.5" />
            <line x1="1" y1="50" x2="99" y2="50" stroke="#fff" strokeWidth="0.5" />
            <line x1="10" y1="25" x2="90" y2="25" stroke="#fff" strokeWidth="0.5" />
            <line x1="10" y1="75" x2="90" y2="75" stroke="#fff" strokeWidth="0.5" />
          </svg>
        </div>

        {/* Stylized Map */}
        <div className="absolute inset-0 opacity-60">
          <svg viewBox="0 0 200 200" className="w-full h-full" style={{ transform: 'scale(1.5) translate(-10%, 10%)' }}>
            <path d="M 120 60 Q 140 50 160 70 T 180 100 T 150 140 T 110 120 T 90 90 Z" fill="#3a4556" />
            <path d="M 60 40 Q 80 30 100 50 T 110 80 T 80 100 T 50 80 Z" fill="#3a4556" />
            <path d="M 80 100 Q 100 110 110 140 T 80 180 T 50 150 Z" fill="#3a4556" />
            {/* Default target marker */}
            <circle cx="115" cy="95" r="3" fill="#ff3333" className="animate-pulse" />
            <circle cx="115" cy="95" r="8" fill="none" stroke="#ff3333" strokeWidth="0.5" className="animate-ping" />
            <circle cx="125" cy="85" r="2" fill="#ff3333" />
          </svg>
        </div>

        {/* Atmospheric glow */}
        <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_rgba(255,255,255,0.1)] pointer-events-none" />
      </motion.div>

      {/* Overlay UI */}
      <div className="absolute top-2 left-2 flex gap-1">
        <motion.div
          className="w-2 h-2 rounded-full"
          animate={{ backgroundColor: selectedAsset ? '#E5FF00' : '#E5FF00' }}
        />
        <div className="w-2 h-2 bg-[#333] rounded-full" />
        <div className="w-2 h-2 bg-[#333] rounded-full" />
      </div>

      {/* Selected asset info overlay */}
      {selectedAsset && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-2 right-2 bg-black/80 border border-acid-yellow/30 px-2 py-1 font-mono text-[0.55rem]"
        >
          <div className="text-acid-yellow font-bold tracking-wider">{selectedAsset.id}</div>
          <div className="text-[#888] text-[0.5rem]">{selectedAsset.type} / {selectedAsset.status}</div>
          <div className="text-[#888] text-[0.5rem]">HDG {selectedAsset.heading}°</div>
        </motion.div>
      )}

      <div className="absolute bottom-2 right-2 text-[0.5rem] font-mono text-[#666]">
        {selectedAsset ? `TRK: ${selectedAsset.id}` : 'SYS.OP.NOMINAL'}
      </div>
    </div>
  );
}
