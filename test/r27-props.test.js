import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import * as L from '../src/ledger.js';

const snap = JSON.parse(fs.readFileSync('src/boosters.json', 'utf8'));
const FL = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights;
const all = L.load(snap);
const serials = all.map(b => b.serial);

describe('properties over real snapshot', () => {
  it('asOf(t=Infinity-ish far future) == load', () => {
    const far = Date.UTC(2100, 0);
    const a = L.asOf(all, FL, far);
    expect(a.length).toBe(all.length);
    for (const b of a) {
      const raw = all.find(x => x.serial === b.serial);
      expect(b.flights).toBe(raw.flights);
    }
  });
  it('asOf before first flight is empty', () => {
    expect(L.asOf(all, FL, Date.UTC(2000, 0))).toEqual([]);
  });
  it('gaps days are positive', () => {
    for (const g of L.gaps(FL)) expect(g.days).toBeGreaterThan(0);
  });
  it('recordProgression n is 1..max unique', () => {
    const P = L.recordProgression(FL);
    expect(P.map(p => p.n)).toEqual([...Array(P.length)].map((_, i) => i + 1));
  });
  it('serialize/parse round-trip random states', () => {
    for (let i = 0; i < 50; i++) {
      const s = {
        q: ['', 'B10', 'Starlink', 'x'.repeat(60)][i % 4],
        status: ['all', 'active', 'expended', 'lost'][i % 4],
        sort: ['flights', 'first', 'newest'][i % 3],
        fh: i % 2 === 0,
        lt: ['all', 'ASDS', 'RTLS', 'Ocean', 'EXP'][i % 5],
        y: i % 3 === 0 ? 2018 + (i % 8) : null,
        a: serials[i % serials.length],
        b: serials[(i * 7) % serials.length],
      };
      const parsed = L.parseState(L.serializeState(s), serials);
      expect(parsed.q.length).toBeLessThanOrEqual(40);
      expect(parsed.status).toBe(s.status === 'all' || /^[a-z]+$/.test(s.status) ? (['all','active','expended','lost'].includes(s.status) ? s.status : 'all') : 'all');
      expect(parsed.sort).toBe(s.sort);
      expect(parsed.fh).toBe(s.fh);
      expect(parsed.lt).toBe(s.lt);
      expect(parsed.y).toBe(s.y);
      expect(parsed.a).toBe(s.a);
      expect(parsed.b).toBe(s.b);
    }
  });
  it('filterWithMissions ⊆ load', () => {
    const hit = L.filterWithMissions(all, FL, { q: 'Starlink' });
    expect(hit.every(b => all.some(x => x.serial === b.serial))).toBe(true);
    expect(hit.length).toBeGreaterThan(5);
  });
  it('fleetSizeByYear final flying == active', () => {
    const [y0, y1] = L.yearRange(all);
    const s = L.fleetSizeByYear(all, FL, y0, y1);
    expect(s.at(-1).flying).toBe(all.filter(b => b.status === 'active').length);
  });
});
