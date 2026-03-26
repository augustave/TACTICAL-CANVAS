import { expect, test } from '@playwright/test';

test('GEOINT stays interactive during drag, zoom, and layer actions', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  await page.goto('/');
  for (const moduleName of ['GEOINT', 'COMMAND', 'GEOINT', 'RADAR', 'GEOINT', 'TARGETING', 'GEOINT']) {
    await page.getByRole('button', { name: moduleName }).click();
  }

  await expect(page.getByTestId('geoint-surface')).toBeVisible();
  await expect(page.getByText('Layer Inspector')).toBeVisible();
  await expect(page.getByText('2D Surface Stable / WebGL Path Removed')).toBeVisible();

  const surface = page.getByTestId('geoint-surface');
  const box = await surface.boundingBox();
  if (!box) {
    throw new Error('2D GEOINT surface bounding box unavailable.');
  }

  await page.mouse.move(box.x + box.width * 0.52, box.y + box.height * 0.48);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.28, box.y + box.height * 0.42, { steps: 24 });
  await page.mouse.up();
  await page.mouse.wheel(0, -520);

  await page.getByRole('button', { name: 'Fit Active' }).click();
  await page.getByRole('button', { name: 'Zoom +' }).click();
  await page.getByRole('button', { name: 'Reset' }).click();
  await page.getByRole('button', { name: 'Visible' }).first().click();
  await page.getByRole('button', { name: 'Hidden' }).first().click();
  await expect(page.getByText('2D Tactical Surface')).toBeVisible();
  expect(pageErrors).toEqual([]);
});
