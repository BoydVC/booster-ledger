import { load, leaderboard, fastestTurnarounds, statusCounts, fleetStats, filter, yearRange, activeAt, flightsPerYear, sortBy, rankOf, landingRate, fateBreakdown, serialFromHash } from './ledger.js';
const snap = await (await fetch('boosters.json')).json();
const all = load(snap);
const $ = id => document.getElementById(id);
const COL = { active: '#4fb3ff', expended: '#ffc94f', destroyed: '#ff6b6b', lost: '#ff6b6b', retired: '#8a96a8' };
let cutoff = Infinity;
function stats(bs) {
  const s = fleetStats(bs);
  $('stats').innerHTML = [['Boosters', s.boosters], ['Flights', s.flights], ['Landings', s.landings], ['Reflown', s.reflown], ['Still active', s.active], ['Record', s.maxFlights + ' flights']]
    .map(([k, v]) => `<div class="stat"><b>${v}</b>${k}</div>`).join('');
}
function lanes(bs) {
  const [y0, y1] = yearRange(all), t0 = Date.UTC(y0, 0), t1 = Date.UTC(y1 + 1, 0);
  const rows = sortBy(bs, $('sort').value), W = 900, H = 14 * rows.length + 30;
  const x = t => 70 + (W - 80) * (t - t0) / (t1 - t0);
  let g = '';
  for (let y = y0; y <= y1 + 1; y++) g += `<line x1="${x(Date.UTC(y,0))}" y1="0" x2="${x(Date.UTC(y,0))}" y2="${H-18}" stroke="#1e2838"/><text x="${x(Date.UTC(y,0))+2}" y="${H-4}" fill="#8a96a8" font-size="11">${y}</text>`;
  rows.forEach((b, i) => {
    const end = Math.min(cutoff, b.status === 'active' ? Date.parse(snap.fetched_at) : b.lastMs);
    if (b.firstMs > cutoff) return;
    const y = 8 + i * 14, w = Math.max(3, x(end) - x(b.firstMs));
    g += `<g class="lane" data-s="${b.serial}"><text x="4" y="${y+9}">${b.serial}</text><rect x="${x(b.firstMs)}" y="${y}" width="${w}" height="10" rx="4" fill="${COL[b.status] || '#8a96a8'}" opacity="${.35 + .65 * b.flights / 40}"/><text x="${x(b.firstMs)+w+4}" y="${y+9}">${b.flights}</text></g>`;
  });
  const svg = $('lanes'); svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.innerHTML = g;
  svg.querySelectorAll('.lane').forEach(el => el.onclick = () => open(el.dataset.s));
}
function lists(bs) {
  $('top').innerHTML = leaderboard(bs).map(b => `<li data-s="${b.serial}">${b.serial} — ${b.flights} flights</li>`).join('');
  $('fast').innerHTML = fastestTurnarounds(bs).map(b => `<li data-s="${b.serial}">${b.serial} — ${b.turnaroundDays.toFixed(1)} days</li>`).join('');
  document.querySelectorAll('li[data-s]').forEach(el => el.onclick = () => open(el.dataset.s));
}
function open(s) {
  const b = all.find(x => x.serial === s); if (!b) return; const fpy = flightsPerYear(b), lr = landingRate(b); history.replaceState(null, '', '#' + s);
  $('detail').innerHTML = `<h2>${b.serial}</h2><p>Status: <b>${b.status}</b> · #${rankOf(all, b.serial)} of ${all.length} by flights${lr != null ? ` · ${Math.round(lr*100)}% landings` : ''}</p><p>${b.flights} flights · ${b.landings_ok}/${b.landings_attempted ?? '?'} landings</p>
  <p>First flight ${b.first?.slice(0,10)} · last ${b.last?.slice(0,10)}</p><p>Fastest turnaround: ${b.turnaroundDays?.toFixed(1) ?? '—'} days${fpy ? ` · ${fpy.toFixed(1)} flights/yr` : ''}</p>
  <p class="sub">${b.details || ''}</p><p><a href="${b.source}" target="_blank" rel="noopener">Source record</a></p>`;
  $('drawer').showModal();
}
function fate(bs) {
  const f = fateBreakdown(bs);
  $('fate').innerHTML = f.map(x => `<span title="${x.status}: ${x.count}" style="width:${x.share*100}%;background:${COL[x.status] || '#8a96a8'}"></span>`).join('');
  $('fate').insertAdjacentHTML('afterend', '');
  let lg = document.getElementById('legend'); if (!lg) { lg = document.createElement('div'); lg.id = 'legend'; lg.className = 'legend'; $('fate').after(lg); }
  lg.textContent = f.map(x => `${x.status} ${x.count}`).join(' · ');
}
function render() {
  const bs = filter(all, { q: $('q').value, status: $('status').value });
  stats(bs); fate(bs); lanes(bs); lists(bs);
}
for (const k of Object.keys(statusCounts(all))) $('status').insertAdjacentHTML('beforeend', `<option value="${k}">${k}</option>`);
$('q').oninput = $('status').onchange = $('sort').onchange = render; $('close').onclick = () => $('drawer').close();
let playing = false;
$('play').onclick = async () => {
  if (playing) return; playing = true;
  const [y0, y1] = yearRange(all);
  for (let y = y0; y <= y1; y++) { cutoff = Date.UTC(y + 1, 0); $('year').textContent = `${y} · ${activeAt(all, cutoff).length} flying`; render(); await new Promise(r => setTimeout(r, 450)); }
  cutoff = Infinity; $('year').textContent = ''; render(); playing = false;
};
$('src').innerHTML = `Data: <a href="https://thespacedevs.com/llapi">${snap.source}</a>, snapshot ${snap.fetched_at.slice(0,10)}. Unofficial; not affiliated with SpaceX.`;
render();
document.addEventListener('keydown', e => {
  if (e.target.matches('input,select')) { if (e.key === 'Escape') e.target.blur(); return; }
  if (e.key === '/') { e.preventDefault(); $('q').focus(); }
  else if (e.key === ' ') { e.preventDefault(); $('play').click(); }
});
$('drawer').addEventListener('close', () => history.replaceState(null, '', location.pathname));
const deep = serialFromHash(location.hash); if (deep) open(deep);
