import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test('Active filter stats match filtered fleetStats', async ({ page }) => {
  const { load, fleetStats, filterWithMissions } = await import('../src/ledger.js');
  const all = load(JSON.parse(fs.readFileSync('src/boosters.json', 'utf8')));
  const FL = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights;
  const active = filterWithMissions(all, FL, { q: '', status: 'active' });
  const s = fleetStats(active);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/?status=active');
  await page.waitForSelector('body[data-ready="1"]');
  const cards = await page.locator('#stats .stat').allTextContents();
  const joined = cards.join(' ');
  expect(joined).toContain(String(s.boosters));
  expect(joined).toContain(String(s.flights));
  expect(joined).toContain(String(s.landings));
  expect(joined).toContain(String(s.active));
  await expect(page.locator('#matchn')).toHaveText(`${s.boosters} shown`);
});
