import { test, expect } from '@playwright/test';
import * as L from '../src/ledger.js';
import fs from 'node:fs';
const FL = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights;
const all = L.load(JSON.parse(fs.readFileSync('src/boosters.json', 'utf8')));

test('firsts panel matches ledger.firsts', async ({ page }) => {
  await page.goto('/'); await page.waitForSelector('body[data-ready="1"]');
  const labels = await page.locator('#firsts div').evaluateAll(els => els.map(e => e.getAttribute('data-first')));
  expect(labels).toEqual(L.firsts(FL, all).map(r => r.label));
});
