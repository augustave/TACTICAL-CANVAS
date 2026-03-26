import { Targeting3D } from '../components/Targeting3D';
import type { FeatureSummary, MissionTask } from '../types';
import { ModuleDeskLayout } from './ModuleDeskLayout';

interface Props {
  featureCount: number;
  featureSummary: FeatureSummary;
  selectedAssetId: string | null;
  selectedTargetId: string | null;
  currentTask: MissionTask | null;
  onSelectTarget: (id: string | null) => void;
  onTaskSelection: () => void;
  onClearTask: () => void;
}

export function TargetingScreen({
  featureCount,
  featureSummary,
  selectedAssetId,
  selectedTargetId,
  currentTask,
  onSelectTarget,
  onTaskSelection,
  onClearTask,
}: Props) {
  return (
    <ModuleDeskLayout featureCount={featureCount} featureSummary={featureSummary}>
      <Targeting3D
        selectedAssetId={selectedAssetId}
        selectedTargetId={selectedTargetId}
        currentTask={currentTask}
        onSelectTarget={onSelectTarget}
        onTaskSelection={onTaskSelection}
        onClearTask={onClearTask}
      />
    </ModuleDeskLayout>
  );
}
