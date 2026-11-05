import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import * as L from '../src/ledger.js';
import * as C from '../src/charts.js';
const FL = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights;

describe('padCadence', () => {
  const c = L.padCadence(FL);
  it('grid sums to all flights', () => {
    let s = 0; for (const p of c.pads) for (const y of c.years) s += c.grid[p][y];
    expect(s).toBe(FL.length);
  });
  it('years cover data', () => {
    const ys = FL.map(f => +f.net.slice(0, 4));
    expect(c.years[0]).toBe(Math.min(...ys));
    expect(c.years.at(-1)).toBe(Math.max(...ys));
  });
});

describe('recoveredShareByYear', () => {
  const s = L.recoveredShareByYear(FL);
  it('totals sum to flights', () => expect(s.reduce((a, x) => a + x.total, 0)).toBe(FL.length));
  it('recovered sum matches landing_success', () => expect(s.reduce((a, x) => a + x.recovered, 0)).toBe(FL.filter(f => f.landing_success).length));
  it('share in [0,1]', () => s.forEach(x => { expect(x.share).toBeGreaterThanOrEqual(0); expect(x.share).toBeLessThanOrEqual(1); }));
});

describe('padSVG / recoveredSVG', () => {
  it('no NaN', () => {
    expect(C.padSVG(L.padCadence(FL), 2026, { w: 640 }).svg).not.toMatch(/NaN/);
    expect(C.recoveredSVG(L.recoveredShareByYear(FL), 2026, { w: 400 }).svg).not.toMatch(/NaN/);
  });
});
