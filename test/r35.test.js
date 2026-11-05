import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import * as L from '../src/ledger.js';
import * as C from '../src/charts.js';
const FL = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights;
describe('cumulativeFleetFlights', () => {
  const p = L.cumulativeFleetFlights(FL);
  it('ends at total flights', () => expect(p.at(-1).n).toBe(FL.length));
  it('is nondecreasing', () => { for (let i=1;i<p.length;i++) expect(p[i].n).toBeGreaterThanOrEqual(p[i-1].n); });
  it('svg has no NaN', () => expect(C.cumFleetSVG(p,{w:640}).svg).not.toMatch(/NaN/));
});
