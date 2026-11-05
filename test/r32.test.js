import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import * as L from '../src/ledger.js';
const FL = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights;
const all = L.load(JSON.parse(fs.readFileSync('src/boosters.json', 'utf8')));

describe('edge cases', () => {
  it('toCSV escapes formulas', () => {
    const csv = L.toCSV([{ serial: '=CMD', status: 'active' }], ['serial', 'status']);
    expect(csv).toContain("\"'=CMD\"");
  });
  it('linePath empty', () => expect(L.linePath([], x => x, y => y)).toBe(''));
  it('heavyBoosters sorted unique', () => {
    const h = L.heavyBoosters(FL);
    expect(h).toEqual([...h].sort());
    expect(new Set(h).size).toBe(h.length);
  });
  it('firsts sources are safeUrl-ok', () => {
    for (const r of L.firsts(FL, all)) expect(L.safeUrl(r.source)).toBe(r.source);
  });
  it('reuseCurve share decreases', () => {
    const c = L.reuseCurve(all);
    for (let i = 1; i < c.length; i++) expect(c[i].share).toBeLessThanOrEqual(c[i - 1].share);
  });
});
