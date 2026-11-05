import { it, expect } from 'vitest'; import fs from 'node:fs'; import * as L from '../src/ledger.js';
const FL = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights;
const P = L.recordProgression(FL);
it('one entry per flight count 1..max', () => expect(P.map(f => f.n)).toEqual(P.map((_, i) => i + 1)));
it('max equals record', () => expect(P.at(-1).n).toBe(Math.max(...FL.map(f => f.n))));
it('dates non-decreasing', () => P.forEach((f, i) => i && expect(f.net >= P[i - 1].net).toBe(true)));
it('each is the earliest flight with that n', () => P.forEach(p => FL.filter(f => f.n === p.n).forEach(f => expect(f.net >= p.net).toBe(true))));
it('empty', () => expect(L.recordProgression([])).toEqual([]));
