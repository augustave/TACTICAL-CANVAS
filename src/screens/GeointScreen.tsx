import { useState } from 'react';
import { GeoJSONPanel } from '../components/GeoJSONPanel';
import { LegacyTacticalCanvas } from '../components/LegacyTacticalCanvas';
import { LayerPanel } from '../components/LayerPanel';
import { MapPaneErrorBoundary } from '../components/MapPaneErrorBoundary';
import { TacticalCanvas } from '../components/TacticalCanvas';
import type {
  FeatureSummary,
  GeoJsonFeature,
  LayerDefinition,
  MapFeatureRef,
  MapFocusRequest,
  MapHealthState,
  MapViewportState,
} from '../types';
import { ModuleDeskLayout } from './ModuleDeskLayout';

interface Props {
  layers: LayerDefinition[];
  activeLayerId: string | null;
  featureCount: number;
  featureSummary: FeatureSummary;
  selectedFeatureRef: MapFeatureRef | null;
  selectedFeature: GeoJsonFeature | null;
  activeLayer: LayerDefinition | null;
  initialViewport: MapViewportState;
  focusRequest: MapFocusRequest | null;
  statusMessage: string | null;
  onSetActiveLayer: (layerId: string) => void;
  onToggleVisibility: (layerId: string) => void;
  onSetOpacity: (layerId: string, opacity: number) => void;
  onMoveLayer: (layerId: string, direction: 'up' | 'down') => void;
  onFitLayer: (layerId: string) => void;
  onFitSelectedFeature: () => void;
  onImportFile: (file: File) => void;
  onImportUrl: (url: string) => Promise<void>;
  onSelectedFeatureChange: (featureRef: MapFeatureRef | null) => void;
  onFocusRequestHandled: (token: number) => void;
}

export function GeointScreen({
  layers,
  activeLayerId,
  featureCount,
  featureSummary,
  selectedFeatureRef,
  selectedFeature,
  activeLayer,
  initialViewport,
  focusRequest,
  statusMessage,
  onSetActiveLayer,
  onToggleVisibility,
  onSetOpacity,
  onMoveLayer,
  onFitLayer,
  onFitSelectedFeature,
  onImportFile,
  onImportUrl,
  onSelectedFeatureChange,
  onFocusRequestHandled,
}: Props) {
  const [viewportSnapshot, setViewportSnapshot] = useState<MapViewportState>(initialViewport);
  const [mapHealth, setMapHealth] = useState<MapHealthState>('ready');
  const [mapHealthDetail, setMapHealthDetail] = useState<string | null>(null);
  const [reloadNonce, setReloadNonce] = useState(0);

  const handleMapHealthChange = (state: MapHealthState, details?: string) => {
    setMapHealth(state);
    setMapHealthDetail(details ?? null);
  };

  const handleReloadPane = () => {
    setReloadNonce((current) => current + 1);
    setMapHealth('ready');
    setMapHealthDetail(null);
  };

  const healthTone =
    mapHealth === 'failed'
      ? 'border-alert-red/45 bg-alert-red/10 text-alert-red'
      : mapHealth === 'degraded'
        ? 'border-flare-orange/45 bg-flare-orange/10 text-flare-orange'
        : 'border-radar-blue/35 bg-radar-blue/10 text-radar-blue';

  return (
    <ModuleDeskLayout featureCount={featureCount} featureSummary={featureSummary}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-mono text-[0.58rem] uppercase tracking-[0.24em] text-[#7d8a90]">GEOINT Surfaces</div>
          <div className="mt-1 font-mono text-[0.54rem] uppercase tracking-[0.22em] text-[#9aa8ad]">
            Dual surfaces locked for stability
          </div>
        </div>
        <div className={`border px-3 py-2 font-mono text-[0.55rem] uppercase tracking-[0.22em] ${healthTone}`}>
          Layer Engine {mapHealth}
          {mapHealthDetail ? ` / ${mapHealthDetail}` : ''}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] xl:items-start">
        <MapPaneErrorBoundary
          resetKey={reloadNonce}
          onError={(error) => handleMapHealthChange('failed', error.message)}
          fallback={
            <div className="flex h-[560px] items-center justify-center border-2 border-alert-red/40 bg-[#0b1012] p-6 text-center shadow-[4px_6px_15px_rgba(0,0,0,0.6)]">
              <div className="max-w-[340px] font-mono text-archival-white">
                <div className="text-[0.56rem] uppercase tracking-[0.24em] text-alert-red">Layer Engine Crashed</div>
                <div className="mt-3 text-[0.92rem] font-semibold">Legacy tactical pane is still available.</div>
                <button
                  type="button"
                  onClick={handleReloadPane}
                  className="mt-4 border border-acid-yellow/45 px-3 py-2 text-[0.58rem] uppercase tracking-[0.22em] text-acid-yellow transition-colors hover:bg-acid-yellow hover:text-ink"
                >
                  Reload Layer Engine
                </button>
              </div>
            </div>
          }
        >
          <TacticalCanvas
            key={reloadNonce}
            layers={layers}
            activeLayerId={activeLayerId}
            selectedFeatureRef={selectedFeatureRef}
            focusRequest={focusRequest}
            initialViewport={initialViewport}
            onActiveLayerChange={onSetActiveLayer}
            onSelectedFeatureChange={onSelectedFeatureChange}
            onViewportSnapshotChange={setViewportSnapshot}
            onMapHealthChange={handleMapHealthChange}
            onFocusRequestHandled={onFocusRequestHandled}
            onReloadRequest={handleReloadPane}
          />
        </MapPaneErrorBoundary>

        <LegacyTacticalCanvas
          layers={layers}
          activeLayerId={activeLayerId}
          selectedFeatureRef={selectedFeatureRef}
          onActiveLayerChange={onSetActiveLayer}
          onSelectedFeatureChange={onSelectedFeatureChange}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(280px,0.95fr)_minmax(0,1.05fr)]">
        <LayerPanel
          layers={layers}
          activeLayerId={activeLayerId}
          selectedFeatureRef={selectedFeatureRef}
          viewport={viewportSnapshot}
          statusMessage={statusMessage}
          onSetActiveLayer={onSetActiveLayer}
          onToggleVisibility={onToggleVisibility}
          onSetOpacity={onSetOpacity}
          onMoveLayer={onMoveLayer}
          onFitLayer={onFitLayer}
          onFitSelectedFeature={onFitSelectedFeature}
          onImportFile={onImportFile}
          onImportUrl={onImportUrl}
        />
        <GeoJSONPanel activeLayer={activeLayer} selectedFeature={selectedFeature} viewport={viewportSnapshot} />
      </div>
    </ModuleDeskLayout>
  );
}
