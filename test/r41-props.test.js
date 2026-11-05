import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import * as L from '../src/ledger.js';

const snap = JSON.parse(readFileSync('src/boosters.json', 'utf8'));
const fsnap = JSON.parse(readFileSync('src/flights.json', 'utf8'));
const all = L.load(snap);
const FL = fsnap.flights;

describe('r41 properties', () => {
  it('every attempted landing_loc appears in spotsFleet (expended PAC etc. excluded)', () => {
    const spots = new Set(L.spotsFleet(FL).map(s => s.where));
    for (const f of FL) {
      if (f.landing_attempt && f.landing_loc) expect(spots.has(f.landing_loc), f.landing_loc).toBe(true);
    }
  });

  it('busiest droneship success/attempts match spot row', () => {
    const rec = L.records(all, FL);
    const d = rec.busiestDroneship;
    const row = L.spotsFleet(FL).find(s => s.where === d.where);
    expect(row).toBeTruthy();
    expect(row.success).toBe(d.success);
    expect(row.attempts).toBe(d.attempts);
  });

  it('rankOf is 1 for most-flown and unique per serial', () => {
    const sorted = L.sortBy(all, 'flights');
    expect(L.rankOf(all, sorted[0].serial)).toBe(1);
    const ranks = all.map(b => L.rankOf(all, b.serial));
    expect(new Set(ranks).size).toBe(all.length);
    expect(Math.min(...ranks)).toBe(1);
    expect(Math.max(...ranks)).toBe(all.length);
  });

  it('asOf never increases fleet stats vs full snapshot', () => {
    const full = L.fleetStats(all);
    for (const y of [2016, 2018, 2020, 2022, 2024]) {
      const cut = Date.UTC(y + 1, 0);
      const s = L.fleetStats(L.asOf(all, FL, cut));
      expect(s.flights).toBeLessThanOrEqual(full.flights);
      expect(s.boosters).toBeLessThanOrEqual(full.boosters);
    }
  });

  it('filterWithMissions is idempotent and a proper subset for Starlink', () => {
    const a = L.filterWithMissions(all, FL, { q: 'starlink', status: 'all' });
    const b = L.filterWithMissions(a, FL, { q: 'starlink', status: 'all' });
    expect(b.map(x => x.serial)).toEqual(a.map(x => x.serial));
    expect(a.length).toBeGreaterThan(0);
    expect(a.length).toBeLessThan(all.length);
  });

  it('cumulativeFleetFlights ends at total flight count', () => {
    const series = L.cumulativeFleetFlights(FL);
    expect(series.at(-1).n).toBe(FL.length);
    for (let i = 1; i < series.length; i++) expect(series[i].n).toBeGreaterThanOrEqual(series[i - 1].n);
  });
});
