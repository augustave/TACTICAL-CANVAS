import { useState } from 'react';
import { GeoJSONPanel } from '../components/GeoJSONPanel';
import { LegacyTacticalCanvas } from '../components/LegacyTacticalCanvas';
import { LayerPanel } from '../components/LayerPanel';
import { TacticalCanvas } from '../components/TacticalCanvas';
import type {
  FeatureSummary,
  GeoJsonFeature,
  LayerDefinition,
  MapFeatureRef,
  MapFocusRequest,
  MapViewportState,
} from '../types';
import { ModuleDeskLayout } from './ModuleDeskLayout';

interface Props {
  layers: LayerDefinition[];
  activeLayerId: string | null;
  featureCount: number;
  featureSummary: FeatureSummary;
  selectedFeatureRef: MapFeatureRef | null;
  hoveredFeatureRef: MapFeatureRef | null;
  selectedFeature: GeoJsonFeature | null;
  hoveredFeature: GeoJsonFeature | null;
  activeLayer: LayerDefinition | null;
  viewport: MapViewportState;
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
  onHoveredFeatureChange: (featureRef: MapFeatureRef | null) => void;
  onViewportChange: (viewport: MapViewportState) => void;
  onFocusRequestHandled: (token: number) => void;
}

export function GeointScreen({
  layers,
  activeLayerId,
  featureCount,
  featureSummary,
  selectedFeatureRef,
  hoveredFeatureRef,
  selectedFeature,
  hoveredFeature,
  activeLayer,
  viewport,
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
  onHoveredFeatureChange,
  onViewportChange,
  onFocusRequestHandled,
}: Props) {
  const [viewMode, setViewMode] = useState<'dual' | 'layer' | 'legacy'>('dual');

  return (
    <ModuleDeskLayout featureCount={featureCount} featureSummary={featureSummary}>
      <div className="flex items-center justify-between gap-3">
        <div className="font-mono text-[0.58rem] uppercase tracking-[0.24em] text-[#7d8a90]">
          GEOINT Surfaces
        </div>
        <div className="flex border border-[#2a3338] bg-[#0b1012]">
          {([
            ['dual', 'Dual'],
            ['layer', 'Layer'],
            ['legacy', 'Legacy'],
          ] as const).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`px-3 py-2 font-mono text-[0.55rem] uppercase tracking-[0.22em] transition-colors ${
                viewMode === mode ? 'bg-acid-yellow text-ink' : 'text-archival-white hover:bg-[#151b1f]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={`grid gap-4 ${viewMode === 'dual' ? 'xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] xl:items-start' : ''}`}>
        {viewMode !== 'legacy' && (
          <TacticalCanvas
            layers={layers}
            activeLayerId={activeLayerId}
            selectedFeatureRef={selectedFeatureRef}
            hoveredFeatureRef={hoveredFeatureRef}
            focusRequest={focusRequest}
            viewport={viewport}
            onActiveLayerChange={onSetActiveLayer}
            onSelectedFeatureChange={onSelectedFeatureChange}
            onHoveredFeatureChange={onHoveredFeatureChange}
            onViewportChange={onViewportChange}
            onFocusRequestHandled={onFocusRequestHandled}
          />
        )}

        {viewMode !== 'layer' && (
          <LegacyTacticalCanvas
            layers={layers}
            activeLayerId={activeLayerId}
            selectedFeatureRef={selectedFeatureRef}
            onActiveLayerChange={onSetActiveLayer}
            onSelectedFeatureChange={onSelectedFeatureChange}
          />
        )}
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(280px,0.95fr)_minmax(0,1.05fr)]">
        <LayerPanel
          layers={layers}
          activeLayerId={activeLayerId}
          selectedFeatureRef={selectedFeatureRef}
          viewport={viewport}
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
        <GeoJSONPanel
          activeLayer={activeLayer}
          selectedFeature={selectedFeature}
          hoveredFeature={hoveredFeature}
          viewport={viewport}
        />
      </div>
    </ModuleDeskLayout>
  );
}
