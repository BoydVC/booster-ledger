// Mutation check: each mutant of src/ledger.js must make `vitest run` fail. Restores the file afterward.
import fs from 'node:fs'; import { spawnSync } from 'node:child_process';
const F = 'src/ledger.js', orig = fs.readFileSync(F, 'utf8');
const M = [
  ['gaps off-by-one', 'for (let i = 1; i < fs.length; i++) out.push', 'for (let i = 2; i < fs.length; i++) out.push'],
  ['median even', '(s[m - 1] + s[m]) / 2', 's[m]'],
  ['leaderboard order', 'b.flights - a.flights || a.serial', 'a.flights - b.flights || a.serial'],
  ['landing success count', 'e.attempts++; if (f.landing_success) e.success++;', 'e.attempts++; e.success++;'],
  ['asOf boundary', 'if (Date.parse(f.net) < t)', 'if (Date.parse(f.net) <= t + 864e5 * 400)'],
  ['first reflight n', 'flights.filter(f => f.n === 2)', 'flights.filter(f => f.n === 3)'],
  ['parseDuration hours', 'd + h / 24', 'd + h / 12'],
  ['serial hash', '/^#(B10\\d\\d)$/i', '/^#(B\\d+)$/i'],
  ['fleet reflown', 'bs.filter(b => b.flights > 1).length', 'bs.filter(b => b.flights >= 1).length'],
  ['record progression earliest', 'f.net < best[f.n].net', 'f.net > best[f.n].net'],
];
let killed = 0;
try {
  for (const [name, a, b] of M) {
    if (!orig.includes(a)) { console.log('SKIP (pattern missing):', name); continue; }
    fs.writeFileSync(F, orig.replace(a, b));
    const r = spawnSync('npx', ['vitest', 'run', '--reporter=dot'], { encoding: 'utf8' });
    const dead = r.status !== 0; killed += dead; console.log(dead ? 'killed  ' : 'SURVIVED', name);
  }
} finally { fs.writeFileSync(F, orig); }
console.log(`${killed}/${M.length} mutants killed`); process.exit(killed === M.length ? 0 : 1);
