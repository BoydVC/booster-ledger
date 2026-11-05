import { describe, it, expect } from 'vitest'; import fs from 'node:fs'; import * as L from '../src/ledger.js';
const FL = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights;
describe('flightsByYear', () => {
  const t = L.flightsByYear(FL);
  it('totals sum to all flights', () => expect(t.reduce((s, x) => s + x.total, 0)).toBe(FL.length));
  it('types sum to total each year', () => t.forEach(x => expect(x.ASDS + x.RTLS + x.EXP + x.Ocean + x.Other).toBe(x.total)));
  it('years ascending', () => t.forEach((x, i) => i && expect(x.year).toBeGreaterThan(t[i - 1].year)));
  it('landingType maps no-attempt to EXP', () => expect(L.landingType({ landing_attempt: false, landing_type: 'ASDS' })).toBe('EXP'));
  it('landingType unknown -> Other', () => expect(L.landingType({ landing_attempt: true, landing_type: 'XYZ' })).toBe('Other'));
});
describe('spotsFleet', () => {
  it('only attempted landings', () => expect(L.spotsFleet(FL).reduce((s, x) => s + x.attempts, 0)).toBe(FL.filter(f => f.landing_attempt).length));
  it('no expended bucket', () => expect(L.spotsFleet(FL).some(x => x.type === 'EXP')).toBe(false));
});
describe('URL state', () => {
  const S = ['B1067', 'B1058'];
  it('defaults', () => expect(L.parseState('', S)).toEqual({ q: '', status: 'all', sort: 'flights', a: null, b: null, fh: false, lt: 'all', y: null }));
  it('round trip', () => { const s = { q: '106', status: 'lost', sort: 'newest', a: 'B1067', b: 'B1058', fh: true, lt: 'ASDS', y: 2020 }; expect(L.parseState(L.serializeState(s), S)).toEqual(s); });
  it('rejects unknown serial & sort', () => expect(L.parseState('?a=B9999&sort=evil', S)).toMatchObject({ a: null, sort: 'flights' }));
  it('rejects odd status', () => expect(L.parseState('?status=<x>', S).status).toBe('all'));
  it('caps q length', () => expect(L.parseState('?q=' + 'x'.repeat(100), S).q).toHaveLength(40));
  it('defaults serialize to empty', () => expect(L.serializeState({ q: '', status: 'all', sort: 'flights' })).toBe(''));
  it('case-insensitive serial', () => expect(L.parseState('?a=b1067', S).a).toBe('B1067'));
});
describe('prototype keys', () => {
  it('sortBy rejects __proto__', () => expect(() => L.sortBy([], '__proto__')).toThrow());
  it('parseState rejects __proto__/constructor sort', () => { expect(L.parseState('?sort=__proto__').sort).toBe('flights'); expect(L.parseState('?sort=constructor').sort).toBe('flights'); });
});
