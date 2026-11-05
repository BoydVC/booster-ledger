import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import * as L from '../src/ledger.js';
import * as C from '../src/charts.js';
const FL = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights;

describe('flightsByMonth', () => {
  const h = L.flightsByMonth(FL);
  it('cell sum equals flight count', () => {
    expect(h.cells.flat().reduce((a, b) => a + b, 0)).toBe(FL.length);
  });
  it('max is the busiest month', () => {
    expect(h.max).toBe(Math.max(...h.cells.flat()));
    expect(h.max).toBeGreaterThan(0);
  });
  it('years cover first..last flight', () => {
    const ys = FL.map(f => +f.net.slice(0, 4));
    expect(h.years[0]).toBe(Math.min(...ys));
    expect(h.years.at(-1)).toBe(Math.max(...ys));
  });
});

describe('turnaroundHistogram', () => {
  const b = L.turnaroundHistogram(FL, 10);
  it('bucket counts sum to gap count', () => {
    const gaps = L.gaps(FL).length;
    expect(b.reduce((s, x) => s + x.count, 0)).toBe(gaps);
  });
  it('bins are 10 days (overflow hi is Infinity)', () => {
    for (const x of b) {
      if (x.hi === Infinity) expect(x.lo).toBe(200);
      else expect(x.hi - x.lo).toBe(10);
    }
  });
  it('still accounts for every gap including long ones', () => {
    expect(b.reduce((s, x) => s + x.count, 0)).toBe(L.gaps(FL).length);
  });
});

describe('heatSVG / histSVG', () => {
  it('heatmap has a rect per month cell', () => {
    const h = L.flightsByMonth(FL);
    const r = C.heatSVG(h, { w: 640 });
    expect(r.svg.match(/<rect class="hm"/g).length).toBe(h.years.length * 12);
    expect(r.svg).not.toMatch(/NaN/);
  });
  it('hist has a bar per bucket', () => {
    const b = L.turnaroundHistogram(FL, 10);
    const r = C.histSVG(b, { w: 640 });
    expect(r.svg.match(/<rect class="hb"/g).length).toBe(b.length);
  });
});
