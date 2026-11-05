import { test, expect } from '@playwright/test';
import fs from 'node:fs';
const F = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights;
const go = async p => { await p.goto('/'); await p.waitForSelector('body[data-ready="1"]'); };

test('failed landing shows ✗ not ✓', async ({ page }) => {
  await page.goto('/#B1012');
  await page.waitForSelector('#drawer[open]');
  const cell = await page.locator('.tl tr').evaluateAll(trs => {
    const row = [...trs].slice(1).find(tr => tr.textContent.includes('✗') || tr.cells[3]?.classList.contains('bad'));
    return row ? row.cells[3].textContent : null;
  });
  expect(cell).toMatch(/✗/);
  expect(cell).not.toMatch(/✓/);
});

test('fastest list respects as-of cutoff', async ({ page }) => {
  await go(page);
  const full = await page.locator('#fast button').allTextContents();
  // Scrub to end of 2020 (Y0=2013 → index 7). Mutant that drops the flight-date cutoff
  // still filters boosters via asOf, but includes their later career gaps — list must differ.
  await page.locator('#scrub').evaluate(el => { el.value = '7'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await expect(page.locator('#year')).toHaveText('2020');
  const early = await page.locator('#fast button').allTextContents();
  expect(early.length).toBeGreaterThan(0);
  expect(early.join('|')).not.toBe(full.join('|'));
  // Correct cutoff keeps the 2020-era fastest at ~51 days (B1058). A mutant that ignores
  // the flight-date cutoff pulls in later 21-day gaps from the same boosters' future careers.
  expect(early[0]).toContain('B1058');
  expect(early[0]).toContain('51.1');
});

test('all drawer links are LL2 or #', async ({ page }) => {
  await page.goto('/#B1067');
  await page.waitForSelector('#drawer[open]');
  const hrefs = await page.locator('#detail a').evaluateAll(as => as.map(a => a.getAttribute('href')));
  for (const h of hrefs) expect(h === '#' || /^https:\/\/ll\.thespacedevs\.com\//.test(h)).toBe(true);
});
