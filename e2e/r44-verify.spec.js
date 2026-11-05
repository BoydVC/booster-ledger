import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { createRequire } from 'node:module';
// Use ledger via dynamic import
const snap = JSON.parse(fs.readFileSync('src/boosters.json', 'utf8'));
const fsnap = JSON.parse(fs.readFileSync('src/flights.json', 'utf8'));

test('records launch failures match raw Failure status', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('body[data-ready="1"]');
  const raw = fsnap.flights.filter(f => f.launch_status && f.launch_status !== 'Success');
  const text = await page.locator('#records').innerText();
  for (const f of raw) {
    expect(text, f.serial).toContain(f.serial);
  }
  expect(raw.map(f => f.serial).sort()).toEqual(['B1018', 'B1028', 'B1063']);
});

test('stats cards equal fleetStats on raw load', async ({ page }) => {
  const { load, fleetStats } = await import('../src/ledger.js');
  const s = fleetStats(load(snap));
  await page.goto('/');
  await page.waitForSelector('body[data-ready="1"]');
  const cards = await page.locator('#stats .stat').allTextContents();
  const joined = cards.join(' | ');
  expect(joined).toContain(String(s.boosters));
  expect(joined).toContain(String(s.flights));
  expect(joined).toContain(String(s.landings));
  expect(joined).toContain(String(s.reflown));
  expect(joined).toContain(String(s.active));
  expect(joined).toContain(String(s.maxFlights));
});
