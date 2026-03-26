import React, { useMemo, useRef, useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import type { LayerDefinition, MapFeatureRef, MapViewportState } from '../types';
import { normalizeGeoJsonInput, getFeatureByRef, getDefaultLayerStyle, getDisplayModesForCollection } from '../utils/geojson';

vi.mock('../components/TacticalCanvas', async () => {
  const ReactModule = await import('react');

  return {
    TacticalCanvas: ({ onSelectedFeatureChange }: { onSelectedFeatureChange: (featureRef: MapFeatureRef | null) => void }) => {
      const [hoverTicks, setHoverTicks] = ReactModule.useState(0);

      return (
        <div data-testid="mock-tactical-canvas">
          <button type="button" onClick={() => setHoverTicks((count) => count + 1)}>
            Local Hover
          </button>
          <button type="button" onClick={() => onSelectedFeatureChange({ layerId: 'layer-1', featureId: 'feature-1' })}>
            Select Feature
          </button>
          <span data-testid="hover-ticks">{hoverTicks}</span>
        </div>
      );
    },
  };
});

vi.mock('../components/LegacyTacticalCanvas', () => ({
  LegacyTacticalCanvas: () => <div data-testid="mock-legacy-surface">Legacy Surface</div>,
}));

import { GeointScreen } from './GeointScreen';

const initialViewport: MapViewportState = {
  center: [-73.965, 40.745],
  zoom: 12.35,
  bearing: 0,
  pitch: 0,
};

function makeLayer(): LayerDefinition {
  const data = normalizeGeoJsonInput({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 'feature-1',
        geometry: {
          type: 'Point',
          coordinates: [-73.962, 40.744],
        },
        properties: {
          category: 'infrastructure',
          name: 'Relay Point',
        },
      },
    ],
  });

  return {
    id: 'layer-1',
    name: 'Layer One',
    sourceType: 'sample',
    sourceConfig: { label: 'Test source' },
    data,
    displayModes: getDisplayModesForCollection(data),
    style: getDefaultLayerStyle(data, 0),
    visible: true,
    opacity: 1,
    zIndex: 10,
    locked: false,
    minZoom: 0,
    maxZoom: 24,
    status: 'ready',
  };
}

function Harness() {
  const layer = useMemo(() => makeLayer(), []);
  const [selectedFeatureRef, setSelectedFeatureRef] = useState<MapFeatureRef | null>(null);
  const renderCount = useRef(0);
  renderCount.current += 1;

  const selectedFeature = getFeatureByRef([layer], selectedFeatureRef);

  return (
    <div>
      <div data-testid="render-count">{renderCount.current}</div>
      <GeointScreen
        layers={[layer]}
        activeLayerId={layer.id}
        featureCount={1}
        featureSummary={{ total: 1, infrastructure: 1, pathway: 0, organic: 0, zone: 0 }}
        selectedFeatureRef={selectedFeatureRef}
        selectedFeature={selectedFeature}
        activeLayer={layer}
        initialViewport={initialViewport}
        focusRequest={null}
        statusMessage="Ready"
        onSetActiveLayer={() => {}}
        onToggleVisibility={() => {}}
        onSetOpacity={() => {}}
        onMoveLayer={() => {}}
        onFitLayer={() => {}}
        onFitSelectedFeature={() => {}}
        onImportFile={() => {}}
        onImportUrl={async () => {}}
        onSelectedFeatureChange={setSelectedFeatureRef}
        onFocusRequestHandled={() => {}}
      />
    </div>
  );
}

test('local hover does not force parent GEOINT rerender while selection still updates inspector', () => {
  render(<Harness />);

  expect(screen.getByTestId('mock-tactical-canvas')).toBeTruthy();
  expect(screen.getByTestId('mock-legacy-surface')).toBeTruthy();
  expect(screen.getByTestId('render-count').textContent).toBe('1');
  expect(screen.getByText('No feature selected')).toBeTruthy();

  fireEvent.click(screen.getByRole('button', { name: 'Local Hover' }));
  expect(screen.getByTestId('hover-ticks').textContent).toBe('1');
  expect(screen.getByTestId('render-count').textContent).toBe('1');

  fireEvent.click(screen.getByRole('button', { name: 'Select Feature' }));
  expect(screen.getByTestId('render-count').textContent).toBe('2');
  expect(screen.getByText('Selected feature-1')).toBeTruthy();
  expect(screen.getByText(/Relay Point/)).toBeTruthy();
});
