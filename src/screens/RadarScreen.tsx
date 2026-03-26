import { AirspaceRadar } from '../components/AirspaceRadar';
import type { FeatureSummary, MissionTask } from '../types';
import { ModuleDeskLayout } from './ModuleDeskLayout';

interface Props {
  featureCount: number;
  featureSummary: FeatureSummary;
  selectedAssetId: string | null;
  selectedTargetId: string | null;
  currentTask: MissionTask | null;
  onSelectAsset: (id: string | null) => void;
}

export function RadarScreen({
  featureCount,
  featureSummary,
  selectedAssetId,
  selectedTargetId,
  currentTask,
  onSelectAsset,
}: Props) {
  return (
    <ModuleDeskLayout featureCount={featureCount} featureSummary={featureSummary}>
      <AirspaceRadar
        selectedAssetId={selectedAssetId}
        selectedTargetId={selectedTargetId}
        currentTask={currentTask}
        onSelectAsset={onSelectAsset}
      />
    </ModuleDeskLayout>
  );
}
