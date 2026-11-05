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
  const lt = p.get('lt'), year = p.get('y'); return { q: (p.get('q') || '').slice(0, 40), status: status && /^[a-z]+$/.test(status) ? status : 'all', sort: sort && Object.hasOwn(SORTS, sort) ? sort : 'flights', a: ok(p.get('a')), b: ok(p.get('b')), fh: p.get('fh') === '1', lt: LANDING_TYPES.includes(lt) || lt === 'Other' ? lt : 'all', y: year && /^\d{4}$/.test(year) ? +year : null };
}
export function serializeState(s) {
  const p = new URLSearchParams();
  if (s.q) p.set('q', s.q); if (s.status && s.status !== 'all') p.set('status', s.status); if (s.sort && s.sort !== 'flights') p.set('sort', s.sort);
  if (s.fh) p.set('fh', '1'); if (s.lt && s.lt !== 'all') p.set('lt', s.lt); if (s.y) p.set('y', String(s.y)); if (s.a) p.set('a', s.a); if (s.b) p.set('b', s.b);
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
// Counts as of time t, from per-flight data (status is NOT back-dated; callers show final status).
export function asOf(boosters, flights, t) {
  if (!isFinite(t)) return boosters;
  const n = {}, l = {};
  for (const f of flights) if (Date.parse(f.net) < t) { n[f.serial] = (n[f.serial] || 0) + 1; if (f.landing_success) l[f.serial] = (l[f.serial] || 0) + 1; }
  return boosters.filter(b => n[b.serial]).map(b => ({ ...b, flights: n[b.serial], landings_ok: l[b.serial] || 0 }));
}
// The first booster to reach each flight count n (record progression).
export function recordProgression(flights) {
  const best = {};
  for (const f of flights) if (f.n && (!best[f.n] || f.net < best[f.n].net)) best[f.n] = f;
  return Object.values(best).sort((a, b) => a.n - b.n);
}

// ---- Round 18+: block version, fleet series, mission search, timeline ----
// Block version: prefer LL2 details text; else public Falcon 9 serial ranges
// (Block 5 begins at B1046 — first Block 5 flight, Bangabandhu-1, May 2018).
export function blockOf(details, serial) {
  if (/Falcon Heavy core/i.test(details || '')) return 'FH core';
  const m = /Block\s+(\d+)/i.exec(details || '');
  if (m) return 'Block ' + m[1];
  const n = /^B(\d+)$/.exec(serial || '');
  if (!n) return 'Unknown';
  const num = +n[1];
  if (num >= 1046) return 'Block 5';
  if (num >= 1021) return 'Full Thrust'; // includes Block 3/4 Full Thrust era
  if (num >= 1001) return 'v1.0/v1.1';
  return 'Unknown';
}
export function blockCounts(boosters) {
  const c = {};
  for (const b of boosters) { const k = blockOf(b.details, b.serial); c[k] = (c[k] || 0) + 1; }
  return Object.entries(c).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([block, count]) => ({ block, count }));
}
// For each year-end (UTC Jan 1 of next year), how many boosters had flown by then and had not yet flown their last (or are still active).
export function fleetSizeByYear(boosters, flights, y0, y1) {
  const first = {}, last = {};
  for (const f of flights) {
    const t = Date.parse(f.net);
    if (first[f.serial] == null || t < first[f.serial]) first[f.serial] = t;
    if (last[f.serial] == null || t > last[f.serial]) last[f.serial] = t;
  }
  const status = Object.fromEntries(boosters.map(b => [b.serial, b.status]));
  const out = [];
  for (let y = y0; y <= y1; y++) {
    const t = Date.UTC(y + 1, 0);
    let flying = 0, debuted = 0, retired = 0;
    for (const s of Object.keys(first)) {
      if (first[s] >= t) continue;
      debuted++;
      const still = status[s] === 'active' || (last[s] ?? 0) >= t;
      if (still) flying++; else retired++;
    }
    out.push({ year: y, flying, debuted, retired });
  }
  return out;
}
export function missionsMatching(flights, q) {
  const s = (q || '').trim().toUpperCase();
  if (!s) return new Set();
  return new Set(flights.filter(f => (f.mission || '').toUpperCase().includes(s) || (f.serial || '').toUpperCase().includes(s)).map(f => f.serial));
}
export function filterWithMissions(bs, flights, { q = '', status = 'all' } = {}) {
  const s = q.trim().toUpperCase();
  if (!s) return filter(bs, { q: '', status });
  const hit = missionsMatching(flights, q);
  return bs.filter(b => (status === 'all' || b.status === status) && (b.serial.toUpperCase().includes(s) || hit.has(b.serial)));
}
export function landingSuccessByYear(flights) {
  const by = {};
  for (const f of flights) {
    if (!f.landing_attempt) continue;
    const y = +f.net.slice(0, 4);
    const e = (by[y] ||= { year: y, attempts: 0, success: 0 });
    e.attempts++; if (f.landing_success) e.success++;
  }
  return Object.values(by).sort((a, b) => a.year - b.year).map(e => ({ ...e, rate: e.attempts ? e.success / e.attempts : null }));
}
export function flightsByMonth(flights) {
  const by = {};
  for (const f of flights) {
    const key = f.net.slice(0, 7); // YYYY-MM
    by[key] = (by[key] || 0) + 1;
  }
  const keys = Object.keys(by).sort();
  if (!keys.length) return { keys: [], years: [], cells: [] };
  const y0 = +keys[0].slice(0, 4), y1 = +keys.at(-1).slice(0, 4);
  const years = [];
  for (let y = y0; y <= y1; y++) years.push(y);
  const cells = years.map(y => Array.from({ length: 12 }, (_, m) => by[`${y}-${String(m + 1).padStart(2, '0')}`] || 0));
  return { years, cells, max: Math.max(0, ...cells.flat()) };
}
export function turnaroundHistogram(flights, bin = 10, cap = 200) {
  const gs = gaps(flights).map(g => g.days);
  if (!gs.length) return [];
  const n = Math.ceil(cap / bin);
  const buckets = Array.from({ length: n }, (_, i) => ({ lo: i * bin, hi: (i + 1) * bin, count: 0 }));
  const overflow = { lo: cap, hi: Infinity, count: 0 };
  for (const d of gs) {
    if (d >= cap) overflow.count++;
    else buckets[Math.min(n - 1, Math.floor(d / bin))].count++;
  }
  if (overflow.count) buckets.push(overflow);
  return buckets;
}

export function serialsWithLandingType(flights, lt) {
  if (!lt || lt === 'all') return null;
  return new Set(flights.filter(f => landingType(f) === lt).map(f => f.serial));
}
// Share of boosters that reached at least N flights (reuse curve).
export function reuseCurve(boosters) {
  const max = Math.max(0, ...boosters.map(b => b.flights));
  const out = [];
  for (let n = 1; n <= max; n++) {
    const reached = boosters.filter(b => b.flights >= n).length;
    out.push({ n, reached, share: boosters.length ? reached / boosters.length : 0 });
  }
  return out;
}
export function heavyRole(flights, serial) {
  const fh = flights.filter(f => f.serial === serial && f.rocket === 'Falcon Heavy');
  if (!fh.length) return null;
  // LL2 does not always tag side vs core on the flight; use details/heuristic via caller.
  return { flights: fh.length, pads: [...new Set(fh.map(f => f.pad))] };
}
export function padCadence(flights) {
  const pads = [...new Set(flights.map(f => f.pad || 'Unknown'))].sort();
  const years = [...new Set(flights.map(f => +f.net.slice(0, 4)))].sort((a, b) => a - b);
  const grid = Object.fromEntries(pads.map(p => [p, Object.fromEntries(years.map(y => [y, 0]))]));
  for (const f of flights) grid[f.pad || 'Unknown'][+f.net.slice(0, 4)]++;
  return { pads, years, grid };
}
export function recoveredShareByYear(flights) {
  const by = {};
  for (const f of flights) {
    const y = +f.net.slice(0, 4);
    const e = (by[y] ||= { year: y, total: 0, recovered: 0 });
    e.total++;
    if (f.landing_success) e.recovered++;
  }
  return Object.values(by).sort((a, b) => a.year - b.year).map(e => ({ ...e, share: e.total ? e.recovered / e.total : 0 }));
}

export function safeUrl(u) {
  return /^https:\/\/ll\.thespacedevs\.com\//.test(u || '') ? u : '#';
}
export function firsts(flights, boosters) {
  const out = [];
  const push = (label, f) => { if (f) out.push({ label, serial: f.serial, net: f.net, mission: f.mission, source: f.source }); };
  const byNet = [...flights].sort((a, b) => a.net.localeCompare(b.net));
  push('First flight in snapshot', byNet[0]);
  push('First ASDS landing', byNet.find(f => f.landing_type === 'ASDS' && f.landing_success));
  push('First RTLS landing', byNet.find(f => f.landing_type === 'RTLS' && f.landing_success));
  push('First Falcon Heavy flight', byNet.find(f => f.rocket === 'Falcon Heavy'));
  push('First reflight', byNet.find(f => f.n === 2));
  const prog = recordProgression(flights);
  for (const n of [5, 10, 15, 20, 25, 30]) {
    const f = prog.find(p => p.n === n);
    if (f) push(`First ${n}-flight booster`, f);
  }
  return out.sort((a, b) => a.net.localeCompare(b.net));
}
export function cumulativeFleetFlights(flights) {
  const byDay = {};
  for (const f of flights) {
    const d = f.net.slice(0, 10);
    byDay[d] = (byDay[d] || 0) + 1;
  }
  const days = Object.keys(byDay).sort();
  let acc = 0;
  return days.map(d => { acc += byDay[d]; return { t: Date.parse(d + 'T00:00:00Z'), n: acc, day: d }; });
}
export function landingMatrix(flights) {
  const years = [...new Set(flights.map(f => +f.net.slice(0, 4)))].sort((a, b) => a - b);
  const types = ['ASDS', 'RTLS', 'Ocean', 'EXP'];
  const cells = {};
  for (const y of years) for (const t of types) cells[`${y}:${t}`] = { year: y, type: t, attempts: 0, success: 0 };
  for (const f of flights) {
    const y = +f.net.slice(0, 4);
    const t = landingType(f);
    if (!types.includes(t)) continue;
    const e = cells[`${y}:${t}`];
    if (!f.landing_attempt && t !== 'EXP') continue;
    if (t === 'EXP') { e.attempts++; continue; }
    if (!f.landing_attempt) continue;
    e.attempts++; if (f.landing_success) e.success++;
  }
  return { years, types, cells };
}
