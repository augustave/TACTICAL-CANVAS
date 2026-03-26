import { useDeferredValue, useMemo } from 'react';
import type { GeoJsonFeature, LayerDefinition, MapViewportState } from '../types';
import { computeFeatureCollectionBounds, getGeometryCounts, stringifyGeoJson } from '../utils/geojson';

interface Props {
  activeLayer: LayerDefinition | null;
  selectedFeature: GeoJsonFeature | null;
  viewport?: MapViewportState | null;
}

const EMPTY_JSON_MESSAGE = '<span class="text-[#4d585d]">No GeoJSON payload selected.</span>';

export function GeoJSONPanel({ activeLayer, selectedFeature, viewport }: Props) {
  const activeBounds = useMemo(
    () => activeLayer ? computeFeatureCollectionBounds(activeLayer.data) : undefined,
    [activeLayer],
  );

  const geometryCounts = useMemo(
    () => activeLayer ? getGeometryCounts(activeLayer.data) : { point: 0, line: 0, polygon: 0 },
    [activeLayer],
  );

  const previewPayload = useDeferredValue(selectedFeature ?? activeLayer?.data ?? null);
  const highlightedJSON = useMemo(() => {
    if (!previewPayload) return '';
    const json = stringifyGeoJson(previewPayload);
    return json
      .replace(/"([^"]+)":/g, '<span class="text-tension-blue">"$1"</span>:')
      .replace(/: "([^"]+)"/g, ': <span class="text-leather">"$1"</span>')
      .replace(/: (-?\d+\.?\d*)/g, ': <span class="text-flare-orange">$1</span>');
  }, [previewPayload]);

  return (
    <div className="relative bg-kraft-brown p-4 shadow-[2px_4px_12px_rgba(0,0,0,0.5)] -rotate-[0.35deg]">
      <div className="mb-3 flex items-center justify-between border-b-2 border-ink pb-1.5">
        <h3 className="text-[0.7rem] font-bold uppercase tracking-[2px] text-ink">Layer Inspector</h3>
        <span className="bg-ink px-1.5 py-0.5 font-mono text-[0.5rem] tracking-[0.5px] text-flare-orange">
          RFC 7946 / SOURCE VIEW
        </span>
      </div>

      <div className="grid gap-2 md:grid-cols-2">
        <div className="bg-[rgba(0,0,0,0.06)] p-3 font-mono text-[0.58rem] text-ink">
          <div className="uppercase tracking-[0.22em] text-[0.52rem] opacity-65">Active Layer</div>
          <div className="mt-2 text-[0.82rem] font-semibold">{activeLayer?.name ?? 'No layer selected'}</div>
          {activeLayer && (
            <>
              <div className="mt-2 text-[0.56rem] uppercase tracking-[0.18em] opacity-70">
                Source {activeLayer.sourceType} / Modes {activeLayer.displayModes.join(', ')}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="border border-ink/10 bg-white/20 px-2 py-2">PTS {geometryCounts.point}</div>
                <div className="border border-ink/10 bg-white/20 px-2 py-2">LINES {geometryCounts.line}</div>
                <div className="border border-ink/10 bg-white/20 px-2 py-2">POLYS {geometryCounts.polygon}</div>
              </div>
              {activeBounds && (
                <div className="mt-3 text-[0.56rem] leading-[1.7] opacity-80">
                  BBOX: [{activeBounds.map((value) => value.toFixed(4)).join(', ')}]
                </div>
              )}
            </>
          )}
        </div>

        <div className="bg-[rgba(0,0,0,0.06)] p-3 font-mono text-[0.58rem] text-ink">
          <div className="uppercase tracking-[0.22em] text-[0.52rem] opacity-65">Selection + Viewport</div>
          <div className="mt-2 text-[0.72rem] font-semibold">
            {selectedFeature ? `Selected ${selectedFeature.id}` : 'No feature selected'}
          </div>
          {viewport ? (
            <div className="mt-3 leading-[1.7] opacity-80">
              CENTER: {viewport.center[1].toFixed(4)}, {viewport.center[0].toFixed(4)}<br />
              ZOOM: {viewport.zoom.toFixed(2)}<br />
              PITCH: {viewport.pitch.toFixed(0)}°<br />
              BEARING: {viewport.bearing.toFixed(0)}°
            </div>
          ) : (
            <div className="mt-3 leading-[1.7] opacity-65">Viewport telemetry idle.</div>
          )}
        </div>
      </div>

      <div
        className="mt-4 max-h-[240px] overflow-y-auto whitespace-pre bg-[rgba(0,0,0,0.06)] p-2 font-mono text-[0.55rem] leading-[1.5] text-ink scrollbar-thin"
        dangerouslySetInnerHTML={{ __html: highlightedJSON || EMPTY_JSON_MESSAGE }}
      />
    </div>
  );
}
