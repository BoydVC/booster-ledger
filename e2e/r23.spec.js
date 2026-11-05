import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import * as L from '../src/ledger.js';
const all = L.load(JSON.parse(fs.readFileSync('src/boosters.json', 'utf8')));
const go = async p => { await p.goto('/'); await p.waitForSelector('body[data-ready="1"]'); };

test('reuse curve ≥10 matches raw', async ({ page }) => {
  await go(page);
  const n10 = L.reuseCurve(all).find(p => p.n === 10).reached;
  await expect(page.locator('#reusesvg text[data-n10]')).toHaveAttribute('data-n10', String(n10));
});

test('sticky toc stays in view while scrolling', async ({ page }) => {
  await go(page);
  await page.locator('#tocwrap').evaluate(el => { el.open = true; });
  await page.locator('#heat').scrollIntoViewIfNeeded();
  const top = await page.locator('#tocwrap').evaluate(el => el.getBoundingClientRect().top);
  expect(top).toBeGreaterThanOrEqual(0);
  expect(top).toBeLessThan(8);
});

test('FH flyer drawer notes Heavy flights', async ({ page }) => {
  await go(page);
  // Find a booster that flew FH
  const FL = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights;
  const serial = FL.find(f => f.rocket === 'Falcon Heavy').serial;
  await page.goto('/#' + serial);
  await expect(page.locator('#detail')).toContainText('Flew Falcon Heavy');
});
