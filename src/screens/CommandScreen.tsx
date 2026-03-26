import { CommandCenter } from '../components/CommandCenter';
import type { FeatureSummary, MissionActions, MissionState } from '../types';

interface Props {
  featureSummary: FeatureSummary;
  mission: MissionState;
  actions: MissionActions;
}

export function CommandScreen({ featureSummary, mission, actions }: Props) {
  return (
    <CommandCenter
      featureSummary={featureSummary}
      mission={mission}
      actions={actions}
    />
  );
}
