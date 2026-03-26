import { Targeting3D } from '../components/Targeting3D';
import type { GeoFeature } from '../types';
import { ModuleDeskLayout } from './ModuleDeskLayout';

interface Props {
  features: GeoFeature[];
  selectedTargetId: string | null;
  onSelectTarget: (id: string | null) => void;
}

export function TargetingScreen({ features, selectedTargetId, onSelectTarget }: Props) {
  return (
    <ModuleDeskLayout features={features}>
      <Targeting3D
        selectedTargetId={selectedTargetId}
        onSelectTarget={onSelectTarget}
      />
    </ModuleDeskLayout>
  );
}
