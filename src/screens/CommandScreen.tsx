import { CommandCenter } from '../components/CommandCenter';
import type { GeoFeature, MissionActions, MissionState } from '../types';

interface Props {
  features: GeoFeature[];
  mission: MissionState;
  actions: MissionActions;
}

export function CommandScreen({ features, mission, actions }: Props) {
  return (
    <CommandCenter
      features={features}
      mission={mission}
      actions={actions}
    />
  );
}
