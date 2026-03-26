import { AirspaceRadar } from '../components/AirspaceRadar';
import type { GeoFeature, MissionTask } from '../types';
import { ModuleDeskLayout } from './ModuleDeskLayout';

interface Props {
  features: GeoFeature[];
  selectedAssetId: string | null;
  selectedTargetId: string | null;
  currentTask: MissionTask | null;
  onSelectAsset: (id: string | null) => void;
}

export function RadarScreen({
  features,
  selectedAssetId,
  selectedTargetId,
  currentTask,
  onSelectAsset,
}: Props) {
  return (
    <ModuleDeskLayout features={features}>
      <AirspaceRadar
        selectedAssetId={selectedAssetId}
        selectedTargetId={selectedTargetId}
        currentTask={currentTask}
        onSelectAsset={onSelectAsset}
      />
    </ModuleDeskLayout>
  );
}
