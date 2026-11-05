import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import * as L from '../src/ledger.js';

const snap = JSON.parse(readFileSync('src/boosters.json', 'utf8'));
const FL = JSON.parse(readFileSync('src/flights.json', 'utf8')).flights;
const all = L.load(snap);

describe('r52 properties', () => {
  it('reuseCurve is nonincreasing in share and ends near 0 for huge N', () => {
    const curve = L.reuseCurve(all);
    expect(curve[0].n).toBe(1);
    expect(curve[0].share).toBe(1);
    for (let i = 1; i < curve.length; i++) {
      expect(curve[i].share).toBeLessThanOrEqual(curve[i - 1].share + 1e-12);
      expect(curve[i].n).toBe(curve[i - 1].n + 1);
    }
  });

  it('recoveredShareByYear rates are in [0,1]', () => {
    for (const r of L.recoveredShareByYear(FL)) {
      expect(r.share).toBeGreaterThanOrEqual(0);
      expect(r.share).toBeLessThanOrEqual(1);
    }
  });

  it('landingMatrix cells have success <= attempts', () => {
    const { cells } = L.landingMatrix(FL);
    for (const c of Object.values(cells)) {
      expect(c.success).toBeLessThanOrEqual(c.attempts);
      expect(c.attempts).toBeGreaterThanOrEqual(0);
    }
  });

  it('heavyBoosters are a subset of loaded serials', () => {
    const serials = new Set(all.map(b => b.serial));
    for (const s of L.heavyBoosters(FL)) expect(serials.has(s)).toBe(true);
  });
});
