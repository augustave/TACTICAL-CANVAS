import { motion } from 'motion/react';
import type { FeatureSummary } from '../types';

export function StatsBar({ summary }: { summary: FeatureSummary }) {
  const stats = [
    { label: 'Total Features', value: summary.total, bg: 'bg-ink', text: 'text-archival-white' },
    { label: 'Infrastructure', value: summary.infrastructure, bg: 'bg-terrain-grey', text: 'text-archival-white' },
    { label: 'Pathways', value: summary.pathway, bg: 'bg-kraft-brown', text: 'text-ink' },
    { label: 'Organic', value: summary.organic, bg: 'bg-leather', text: 'text-archival-white' },
    { label: 'Zones', value: summary.zone, bg: 'bg-acid-yellow', text: 'text-ink' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.5, ease: "easeOut" }}
      className="col-span-1 lg:col-span-2 flex flex-wrap lg:flex-nowrap mt-6 relative z-10"
    >
      {stats.map((stat, i) => (
        <div key={i} className={`flex-1 min-w-[120px] py-3 px-4 flex flex-col gap-0.5 ${stat.bg} ${stat.text}`}>
          <span className="text-[0.5rem] font-bold uppercase tracking-[1.5px] font-mono opacity-70">
            {stat.label}
          </span>
          <span className="text-[1.8rem] font-light tracking-[-1px] leading-none">
            {stat.value}
          </span>
        </div>
      ))}
    </motion.div>
  );
}
