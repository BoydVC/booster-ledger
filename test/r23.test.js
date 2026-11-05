import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import * as L from '../src/ledger.js';
import * as C from '../src/charts.js';
const all = L.load(JSON.parse(fs.readFileSync('src/boosters.json', 'utf8')));
const FL = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights;

describe('reuseCurve', () => {
  const c = L.reuseCurve(all);
  it('starts at 100% for n=1', () => {
    expect(c[0].n).toBe(1);
    expect(c[0].reached).toBe(all.length);
    expect(c[0].share).toBe(1);
  });
  it('is non-increasing', () => {
    for (let i = 1; i < c.length; i++) expect(c[i].reached).toBeLessThanOrEqual(c[i - 1].reached);
  });
  it('ends at the record holder alone', () => {
    expect(c.at(-1).reached).toBe(1);
    expect(c.at(-1).n).toBe(Math.max(...all.map(b => b.flights)));
  });
});

describe('heavyRole', () => {
  it('null for never-FH booster', () => {
    const s = all.find(b => !FL.some(f => f.serial === b.serial && f.rocket === 'Falcon Heavy'));
    expect(L.heavyRole(FL, s.serial)).toBeNull();
  });
  it('counts FH flights for a known Heavy flyer', () => {
    const serial = FL.find(f => f.rocket === 'Falcon Heavy').serial;
    const hr = L.heavyRole(FL, serial);
    expect(hr.flights).toBe(FL.filter(f => f.serial === serial && f.rocket === 'Falcon Heavy').length);
    expect(hr.pads.length).toBeGreaterThan(0);
  });
});

describe('reuseSVG', () => {
  it('embeds ≥10 count matching raw', () => {
    const c = L.reuseCurve(all);
    const r = C.reuseSVG(c, { w: 640 });
    const n10 = c.find(p => p.n === 10).reached;
    expect(r.svg).toContain(`data-n10="${n10}"`);
    expect(r.svg).not.toMatch(/NaN/);
  });
});
