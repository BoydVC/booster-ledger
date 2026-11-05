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
  if (!SORTS[key]) throw new Error(`unknown sort ${key}`);
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
