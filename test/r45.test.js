import { it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { load, sortBy } from '../src/ledger.js';
const all = load(JSON.parse(readFileSync('src/boosters.json', 'utf8')));
it('sort by landings puts highest landings_ok first', () => {
  const rows = sortBy(all, 'landings');
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1], b = rows[i];
    expect(a.landings_ok).toBeGreaterThanOrEqual(b.landings_ok);
  }
});
