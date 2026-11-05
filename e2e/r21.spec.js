import { test, expect } from '@playwright/test';
const go = async p => { await p.goto('/'); await p.waitForSelector('body[data-ready="1"]'); };

test('landing type filter narrows lanes', async ({ page }) => {
  await go(page);
  const all = await page.locator('#lanes .lane').count();
  await page.selectOption('#lt', 'Ocean');
  const n = await page.locator('#lanes .lane').count();
  expect(n).toBeGreaterThan(0);
  expect(n).toBeLessThan(all);
});

test('share URL includes lt and restores', async ({ page }) => {
  await go(page);
  await page.selectOption('#lt', 'RTLS');
  await page.click('#share');
  const url = page.url();
  expect(url).toContain('lt=RTLS');
  await page.goto('/?lt=ASDS');
  await page.waitForSelector('body[data-ready="1"]');
  expect(await page.locator('#lt').inputValue()).toBe('ASDS');
});

test('year in URL sets scrubber', async ({ page }) => {
  await page.goto('/?y=2018');
  await page.waitForSelector('body[data-ready="1"]');
  await expect(page.locator('#year')).toContainText('2018');
  const n = Number(await page.locator('.stat[data-k="Boosters"] b').textContent());
  expect(n).toBeLessThan(90);
});

test('JSON download fires', async ({ page }) => {
  await go(page);
  const [download] = await Promise.all([page.waitForEvent('download'), page.click('#json')]);
  expect(download.suggestedFilename()).toBe('booster-ledger.json');
});
