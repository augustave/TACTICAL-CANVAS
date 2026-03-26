import { AirspaceRadar } from '../components/AirspaceRadar';
import type { GeoFeature } from '../types';
import { ModuleDeskLayout } from './ModuleDeskLayout';

interface Props {
  features: GeoFeature[];
  selectedAssetId: string | null;
  onSelectAsset: (id: string | null) => void;
}

export function RadarScreen({ features, selectedAssetId, onSelectAsset }: Props) {
  return (
    <ModuleDeskLayout features={features}>
      <AirspaceRadar
        selectedAssetId={selectedAssetId}
        onSelectAsset={onSelectAsset}
      />
    </ModuleDeskLayout>
  );
}
