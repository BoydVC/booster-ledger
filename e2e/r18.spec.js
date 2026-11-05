import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import * as L from '../src/ledger.js';

const snap = JSON.parse(fs.readFileSync('src/boosters.json', 'utf8'));
const fsnap = JSON.parse(fs.readFileSync('src/flights.json', 'utf8'));
const all = L.load(snap);
const FL = fsnap.flights;
const [Y0, Y1] = L.yearRange(all);
const go = async p => { await p.goto('/'); await p.waitForSelector('body[data-ready="1"]'); };

test('fleet chart matches raw series', async ({ page }) => {
  await go(page);
  const series = L.fleetSizeByYear(all, FL, Y0, Y1);
  const ys = await page.locator('#fleetsvg g[data-y]').evaluateAll(els => els.map(e => +e.getAttribute('data-y')));
  expect(ys).toEqual(series.map(s => s.year));
  await expect(page.locator('#blocks')).toContainText('Block 5');
});

test('scrubber sets as-of year and restores', async ({ page }) => {
  await go(page);
  const full = await page.locator('.stat[data-k="Boosters"] b').textContent();
  await page.locator('#scrub').fill('0'); // Y0
  await expect(page.locator('#year')).not.toHaveText('');
  const early = await page.locator('.stat[data-k="Boosters"] b').textContent();
  expect(Number(early)).toBeLessThan(Number(full));
  await page.locator('#scrub').fill(String(Y1 - Y0 + 1));
  await expect(page.locator('.stat[data-k="Boosters"] b')).toHaveText(full);
});

test('mission search finds booster', async ({ page }) => {
  await go(page);
  await page.fill('#q', 'CRS-2 SpX-22');
  await expect(page.locator('#lanes .lane')).toHaveCount(1);
  await expect(page.locator('#lanes .lane')).toHaveAttribute('data-s', 'B1067');
});

test('drawer shows timeline and block', async ({ page }) => {
  await go(page);
  await page.goto('/#B1067');
  await expect(page.locator('#drawer')).toBeVisible();
  await expect(page.locator('#detail')).toContainText('Block 5');
  const n = await page.locator('#tline circle').count();
  expect(n).toBe(L.flightsFor(FL, 'B1067').length);
});

test('j/k walks boosters', async ({ page }) => {
  await go(page);
  await page.keyboard.press('j');
  await expect(page.locator('#drawer')).toBeVisible();
  const first = await page.locator('#dtitle').textContent();
  await page.keyboard.press('j');
  const second = await page.locator('#dtitle').textContent();
  expect(second).not.toBe(first);
  await page.keyboard.press('k');
  await expect(page.locator('#dtitle')).toHaveText(first);
});
