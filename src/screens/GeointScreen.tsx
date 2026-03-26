import { GeoJSONPanel } from '../components/GeoJSONPanel';
import { LegendPanel } from '../components/LegendPanel';
import { TacticalCanvas } from '../components/TacticalCanvas';
import type { FilterState, GeoFeature } from '../types';
import { ModuleDeskLayout } from './ModuleDeskLayout';

interface Props {
  allFeatures: GeoFeature[];
  visibleFeatures: GeoFeature[];
  activeFilters: FilterState;
  toggleFilter: (type: string) => void;
}

export function GeointScreen({
  allFeatures,
  visibleFeatures,
  activeFilters,
  toggleFilter,
}: Props) {
  return (
    <ModuleDeskLayout features={visibleFeatures}>
      <TacticalCanvas
        features={allFeatures}
        activeFilters={activeFilters}
        toggleFilter={toggleFilter}
      />
      <LegendPanel activeFilters={activeFilters} toggleFilter={toggleFilter} />
      <GeoJSONPanel features={visibleFeatures} />
    </ModuleDeskLayout>
  );
}
