// (d) Every number on screen re-derived from the raw committed JSON, independently of src/ledger.js.
import { test, expect } from '@playwright/test'; import fs from 'node:fs';
const B = JSON.parse(fs.readFileSync('src/boosters.json', 'utf8')).boosters.filter(b => (b.flights || 0) > 0);
const F = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights;
const by = {}; for (const f of F) (by[f.serial] ||= []).push(f); for (const k in by) by[k].sort((a, b) => a.net < b.net ? -1 : 1);
const gaps = Object.entries(by).flatMap(([s, fs]) => fs.slice(1).map((f, i) => ({ s, d: (Date.parse(f.net) - Date.parse(fs[i].net)) / 864e5, f })));
const go = async p => { await p.goto('/'); await p.waitForSelector('body[data-ready="1"]'); };
test('stat cards', async ({ page }) => {
  await go(page); const v = async k => (await page.locator(`.stat[data-k="${k}"] b`).textContent());
  expect(await v('Boosters')).toBe(String(B.length));
  expect(await v('Flights')).toBe(String(F.length));
  expect(await v('Landings')).toBe(String(F.filter(f => f.landing_success).length));
  expect(await v('Reflown')).toBe(String(B.filter(b => b.flights > 1).length));
  expect(await v('Still active')).toBe(String(B.filter(b => b.status === 'active').length));
  expect(await v('Record')).toBe(Math.max(...B.map(b => b.flights)) + ' flights');
});
test('most-flown list', async ({ page }) => {
  await go(page); const items = await page.locator('#top button').allTextContents();
  const exp = [...B].sort((a, b) => b.flights - a.flights || a.serial.localeCompare(b.serial)).slice(0, 10).map(b => `${b.serial} — ${b.flights} flights`);
  expect(items).toEqual(exp);
});
test('fastest-turnaround list', async ({ page }) => {
  await go(page); const best = {}; for (const g of gaps) if (!best[g.s] || g.d < best[g.s]) best[g.s] = g.d;
  const exp = Object.entries(best).sort((a, b) => a[1] - b[1]).slice(0, 10).map(([s, d]) => `${s} — ${d.toFixed(1)} days`);
  expect(await page.locator('#fast button').allTextContents()).toEqual(exp);
});
test('records panel', async ({ page }) => {
  await go(page); const g = [...gaps].sort((a, b) => a.d - b.d)[0];
  await expect(page.locator('#rec-fast')).toContainText(`${g.s}: ${g.d.toFixed(1)} days`);
  await expect(page.locator('#rec-fast a')).toHaveAttribute('href', g.f.source);
  const r = F.filter(f => f.n === 2).sort((a, b) => a.net < b.net ? -1 : 1)[0];
  await expect(page.locator('#rec-first')).toContainText(`${r.serial} on ${r.net.slice(0, 10)}`);
  const ds = {}; for (const f of F) if (f.landing_attempt && f.landing_type === 'ASDS') { const e = (ds[f.landing_loc_name] ||= [0, 0]); e[0]++; if (f.landing_success) e[1]++; }
  const [name, [att, ok]] = Object.entries(ds).sort((a, b) => b[1][0] - a[1][0])[0];
  await expect(page.locator('#rec-ds')).toContainText(`${name}: ${ok}/${att} landings`);
});
test('trend medians', async ({ page }) => {
  await go(page); const yr = {}; for (const g of gaps) (yr[g.f.net.slice(0, 4)] ||= []).push(g.d);
  const med = xs => { const s = [...xs].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  for (const [y, xs] of Object.entries(yr)) await expect(page.locator(`#trendsvg .pt[data-y="${y}"] title`)).toContainText(`median ${med(xs).toFixed(1)} d, fastest ${Math.min(...xs).toFixed(1)} d, ${xs.length} reflights`);
});
for (const s of ['B1067', 'B1058', 'B1049', 'B1003', 'B1012']) test(`drawer rows for ${s}`, async ({ page }) => {
  await page.goto(`/?v#${s}`); await page.waitForSelector('#drawer[open]');
  const rows = await page.locator('.tl tr').evaluateAll(trs => trs.slice(1).map(tr => [...tr.cells].map(c => c.textContent.trim())));
  expect(rows).toEqual(by[s].map(f => [String(f.n), f.net.slice(0, 10), f.mission, f.landing_attempt ? (f.landing_loc || f.landing_type) + (f.landing_success ? ' ✓' : ' ✗') : 'expended']));
  const b = B.find(x => x.serial === s); await expect(page.locator('#detail')).toContainText(`${b.flights} flights · ${b.landings_ok}/${b.landings_attempted} landings`);
});
test('compare table numbers', async ({ page }) => {
  await go(page); await page.selectOption('#ca', 'B1071'); await page.selectOption('#cb', 'B1060');
  for (const [i, s] of [[0, 'B1071'], [1, 'B1060']]) {
    await expect(page.locator('#ctable tr[data-k="flights"] td').nth(i)).toHaveText(String(by[s].length));
    await expect(page.locator('#ctable tr[data-k="landings"] td').nth(i)).toHaveText(String(by[s].filter(f => f.landing_success).length));
    const gs = gaps.filter(g => g.s === s).map(g => g.d);
    await expect(page.locator('#ctable tr[data-k="fastestGap"] td').nth(i)).toHaveText(Math.min(...gs).toFixed(1) + ' d');
  }
});
