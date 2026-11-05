import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import * as L from '../src/ledger.js';
const snap = JSON.parse(fs.readFileSync('src/boosters.json', 'utf8'));
const FL = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights;
const all = L.load(snap);

test('firsts panel sources are LL2', async ({ page }) => {
  await page.goto('/'); await page.waitForSelector('body[data-ready="1"]');
  const hrefs = await page.locator('#firsts a').evaluateAll(as => as.map(a => a.getAttribute('href')));
  expect(hrefs.length).toBeGreaterThan(5);
  for (const h of hrefs) expect(h).toMatch(/^https:\/\/ll\.thespacedevs\.com\//);
});

test('recovered share final year matches raw', async ({ page }) => {
  await page.goto('/'); await page.waitForSelector('body[data-ready="1"]');
  const series = L.recoveredShareByYear(FL);
  const last = series.at(-1);
  const title = await page.locator(`#recoveredsvg g[data-y="${last.year}"] title`).textContent();
  expect(title).toContain(`${Math.round(last.share * 100)}% recovered`);
  expect(title).toContain(`${last.recovered}/${last.total}`);
});

test('reuse curve ≥20 matches raw', async ({ page }) => {
  await page.goto('/'); await page.waitForSelector('body[data-ready="1"]');
  const n20 = L.reuseCurve(all).find(p => p.n === 20)?.reached;
  if (n20 != null) await expect(page.locator('#reusesvg text[data-n20]')).toHaveAttribute('data-n20', String(n20));
});
