import { describe, it, expect } from 'vitest'; import fs from 'node:fs'; import * as L from '../src/ledger.js';
const all = L.load(JSON.parse(fs.readFileSync('src/boosters.json', 'utf8')));
const mk = o => L.normalize({ serial: 'B1', flights: 1, landings_ok: 1, landings_attempted: 1, status: 'active', first: '2020-01-01T00:00:00Z', last: '2021-01-01T00:00:00Z', ...o });
describe('sortBy', () => {
  const bs = [mk({ serial: 'B1', flights: 2, first: '2019-01-01T00:00:00Z' }), mk({ serial: 'B2', flights: 9, first: '2022-01-01T00:00:00Z' })];
  it('flights', () => expect(L.sortBy(bs, 'flights')[0].serial).toBe('B2'));
  it('first', () => expect(L.sortBy(bs, 'first')[0].serial).toBe('B1'));
  it('newest', () => expect(L.sortBy(bs, 'newest')[0].serial).toBe('B2'));
  it('default is flights', () => expect(L.sortBy(bs)[0].serial).toBe('B2'));
  it('unknown throws', () => expect(() => L.sortBy(bs, 'x')).toThrow());
  it('does not mutate', () => { const c = [...bs]; L.sortBy(bs, 'newest'); expect(bs).toEqual(c); });
});
describe('rankOf / landingRate / fate', () => {
  it('rank 1 is the record holder', () => expect(L.rankOf(all, L.leaderboard(all, 1)[0].serial)).toBe(1));
  it('unknown rank null', () => expect(L.rankOf(all, 'B0000')).toBeNull());
  it('landing rate', () => expect(L.landingRate(mk({ landings_ok: 3, landings_attempted: 4 }))).toBe(.75));
  it('no attempts -> null', () => expect(L.landingRate(mk({ landings_attempted: 0 }))).toBeNull());
  it('fate shares sum to 1', () => expect(L.fateBreakdown(all).reduce((s, x) => s + x.share, 0)).toBeCloseTo(1));
  it('fate sorted desc', () => { const f = L.fateBreakdown(all); for (let i = 1; i < f.length; i++) expect(f[i-1].count).toBeGreaterThanOrEqual(f[i].count); });
  it('fate empty', () => expect(L.fateBreakdown([])).toEqual([]));
});
describe('serialFromHash', () => {
  it('parses', () => expect(L.serialFromHash('#b1067')).toBe('B1067'));
  it('rejects junk', () => { expect(L.serialFromHash('#<script>')).toBeNull(); expect(L.serialFromHash('')).toBeNull(); });
});
