import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test('firsts panel row count matches ledger.firsts', async ({ page }) => {
  const { load, firsts } = await import('../src/ledger.js');
  const snap = JSON.parse(fs.readFileSync('src/boosters.json', 'utf8'));
  const fsnap = JSON.parse(fs.readFileSync('src/flights.json', 'utf8'));
  const rows = firsts(fsnap.flights, load(snap));
  await page.goto('/');
  await page.waitForSelector('body[data-ready="1"]');
  await expect(page.locator('#firsts li, #firsts div')).toHaveCount(rows.length);
  const text = await page.locator('#firsts').innerText();
  for (const r of rows.slice(0, 5)) {
    expect(text).toContain(r.serial || r.label || r.title || '');
  }
});
