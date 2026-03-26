import { useMemo } from 'react';
import { motion } from 'motion/react';
import { generateGeoJSON } from '../utils/geo';

import type { GeoFeature } from '../types';

export function GeoJSONPanel({ features }: { features: GeoFeature[] }) {
  const highlightedJSON = useMemo(() => {
    const geojson = generateGeoJSON(features);
    const json = JSON.stringify(geojson, null, 2);
    return json
      .replace(/"([^"]+)":/g, '<span class="text-tension-blue">"$1"</span>:')
      .replace(/: "([^"]+)"/g, ': <span class="text-leather">"$1"</span>')
      .replace(/: (-?\d+\.?\d*)/g, ': <span class="text-flare-orange">$1</span>');
  }, [features]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5, ease: "easeOut" }}
      className="bg-kraft-brown p-4 shadow-[2px_4px_12px_rgba(0,0,0,0.5)] -rotate-[0.5deg] relative"
    >
      <div className="flex justify-between items-center border-b-2 border-ink pb-1.5 mb-3">
        <h3 className="text-[0.7rem] font-bold uppercase tracking-[2px] text-ink">GeoJSON Output</h3>
        <span className="text-[0.5rem] font-mono bg-ink text-flare-orange py-0.5 px-1.5 tracking-[0.5px]">
          RFC 7946 COMPLIANT
        </span>
      </div>
      <div 
        className="font-mono text-[0.55rem] leading-[1.5] text-ink max-h-[120px] overflow-y-auto whitespace-pre bg-[rgba(0,0,0,0.06)] p-2 scrollbar-thin"
        dangerouslySetInnerHTML={{ __html: highlightedJSON }}
      />
    </motion.div>
  );
}
