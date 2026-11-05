import { it, expect } from 'vitest'; import fs from 'node:fs'; import path from 'node:path';
const NAMES = /\b(Charlotte|Victor|Miranda|Boyd|Spalding|Char|Vic)\b/i;
const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => ['node_modules','.git','test-results','screenshots','raw'].includes(e.name) ? [] : e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
it('no family names in text files', () => {
  for (const f of walk('.').filter(f => /\.(js|mjs|json|html|css|md)$/.test(f) && !f.endsWith('package-lock.json') && !f.includes('privacy.test')))
    expect(fs.readFileSync(f, 'utf8'), f).not.toMatch(NAMES);
});
it('server only reads src/', () => { const s = fs.readFileSync('server.js', 'utf8'); expect(s).toMatch(/path\.resolve\('src'\)/); expect(s).not.toMatch(/home|workspace|readdir/); });
