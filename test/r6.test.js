import { it, expect, describe } from 'vitest'; import fs from 'node:fs'; import * as L from '../src/ledger.js';
const FL = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights;
describe('countBy', () => {
  it('pads sum to all flights', () => expect(L.countBy(FL, 'pad').reduce((s, x) => s + x.count, 0)).toBe(FL.length));
  it('missing key -> Unknown', () => expect(L.countBy([{}], 'pad')).toEqual([{ name: 'Unknown', count: 1 }]));
  it('sorted desc', () => { const c = L.countBy(FL, 'rocket'); expect(c[0].count).toBeGreaterThanOrEqual(c.at(-1).count); });
});
describe('heavyBoosters', () => {
  it('only boosters that flew a Falcon Heavy', () => L.heavyBoosters(FL).forEach(s => expect(FL.some(f => f.serial === s && f.rocket === 'Falcon Heavy')).toBe(true)));
  it('unique & sorted', () => { const h = L.heavyBoosters(FL); expect(h).toEqual([...new Set(h)].sort()); });
});
describe('toCSV', () => {
  it('header + rows', () => expect(L.toCSV([{ a: 1, b: 'x' }], ['a', 'b'])).toBe('a,b\n1,x\n'));
  it('quotes commas and quotes', () => expect(L.toCSV([{ a: 'x,"y"' }], ['a'])).toBe('a\n"x,""y"""\n'));
  it('neutralizes formula injection', () => expect(L.toCSV([{ a: '=HYPERLINK("x")' }], ['a'])).toBe('a\n"\'=HYPERLINK(""x"")"\n'));
  it('null -> empty', () => expect(L.toCSV([{ a: null }], ['a'])).toBe('a\n\n'));
});
