import { Targeting3D } from '../components/Targeting3D';
import type { GeoFeature, MissionTask } from '../types';
import { ModuleDeskLayout } from './ModuleDeskLayout';

interface Props {
  features: GeoFeature[];
  selectedAssetId: string | null;
  selectedTargetId: string | null;
  currentTask: MissionTask | null;
  onSelectTarget: (id: string | null) => void;
  onTaskSelection: () => void;
  onClearTask: () => void;
}

export function TargetingScreen({
  features,
  selectedAssetId,
  selectedTargetId,
  currentTask,
  onSelectTarget,
  onTaskSelection,
  onClearTask,
}: Props) {
  return (
    <ModuleDeskLayout features={features}>
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
