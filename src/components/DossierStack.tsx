import { AnimatePresence, motion } from 'motion/react';
import { useMemo, useState } from 'react';

type StackSectionId = 'scatter' | 'radar' | 'density' | 'export';

interface DossierSection {
  id: StackSectionId;
  index: number;
  tabLabel: string;
  title: string;
  eyebrowLeft: string;
  eyebrowRight: string;
  tone: string;
  textTone: string;
  cardClassName: string;
  numberClassName: string;
  summary: string;
  details: string[];
  featureLabel: string;
  featureList: string[];
  signal: string;
}

const DOSSIER_SECTIONS: DossierSection[] = [
  {
    id: 'scatter',
    index: 1,
    tabLabel: '(1) SCAT.',
    title: 'Feature Collection',
    eyebrowLeft: 'RFC 7946',
    eyebrowRight: 'GEOJSON',
    tone: 'bg-archival-white',
    textTone: 'text-ink',
    cardClassName: 'absolute top-0 left-0 w-[52%] h-[32%] z-10 p-4',
    numberClassName: 'text-[8rem] leading-[0.85] text-center font-light tracking-[-4px]',
    summary: 'Point geometry set configured for live scatter inspection.',
    details: ['COLLECTION LIVE', 'POINT GEOMETRY', 'SCHEMA LOCKED'],
    featureLabel: 'Scatter Controls',
    featureList: ['Pulse clusters', 'Inspect point families', 'Lock geo schema'],
    signal: 'Nominal',
  },
  {
    id: 'radar',
    index: 2,
    tabLabel: '(2) RAD.',
    title: 'Coordinate Envelope',
    eyebrowLeft: 'COORD.SYS',
    eyebrowRight: 'WGS 84',
    tone: 'bg-grey-mid',
    textTone: 'text-ink',
    cardClassName: 'absolute top-0 right-[50px] w-[48%] h-[55%] z-20 p-4',
    numberClassName: 'text-[8rem] leading-[0.85] text-center font-light tracking-[-4px]',
    summary: 'Reference frame aligned to the current operating box.',
    details: ['CRS84', 'FEATURE WINDOW', 'MAP BOUNDS'],
    featureLabel: 'Reference Tools',
    featureList: ['Snap bbox', 'Reframe sector', 'Verify datum transfer'],
    signal: 'Aligned',
  },
  {
    id: 'density',
    index: 3,
    tabLabel: '(3) DENS.',
    title: 'GeoJSON Scatter Protocol',
    eyebrowLeft: 'DENSITY ANALYSIS',
    eyebrowRight: '',
    tone: 'bg-kraft-brown',
    textTone: 'text-ink',
    cardClassName: 'absolute top-[28%] -left-[8px] w-[54%] h-[72%] z-30 p-4',
    numberClassName: 'text-[8rem] leading-[0.85] text-center font-light tracking-[-4px]',
    summary: 'Density pass ready for focus shifting, thresholding, and protocol inspection.',
    details: ['3.1 POINT', '3.2 DENSITY', 'THRESHOLD READY'],
    featureLabel: 'Density Actions',
    featureList: ['Escalate threshold', 'Focus hotspot', 'Stage export payload'],
    signal: 'High Gain',
  },
  {
    id: 'export',
    index: 4,
    tabLabel: '(4) EXP.',
    title: 'Status Ledger',
    eyebrowLeft: 'STATUS',
    eyebrowRight: '',
    tone: 'bg-leather',
    textTone: 'text-archival-white',
    cardClassName: 'absolute bottom-0 right-[50px] w-[42%] h-[40%] z-40 p-4',
    numberClassName: 'text-[8rem] leading-[0.85] text-center font-light tracking-[-4px]',
    summary: 'Feed state and export readiness tracked against the active dossier.',
    details: ['LIVE FEED', 'EXPORT STAGED', 'STATUS HOT'],
    featureLabel: 'Output Actions',
    featureList: ['Export fragment', 'Pin state', 'Sync live feed'],
    signal: 'Active',
  },
];

function sectionOffset(id: StackSectionId, activeId: StackSectionId) {
  if (id === activeId) {
    return { x: 0, y: -6, rotate: 0 };
  }

  if (id === 'scatter') {
    return { x: -6, y: 0, rotate: -0.4 };
  }

  if (id === 'radar') {
    return { x: 7, y: -2, rotate: 0.35 };
  }

  if (id === 'density') {
    return { x: -8, y: 5, rotate: -0.35 };
  }

  return { x: 6, y: 4, rotate: 0.45 };
}

export function DossierStack({ featureCount }: { featureCount: number }) {
  const [activeSectionId, setActiveSectionId] = useState<StackSectionId>('density');
  const [junctionOpen, setJunctionOpen] = useState(false);

  const activeSection = useMemo(
    () => DOSSIER_SECTIONS.find((section) => section.id === activeSectionId) ?? DOSSIER_SECTIONS[0],
    [activeSectionId],
  );

  const cycleSection = () => {
    const index = DOSSIER_SECTIONS.findIndex((section) => section.id === activeSectionId);
    const next = DOSSIER_SECTIONS[(index + 1) % DOSSIER_SECTIONS.length];
    setActiveSectionId(next.id);
  };

  return (
    <div className="relative mx-auto h-[500px] w-full max-w-[480px] -rotate-[0.8deg] lg:h-[560px]">
      {DOSSIER_SECTIONS.map((section, i) => {
        const isActive = section.id === activeSectionId;
        const offset = sectionOffset(section.id, activeSectionId);

        return (
          <motion.button
            key={section.id}
            type="button"
            initial={{ opacity: 0, y: 15 }}
            animate={{
              opacity: 1,
              y: offset.y,
              x: offset.x,
              rotate: offset.rotate,
              scale: isActive ? 1.015 : 1,
            }}
            transition={{ delay: 0.1 + i * 0.1, duration: 0.45, ease: 'easeOut' }}
            onClick={() => setActiveSectionId(section.id)}
            className={`${section.cardClassName} ${section.tone} ${section.textTone} flex flex-col text-left shadow-[2px_4px_12px_rgba(0,0,0,0.5)] transition-shadow duration-300 hover:shadow-[4px_8px_24px_rgba(0,0,0,0.7)] ${isActive ? 'ring-2 ring-acid-yellow/60' : ''}`}
          >
            <div className="mb-3 flex justify-between text-[0.6rem] font-bold font-mono uppercase tracking-[0.5px] opacity-70">
              <span>{section.eyebrowLeft}</span>
              <span>{section.eyebrowRight}</span>
            </div>

            <div className={section.numberClassName}>({section.index})</div>

            {section.id === 'scatter' && (
              <div className="mt-auto border-t border-ink pt-2 text-[0.7rem] font-bold uppercase tracking-[2px]">
                Point Geometry
              </div>
            )}

            {section.id === 'radar' && (
              <div className="mt-auto font-mono text-[0.6rem] leading-[1.8] opacity-80 text-archival-white">
                TYPE: FeatureCollection<br />
                CRS: urn:ogc:def:crs:OGC::CRS84<br />
                FEATURES: <span>{featureCount}</span><br />
                BBOX: [-73.99, 40.71, -73.93, 40.78]
              </div>
            )}

            {section.id === 'density' && (
              <>
                <div className="mt-[-5px] text-[1.2rem] font-semibold leading-[1.15] tracking-[-0.5px]">
                  GeoJSON
                  <br />
                  Scatter Protocol
                </div>
                <div className="mt-2 text-[3rem] font-normal leading-[1.1]">
                  3.1.
                  <br />
                  3.2.
                </div>
                <div className="mt-auto inline-block self-start bg-ink px-2 py-[3px] font-mono text-[0.55rem] tracking-[1px] text-acid-yellow">
                  RFC 7946 § 3.1.2 — POINT
                </div>
              </>
            )}

            {section.id === 'export' && (
              <div className="mt-auto flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-[1px]">
                <div className="h-2 w-2 rounded-full bg-acid-yellow animate-pulse-dot" />
                <span>Live Feed Active</span>
              </div>
            )}
          </motion.button>
        );
      })}

      <div className="absolute top-[8%] -right-[42px] z-[70] flex flex-col gap-1">
        {DOSSIER_SECTIONS.map((section) => {
          const isActive = section.id === activeSectionId;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSectionId(section.id)}
              className={`flex h-[72px] items-center rounded-r-md px-0.5 py-1.5 text-[0.65rem] font-bold tracking-[0.5px] shadow-[2px_2px_6px_rgba(0,0,0,0.4)] transition-all duration-200 [writing-mode:vertical-rl] text-orientation-mixed ${
                isActive
                  ? 'translate-x-[8px] bg-acid-yellow text-ink'
                  : 'bg-tab-blue text-ink hover:translate-x-[5px] hover:bg-tension-blue hover:text-archival-white'
              }`}
            >
              {section.tabLabel}
            </button>
          );
        })}
      </div>

      <motion.div
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.6, ease: 'easeOut' }}
        className="absolute -bottom-[20px] -top-[20px] left-[53%] z-50 w-[22px] origin-top bg-tension-blue shadow-[2px_0px_8px_rgba(0,0,0,0.6)]"
        style={{
          backgroundImage: 'repeating-linear-gradient(transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
        }}
      />

      <div className="absolute left-[53%] top-[52%] z-[80] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-3">
        <motion.button
          type="button"
          onClick={() => setJunctionOpen((open) => !open)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="relative flex h-[108px] w-[108px] items-center justify-center rounded-full border border-acid-yellow/45 bg-[radial-gradient(circle_at_center,rgba(229,255,0,0.16),rgba(8,13,14,0.94)_64%)] shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_12px_24px_rgba(0,0,0,0.5),0_0_22px_rgba(229,255,0,0.16)]"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 14, ease: 'linear' }}
            className="absolute inset-2 rounded-full border border-dashed border-acid-yellow/30"
          />
          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.65, 0.35] }}
            transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
            className="absolute inset-5 rounded-full border border-radar-blue/45"
          />
          <div className="relative text-center font-mono">
            <div className="text-[0.48rem] uppercase tracking-[0.28em] text-[#9aacb3]">Junction</div>
            <div className="mt-1 text-[1.35rem] font-bold tracking-[0.12em] text-acid-yellow">
              {activeSection.index}
            </div>
            <div className="text-[0.45rem] uppercase tracking-[0.22em] text-archival-white/80">Open</div>
          </div>
        </motion.button>

        <div className="flex flex-col gap-2">
          {DOSSIER_SECTIONS.map((section) => {
            const isActive = section.id === activeSectionId;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSectionId(section.id)}
                className={`h-3 w-3 rounded-full border transition-all ${
                  isActive
                    ? 'border-acid-yellow bg-acid-yellow shadow-[0_0_10px_rgba(229,255,0,0.7)]'
                    : 'border-archival-white/40 bg-black/40 hover:border-radar-blue hover:bg-radar-blue/80'
                }`}
                aria-label={`Activate ${section.title}`}
              />
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {junctionOpen && (
          <motion.div
            initial={{ opacity: 0, x: -18, y: 8 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: -12, y: 4 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="absolute left-[8%] top-[44%] z-[90] w-[270px] border border-[#2b3a40] bg-[rgba(9,13,16,0.94)] p-3 text-archival-white shadow-[0_16px_32px_rgba(0,0,0,0.45)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-mono text-[0.48rem] uppercase tracking-[0.28em] text-[#7f9097]">
                  {activeSection.featureLabel}
                </div>
                <div className="mt-1 text-[1rem] font-semibold leading-tight">
                  {activeSection.title}
                </div>
              </div>
              <button
                type="button"
                onClick={cycleSection}
                className="border border-radar-blue/35 px-2 py-1 font-mono text-[0.5rem] uppercase tracking-[0.24em] text-radar-blue transition-colors hover:bg-radar-blue hover:text-ink"
              >
                Cycle
              </button>
            </div>

            <div className="mt-3 border border-archival-white/10 bg-black/25 p-2">
              <div className="flex items-center justify-between font-mono text-[0.52rem] uppercase tracking-[0.24em] text-[#768388]">
                <span>Signal</span>
                <span className="text-acid-yellow">{activeSection.signal}</span>
              </div>
              <div className="mt-2 text-[0.72rem] leading-relaxed text-archival-white/85">
                {activeSection.summary}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {activeSection.details.map((detail) => (
                <div
                  key={detail}
                  className="border border-archival-white/10 bg-white/5 px-2 py-1.5 text-center font-mono text-[0.5rem] uppercase tracking-[0.2em] text-[#b4c2c7]"
                >
                  {detail}
                </div>
              ))}
            </div>

            <div className="mt-3 space-y-2">
              {activeSection.featureList.map((feature, index) => (
                <button
                  key={feature}
                  type="button"
                  onClick={() => setActiveSectionId(activeSection.id)}
                  className="flex w-full items-center justify-between border border-[#2b3539] bg-[rgba(255,255,255,0.03)] px-2 py-2 text-left transition-colors hover:border-radar-blue/40 hover:bg-radar-blue/10"
                >
                  <span className="font-mono text-[0.52rem] uppercase tracking-[0.22em] text-[#7d8b91]">
                    0{index + 1}
                  </span>
                  <span className="ml-3 flex-1 text-[0.68rem] text-archival-white">{feature}</span>
                  <span className="text-[0.58rem] text-acid-yellow">ARM</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        initial={{ opacity: 0, rotate: 1.5, scale: 1.4 }}
        animate={{ opacity: 1, rotate: 1.5, scale: 1 }}
        transition={{ delay: 0.7, duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
        onClick={() => setJunctionOpen((open) => !open)}
        className="absolute bottom-[10%] left-[32%] z-[60] flex items-baseline gap-[2px] bg-acid-yellow px-[1.5rem] py-[0.6rem] text-ink shadow-[0px_4px_10px_rgba(0,0,0,0.4)]"
      >
        <span className="text-[2.5rem] font-light tracking-[-1px]">GEO</span>
        <span className="align-super text-[0.6rem] font-bold">INT</span>
      </motion.button>
    </div>
  );
}
