import { useState, useEffect } from 'react';

export function ClassificationStrip() {
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      setTime(new Date().toISOString().replace('T', ' ').slice(0, 19) + 'Z');
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="col-span-1 lg:col-span-2 flex justify-between items-center py-2 px-4 bg-ink border-b-[3px] border-tension-blue relative z-50 mb-6">
      <span className="text-[0.65rem] font-bold tracking-[3px] uppercase text-flare-orange font-mono">
        ■ TACTICAL DOSSIER — GEOINT TEMPLATE v1.0
      </span>
      <span className="text-[0.6rem] text-grey-mid font-mono tracking-[1px]">
        {time}
      </span>
    </div>
  );
}
