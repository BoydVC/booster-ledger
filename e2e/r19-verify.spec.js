import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const B = JSON.parse(fs.readFileSync('src/boosters.json', 'utf8')).boosters.filter(b => (b.flights || 0) > 0);
const F = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights;
const go = async p => { await p.goto('/'); await p.waitForSelector('body[data-ready="1"]'); };

test('every lane flight count equals raw booster.flights', async ({ page }) => {
  await go(page); await page.locator('#tocwrap').evaluate(el => { el.open = true; });
  const dom = await page.locator('#lanes .lane').evaluateAll(els => els.map(e => ({
    s: e.getAttribute('data-s'),
    n: +(e.querySelectorAll('text')[1]?.textContent || 0),
  })));
  const by = Object.fromEntries(B.map(b => [b.serial, b.flights]));
  expect(dom.length).toBe(B.length);
  for (const row of dom) expect(row.n, row.s).toBe(by[row.s]);
});

test('spot table success/attempts match raw', async ({ page }) => {
  await go(page); await page.locator('#tocwrap').evaluate(el => { el.open = true; });
  const raw = {};
  for (const f of F) {
    if (!f.landing_attempt) continue;
    const k = f.landing_loc || f.landing_type || 'Unknown';
    const e = (raw[k] ||= { a: 0, s: 0, name: f.landing_loc_name || k });
    e.a++; if (f.landing_success) e.s++;
  }
  const rows = await page.locator('#spottable tr[data-w]').evaluateAll(els => els.map(tr => ({
    w: tr.getAttribute('data-w'),
    text: tr.children[2].textContent,
  })));
  expect(rows.length).toBe(Object.keys(raw).length);
  for (const r of rows) {
    expect(r.text).toBe(`${raw[r.w].s}/${raw[r.w].a}`);
  }
});

test('year bar totals match raw flights per year', async ({ page }) => {
  await go(page); await page.locator('#tocwrap').evaluate(el => { el.open = true; });
  const by = {};
  for (const f of F) { const y = +f.net.slice(0, 4); by[y] = (by[y] || 0) + 1; }
  const dom = await page.locator('#yearsvg text.tot').evaluateAll(els => els.map(e => ({ y: +e.getAttribute('data-y'), n: +e.textContent })));
  expect(Object.fromEntries(dom.map(d => [d.y, d.n]))).toEqual(by);
});

test('rate chart points match raw success rates', async ({ page }) => {
  await go(page); await page.locator('#tocwrap').evaluate(el => { el.open = true; });
  const by = {};
  for (const f of F) {
    if (!f.landing_attempt) continue;
    const y = +f.net.slice(0, 4);
    const e = (by[y] ||= { a: 0, s: 0 });
    e.a++; if (f.landing_success) e.s++;
  }
  const ys = await page.locator('#ratesvg g[data-y]').evaluateAll(els => els.map(e => +e.getAttribute('data-y')));
  expect(ys).toEqual(Object.keys(by).map(Number).sort((a, b) => a - b));
});

test('compare table flights equal raw counts', async ({ page }) => {
  await go(page); await page.locator('#tocwrap').evaluate(el => { el.open = true; });
  const a = await page.locator('#ca').inputValue();
  const b = await page.locator('#cb').inputValue();
  const na = F.filter(f => f.serial === a).length;
  const nb = F.filter(f => f.serial === b).length;
  const cell = async (k, col) => page.locator(`#ctable tr[data-k="${k}"] td`).nth(col).textContent();
  expect(await cell('flights', 0)).toBe(String(na));
  expect(await cell('flights', 1)).toBe(String(nb));
});

test('toc links target existing sections', async ({ page }) => {
  await go(page); await page.locator('#tocwrap').evaluate(el => { el.open = true; });
  const hrefs = await page.locator('#toc a').evaluateAll(as => as.map(a => a.getAttribute('href')));
  for (const h of hrefs) {
    const id = h.slice(1);
    await expect(page.locator('#' + id)).toHaveCount(1);
  }
});
