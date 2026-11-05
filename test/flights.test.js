import { describe, it, expect } from 'vitest'; import fs from 'node:fs'; import * as L from '../src/ledger.js';
const FL = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights;
const B = L.load(JSON.parse(fs.readFileSync('src/boosters.json', 'utf8')));
const f = (serial, net, o = {}) => ({ serial, net, n: 1, mission: 'M', landing_attempt: true, landing_success: true, landing_loc: 'OCISLY', landing_loc_name: 'Of Course I Still Love You', landing_type: 'ASDS', source: 'https://ll.thespacedevs.com/x', ...o });
describe('flights snapshot', () => {
  it('matches booster flight counts exactly', () => { for (const b of B) expect(L.flightsFor(FL, b.serial).length, b.serial).toBe(b.flights); });
  it('flight numbers run 1..n per booster', () => { for (const b of B) { const ns = L.flightsFor(FL, b.serial).map(x => x.n); expect(ns, b.serial).toEqual(ns.map((_, i) => i + 1)); } });
  it('landing successes match booster records', () => { for (const b of B) expect(L.flightsFor(FL, b.serial).filter(x => x.landing_success).length, b.serial).toBe(b.landings_ok); });
  it('every flight cites LL2', () => FL.forEach(x => expect(x.source).toMatch(/^https:\/\/ll\.thespacedevs\.com\/2\.3\.0\/launches\//)));
  it('success implies attempt', () => FL.forEach(x => x.landing_success && expect(x.landing_attempt).toBe(true)));
});
describe('gaps & trend', () => {
  const fs2 = [f('A', '2020-01-01T00:00:00Z'), f('A', '2020-01-11T00:00:00Z'), f('A', '2021-01-01T00:00:00Z'), f('B', '2020-06-01T00:00:00Z')];
  it('gaps per booster only', () => expect(L.gaps(fs2).map(g => Math.round(g.days))).toEqual([10, 356]));
  it('gaps independent of input order', () => expect(L.gaps([...fs2].reverse()).map(g => Math.round(g.days))).toEqual([10, 356]));
  it('median odd/even/empty', () => { expect(L.median([3, 1, 2])).toBe(2); expect(L.median([1, 2, 3, 4])).toBe(2.5); expect(L.median([])).toBeNull(); });
  it('trend groups by reflight year', () => expect(L.turnaroundByYear(fs2).map(t => [t.year, t.reflights])).toEqual([[2020, 1], [2021, 1]]));
  it('real trend: fastest never above median', () => L.turnaroundByYear(FL).forEach(t => expect(t.min).toBeLessThanOrEqual(t.median)));
});
describe('landingBreakdown', () => {
  const xs = [f('A', '1'), f('A', '2', { landing_success: false }), f('A', '3', { landing_attempt: false, landing_success: null, landing_loc: null })];
  it('groups by spot with success counts', () => expect(L.landingBreakdown(xs)[0]).toMatchObject({ where: 'OCISLY', attempts: 2, success: 1 }));
  it('expended bucket', () => expect(L.landingBreakdown(xs)[1]).toMatchObject({ where: 'Expended / no attempt', type: 'EXP', success: 0 }));
  it('real totals equal flights', () => expect(L.landingBreakdown(FL).reduce((s, x) => s + x.attempts, 0)).toBe(FL.length));
});
describe('records & compare', () => {
  const r = L.records(B, FL);
  it('first reflight is a flight #2', () => expect(r.firstReflight.n).toBe(2));
  it('no earlier flight #2 exists', () => FL.filter(x => x.n === 2).forEach(x => expect(x.net >= r.firstReflight.net).toBe(true)));
  it('fastest turnaround is the global min gap', () => expect(r.fastestTurnaround.days).toBe(Math.min(...L.gaps(FL).map(g => g.days))));
  it('most flights matches leaderboard', () => expect(r.mostFlights.serial).toBe(L.leaderboard(B, 1)[0].serial));
  it('busiest droneship is ASDS', () => expect(r.busiestDroneship.type).toBe('ASDS'));
  it('records on empty', () => expect(L.records([], [])).toMatchObject({ firstReflight: null, fastestTurnaround: null, mostFlights: null }));
  it('compare two', () => { const [a, b] = L.compare(B, FL, 'B1067', 'B1063'); expect(a.flights).toBe(B.find(x => x.serial === 'B1067').flights); expect(b.serial).toBe('B1063'); expect(a.fastestGap).toBeLessThanOrEqual(a.medianGap); });
  it('compare unknown -> null', () => expect(L.compare(B, FL, 'B0000', 'B1067')[0]).toBeNull());
  it('compare single-flight booster has null gaps', () => { const one = B.find(b => b.flights === 1); expect(L.compare(B, FL, one.serial, one.serial)[0].medianGap).toBeNull(); });
});
