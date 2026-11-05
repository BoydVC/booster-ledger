import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { load, activeAt, fleetStats } from '../src/ledger.js';
const all = load(JSON.parse(readFileSync('src/boosters.json', 'utf8')));
it('activeAt(Infinity) equals status===active count', () => {
  expect(activeAt(all, Infinity).length).toBe(all.filter(b => b.status === 'active').length);
  expect(activeAt(all, Infinity).length).toBe(fleetStats(all).active);
});
it('activeAt before first flight is 0', () => {
  const t = Math.min(...all.map(b => b.firstMs)) - 1;
  expect(activeAt(all, t).length).toBe(0);
});
