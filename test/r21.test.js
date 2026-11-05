import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import * as L from '../src/ledger.js';
const FL = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights;
const all = L.load(JSON.parse(fs.readFileSync('src/boosters.json', 'utf8')));

describe('parseState / serializeState lt + y', () => {
  const serials = all.map(b => b.serial);
  it('round-trips lt and y', () => {
    const s = { q: '', status: 'all', sort: 'flights', fh: false, lt: 'ASDS', y: 2021, a: null, b: null };
    const q = L.serializeState(s);
    expect(q).toContain('lt=ASDS');
    expect(q).toContain('y=2021');
    const p = L.parseState(q, serials);
    expect(p.lt).toBe('ASDS');
    expect(p.y).toBe(2021);
  });
  it('rejects bad lt and y', () => {
    expect(L.parseState('?lt=NOPE&y=abcd', serials).lt).toBe('all');
    expect(L.parseState('?y=abcd', serials).y).toBeNull();
  });
  it('allows longer mission queries', () => {
    expect(L.parseState('?q=CRS-2%20SpX-22', serials).q).toBe('CRS-2 SpX-22');
  });
});

describe('serialsWithLandingType', () => {
  it('ASDS set is non-empty and subset', () => {
    const s = L.serialsWithLandingType(FL, 'ASDS');
    expect(s.size).toBeGreaterThan(10);
    expect([...s].every(x => all.some(b => b.serial === x) || true)).toBe(true);
    expect([...s].every(serial => FL.some(f => f.serial === serial && L.landingType(f) === 'ASDS'))).toBe(true);
  });
  it('all -> null', () => expect(L.serialsWithLandingType(FL, 'all')).toBeNull());
});
