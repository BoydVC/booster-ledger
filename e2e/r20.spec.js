import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import * as L from '../src/ledger.js';
const FL = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights;
const go = async p => { await p.goto('/'); await p.waitForSelector('body[data-ready="1"]'); };

test('heatmap cell counts sum to all flights', async ({ page }) => {
  await go(page);
  const sum = await page.locator('#heatsvg rect.hm').evaluateAll(els => els.reduce((s, e) => s + +e.getAttribute('data-n'), 0));
  expect(sum).toBe(FL.length);
});

test('histogram bar counts sum to gap count', async ({ page }) => {
  await go(page);
  const gaps = L.gaps(FL).length;
  const sum = await page.locator('#histsvg rect.hb').evaluateAll(els =>
    els.reduce((s, e) => s + (+e.querySelector('title')?.textContent?.split(': ')[1] || 0), 0));
  // titles are "lo–hi d: count"
  const sum2 = await page.locator('#histsvg rect.hb title').evaluateAll(ts =>
    ts.reduce((s, t) => s + Number(t.textContent.split(': ').pop()), 0));
  expect(sum2).toBe(gaps);
});

test('toc includes heat and hist', async ({ page }) => {
  await go(page);
  await expect(page.locator('#toc a[href="#heat"]')).toHaveCount(1);
  await expect(page.locator('#toc a[href="#hist"]')).toHaveCount(1);
  await page.locator('#toc a[href="#heat"]').click();
  await expect(page.locator('#heatsvg')).toBeInViewport();
});
