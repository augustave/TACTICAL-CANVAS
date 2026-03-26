import { expect, test } from '@playwright/test';

test('GEOINT stays interactive during drag, zoom, and layer actions', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'GEOINT' }).click();

  await expect(page.getByTestId('geoint-legacy-surface')).toBeVisible();
  await expect(page.getByText('Layer Inspector')).toBeVisible();

  const layerEngineFallback = page.getByText('Layer Engine Crashed');
  if (await layerEngineFallback.isVisible().catch(() => false)) {
    await expect(page.getByRole('button', { name: 'Reload Layer Engine' })).toBeVisible();
    expect(pageErrors).toEqual([]);
    return;
  }

  await expect(page.getByTestId('geoint-layer-engine')).toBeVisible();

  const canvas = page.locator('.maplibregl-canvas').first();
  await expect(canvas).toBeVisible();

  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error('Map canvas bounding box unavailable.');
  }

  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.55);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.35, box.y + box.height * 0.45, { steps: 24 });
  await page.mouse.up();
  await page.mouse.wheel(0, -500);

  await page.getByRole('button', { name: 'Fit Active' }).click();
  await page.getByRole('button', { name: 'Visible' }).first().click();
  await page.getByRole('button', { name: 'Hidden' }).first().click();

  await expect(page.getByText('Legacy tactical view remains available.')).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});

test('GEOINT keeps legacy pane alive when the layer engine fails closed', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  await page.goto('/?geointMapFailure=1');
  await page.getByRole('button', { name: 'GEOINT' }).click();

  await expect(page.getByTestId('geoint-legacy-surface')).toBeVisible();
  await expect(page.getByText('Layer Engine Halted')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reload Layer Engine' })).toBeVisible();
  expect(pageErrors).toEqual([]);
});
