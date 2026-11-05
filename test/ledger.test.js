import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import * as L from '../src/ledger.js';
const snap = JSON.parse(fs.readFileSync('src/boosters.json', 'utf8'));
const all = L.load(snap);
const mk = (o) => L.normalize({ serial: 'B1', flights: 1, landings_ok: 1, status: 'active', first: '2020-01-01T00:00:00Z', last: '2021-01-01T00:00:00Z', fastest_turnaround: null, ...o });
describe('parseDuration', () => {
  it('days+hours', () => expect(L.parseDuration('P22DT12H')).toBeCloseTo(22.5));
  it('full form', () => expect(L.parseDuration('P1DT1H1M1S')).toBeCloseTo(1 + 1/24 + 1/1440 + 1/86400));
  it('time only', () => expect(L.parseDuration('PT6H')).toBeCloseTo(.25));
  it('null', () => expect(L.parseDuration(null)).toBeNull());
  it('garbage', () => expect(L.parseDuration('3 days')).toBeNull());
});
describe('snapshot', () => {
  it('cites the source', () => { expect(snap.source).toMatch(/thespacedevs/); expect(snap.fetched_at).toMatch(/^\d{4}-/); });
  it('every booster links its record', () => snap.boosters.forEach(b => expect(b.source).toMatch(/^https:\/\/ll\.thespacedevs\.com\//)));
  it('serials are B10xx', () => all.forEach(b => expect(b.serial).toMatch(/^B10\d\d/)));
  it('landings never exceed flights', () => all.forEach(b => expect(b.landings_ok).toBeLessThanOrEqual(b.flights)));
  it('first <= last', () => all.forEach(b => b.firstMs && b.lastMs && expect(b.firstMs).toBeLessThanOrEqual(b.lastMs)));
  it('unique serials', () => expect(new Set(all.map(b => b.serial)).size).toBe(all.length));
});
describe('rankings', () => {
  it('leaderboard sorted desc', () => { const t = L.leaderboard(all); for (let i = 1; i < t.length; i++) expect(t[i-1].flights).toBeGreaterThanOrEqual(t[i].flights); });
  it('leaderboard limit', () => expect(L.leaderboard(all, 3)).toHaveLength(3));
  it('tie broken by serial', () => expect(L.leaderboard([mk({serial:'B2'}), mk({serial:'B1'})]).map(b=>b.serial)).toEqual(['B1','B2']));
  it('fastest ignores single-flight', () => expect(L.fastestTurnarounds([mk({ fastest_turnaround: 'P1D' })])).toHaveLength(0));
  it('fastest sorted asc', () => expect(L.fastestTurnarounds([mk({flights:3,fastest_turnaround:'P30D',serial:'B2'}), mk({flights:3,fastest_turnaround:'P9D'})])[0].serial).toBe('B1'));
});
describe('fleet', () => {
  it('stats sum', () => { const s = L.fleetStats([mk({flights:3,landings_ok:2}), mk({flights:1,status:'lost'})]); expect(s).toMatchObject({ boosters: 2, flights: 4, landings: 3, reflown: 1, active: 1, maxFlights: 3 }); });
  it('empty stats', () => expect(L.fleetStats([]).maxFlights).toBe(0));
  it('status counts', () => expect(L.statusCounts([mk({}), mk({status:'lost'}), mk({})])).toEqual({ active: 2, lost: 1 }));
  it('activeAt includes active', () => expect(L.activeAt([mk({})], Date.UTC(2025,0))).toHaveLength(1));
  it('activeAt excludes retired before t', () => expect(L.activeAt([mk({status:'expended'})], Date.UTC(2025,0))).toHaveLength(0));
  it('activeAt excludes not yet flown', () => expect(L.activeAt([mk({})], Date.UTC(2019,0))).toHaveLength(0));
  it('flightsPerYear', () => expect(L.flightsPerYear(mk({ flights: 4 }))).toBeCloseTo(4 / (366/365.25), 1));
  it('flightsPerYear single flight null', () => expect(L.flightsPerYear(mk({}))).toBeNull());
  it('load drops zero-flight', () => expect(L.load({ boosters: [{ serial: 'B9', flights: 0 }, { serial: 'B8', flights: null }] })).toHaveLength(0));
});
describe('filter', () => {
  const bs = [mk({serial:'B1067'}), mk({serial:'B1063', status:'lost'})];
  it('by serial, case-insensitive', () => expect(L.filter(bs, { q: 'b1067' })).toHaveLength(1));
  it('by status', () => expect(L.filter(bs, { status: 'lost' })[0].serial).toBe('B1063'));
  it('all', () => expect(L.filter(bs)).toHaveLength(2));
  it('yearRange', () => expect(L.yearRange(bs)).toEqual([2020, 2021]));
});
