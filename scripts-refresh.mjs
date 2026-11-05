// Refresh snapshot from the public Launch Library 2 API (rate-limited: ~15 req/hr anonymous).
import fs from 'node:fs';
const out = [];
for (let off = 0; off < 400; off += 100) {
  const j = await (await fetch(`https://ll.thespacedevs.com/2.3.0/launchers/?limit=100&offset=${off}&mode=normal`)).json();
  for (const r of j.results) if (r.serial_number?.startsWith('B10')) out.push({ serial: r.serial_number, flights: r.flights, landings_ok: r.successful_landings, landings_attempted: r.attempted_landings, first: r.first_launch_date, last: r.last_launch_date, status: r.status.name, fastest_turnaround: r.fastest_turnaround, details: (r.details || '').slice(0, 300), source: r.url });
  if (!j.next) break;
}
fs.writeFileSync('src/boosters.json', JSON.stringify({ source: 'The Space Devs Launch Library 2 API v2.3.0 (https://ll.thespacedevs.com/2.3.0/launchers/)', fetched_at: new Date().toISOString(), boosters: out }, null, 1));
console.log(out.length, 'boosters');
