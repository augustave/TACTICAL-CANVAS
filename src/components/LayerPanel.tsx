import { useState } from 'react';
import { motion } from 'motion/react';
import type { LayerDefinition, MapFeatureRef, MapViewportState } from '../types';
import { getGeometryCounts } from '../utils/geojson';

interface Props {
  layers: LayerDefinition[];
  activeLayerId: string | null;
  selectedFeatureRef: MapFeatureRef | null;
  viewport: MapViewportState;
  statusMessage: string | null;
  onSetActiveLayer: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  onSetOpacity: (layerId: string, opacity: number) => void;
  onMoveLayer: (layerId: string, direction: 'up' | 'down') => void;
  onFitLayer: (layerId: string) => void;
  onFitSelectedFeature: () => void;
  onImportFile: (file: File) => void;
  onImportUrl: (url: string) => Promise<void>;
}

export function LayerPanel({
  layers,
  activeLayerId,
  selectedFeatureRef,
  viewport,
  statusMessage,
  onSetActiveLayer,
  onToggleVisibility,
  onSetOpacity,
  onMoveLayer,
  onFitLayer,
  onFitSelectedFeature,
  onImportFile,
  onImportUrl,
}: Props) {
  const [urlValue, setUrlValue] = useState('');
  const orderedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#0b0f12] border border-[#263238] p-4 shadow-[0_10px_24px_rgba(0,0,0,0.28)]"
    >
      <div className="flex items-start justify-between gap-3 border-b border-[#1e262b] pb-3">
        <div>
          <div className="font-mono text-[0.52rem] uppercase tracking-[0.28em] text-[#7b8a90]">Layer Control</div>
          <h3 className="mt-1 text-[0.9rem] font-semibold uppercase tracking-[0.18em] text-archival-white">GeoJSON Sources</h3>
        </div>
        <div className="text-right font-mono text-[0.55rem] text-[#728089]">
          <div>ZOOM {viewport.zoom.toFixed(1)}</div>
          <div>BRG {viewport.bearing.toFixed(0)}°</div>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        <label className="border border-[#2a3439] bg-black/25 px-3 py-2 text-[0.62rem] uppercase tracking-[0.18em] text-archival-white cursor-pointer hover:border-radar-blue/40">
          Import GeoJSON File
          <input
            type="file"
            accept=".json,.geojson,application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                onImportFile(file);
                event.target.value = '';
              }
            }}
          />
        </label>

        <div className="border border-[#2a3439] bg-black/25 p-3">
          <div className="font-mono text-[0.5rem] uppercase tracking-[0.24em] text-[#7d8b90]">Import GeoJSON URL</div>
          <input
            value={urlValue}
            onChange={(event) => setUrlValue(event.target.value)}
            placeholder="https://example.com/layer.geojson"
            className="mt-2 w-full border border-[#2f3a40] bg-[#0f1417] px-2 py-2 text-[0.72rem] text-archival-white outline-none focus:border-radar-blue"
          />
          <button
            type="button"
            onClick={async () => {
              if (!urlValue.trim()) return;
              await onImportUrl(urlValue.trim());
              setUrlValue('');
            }}
            className="mt-2 w-full border border-radar-blue/40 px-3 py-2 font-mono text-[0.58rem] uppercase tracking-[0.24em] text-radar-blue transition-colors hover:bg-radar-blue hover:text-ink"
          >
            Fetch Remote Source
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => activeLayerId && onFitLayer(activeLayerId)}
            disabled={!activeLayerId}
            className="border border-acid-yellow/35 px-3 py-2 font-mono text-[0.55rem] uppercase tracking-[0.22em] text-acid-yellow disabled:opacity-35"
          >
            Fit Active
          </button>
          <button
            type="button"
            onClick={onFitSelectedFeature}
            disabled={!selectedFeatureRef}
            className="border border-target-red/35 px-3 py-2 font-mono text-[0.55rem] uppercase tracking-[0.22em] text-target-red disabled:opacity-35"
          >
            Fit Selected
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="mt-3 border border-[#2a3439] bg-[#10161a] px-3 py-2 font-mono text-[0.58rem] uppercase tracking-[0.18em] text-[#95a4ab]">
          {statusMessage}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {orderedLayers.map((layer, index) => {
          const geometryCounts = getGeometryCounts(layer.data);
          const isActive = layer.id === activeLayerId;

          return (
            <div
              key={layer.id}
              className={`border p-3 transition-colors ${isActive ? 'border-acid-yellow/40 bg-[#12181b]' : 'border-[#293136] bg-black/20'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => onSetActiveLayer(layer.id)}
                  className="text-left"
                >
                  <div className="font-mono text-[0.52rem] uppercase tracking-[0.24em] text-[#77858b]">{layer.sourceType}</div>
                  <div className={`mt-1 text-[0.8rem] font-semibold ${isActive ? 'text-acid-yellow' : 'text-archival-white'}`}>
                    {layer.name}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onToggleVisibility(layer.id)}
                  className={`border px-2 py-1 font-mono text-[0.5rem] uppercase tracking-[0.22em] ${
                    layer.visible ? 'border-acid-yellow/35 text-acid-yellow' : 'border-[#3a4348] text-[#707d84]'
                  }`}
                >
                  {layer.visible ? 'Visible' : 'Hidden'}
                </button>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 font-mono text-[0.5rem] uppercase tracking-[0.18em] text-[#90a0a7]">
                <div className="border border-[#263136] bg-[#0d1215] px-2 py-2">PTS {geometryCounts.point}</div>
                <div className="border border-[#263136] bg-[#0d1215] px-2 py-2">LINES {geometryCounts.line}</div>
                <div className="border border-[#263136] bg-[#0d1215] px-2 py-2">POLYS {geometryCounts.polygon}</div>
              </div>

              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between font-mono text-[0.5rem] uppercase tracking-[0.18em] text-[#758287]">
                  <span>Opacity</span>
                  <span>{Math.round(layer.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={Math.round(layer.opacity * 100)}
                  onChange={(event) => onSetOpacity(layer.id, Number(event.target.value) / 100)}
                  className="w-full accent-acid-yellow"
                />
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onMoveLayer(layer.id, 'up')}
                  disabled={index === 0}
                  className="border border-[#314047] px-2 py-1 font-mono text-[0.5rem] uppercase tracking-[0.18em] text-[#93a4ab] disabled:opacity-30"
                >
                  Up
                </button>
                <button
                  type="button"
                  onClick={() => onMoveLayer(layer.id, 'down')}
                  disabled={index === orderedLayers.length - 1}
                  className="border border-[#314047] px-2 py-1 font-mono text-[0.5rem] uppercase tracking-[0.18em] text-[#93a4ab] disabled:opacity-30"
                >
                  Down
                </button>
                <button
                  type="button"
                  onClick={() => onFitLayer(layer.id)}
                  className="border border-radar-blue/30 px-2 py-1 font-mono text-[0.5rem] uppercase tracking-[0.18em] text-radar-blue"
                >
                  Fit
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
