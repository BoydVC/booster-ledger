import { test, expect } from '@playwright/test'; import fs from 'node:fs';
const F = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights;
const go = async (p, u = '/') => { await p.goto(u); await p.waitForSelector('body[data-ready="1"]'); };
test('Falcon Heavy filter', async ({ page }) => { await go(page); await page.check('#fh'); const n = new Set(F.filter(f => f.rocket === 'Falcon Heavy').map(f => f.serial)).size; await expect(page.locator('.lane')).toHaveCount(n); expect(page.url()).toContain('fh=1'); });
test('pad table matches raw', async ({ page }) => { await go(page); const n = F.filter(f => f.pad === 'Launch Complex 39A').length; await expect(page.locator('#padtable tr[data-pad="Launch Complex 39A"] td').nth(1)).toHaveText(String(n)); });
test('CSV download has a row per shown booster', async ({ page }) => {
  await go(page, '/?status=lost'); const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#csv')]);
  const text = fs.readFileSync(await dl.path(), 'utf8'); const n = await page.locator('.lane').count();
  expect(text.trim().split('\n')).toHaveLength(n + 1); expect(text).toContain('thespacedevs');
});
test('data load failure shows a friendly error', async ({ page }) => {
  await page.route('**/flights.json', r => r.fulfill({ status: 500, body: '' }));
  await page.goto('/'); await expect(page.locator('#err')).toBeVisible(); await expect(page.locator('#err')).toContainText('flights.json: HTTP 500');
});
test('drawer marks Falcon Heavy flights', async ({ page }) => { const s = F.find(f => f.rocket === 'Falcon Heavy').serial; await page.goto(`/?h#${s}`); await expect(page.locator('#detail')).toContainText('Falcon Heavy'); });
