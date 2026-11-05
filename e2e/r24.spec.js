import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const FL = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights;
const go = async p => { await p.goto('/'); await p.waitForSelector('body[data-ready="1"]'); };

test('recovered chart years match raw', async ({ page }) => {
  await go(page);
  const years = [...new Set(FL.map(f => +f.net.slice(0, 4)))].sort((a, b) => a - b);
  const dom = await page.locator('#recoveredsvg g[data-y]').evaluateAll(els => els.map(e => +e.getAttribute('data-y')));
  expect(dom).toEqual(years);
});

test('pad cadence svg renders', async ({ page }) => {
  await go(page);
  await expect(page.locator('#padsvg polyline')).toHaveCount(3);
});
