import * as L from './ledger.js';
const [snap, fsnap] = await Promise.all(['boosters.json', 'flights.json'].map(async f => (await fetch(f)).json()));
const all = L.load(snap), FL = fsnap.flights;
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = u => /^https:\/\/ll\.thespacedevs\.com\//.test(u || '') ? u : '#';
const d10 = s => (s || '').slice(0, 10);
const COL = { active: '#4fb3ff', expended: '#ffc94f', destroyed: '#ff6b6b', lost: '#ff6b6b', retired: '#8a96a8' };
const [Y0, Y1] = L.yearRange(all), T0 = Date.UTC(Y0, 0), T1 = Date.UTC(Y1 + 1, 0), W = 900;
const X = t => 70 + (W - 100) * (t - T0) / (T1 - T0);
let cutoff = Infinity;
function stats(bs) {
  const s = L.fleetStats(bs);
  $('stats').innerHTML = [['Boosters', s.boosters], ['Flights', s.flights], ['Landings', s.landings], ['Reflown', s.reflown], ['Still active', s.active], ['Record', s.maxFlights + ' flights']]
    .map(([k, v]) => `<div class="stat" data-k="${k}"><b>${v}</b>${k}</div>`).join('');
}
function fate(bs) {
  const f = L.fateBreakdown(bs);
  $('fate').innerHTML = f.map(x => `<span title="${esc(x.status)}: ${x.count}" style="width:${x.share * 100}%;background:${COL[x.status] || '#8a96a8'}"></span>`).join('');
  let lg = $('legend'); if (!lg) { lg = document.createElement('div'); lg.id = 'legend'; lg.className = 'legend'; $('fate').after(lg); }
  lg.textContent = f.map(x => `${x.status} ${x.count}`).join(' · ');
}
function axis() {
  let g = '';
  for (let y = Y0; y <= Y1; y++) g += `<text x="${X(Date.UTC(y, 0)) + 2}" y="15" fill="#8a96a8" font-size="11">${y}</text>`;
  $('axis').setAttribute('viewBox', `0 0 ${W} 22`); $('axis').innerHTML = g;
}
function lanes(bs) {
  const rows = L.sortBy(bs, $('sort').value).filter(b => b.firstMs <= cutoff), H = 14 * rows.length + 8;
  let g = '';
  for (let y = Y0; y <= Y1 + 1; y++) g += `<line x1="${X(Date.UTC(y, 0))}" y1="0" x2="${X(Date.UTC(y, 0))}" y2="${H}" stroke="#1e2838"/>`;
  rows.forEach((b, i) => {
    const end = Math.min(cutoff, b.status === 'active' ? Date.parse(snap.fetched_at) : b.lastMs), y = 4 + i * 14, w = Math.max(3, X(end) - X(b.firstMs));
    g += `<g class="lane" data-s="${esc(b.serial)}" tabindex="0"><text x="${X(b.firstMs) - 4}" y="${y + 9}" text-anchor="end">${esc(b.serial)}</text><rect x="${X(b.firstMs)}" y="${y}" width="${w}" height="10" rx="4" fill="${COL[b.status] || '#8a96a8'}" opacity="${.35 + .65 * Math.min(1, b.flights / 40)}"/><text x="${X(b.firstMs) + w + 4}" y="${y + 9}">${b.flights}</text></g>`;
  });
  const svg = $('lanes'); svg.setAttribute('viewBox', `0 0 ${W} ${Math.max(H, 20)}`); svg.style.height = Math.max(H, 20) * Math.max(svg.clientWidth || W, 720) / W + 'px'; svg.innerHTML = g;
  if (!rows.length) svg.innerHTML = `<text x="20" y="16" fill="#8a96a8">No boosters match.</text>`;
  svg.querySelectorAll('.lane').forEach(el => { el.onclick = () => open(el.dataset.s); el.onkeydown = e => e.key === 'Enter' && open(el.dataset.s); });
}
function lists(bs) {
  $('top').innerHTML = L.leaderboard(bs).map(b => `<li data-s="${esc(b.serial)}">${esc(b.serial)} — ${b.flights} flights</li>`).join('');
  const gs = L.gaps(FL.filter(f => bs.some(b => b.serial === f.serial)));
  const best = {}; for (const g of gs) if (!best[g.serial] || g.days < best[g.serial].days) best[g.serial] = g;
  $('fast').innerHTML = Object.values(best).sort((a, b) => a.days - b.days).slice(0, 10).map(g => `<li data-s="${esc(g.serial)}">${esc(g.serial)} — ${g.days.toFixed(1)} days</li>`).join('');
  document.querySelectorAll('li[data-s]').forEach(el => el.onclick = () => open(el.dataset.s));
}
function recordsPanel() {
  const r = L.records(all, FL), a = (u, t) => `<a href="${safeUrl(u)}" target="_blank" rel="noopener">${esc(t)}</a>`;
  $('records').innerHTML = [
    r.firstReflight && `<div id="rec-first"><b>First reflight</b><br>${esc(r.firstReflight.serial)} on ${d10(r.firstReflight.net)} · ${a(r.firstReflight.source, r.firstReflight.mission)}</div>`,
    r.fastestTurnaround && `<div id="rec-fast"><b>Fastest turnaround</b><br>${esc(r.fastestTurnaround.serial)}: ${r.fastestTurnaround.days.toFixed(1)} days, before ${a(r.fastestTurnaround.source, r.fastestTurnaround.mission)}</div>`,
    r.mostFlights && `<div id="rec-most"><b>Most flights</b><br>${esc(r.mostFlights.serial)}: ${r.mostFlights.flights} · <a href="${safeUrl(r.mostFlights.source)}" target="_blank" rel="noopener">record</a></div>`,
    r.busiestDroneship && `<div id="rec-ds"><b>Busiest droneship</b><br>${esc(r.busiestDroneship.name)}: ${r.busiestDroneship.success}/${r.busiestDroneship.attempts} landings</div>`,
  ].filter(Boolean).join('');
}
function trend() {
  const t = L.turnaroundByYear(FL), w = 900, h = 260, pad = 44, max = Math.max(...t.map(x => x.median));
  const x = i => pad + (w - pad * 2) * (t.length < 2 ? .5 : i / (t.length - 1)), y = v => h - 30 - (h - 60) * v / max;
  let g = '';
  for (let v = 0; v <= max; v += Math.ceil(max / 5 / 50) * 50 || 50) g += `<line x1="${pad}" x2="${w - pad}" y1="${y(v)}" y2="${y(v)}" stroke="#1e2838"/><text x="4" y="${y(v) + 4}" fill="#8a96a8" font-size="11">${v}d</text>`;
  g += `<polyline fill="none" stroke="#4fb3ff" stroke-width="3" points="${t.map((p, i) => `${x(i)},${y(p.median)}`).join(' ')}"/>`;
  g += `<polyline fill="none" stroke="#ffc94f" stroke-width="2" stroke-dasharray="5 4" points="${t.map((p, i) => `${x(i)},${y(p.min)}`).join(' ')}"/>`;
  t.forEach((p, i) => g += `<g class="pt" data-y="${p.year}"><circle cx="${x(i)}" cy="${y(p.median)}" r="4" fill="#4fb3ff"><title>${p.year}: median ${p.median.toFixed(1)} d, fastest ${p.min.toFixed(1)} d, ${p.reflights} reflights</title></circle><text x="${x(i)}" y="${h - 10}" text-anchor="middle" fill="#8a96a8" font-size="11">${p.year}${p.year === new Date(fsnap.fetched_at).getUTCFullYear() ? ' (YTD)' : ''}</text><text x="${x(i)}" y="${y(p.median) - 8}" text-anchor="middle" fill="#e8edf5" font-size="11">${Math.round(p.median)}</text></g>`);
  g += `<text x="${w - pad}" y="16" text-anchor="end" fill="#4fb3ff" font-size="12">— median</text><text x="${w - pad}" y="32" text-anchor="end" fill="#ffc94f" font-size="12">- - fastest</text>`;
  $('trendsvg').setAttribute('viewBox', `0 0 ${w} ${h}`); $('trendsvg').innerHTML = g;
}
function cmp() {
  const [a, b] = L.compare(all, FL, $('ca').value, $('cb').value); if (!a || !b) return;
  const rows = [['Status', 'status'], ['Flights', 'flights'], ['Landings', 'landings'], ['First flight', 'first', d10], ['Last flight', 'last', d10],
    ['Median turnaround', 'medianGap', v => v == null ? '—' : v.toFixed(1) + ' d'], ['Fastest turnaround', 'fastestGap', v => v == null ? '—' : v.toFixed(1) + ' d'], ['Most-used landing spot', 'topSpot']];
  $('ctable').innerHTML = `<tr><th></th><th>${esc(a.serial)}</th><th>${esc(b.serial)}</th></tr>` + rows.map(([k, f, fmt = v => v ?? '—']) => `<tr data-k="${f}"><th>${k}</th><td>${esc(fmt(a[f]))}</td><td>${esc(fmt(b[f]))}</td></tr>`).join('');
}
const TCOL = { ASDS: '#4fb3ff', RTLS: '#5fd38d', Ocean: '#b48cff', EXP: '#ffc94f', Other: '#8a96a8' };
function years() {
  const t = L.flightsByYear(FL), w = 900, h = 260, pad = 44, max = Math.max(...t.map(x => x.total)), bw = (w - pad * 2) / t.length;
  const y = v => h - 30 - (h - 60) * v / max;
  let g = '';
  t.forEach((p, i) => {
    let acc = 0; const x = pad + i * bw + bw * .15;
    for (const k of ['ASDS', 'RTLS', 'Ocean', 'EXP', 'Other']) { if (!p[k]) continue; g += `<rect class="seg" data-y="${p.year}" data-k="${k}" x="${x}" y="${y(acc + p[k])}" width="${bw * .7}" height="${y(acc) - y(acc + p[k])}" fill="${TCOL[k]}"><title>${p.year} ${k}: ${p[k]}</title></rect>`; acc += p[k]; }
    g += `<text x="${x + bw * .35}" y="${y(p.total) - 5}" text-anchor="middle" fill="#e8edf5" font-size="11" class="tot" data-y="${p.year}">${p.total}</text><text x="${x + bw * .35}" y="${h - 10}" text-anchor="middle" fill="#8a96a8" font-size="11">${p.year}${p.year === new Date(fsnap.fetched_at).getUTCFullYear() ? ' YTD' : ''}</text>`;
  });
  g += Object.entries(TCOL).slice(0, 4).map(([k, c], i) => `<rect x="${pad + i * 80}" y="8" width="10" height="10" fill="${c}"/><text x="${pad + 14 + i * 80}" y="17" fill="#8a96a8" font-size="11">${k}</text>`).join('');
  $('yearsvg').setAttribute('viewBox', `0 0 ${w} ${h}`); $('yearsvg').innerHTML = g;
}
function spots() {
  $('spottable').innerHTML = '<tr><th>Spot</th><th>Type</th><th>Landed / tried</th><th></th></tr>' + L.spotsFleet(FL).map(x => `<tr data-w="${esc(x.where)}"><td>${esc(x.name)} (${esc(x.where)})</td><td>${esc(x.type)}</td><td>${x.success}/${x.attempts}</td><td><span class="bar"><i style="width:${100 * x.success / x.attempts}%"></i></span></td></tr>`).join('');
}
function syncUrl() {
  const q = L.serializeState({ q: $('q').value, status: $('status').value, sort: $('sort').value, a: $('ca').value, b: $('cb').value });
  history.replaceState(null, '', location.pathname + q + ($('drawer').open ? location.hash : ''));
}
function open(s) {
  const b = all.find(x => x.serial === s); if (!b) return;
  const fs = L.flightsFor(FL, s), lr = L.landingRate(b), fpy = L.flightsPerYear(b), lb = L.landingBreakdown(fs);
  history.replaceState(null, '', '#' + s);
  $('detail').innerHTML = `<h2>${esc(b.serial)}</h2><p>Status: <b>${esc(b.status)}</b> · #${L.rankOf(all, b.serial)} of ${all.length} by flights${lr != null ? ` · ${Math.round(lr * 100)}% landings` : ''}</p>
  <p>${b.flights} flights · ${b.landings_ok}/${b.landings_attempted ?? '?'} landings · first ${d10(b.first)} · last ${d10(b.last)}${fpy ? ` · ${fpy.toFixed(1)} flights/yr` : ''}</p>
  <p class="sub">${esc(b.details)}</p>
  <h3>Where it landed</h3><p id="lb">${lb.map(x => `${esc(x.where)} ${x.success}/${x.attempts}`).join(' · ')}</p>
  <h3>Every flight</h3><div class="tl"><table><tr><th>#</th><th>Date</th><th>Mission</th><th>Landing</th></tr>${fs.map(f => `<tr><td>${f.n ?? ''}</td><td>${d10(f.net)}</td><td><a href="${safeUrl(f.source)}" target="_blank" rel="noopener">${esc(f.mission)}</a></td><td class="${f.landing_success ? 'ok' : f.landing_attempt ? 'bad' : ''}">${f.landing_attempt ? esc(f.landing_loc || f.landing_type) + (f.landing_success ? ' ✓' : ' ✗') : 'expended'}</td></tr>`).join('')}</table></div>
  <p><a href="${safeUrl(b.source)}" target="_blank" rel="noopener">Booster source record</a></p>`;
  if (!$('drawer').open) $('drawer').showModal();
}
function render() { const bs = L.filter(all, { q: $('q').value, status: $('status').value }); stats(bs); fate(bs); lanes(bs); lists(bs); }
for (const k of Object.keys(L.statusCounts(all))) $('status').insertAdjacentHTML('beforeend', `<option value="${esc(k)}">${esc(k)}</option>`);
const opts = L.sortBy(all, 'flights').map(b => `<option>${esc(b.serial)}</option>`).join('');
$('ca').innerHTML = $('cb').innerHTML = opts; $('ca').selectedIndex = 0; $('cb').selectedIndex = 1;
const st = L.parseState(location.search, all.map(b => b.serial));
$('q').value = st.q; if ([...$('status').options].some(o => o.value === st.status)) $('status').value = st.status; $('sort').value = st.sort;
if (st.a) $('ca').value = st.a; if (st.b) $('cb').value = st.b;
$('ca').onchange = $('cb').onchange = () => { cmp(); syncUrl(); };
$('q').oninput = $('status').onchange = $('sort').onchange = () => { render(); syncUrl(); };
$('share').onclick = async () => { syncUrl(); try { await navigator.clipboard.writeText(location.href); $('share').textContent = '✓ Copied'; } catch { $('share').textContent = '✓ In address bar'; } setTimeout(() => $('share').textContent = '🔗 Link', 1500); }; $('close').onclick = () => $('drawer').close();
let playing = false;
$('play').onclick = async () => {
  if (playing) return; playing = true; $('play').disabled = true;
  for (let y = Y0; y <= Y1; y++) { cutoff = Date.UTC(y + 1, 0); $('year').textContent = `${y} · ${L.activeAt(all, cutoff).length} flying`; render(); await new Promise(r => setTimeout(r, 450)); }
  cutoff = Infinity; $('year').textContent = ''; render(); playing = false; $('play').disabled = false;
};
document.addEventListener('keydown', e => {
  if (e.target.matches('input,select')) { if (e.key === 'Escape') e.target.blur(); return; }
  if ($('drawer').open) return;
  if (e.key === '/') { e.preventDefault(); $('q').focus(); }
  else if (e.key === ' ' && !e.target.matches('button,.lane')) { e.preventDefault(); $('play').click(); }
});
$('drawer').addEventListener('close', () => history.replaceState(null, '', location.pathname + location.search));
addEventListener('hashchange', () => { const s = L.serialFromHash(location.hash); if (s) open(s); });
let rz; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(render, 120); });
$('src').innerHTML = `Data: <a href="https://thespacedevs.com/llapi">The Space Devs Launch Library 2</a> — boosters snapshot ${d10(snap.fetched_at)}, flights snapshot ${d10(fsnap.fetched_at)}. Unofficial; not affiliated with SpaceX.`;
axis(); render(); recordsPanel(); trend(); years(); spots(); cmp();
const lw = $('lanewrap'); if (lw.scrollWidth > lw.clientWidth) lw.scrollLeft = lw.scrollWidth; // newest years in view on narrow screens
const deep = L.serialFromHash(location.hash); if (deep) open(deep);
document.body.dataset.ready = '1';
