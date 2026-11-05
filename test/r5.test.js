import { it, expect } from 'vitest'; import fs from 'node:fs'; import * as L from '../src/ledger.js';
const FL = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights;
it('cumulative counts 1..n in time order', () => { const c = L.cumulative(FL, 'B1067'); expect(c.map(p => p.n)).toEqual(c.map((_, i) => i + 1)); c.forEach((p, i) => i && expect(p.t).toBeGreaterThanOrEqual(c[i - 1].t)); });
it('cumulative unknown is empty', () => expect(L.cumulative(FL, 'B0')).toEqual([]));
it('linePath format', () => expect(L.linePath([{ a: 1 }, { a: 2 }], p => p.a, p => p.a * 2)).toBe('M1.0,2.0L2.0,4.0'));
it('linePath empty', () => expect(L.linePath([], x => x, x => x)).toBe(''));
