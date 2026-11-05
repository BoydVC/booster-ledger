// When raw LL2 pages are present on the machine (not committed), re-derive flights.json and require an exact match.
import { it, expect } from 'vitest'; import fs from 'node:fs'; import { execFileSync } from 'node:child_process';
const has = fs.existsSync('raw') && fs.readdirSync('raw').some(f => f.endsWith('.json'));
it.skipIf(!has)('flights.json is exactly derivable from raw API pages', () => {
  const before = JSON.parse(fs.readFileSync('src/flights.json', 'utf8'));
  const tmp = fs.mkdtempSync('/tmp/blv-'); fs.cpSync('src/flights.json', tmp + '/f.json');
  try { execFileSync('node', ['scripts-flights.mjs']); const after = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')); expect(after.flights).toEqual(before.flights); }
  finally { fs.writeFileSync('src/flights.json', fs.readFileSync(tmp + '/f.json')); }
});
