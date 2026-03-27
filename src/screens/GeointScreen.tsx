import { useState } from 'react';
import { GeoJSONPanel } from '../components/GeoJSONPanel';
import { GeointSurface } from '../components/GeointSurface';
import { LayerPanel } from '../components/LayerPanel';
import type {
  FeatureSummary,
  GeointViewportState,
  GeoJsonFeature,
  LayerDefinition,
  MapFeatureRef,
  MapFocusRequest,
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
  const [viewportSnapshot, setViewportSnapshot] = useState<GeointViewportState>({
    bbox: [-73.995, 40.71, -73.93, 40.78],
    center: [-73.9625, 40.745],
    zoom: 1,
  });

  return (
    <ModuleDeskLayout featureCount={featureCount} featureSummary={featureSummary}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-mono text-[0.58rem] uppercase tracking-[0.24em] text-[#7d8a90]">GEOINT Runtime</div>
          <div className="mt-1 font-mono text-[0.54rem] uppercase tracking-[0.22em] text-[#9aa8ad]">
            Bounded 2D scene graph with scan-led spatial telemetry
          </div>
        </div>
        <div className="border border-radar-blue/35 bg-radar-blue/10 px-3 py-2 font-mono text-[0.55rem] uppercase tracking-[0.22em] text-radar-blue">
          Stable 2D Primary / Spatial Motion Pass Active
        </div>
      </div>

      <div className="grid gap-4">
        <GeointSurface
          layers={layers}
          activeLayerId={activeLayerId}
          selectedFeatureRef={selectedFeatureRef}
          focusRequest={focusRequest}
          onActiveLayerChange={onSetActiveLayer}
          onSelectedFeatureChange={onSelectedFeatureChange}
          onViewportChange={setViewportSnapshot}
          onFocusRequestHandled={onFocusRequestHandled}
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
