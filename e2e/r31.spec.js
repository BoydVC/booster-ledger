import { test, expect } from '@playwright/test';
const go = async p => { await p.goto('/'); await p.waitForSelector('body[data-ready="1"]'); };

test('quick Active filter', async ({ page }) => {
  await go(page);
  const all = await page.locator('#lanes .lane').count();
  await page.locator('#quick button[data-st="active"]').click();
  const n = await page.locator('#lanes .lane').count();
  expect(n).toBeGreaterThan(0);
  expect(n).toBeLessThan(all);
  expect(await page.locator('#status').inputValue()).toBe('active');
});

test('flights CSV download', async ({ page }) => {
  await go(page);
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#fcsv')]);
  expect(download.suggestedFilename()).toBe('booster-flights.csv');
});
