// Refresh both snapshots from the public Launch Library 2 API.
// Anonymous limit is ~15 requests/hour; this uses ~10 and backs off on HTTP 429. Raw launch pages go to raw/ (not committed).
import fs from 'node:fs'; import { execFileSync } from 'node:child_process'; import { validate } from './validate.mjs';
const API = 'https://ll.thespacedevs.com/2.3.0';
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function get(url) {
  for (let i = 0; i < 4; i++) {
    const r = await fetch(url);
    if (r.status === 429) { const w = Number(r.headers.get('retry-after') || 60); console.warn(`429, waiting ${w}s`); await sleep(w * 1000); continue; }
    if (!r.ok) throw new Error(`${r.status} ${url}`);
    return r.json();
  }
  throw new Error('rate-limited: ' + url);
}
export function boosterRow(r) {
  return { serial: r.serial_number, flights: r.flights, landings_ok: r.successful_landings, landings_attempted: r.attempted_landings, first: r.first_launch_date, last: r.last_launch_date, status: r.status?.name, fastest_turnaround: r.fastest_turnaround, details: (r.details || '').slice(0, 300), source: r.url };
}
if (process.argv[1].endsWith('scripts-refresh.mjs')) {
  const out = [];
  for (let url = `${API}/launchers/?limit=100&mode=normal`; url; ) { const j = await get(url); for (const r of j.results) if (r.serial_number?.startsWith('B10')) out.push(boosterRow(r)); url = j.next; await sleep(1500); }
  fs.mkdirSync('raw', { recursive: true });
  let n = 0;
  for (let url = `${API}/launches/previous/?limit=100&mode=detailed&lsp__name=SpaceX&ordering=net`; url; n++) { const j = await get(url); fs.writeFileSync(`raw/l${n * 100}.json`, JSON.stringify(j)); url = j.next; await sleep(1500); }
  const prevB = fs.readFileSync('src/boosters.json'), prevF = fs.readFileSync('src/flights.json');
  fs.writeFileSync('src/boosters.json', JSON.stringify({ source: `The Space Devs Launch Library 2 API v2.3.0 (${API}/launchers/)`, fetched_at: new Date().toISOString(), boosters: out }, null, 1));
  execFileSync('node', ['scripts-flights.mjs'], { stdio: 'inherit' });
  const errs = validate(out.filter(b => (b.flights || 0) > 0), JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights);
  if (errs.length) { fs.writeFileSync('src/boosters.json', prevB); fs.writeFileSync('src/flights.json', prevF); console.error('Refresh rejected; snapshots restored:\n' + errs.slice(0, 20).join('\n')); process.exit(1); }
  console.log(out.length, 'boosters; run `npm test` to confirm both snapshots agree');
}
