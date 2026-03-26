/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useCallback } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { generateCluster } from './utils/geo';
import { MissionWorkflowBar } from './components/MissionWorkflowBar';
import { WorldClocks } from './components/WorldClocks';
import type {
  ActiveModule,
  LayerDefinition,
  MapFeatureRef,
  MapFocusRequest,
  MissionActions,
  MissionState,
} from './types';
import { CommandScreen } from './screens/CommandScreen';
import { GeointScreen } from './screens/GeointScreen';
import { RadarScreen } from './screens/RadarScreen';
import { TargetingScreen } from './screens/TargetingScreen';
import { buildInitialGeoLayers } from './data/geoLayers';
import {
  getDefaultLayerStyle,
  getDisplayModesForCollection,
  getFeatureByRef,
  getLayerById,
  getLayerFeatureSummary,
  normalizeGeoJsonInput,
} from './utils/geojson';

export default function App() {
  // ── Module Navigation ────────────────────────────────────────────────────
  const [activeModule, setActiveModule] = useState<ActiveModule>('COMMAND');

  // ── Mission State: shared selection context across all modules ───────────
  const [missionState, setMissionState] = useState<MissionState>({
    selectedAssetId: null,
    selectedTargetId: null,
    currentTask: null,
  });

  const missionActions: MissionActions = useMemo(() => ({
    selectAsset: (id) => setMissionState(prev => ({
      ...prev,
      selectedAssetId: prev.selectedAssetId === id ? null : id,
    })),
    selectTarget: (id) => setMissionState(prev => ({
      ...prev,
      selectedTargetId: prev.selectedTargetId === id ? null : id,
    })),
    taskSelection: () => setMissionState(prev => {
      if (!prev.selectedAssetId || !prev.selectedTargetId) {
        return prev;
      }

      return {
        ...prev,
        currentTask: {
          assetId: prev.selectedAssetId,
          targetId: prev.selectedTargetId,
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        },
      };
    }),
    clearTask: () => setMissionState(prev => ({
      ...prev,
      currentTask: null,
    })),
  }), []);

  // ── GeoFeature Data ──────────────────────────────────────────────────────
  const allFeatures = useMemo(() => [
    ...generateCluster('infrastructure', -73.980, 40.755, 60, 1.2),
    ...generateCluster('infrastructure', -73.945, 40.725, 35, 0.8),
    ...generateCluster('pathway', -73.965, 40.740, 80, 2.0),
    ...generateCluster('organic', -73.955, 40.735, 180, 1.5),
    ...generateCluster('organic', -73.975, 40.760, 60, 0.6),
    ...generateCluster('zone', -73.950, 40.750, 100, 1.8)
  ], []);

  const [geoLayers, setGeoLayers] = useState<LayerDefinition[]>(() => buildInitialGeoLayers(allFeatures));
  const [activeLayerId, setActiveLayerId] = useState<string | null>(() => buildInitialGeoLayers(allFeatures)[0]?.id ?? null);
  const [selectedFeatureRef, setSelectedFeatureRef] = useState<MapFeatureRef | null>(null);
  const [focusRequest, setFocusRequest] = useState<MapFocusRequest | null>(null);
  const [geoIntStatus, setGeoIntStatus] = useState<string | null>('Loaded 5 prototype layers');

  const featureSummary = useMemo(() => getLayerFeatureSummary(geoLayers), [geoLayers]);
  const activeLayer = useMemo(() => getLayerById(geoLayers, activeLayerId), [geoLayers, activeLayerId]);
  const selectedFeature = useMemo(() => getFeatureByRef(geoLayers, selectedFeatureRef), [geoLayers, selectedFeatureRef]);

  const appendImportedLayer = useCallback((name: string, sourceType: LayerDefinition['sourceType'], sourceConfig: LayerDefinition['sourceConfig'], rawInput: unknown) => {
    const collection = normalizeGeoJsonInput(rawInput);
    const nextLayerId = `${sourceType}-${Date.now()}`;

    setGeoLayers((prev) => {
      const nextIndex = prev.length;
      const nextLayer: LayerDefinition = {
        id: nextLayerId,
        name,
        sourceType,
        sourceConfig: {
          ...sourceConfig,
          importedAt: new Date().toISOString(),
        },
        data: collection,
        displayModes: getDisplayModesForCollection(collection),
        style: getDefaultLayerStyle(collection, nextIndex),
        visible: true,
        opacity: 1,
        zIndex: (nextIndex + 1) * 10,
        locked: false,
        minZoom: 0,
        maxZoom: 24,
        status: 'ready',
      };

      return [...prev, nextLayer];
    });

    setActiveLayerId(nextLayerId);
    setSelectedFeatureRef(null);
    setGeoIntStatus(`Imported ${name}`);
  }, []);

  const handleImportGeoJsonFile = useCallback((file: File) => {
    void file.text().then((text) => {
      try {
        appendImportedLayer(file.name.replace(/\.(geo)?json$/i, ''), 'geojson-file', {
          label: `Imported file ${file.name}`,
          fileName: file.name,
        }, JSON.parse(text));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to import GeoJSON file.';
        setGeoIntStatus(message);
      }
    });
  }, [appendImportedLayer]);

  const handleImportGeoJsonUrl = useCallback(async (url: string) => {
    setGeoIntStatus(`Fetching ${url}`);
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Request failed with ${response.status}`);
      }
      const json = await response.json();
      appendImportedLayer(url.split('/').pop() || 'remote-layer', 'geojson-url', {
        label: `Imported URL ${url}`,
        url,
      }, json);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import GeoJSON URL.';
      setGeoIntStatus(message);
    }
  }, [appendImportedLayer]);

  const handleLayerOpacity = useCallback((layerId: string, opacity: number) => {
    setGeoLayers((prev) => prev.map((layer) => layer.id === layerId ? { ...layer, opacity } : layer));
  }, []);

  const handleToggleVisibility = useCallback((layerId: string) => {
    setGeoLayers((prev) => prev.map((layer) => layer.id === layerId ? { ...layer, visible: !layer.visible } : layer));
  }, []);

  const handleMoveLayer = useCallback((layerId: string, direction: 'up' | 'down') => {
    setGeoLayers((prev) => {
      const ordered = [...prev].sort((a, b) => a.zIndex - b.zIndex);
      const index = ordered.findIndex((layer) => layer.id === layerId);
      if (index === -1) return prev;

      const swapIndex = direction === 'up' ? index + 1 : index - 1;
      if (swapIndex < 0 || swapIndex >= ordered.length) return prev;

      [ordered[index], ordered[swapIndex]] = [ordered[swapIndex], ordered[index]];
      return ordered.map((layer, orderIndex) => ({ ...layer, zIndex: (orderIndex + 1) * 10 }));
    });
  }, []);

  const requestLayerFit = useCallback((layerId: string) => {
    setFocusRequest({
      kind: 'layer',
      layerId,
      token: Date.now(),
    });
  }, []);

  const requestSelectedFeatureFit = useCallback(() => {
    if (!selectedFeatureRef) return;
    setFocusRequest({
      kind: 'feature',
      layerId: selectedFeatureRef.layerId,
      featureId: selectedFeatureRef.featureId,
      token: Date.now(),
    });
  }, [selectedFeatureRef]);

  const handleSelectedFeatureChange = useCallback((featureRef: MapFeatureRef | null) => {
    setSelectedFeatureRef(featureRef);
    if (!featureRef) return;

    const feature = getFeatureByRef(geoLayers, featureRef);
    if (!feature) return;
    if (typeof feature.properties.assetId === 'string') {
      missionActions.selectAsset(feature.properties.assetId);
    }
    if (typeof feature.properties.targetId === 'string') {
      missionActions.selectTarget(feature.properties.targetId);
    }
  }, [geoLayers, missionActions]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-void">
      <WorldClocks />

      {/* Module Navigation */}
      <div className="w-full bg-[#111] border-b border-[#333] flex justify-center gap-1 p-1 z-40 relative">
        {(['COMMAND', 'GEOINT', 'RADAR', 'TARGETING'] as const).map(mod => (
          <button
            key={mod}
            onClick={() => setActiveModule(mod)}
            className={`px-6 py-1.5 font-mono text-xs font-bold tracking-widest transition-colors ${
              activeModule === mod
                ? 'bg-acid-yellow text-ink'
                : 'bg-transparent text-[#666] hover:text-archival-white hover:bg-[#222]'
            }`}
          >
            {mod}
          </button>
        ))}
      </div>
      <MissionWorkflowBar activeModule={activeModule} mission={missionState} />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeModule}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="flex-1 min-h-0 overflow-y-auto"
        >
          {activeModule === 'COMMAND' ? (
            <CommandScreen
              featureSummary={featureSummary}
              mission={missionState}
              actions={missionActions}
            />
          ) : activeModule === 'GEOINT' ? (
            <GeointScreen
              layers={geoLayers}
              activeLayerId={activeLayerId}
              featureCount={featureSummary.total}
              featureSummary={featureSummary}
              selectedFeatureRef={selectedFeatureRef}
              selectedFeature={selectedFeature}
              activeLayer={activeLayer}
              focusRequest={focusRequest}
              statusMessage={geoIntStatus}
              onSetActiveLayer={setActiveLayerId}
              onToggleVisibility={handleToggleVisibility}
              onSetOpacity={handleLayerOpacity}
              onMoveLayer={handleMoveLayer}
              onFitLayer={requestLayerFit}
              onFitSelectedFeature={requestSelectedFeatureFit}
              onImportFile={handleImportGeoJsonFile}
              onImportUrl={handleImportGeoJsonUrl}
              onSelectedFeatureChange={handleSelectedFeatureChange}
              onFocusRequestHandled={(token) => {
                setFocusRequest((current) => current?.token === token ? null : current);
              }}
            />
          ) : activeModule === 'RADAR' ? (
            <RadarScreen
              featureCount={featureSummary.total}
              featureSummary={featureSummary}
              selectedAssetId={missionState.selectedAssetId}
              selectedTargetId={missionState.selectedTargetId}
              currentTask={missionState.currentTask}
              onSelectAsset={missionActions.selectAsset}
            />
          ) : (
            <TargetingScreen
              featureCount={featureSummary.total}
              featureSummary={featureSummary}
              selectedAssetId={missionState.selectedAssetId}
              selectedTargetId={missionState.selectedTargetId}
              currentTask={missionState.currentTask}
              onSelectTarget={missionActions.selectTarget}
              onTaskSelection={missionActions.taskSelection}
              onClearTask={missionActions.clearTask}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
