/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useCallback } from 'react';
import { generateCluster } from './utils/geo';
import { WorldClocks } from './components/WorldClocks';
import type { ActiveModule, FilterState, MissionState, MissionActions } from './types';
import { CommandScreen } from './screens/CommandScreen';
import { GeointScreen } from './screens/GeointScreen';
import { RadarScreen } from './screens/RadarScreen';
import { TargetingScreen } from './screens/TargetingScreen';

export default function App() {
  // ── Module Navigation ────────────────────────────────────────────────────
  const [activeModule, setActiveModule] = useState<ActiveModule>('COMMAND');

  // ── Feature Layer Filters ────────────────────────────────────────────────
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    infrastructure: true,
    pathway: true,
    organic: true,
    zone: true
  });

  // ── Mission State: shared selection context across all modules ───────────
  const [missionState, setMissionState] = useState<MissionState>({
    selectedAssetId: null,
    selectedTargetId: null,
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

  const visibleFeatures = useMemo(() =>
    allFeatures.filter(f => activeFilters[f.type]),
  [allFeatures, activeFilters]);

  const toggleFilter = useCallback((type: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [type as keyof FilterState]: !prev[type as keyof FilterState]
    }));
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-void">
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

      {activeModule === 'COMMAND' ? (
        <CommandScreen
          features={visibleFeatures}
          mission={missionState}
          actions={missionActions}
        />
      ) : activeModule === 'GEOINT' ? (
        <GeointScreen
          allFeatures={allFeatures}
          visibleFeatures={visibleFeatures}
          activeFilters={activeFilters}
          toggleFilter={toggleFilter}
        />
      ) : activeModule === 'RADAR' ? (
        <RadarScreen
          features={visibleFeatures}
          selectedAssetId={missionState.selectedAssetId}
          onSelectAsset={missionActions.selectAsset}
        />
      ) : (
        <TargetingScreen
          features={visibleFeatures}
          selectedTargetId={missionState.selectedTargetId}
          onSelectTarget={missionActions.selectTarget}
        />
      )}
    </div>
  );
}
