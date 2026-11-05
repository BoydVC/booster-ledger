import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import * as L from '../src/ledger.js';
import * as C from '../src/charts.js';

const snap = JSON.parse(fs.readFileSync('src/boosters.json', 'utf8'));
const fsnap = JSON.parse(fs.readFileSync('src/flights.json', 'utf8'));
const all = L.load(snap);
const FL = fsnap.flights;
const [Y0, Y1] = L.yearRange(all);

describe('blockOf / blockCounts', () => {
  it('parses Block N from details', () => {
    expect(L.blockOf('Falcon 9 Block 5 booster', 'B1067')).toBe('Block 5');
    expect(L.blockOf('Block 4', 'B1040')).toBe('Block 4');
    expect(L.blockOf('Falcon Heavy core booster.', 'B1057')).toBe('FH core');
  });
  it('falls back to public serial ranges', () => {
    expect(L.blockOf('', 'B1067')).toBe('Block 5');
    expect(L.blockOf('', 'B1046')).toBe('Block 5');
    expect(L.blockOf('', 'B1021')).toBe('Full Thrust');
    expect(L.blockOf('', 'B1010')).toBe('v1.0/v1.1');
    expect(L.blockOf('', '')).toBe('Unknown');
  });
  it('counts sum to loaded boosters', () => {
    expect(L.blockCounts(all).reduce((s, x) => s + x.count, 0)).toBe(all.length);
  });
  it('real fleet is mostly Block 5', () => {
    const top = L.blockCounts(all)[0];
    expect(top.block).toBe('Block 5');
    expect(top.count).toBeGreaterThan(40);
  });
});

describe('fleetSizeByYear', () => {
  const s = L.fleetSizeByYear(all, FL, Y0, Y1);
  it('one row per year', () => expect(s).toHaveLength(Y1 - Y0 + 1));
  it('debuted is non-decreasing', () => {
    for (let i = 1; i < s.length; i++) expect(s[i].debuted).toBeGreaterThanOrEqual(s[i - 1].debuted);
  });
  it('flying + retired == debuted', () => {
    for (const r of s) expect(r.flying + r.retired).toBe(r.debuted);
  });
  it('final year debuted == all with flights', () => {
    expect(s.at(-1).debuted).toBe(all.length);
  });
  it('final year flying == active count', () => {
    // active boosters that have flown
    expect(s.at(-1).flying).toBe(all.filter(b => b.status === 'active').length);
  });
});

describe('filterWithMissions', () => {
  it('serial still works', () => {
    expect(L.filterWithMissions(all, FL, { q: 'B1067' }).map(b => b.serial)).toEqual(['B1067']);
  });
  it('mission name finds the booster', () => {
    const hit = L.filterWithMissions(all, FL, { q: 'CRS-2 SpX-22' });
    expect(hit.some(b => b.serial === 'B1067')).toBe(true);
  });
  it('empty q returns all (status all)', () => {
    expect(L.filterWithMissions(all, FL, { q: '' }).length).toBe(all.length);
  });
  it('status filter still applies with mission q', () => {
    const hit = L.filterWithMissions(all, FL, { q: 'Starlink', status: 'active' });
    expect(hit.every(b => b.status === 'active')).toBe(true);
    expect(hit.length).toBeGreaterThan(0);
  });
});

describe('charts: fleetSVG + timelineSVG', () => {
  it('fleetSVG labels years and has no NaN', () => {
    const series = L.fleetSizeByYear(all, FL, Y0, Y1);
    const r = C.fleetSVG(series, Y1, { w: 640 });
    expect(r.svg).not.toMatch(/NaN/);
    expect(r.svg).toContain(String(Y0));
    expect(r.viewBox).toMatch(/^0 0 640 /);
  });
  it('fleetSVG phone width uses short year labels', () => {
    const series = L.fleetSizeByYear(all, FL, Y0, Y1);
    const r = C.fleetSVG(series, Y1, { w: 400 });
    expect(r.svg).toContain("'" + String(Y1).slice(2));
  });
  it('timelineSVG one point per flight, escaped', () => {
    const fs = L.flightsFor(FL, 'B1067');
    const r = C.timelineSVG(fs, { w: 640 });
    expect(r.svg.match(/<circle/g).length).toBe(fs.length);
    expect(r.svg).not.toMatch(/NaN/);
    const evil = [{ ...fs[0], mission: '<script>x</script>', n: 1 }];
    expect(C.timelineSVG(evil).svg).toContain('&lt;script&gt;');
  });
  it('timelineSVG empty -> null', () => expect(C.timelineSVG([])).toBeNull());
});
