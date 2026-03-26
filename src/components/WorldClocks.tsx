import React, { useState, useEffect } from 'react';

const ZONES = [
  { label: 'MOSCOW', offset: 3 },
  { label: 'KOREA', offset: 9 },
  { label: 'ALASKA', offset: -9 },
  { label: 'PACIFIC', offset: -7 },
  { label: 'MOUNTAIN', offset: -6 },
  { label: 'CENTRAL', offset: -5 },
  { label: 'EASTERN', offset: -4 },
  { label: 'ZULU', offset: 0 },
];

export function WorldClocks() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date, offset: number) => {
    // Create a new date object for the specific timezone
    const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    const tzDate = new Date(utc + (3600000 * offset));
    
    const hh = String(tzDate.getHours()).padStart(2, '0');
    const mm = String(tzDate.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  return (
    <div className="w-full flex flex-wrap justify-center gap-2 md:gap-4 py-2 bg-void border-b border-[#222] z-50 relative px-2">
      <div className="flex flex-wrap justify-center gap-2">
        {ZONES.slice(0, 4).map(zone => (
          <div key={zone.label} className="flex flex-col items-center border border-red-900/50 bg-black/80 px-3 py-0.5 min-w-[80px]">
            <span className="text-[0.45rem] text-red-700 font-sans tracking-[0.2em] uppercase">{zone.label}</span>
            <span className="text-lg text-alert-red font-digital font-bold tracking-widest" style={{ textShadow: '0 0 8px rgba(255,51,51,0.4)' }}>
              {formatTime(time, zone.offset)}
            </span>
          </div>
        ))}
      </div>
      <div className="hidden md:block w-8"></div> {/* Spacer */}
      <div className="flex flex-wrap justify-center gap-2">
        {ZONES.slice(4).map(zone => (
          <div key={zone.label} className="flex flex-col items-center border border-red-900/50 bg-black/80 px-3 py-0.5 min-w-[80px]">
            <span className="text-[0.45rem] text-red-700 font-sans tracking-[0.2em] uppercase">{zone.label}</span>
            <span className="text-lg text-alert-red font-digital font-bold tracking-widest" style={{ textShadow: '0 0 8px rgba(255,51,51,0.4)' }}>
              {formatTime(time, zone.offset)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
