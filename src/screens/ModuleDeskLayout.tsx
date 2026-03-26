import type { ReactNode } from 'react';
import { ClassificationStrip } from '../components/ClassificationStrip';
import { DossierStack } from '../components/DossierStack';
import { StatsBar } from '../components/StatsBar';
import type { FeatureSummary } from '../types';

interface Props {
  children: ReactNode;
  featureCount: number;
  featureSummary: FeatureSummary;
}

export function ModuleDeskLayout({ children, featureCount, featureSummary }: Props) {
  return (
    <div className="desk-texture flex-1 w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 grid-rows-[auto_1fr] gap-0 relative overflow-hidden">
      <ClassificationStrip />

      <div className="relative z-10 lg:pr-8 mb-8 lg:mb-0">
        <DossierStack featureCount={featureCount} />
      </div>

      <div className="relative z-10 flex flex-col gap-4">
        {children}
      </div>

      <StatsBar summary={featureSummary} />
    </div>
  );
}
