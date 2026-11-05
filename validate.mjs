// Consistency checks between the two snapshots. Used by the refresh script (refuses to write bad data) and by tests.
import { parseDuration } from './src/ledger.js';
export function validate(boosters, flights) {
  const errs = [], by = {};
  if (!Array.isArray(boosters) || !boosters.length) errs.push('no boosters');
  if (!Array.isArray(flights) || !flights.length) errs.push('no flights');
  if (errs.length) return errs;
  for (const f of flights) (by[f.serial] ||= []).push(f);
  for (const b of boosters) {
    const fs = (by[b.serial] || []).sort((x, y) => x.net.localeCompare(y.net)), n = b.flights || 0;
    if (fs.length !== n) errs.push(`${b.serial}: ${n} flights in booster record, ${fs.length} in launches`);
    const ok = fs.filter(f => f.landing_success).length;
    if ((b.landings_ok || 0) !== ok) errs.push(`${b.serial}: ${b.landings_ok} landings in record, ${ok} in launches`);
    if (fs.length > 1 && b.fastest_turnaround) {
      const g = Math.min(...fs.slice(1).map((f, i) => (Date.parse(f.net) - Date.parse(fs[i].net)) / 864e5));
      if (Math.abs(g - parseDuration(b.fastest_turnaround)) > 0.01) errs.push(`${b.serial}: fastest turnaround ${b.fastest_turnaround} vs computed ${g.toFixed(2)} d`);
    }
    if (!/^https:\/\/ll\.thespacedevs\.com\//.test(b.source || '')) errs.push(`${b.serial}: bad source`);
  }
  for (const s of Object.keys(by)) if (!boosters.some(b => b.serial === s)) errs.push(`${s}: flights but no booster record`);
  return errs;
}
