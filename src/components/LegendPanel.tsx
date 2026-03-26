import { motion } from 'motion/react';

import type { FilterState } from '../types';

export function LegendPanel({ activeFilters, toggleFilter }: { activeFilters: FilterState, toggleFilter: (type: string) => void }) {
  const tabs = [
    { id: 'infrastructure', label: '(1) BASE', bg: 'bg-ink', text: 'text-archival-white', dot: 'bg-archival-white' },
    { id: 'pathway', label: '(2) PATH', bg: 'bg-flare-orange', text: 'text-ink', dot: 'bg-ink' },
    { id: 'organic', label: '(3) ORGN', bg: 'bg-marker-pink', text: 'text-ink', dot: 'bg-ink' },
    { id: 'zone', label: '(4) ZONE', bg: 'bg-acid-yellow', text: 'text-ink', dot: 'bg-ink' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
      className="flex relative"
    >
      {tabs.map(tab => {
        const isActive = activeFilters[tab.id];
        return (
          <button
            key={tab.id}
            onClick={() => toggleFilter(tab.id)}
            className={`flex-1 py-2.5 px-2 text-[0.6rem] font-bold uppercase tracking-[1px] font-mono cursor-pointer flex items-center justify-center gap-1.5 transition-all duration-200 border-none outline-none relative ${tab.bg} ${tab.text} ${!isActive ? 'grayscale-[0.8] opacity-35 translate-y-[3px]' : ''}`}
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${tab.dot}`} />
            {tab.label}
          </button>
        );
      })}
    </motion.div>
  );
}
