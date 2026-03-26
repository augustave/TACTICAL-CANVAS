import { motion } from 'motion/react';

export function DossierStack({ featureCount }: { featureCount: number }) {
  return (
    <div className="relative w-full max-w-[480px] h-[500px] lg:h-[560px] -rotate-[0.8deg] mx-auto">
      
      {/* Card 1 */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
        className="absolute top-0 left-0 w-[52%] h-[32%] bg-archival-white z-10 shadow-[2px_4px_12px_rgba(0,0,0,0.5)] hover:shadow-[4px_8px_24px_rgba(0,0,0,0.7)] transition-shadow duration-300 flex flex-col p-4"
      >
        <div className="text-[0.6rem] flex justify-between font-bold font-mono tracking-[0.5px] uppercase opacity-70 mb-3">
          <span>RFC 7946</span>
          <span>GEOJSON</span>
        </div>
        <div className="text-[8rem] leading-[0.85] text-center font-light tracking-[-4px] text-ink">(1)</div>
        <div className="text-[0.7rem] font-bold uppercase tracking-[2px] mt-auto border-t border-ink pt-2 text-ink">
          Feature Collection — Point Geometry
        </div>
      </motion.div>

      {/* Card 2 */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
        className="absolute top-0 right-[50px] w-[48%] h-[55%] bg-grey-mid z-20 shadow-[2px_4px_12px_rgba(0,0,0,0.5)] hover:shadow-[4px_8px_24px_rgba(0,0,0,0.7)] transition-shadow duration-300 flex flex-col p-4"
      >
        <div className="text-[0.6rem] flex justify-between font-bold font-mono tracking-[0.5px] uppercase opacity-70 mb-3 text-ink">
          <span>COORD.SYS</span>
          <span>WGS 84</span>
        </div>
        <div className="text-[8rem] leading-[0.85] text-center font-light tracking-[-4px] text-ink">(2)</div>
        <div className="font-mono text-[0.6rem] leading-[1.8] mt-auto text-archival-white opacity-80">
          TYPE: FeatureCollection<br/>
          CRS: urn:ogc:def:crs:OGC::CRS84<br/>
          FEATURES: <span>{featureCount}</span><br/>
          BBOX: [-73.99, 40.71, -73.93, 40.78]
        </div>

        {/* Tabs */}
        <div className="absolute top-[8%] -right-[42px] flex flex-col gap-1 z-10">
          {['(1) SCAT.', '(2) RAD.', '(3) DENS.', '(4) EXP.'].map((label, i) => (
            <div key={i} className="bg-tab-blue text-ink py-1.5 px-0.5 [writing-mode:vertical-rl] text-orientation-mixed rounded-r-md text-[0.65rem] font-bold tracking-[0.5px] h-[72px] flex items-center cursor-pointer transition-all duration-200 shadow-[2px_2px_6px_rgba(0,0,0,0.4)] hover:translate-x-[5px] hover:bg-tension-blue hover:text-archival-white">
              {label}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Card 3 */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
        className="absolute top-[28%] -left-[8px] w-[54%] h-[72%] bg-kraft-brown z-30 shadow-[2px_4px_12px_rgba(0,0,0,0.5)] hover:shadow-[4px_8px_24px_rgba(0,0,0,0.7)] transition-shadow duration-300 flex flex-col p-4 text-ink"
      >
        <div className="text-[0.6rem] flex justify-between font-bold font-mono tracking-[0.5px] uppercase opacity-70 mb-3">
          <span>DENSITY ANALYSIS</span>
        </div>
        <div className="text-[8rem] leading-[0.85] text-center font-light tracking-[-4px]">(3)</div>
        <div className="text-[1.2rem] font-semibold leading-[1.15] -mt-[5px] tracking-[-0.5px]">
          GeoJSON<br/>Scatter Protocol
        </div>
        <div className="text-[3rem] font-normal leading-[1.1] mt-2">
          3.1.<br/>3.2.
        </div>
        <div className="mt-auto text-[0.55rem] font-mono bg-ink text-acid-yellow py-[3px] px-2 inline-block tracking-[1px] self-start">
          RFC 7946 § 3.1.2 — POINT
        </div>
      </motion.div>

      {/* Card 4 */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease: "easeOut" }}
        className="absolute bottom-0 right-[50px] w-[42%] h-[40%] bg-leather text-archival-white z-40 shadow-[2px_4px_12px_rgba(0,0,0,0.5)] hover:shadow-[4px_8px_24px_rgba(0,0,0,0.7)] transition-shadow duration-300 flex flex-col p-4"
      >
        <div className="text-[0.6rem] flex justify-between font-bold font-mono tracking-[0.5px] uppercase opacity-70 mb-3">
          <span>STATUS</span>
        </div>
        <div className="text-[8rem] leading-[0.85] text-center font-light tracking-[-4px]">(4)</div>
        <div className="mt-auto flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-[1px]">
          <div className="w-2 h-2 rounded-full bg-acid-yellow animate-pulse-dot"></div>
          <span>Live Feed Active</span>
        </div>
      </motion.div>

      {/* Tension Band */}
      <motion.div 
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
        className="absolute -top-[20px] -bottom-[20px] left-[53%] w-[22px] bg-tension-blue z-50 shadow-[2px_0px_8px_rgba(0,0,0,0.6)] origin-top"
        style={{
          backgroundImage: 'repeating-linear-gradient(transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)'
        }}
      />

      {/* Neon Sticker */}
      <motion.div 
        initial={{ opacity: 0, rotate: 1.5, scale: 1.4 }}
        animate={{ opacity: 1, rotate: 1.5, scale: 1 }}
        transition={{ delay: 0.7, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
        className="absolute bottom-[10%] left-[32%] py-[0.6rem] px-[1.5rem] bg-acid-yellow z-[60] flex items-baseline gap-[2px] text-[2.5rem] font-light tracking-[-1px] shadow-[0px_4px_10px_rgba(0,0,0,0.4)] text-ink"
      >
        GEO<span className="text-[0.6rem] align-super font-bold">INT</span>
      </motion.div>

    </div>
  );
}
