import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import * as L from '../src/ledger.js';
const FL = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights;
const all = L.load(JSON.parse(fs.readFileSync('src/boosters.json', 'utf8')));

describe('firsts', () => {
  const rows = L.firsts(FL, all);
  it('sorted by date', () => {
    for (let i = 1; i < rows.length; i++) expect(rows[i].net >= rows[i - 1].net).toBe(true);
  });
  it('includes first ASDS and first reflight', () => {
    expect(rows.some(r => r.label === 'First ASDS landing')).toBe(true);
    expect(rows.some(r => r.label === 'First reflight')).toBe(true);
  });
  it('every row has LL2 source', () => {
    for (const r of rows) expect(r.source).toMatch(/^https:\/\/ll\.thespacedevs\.com\//);
  });
});
