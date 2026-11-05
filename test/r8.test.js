import { it, expect } from 'vitest'; import fs from 'node:fs'; import * as L from '../src/ledger.js';
const FL = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights, B = L.load(JSON.parse(fs.readFileSync('src/boosters.json', 'utf8')));
it('asOf Infinity is identity', () => expect(L.asOf(B, FL, Infinity)).toBe(B));
it('asOf counts only earlier flights', () => { const t = Date.UTC(2020, 0); const r = L.asOf(B, FL, t); expect(r.reduce((s, b) => s + b.flights, 0)).toBe(FL.filter(f => Date.parse(f.net) < t).length); });
it('asOf drops boosters not yet flown', () => expect(L.asOf(B, FL, Date.UTC(2010, 0))).toEqual([]));
it('asOf landings <= flights', () => L.asOf(B, FL, Date.UTC(2023, 0)).forEach(b => expect(b.landings_ok).toBeLessThanOrEqual(b.flights)));
it('asOf does not mutate', () => { const before = JSON.stringify(B); L.asOf(B, FL, Date.UTC(2022, 0)); expect(JSON.stringify(B)).toBe(before); });
