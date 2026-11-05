import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test('records most-flights and droneship match ledger.records', async ({ page }) => {
  const { load, records } = await import('../src/ledger.js');
  const snap = JSON.parse(fs.readFileSync('src/boosters.json', 'utf8'));
  const FL = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights;
  const r = records(load(snap), FL);
  await page.goto('/');
  await page.waitForSelector('body[data-ready="1"]');
  const text = await page.locator('#records').innerText();
  expect(text).toContain(r.mostFlights.serial);
  expect(text).toContain(String(r.mostFlights.flights));
  expect(text).toContain(r.busiestDroneship.name);
  expect(text).toContain(`${r.busiestDroneship.success}/${r.busiestDroneship.attempts}`);
  expect(text).toContain(r.firstReflight.serial);
  expect(text).toContain(r.fastestTurnaround.serial);
});
