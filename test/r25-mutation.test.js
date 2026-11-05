import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import * as L from '../src/ledger.js';
import * as C from '../src/charts.js';
const FL = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights;

describe('trend title uses min not median', () => {
  it('when min != median the title shows min', () => {
    const t = L.turnaroundByYear(FL).find(x => x.min !== x.median);
    expect(t).toBeTruthy();
    const svg = C.trendSVG(L.turnaroundByYear(FL), 2026).svg;
    expect(svg).toContain(`fastest ${t.min.toFixed(1)} d`);
    expect(svg).not.toContain(`fastest ${t.median.toFixed(1)} d`);
  });
});

describe('safeUrl', () => {
  it('allows LL2 https', () => expect(L.safeUrl('https://ll.thespacedevs.com/2.3.0/x')).toBe('https://ll.thespacedevs.com/2.3.0/x'));
  it('blocks javascript and http and other hosts', () => {
    expect(L.safeUrl('javascript:alert(1)')).toBe('#');
    expect(L.safeUrl('http://ll.thespacedevs.com/x')).toBe('#');
    expect(L.safeUrl('https://evil.example/x')).toBe('#');
    expect(L.safeUrl('')).toBe('#');
    expect(L.safeUrl(null)).toBe('#');
  });
});
