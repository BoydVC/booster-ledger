// Mutation check: each mutant must make its suite fail (unit = vitest, e2e = Playwright). Restores every file afterward.
import fs from 'node:fs'; import { spawnSync } from 'node:child_process';
const SUITES = { unit: ['vitest', 'run', '--reporter=dot'], e2e: ['playwright', 'test', '--reporter=dot'] };
const M = [
  ['src/ledger.js', 'unit', 'gaps off-by-one', 'for (let i = 1; i < fs.length; i++) out.push', 'for (let i = 2; i < fs.length; i++) out.push'],
  ['src/ledger.js', 'unit', 'median even', '(s[m - 1] + s[m]) / 2', 's[m]'],
  ['src/ledger.js', 'unit', 'leaderboard order', 'b.flights - a.flights || a.serial', 'a.flights - b.flights || a.serial'],
  ['src/ledger.js', 'unit', 'landing success count', 'e.attempts++; if (f.landing_success) e.success++;', 'e.attempts++; e.success++;'],
  ['src/ledger.js', 'unit', 'asOf boundary', 'if (Date.parse(f.net) < t)', 'if (Date.parse(f.net) <= t + 864e5 * 400)'],
  ['src/ledger.js', 'unit', 'first reflight n', 'flights.filter(f => f.n === 2)', 'flights.filter(f => f.n === 3)'],
  ['src/ledger.js', 'unit', 'parseDuration hours', 'd + h / 24', 'd + h / 12'],
  ['src/ledger.js', 'unit', 'serial hash', '/^#(B10\\d\\d)$/i', '/^#(B\\d+)$/i'],
  ['src/ledger.js', 'unit', 'fleet reflown', 'bs.filter(b => b.flights > 1).length', 'bs.filter(b => b.flights >= 1).length'],
  ['src/ledger.js', 'unit', 'record progression earliest', 'f.net < best[f.n].net', 'f.net > best[f.n].net'],
  ['src/charts.js', 'unit', 'years total label', 'class="tot" data-y="${p.year}">${p.total}<', 'class="tot" data-y="${p.year}">${p.landed}<'],
  ['src/charts.js', 'unit', 'trend title fastest', 'fastest ${p.min.toFixed(1)} d', 'fastest ${p.median.toFixed(1)} d'],
  ['src/charts.js', 'unit', 'cmp escaping', '${esc(sa)} · ${A.length}', '${sa} · ${A.length}'],
  ['src/app.js', 'e2e', 'stat landings from wrong field', "['Landings', s.landings]", "['Landings', s.flights]"],
  ['src/app.js', 'e2e', 'drawer landing mark', "(f.landing_success ? ' ✓' : ' ✗')", "(f.landing_attempt ? ' ✓' : ' ✗')"],
  ['src/app.js', 'e2e', 'fastest list ignores cutoff', "keep.has(f.serial) && Date.parse(f.net) < cutoff", "keep.has(f.serial)"],
  ['src/ledger.js', 'unit', 'unsafe link', "return /^https:\\/\\/ll\\.thespacedevs\\.com\\//.test(u || '') ? u : '#';", 'return u;'],
  ['server.js', 'e2e', 'traversal guard', "if (!p.startsWith(root + path.sep))", "if (false)"],
];
let killed = 0, cur = null;
try {
  for (const [F, suite, name, a, b] of M) {
    const orig = fs.readFileSync(F, 'utf8'); cur = [F, orig];
    if (!orig.includes(a)) { console.log('SKIP (pattern missing):', name); continue; }
    fs.writeFileSync(F, orig.replace(a, b));
    const env = { ...process.env, MUTATION: F === 'server.js' ? '1' : '' };
    // Only stop a server we own on PORT (default 4477). Never fuser-kill arbitrary listeners.
    if (F === 'server.js') {
      const port = env.PORT || process.env.PORT || '4477';
      // Prefer exact PID file written by this burn; otherwise leave existing servers alone and let
      // Playwright's webServer (reuseExistingServer=false under MUTATION) bind a free attempt.
      const pidFile = '.burn/server-' + port + '.pid';
      if (fs.existsSync(pidFile)) {
        const pid = fs.readFileSync(pidFile, 'utf8').trim();
        try { process.kill(Number(pid), 'SIGTERM'); } catch {}
        try { fs.unlinkSync(pidFile); } catch {}
        spawnSync('bash', ['-c', `sleep 0.3`], { encoding: 'utf8' });
      }
    }
    const r = spawnSync('npx', SUITES[suite], { encoding: 'utf8', env });
    fs.writeFileSync(F, orig); cur = null;
    const dead = r.status !== 0; killed += dead; console.log(dead ? 'killed  ' : 'SURVIVED', name);
  }
} finally { if (cur) fs.writeFileSync(cur[0], cur[1]); }
console.log(`${killed}/${M.length} mutants killed`); process.exit(killed === M.length ? 0 : 1);
