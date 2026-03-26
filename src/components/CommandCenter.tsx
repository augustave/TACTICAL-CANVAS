import { motion } from 'motion/react';
import { AirspaceRadar } from './AirspaceRadar';
import { GlobeWidget } from './GlobeWidget';
import { AssetListWidget } from './AssetListWidget';
import { ChartWidget } from './ChartWidget';
import { AlertsWidget } from './AlertsWidget';
import { StatsBar } from './StatsBar';
import type { GeoFeature, MissionState, MissionActions } from '../types';

interface Props {
  features: GeoFeature[];
  mission: MissionState;
  actions: MissionActions;
}

export function CommandCenter({ features, mission, actions }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 md:p-8 bg-void text-archival-white font-mono"
    >
      {/* Left Column: Assets */}
      <div className="lg:col-span-3 flex flex-col gap-4 h-[calc(100vh-120px)]">
        <AssetListWidget
          selectedAssetId={mission.selectedAssetId}
          onSelectAsset={actions.selectAsset}
        />
      </div>

      {/* Center Column: Radar & Globe */}
      <div className="lg:col-span-6 flex flex-col gap-4 h-[calc(100vh-120px)]">
        <div className="flex-1 min-h-[400px]">
          <AirspaceRadar
            selectedAssetId={mission.selectedAssetId}
            selectedTargetId={mission.selectedTargetId}
            currentTask={mission.currentTask}
            onSelectAsset={actions.selectAsset}
          />
        </div>
        <div className="h-[300px]">
          <GlobeWidget mission={mission} />
        </div>
      </div>

      {/* Right Column: Details & Stats */}
      <div className="lg:col-span-3 flex flex-col gap-4 h-[calc(100vh-120px)]">
        <div className="flex-1 overflow-hidden">
          <ChartWidget mission={mission} />
        </div>
        <div className="flex-1 overflow-hidden">
          <AlertsWidget
            mission={mission}
            onSelectAsset={actions.selectAsset}
          />
        </div>
        <div className="h-[100px]">
          <StatsBar features={features} />
        </div>
      </div>
    </motion.div>
  );
}
