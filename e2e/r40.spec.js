import { test, expect } from '@playwright/test';

test('empty state hides the lanewrap', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.waitForSelector('body[data-ready="1"]');
  await page.fill('#q', 'ZZZ-NOPE');
  await expect(page.locator('#empty')).toBeVisible();
  await expect(page.locator('#lanewrap')).toBeHidden();
  await page.click('#clearf');
  await expect(page.locator('#lanewrap')).toBeVisible();
});

test('drawer flights CSV downloads this booster', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/#B1067');
  await page.waitForSelector('#drawer[open]');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('#dfcsv'),
  ]);
  expect(download.suggestedFilename()).toBe('B1067-flights.csv');
  const path = await download.path();
  const fs = await import('node:fs');
  const text = fs.readFileSync(path, 'utf8');
  const lines = text.trim().split(/\n/);
  expect(lines[0]).toContain('mission');
  expect(lines.length).toBeGreaterThan(30); // B1067 has 37 flights + header
});
