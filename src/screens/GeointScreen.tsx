import { GeoJSONPanel } from '../components/GeoJSONPanel';
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
  return (
    <ModuleDeskLayout featureCount={featureCount} featureSummary={featureSummary}>
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
