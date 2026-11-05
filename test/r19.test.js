import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import * as L from '../src/ledger.js';
import * as C from '../src/charts.js';

const FL = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights;

describe('landingSuccessByYear', () => {
  const s = L.landingSuccessByYear(FL);
  it('only years with attempts', () => {
    expect(s.every(x => x.attempts > 0)).toBe(true);
  });
  it('rate == success/attempts', () => {
    for (const x of s) expect(x.rate).toBeCloseTo(x.success / x.attempts);
  });
  it('totals match raw landing attempts', () => {
    const attempts = FL.filter(f => f.landing_attempt).length;
    const success = FL.filter(f => f.landing_success).length;
    expect(s.reduce((a, x) => a + x.attempts, 0)).toBe(attempts);
    expect(s.reduce((a, x) => a + x.success, 0)).toBe(success);
  });
  it('sorted by year', () => {
    for (let i = 1; i < s.length; i++) expect(s[i].year).toBeGreaterThan(s[i - 1].year);
  });
});

describe('rateSVG', () => {
  it('no NaN, years present', () => {
    const s = L.landingSuccessByYear(FL);
    const r = C.rateSVG(s, 2026, { w: 640 });
    expect(r.svg).not.toMatch(/NaN/);
    expect(r.svg).toContain(String(s[0].year));
  });
});
