// Derive src/flights.json from raw Launch Library 2 /launches/previous pages (raw/*.json, not committed).
// Fetch raw with: curl 'https://ll.thespacedevs.com/2.3.0/launches/previous/?limit=100&offset=N&mode=detailed&lsp__name=SpaceX&ordering=net'
import fs from 'node:fs';
const rows = [];
for (const f of fs.readdirSync('raw').filter(f => f.endsWith('.json'))) {
  for (const L of JSON.parse(fs.readFileSync('raw/' + f, 'utf8')).results) {
    for (const s of L.rocket?.launcher_stage || []) {
      const sn = s.launcher?.serial_number; if (!sn?.startsWith('B10')) continue;
      const ld = s.landing || {};
      rows.push({ serial: sn, n: s.launcher_flight_number, mission: L.mission?.name || L.name, net: L.net, launch_status: L.status?.abbrev,
        rocket: L.rocket?.configuration?.name, pad: L.pad?.name, landing_attempt: ld.attempt ?? null, landing_success: ld.success ?? null,
        landing_loc: ld.landing_location?.abbrev || null, landing_loc_name: ld.landing_location?.name || null, landing_type: ld.type?.abbrev || null,
        source: L.url });
    }
  }
}
rows.sort((a, b) => a.net.localeCompare(b.net) || a.serial.localeCompare(b.serial));
fs.writeFileSync('src/flights.json', JSON.stringify({ source: 'The Space Devs Launch Library 2 API v2.3.0 (https://ll.thespacedevs.com/2.3.0/launches/previous/)', fetched_at: new Date().toISOString(), flights: rows }));
console.log(rows.length, 'booster flights');
