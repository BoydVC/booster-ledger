// Pure functions over the Launch Library 2 booster snapshot. No I/O.
export function parseDuration(iso) {
  if (!iso) return null;
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(iso);
  if (!m) return null;
  const [d, h, mi, s] = m.slice(1).map(x => Number(x || 0));
  return d + h / 24 + mi / 1440 + s / 86400;
}
export function normalize(b) {
  return {
    ...b,
    flights: b.flights ?? 0,
    landings_ok: b.landings_ok ?? 0,
    turnaroundDays: parseDuration(b.fastest_turnaround),
    firstMs: b.first ? Date.parse(b.first) : null,
    lastMs: b.last ? Date.parse(b.last) : null,
  };
}
export function load(snapshot) {
  return snapshot.boosters.map(normalize).filter(b => b.flights > 0);
}
export function leaderboard(bs, n = 10) {
  return [...bs].sort((a, b) => b.flights - a.flights || a.serial.localeCompare(b.serial)).slice(0, n);
}
export function fastestTurnarounds(bs, n = 10) {
  return bs.filter(b => b.turnaroundDays != null && b.flights > 1)
    .sort((a, b) => a.turnaroundDays - b.turnaroundDays).slice(0, n);
}
export function statusCounts(bs) {
  const c = {};
  for (const b of bs) c[b.status] = (c[b.status] || 0) + 1;
  return c;
}
export function fleetStats(bs) {
  const flights = bs.reduce((s, b) => s + b.flights, 0);
  const landings = bs.reduce((s, b) => s + b.landings_ok, 0);
  const reflown = bs.filter(b => b.flights > 1).length;
  return { boosters: bs.length, flights, landings, reflown,
    active: bs.filter(b => b.status === 'active').length,
    maxFlights: Math.max(0, ...bs.map(b => b.flights)) };
}
// Booster "alive" at year end: first flight on/before t and (active or last flight after t)
export function activeAt(bs, t) {
  return bs.filter(b => b.firstMs != null && b.firstMs <= t && (b.status === 'active' || (b.lastMs ?? 0) >= t));
}
export function flightsPerYear(b) {
  if (!b.firstMs || !b.lastMs || b.flights < 2) return null;
  const yrs = (b.lastMs - b.firstMs) / (365.25 * 864e5);
  return yrs > 0 ? b.flights / yrs : null;
}
export function filter(bs, { q = '', status = 'all' } = {}) {
  const s = q.trim().toUpperCase();
  return bs.filter(b => (status === 'all' || b.status === status) && (!s || b.serial.toUpperCase().includes(s)));
}
export function yearRange(bs) {
  const ys = bs.flatMap(b => [b.firstMs, b.lastMs]).filter(Boolean).map(t => new Date(t).getUTCFullYear());
  return [Math.min(...ys), Math.max(...ys)];
}
export const SORTS = {
  flights: (a, b) => b.flights - a.flights || a.serial.localeCompare(b.serial),
  first: (a, b) => a.firstMs - b.firstMs || a.serial.localeCompare(b.serial),
  newest: (a, b) => b.firstMs - a.firstMs || a.serial.localeCompare(b.serial),
};
export function sortBy(bs, key = 'flights') {
  if (!Object.hasOwn(SORTS, key)) throw new Error(`unknown sort ${key}`);
  return [...bs].sort(SORTS[key]);
}
export function rankOf(bs, serial) {
  const i = leaderboard(bs, bs.length).findIndex(b => b.serial === serial);
  return i < 0 ? null : i + 1;
}
export function landingRate(b) {
  return b.landings_attempted ? b.landings_ok / b.landings_attempted : null;
}
export function fateBreakdown(bs) {
  const c = statusCounts(bs), n = bs.length || 1;
  return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([status, count]) => ({ status, count, share: count / n }));
}
export function serialFromHash(hash) {
  const m = /^#(B10\d\d)$/i.exec(hash || '');
  return m ? m[1].toUpperCase() : null;
}

// ---- per-flight data (src/flights.json) ----
const DAY = 864e5;
export function flightsFor(flights, serial) {
  return flights.filter(f => f.serial === serial).sort((a, b) => a.net.localeCompare(b.net));
}
export function gaps(flights) {
  // turnaround gaps (days) between consecutive flights of the same booster
  const by = {};
  for (const f of flights) (by[f.serial] ||= []).push(f);
  const out = [];
  for (const [serial, fs] of Object.entries(by)) {
    fs.sort((a, b) => a.net.localeCompare(b.net));
    for (let i = 1; i < fs.length; i++) out.push({ serial, days: (Date.parse(fs[i].net) - Date.parse(fs[i - 1].net)) / DAY, net: fs[i].net, mission: fs[i].mission, source: fs[i].source });
  }
  return out;
}
export function median(xs) {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b), m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
export function turnaroundByYear(flights) {
  const by = {};
  for (const g of gaps(flights)) (by[g.net.slice(0, 4)] ||= []).push(g.days);
  return Object.keys(by).sort().map(y => ({ year: +y, reflights: by[y].length, median: median(by[y]), min: Math.min(...by[y]) }));
}
export function landingBreakdown(flights) {
  const c = {};
  for (const f of flights) {
    const k = !f.landing_attempt ? 'Expended / no attempt' : (f.landing_loc || f.landing_type || 'Unknown');
    const e = (c[k] ||= { where: k, name: f.landing_loc_name || k, type: f.landing_attempt ? f.landing_type : 'EXP', attempts: 0, success: 0 });
    e.attempts++; if (f.landing_success) e.success++;
  }
  return Object.values(c).sort((a, b) => b.attempts - a.attempts || a.where.localeCompare(b.where));
}
export function records(boosters, flights) {
  const firstRe = flights.filter(f => f.n === 2).sort((a, b) => a.net.localeCompare(b.net))[0] || null;
  const g = gaps(flights).sort((a, b) => a.days - b.days)[0] || null;
  const most = leaderboard(boosters, 1)[0] || null;
  const landed = flights.filter(f => f.landing_success).length;
  const ds = landingBreakdown(flights).filter(x => x.type === 'ASDS')[0] || null;
  return { firstReflight: firstRe, fastestTurnaround: g, mostFlights: most, totalLandings: landed, busiestDroneship: ds };
}
export function compare(boosters, flights, a, b) {
  return [a, b].map(s => {
    const bo = boosters.find(x => x.serial === s); if (!bo) return null;
    const fs = flightsFor(flights, s), gs = gaps(fs).map(x => x.days);
    return { serial: s, status: bo.status, flights: fs.length, landings: fs.filter(f => f.landing_success).length,
      first: fs[0]?.net || null, last: fs.at(-1)?.net || null, medianGap: median(gs), fastestGap: gs.length ? Math.min(...gs) : null,
      topSpot: landingBreakdown(fs)[0]?.where || null };
  });
}

export const LANDING_TYPES = ['ASDS', 'RTLS', 'EXP', 'Ocean'];
export function landingType(f) { return !f.landing_attempt ? 'EXP' : (LANDING_TYPES.includes(f.landing_type) ? f.landing_type : 'Other'); }
export function flightsByYear(flights) {
  const by = {};
  for (const f of flights) { const y = +f.net.slice(0, 4), e = (by[y] ||= { year: y, total: 0, landed: 0, ASDS: 0, RTLS: 0, EXP: 0, Ocean: 0, Other: 0 }); e.total++; e[landingType(f)]++; if (f.landing_success) e.landed++; }
  return Object.values(by).sort((a, b) => a.year - b.year);
}
export function spotsFleet(flights) {
  return landingBreakdown(flights.filter(f => f.landing_attempt));
}
// Shareable view state in the query string. Unknown/invalid values fall back to defaults.
export function parseState(search, serials = []) {
  const p = new URLSearchParams(search || ''), ok = s => (s && serials.includes(s.toUpperCase())) ? s.toUpperCase() : null;
  const sort = p.get('sort'), status = p.get('status');
  return { q: (p.get('q') || '').slice(0, 12), status: status && /^[a-z]+$/.test(status) ? status : 'all', sort: sort && Object.hasOwn(SORTS, sort) ? sort : 'flights', a: ok(p.get('a')), b: ok(p.get('b')), fh: p.get('fh') === '1' };
}
export function serializeState(s) {
  const p = new URLSearchParams();
  if (s.q) p.set('q', s.q); if (s.status && s.status !== 'all') p.set('status', s.status); if (s.sort && s.sort !== 'flights') p.set('sort', s.sort);
  if (s.fh) p.set('fh', '1'); if (s.a) p.set('a', s.a); if (s.b) p.set('b', s.b);
  const q = p.toString(); return q ? '?' + q : '';
}

export function launchFailures(flights) { return flights.filter(f => f.launch_status && f.launch_status !== 'Success'); }
export function cumulative(flights, serial) {
  return flightsFor(flights, serial).map((f, i) => ({ t: Date.parse(f.net), n: i + 1 }));
}
export function linePath(points, xf, yf) {
  return points.map((p, i) => `${i ? 'L' : 'M'}${xf(p).toFixed(1)},${yf(p).toFixed(1)}`).join('');
}
export function countBy(flights, key) {
  const c = {}; for (const f of flights) { const k = f[key] || 'Unknown'; c[k] = (c[k] || 0) + 1; }
  return Object.entries(c).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name, count]) => ({ name, count }));
}
export function heavyBoosters(flights) { return [...new Set(flights.filter(f => f.rocket === 'Falcon Heavy').map(f => f.serial))].sort(); }
export function toCSV(rows, cols) {
  const q = v => { const s = v == null ? '' : String(v); return /[",\n\r]/.test(s) || /^[=+\-@]/.test(s) ? '"' + (/^[=+\-@]/.test(s) ? "'" : '') + s.replace(/"/g, '""') + '"' : s; };
  return [cols.join(','), ...rows.map(r => cols.map(c => q(r[c])).join(','))].join('\n') + '\n';
}
