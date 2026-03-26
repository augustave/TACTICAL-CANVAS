import React from 'react';
import { motion } from 'motion/react';

export function ChartWidget() {
  // Mock data for a bar chart
  const data = [45, 60, 30, 80, 50, 90, 70, 40, 65, 85, 55, 75];
  
  return (
    <div className="w-full h-full min-h-[200px] bg-[#111] border border-[#333] flex flex-col font-mono text-xs text-archival-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-black border-b border-[#333]">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-radar-blue rounded-full" />
          <span className="font-bold tracking-widest text-[#888]">ACTIVITY METRICS</span>
        </div>
        <span className="text-[0.6rem] text-[#666]">24H</span>
      </div>

      {/* Chart Area */}
      <div className="flex-1 p-4 flex flex-col justify-end gap-2 relative">
        {/* Y-Axis lines */}
        <div className="absolute inset-x-4 top-4 bottom-4 flex flex-col justify-between pointer-events-none opacity-20">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-full h-px bg-white" />
          ))}
        </div>
        
        {/* Bars */}
        <div className="flex items-end justify-between h-full gap-1 z-10">
          {data.map((value, i) => (
            <motion.div 
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${value}%` }}
              transition={{ delay: i * 0.05, duration: 0.5 }}
              className="flex-1 bg-radar-blue/50 border border-radar-blue hover:bg-radar-blue transition-colors relative group"
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[0.5rem] opacity-0 group-hover:opacity-100 transition-opacity bg-black px-1 border border-[#333]">
                {value}
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* X-Axis labels */}
        <div className="flex justify-between text-[0.5rem] text-[#666] mt-1">
          <span>0000</span>
          <span>0600</span>
          <span>1200</span>
          <span>1800</span>
          <span>2400</span>
        </div>
      </div>
    </div>
  );
}
