import * as L from './ledger.js'; import * as C from './charts.js';
let snap, fsnap;
try { [snap, fsnap] = await Promise.all(['boosters.json', 'flights.json'].map(async f => { const r = await fetch(f); if (!r.ok) throw new Error(`${f}: HTTP ${r.status}`); return r.json(); })); }
catch (e) { const el = document.getElementById('err'); el.hidden = false; el.textContent = `Couldn't load the data snapshot (${e.message}). Reload, or check that the server is running.`; document.body.dataset.ready = 'error'; throw e; }
const NOWY = new Date(fsnap.fetched_at).getUTCFullYear(), all = L.load(snap), FL = fsnap.flights, HEAVY = new Set(L.heavyBoosters(FL));
const $ = id => document.getElementById(id);
const esc = C.esc;
const safeUrl = L.safeUrl;
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
    g += `<g class="lane" data-s="${esc(b.serial)}" tabindex="0"><title>${esc(b.serial)}: ${b.flights} flights, ${esc(b.status)}</title><text x="${X(b.firstMs) - 4}" y="${y + 9}" text-anchor="end">${esc(b.serial)}</text><rect x="${X(b.firstMs)}" y="${y}" width="${w}" height="10" rx="4" fill="${COL[b.status] || '#8a96a8'}" opacity="${.35 + .65 * Math.min(1, b.flights / 40)}"/><text x="${X(b.firstMs) + w + 4}" y="${y + 9}">${b.flights}</text></g>`;
  });
  const svg = $('lanes'); svg.setAttribute('viewBox', `0 0 ${W} ${Math.max(H, 20)}`); svg.style.height = Math.max(H, 20) * Math.max(svg.clientWidth || W, 720) / W + 'px'; svg.innerHTML = g;
  if (!rows.length) svg.innerHTML = `<text x="20" y="16" fill="#8a96a8">No boosters match.</text>`;
  svg.querySelectorAll('.lane').forEach(el => { el.onclick = () => open(el.dataset.s); el.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); open(el.dataset.s); } }; });
}
function lists(bs) {
  $('top').innerHTML = L.leaderboard(bs).map(b => `<li><button class="lk" data-s="${esc(b.serial)}">${esc(b.serial)} — ${b.flights} flights</button></li>`).join('');
  const keep = new Set(bs.map(b => b.serial)), gs = L.gaps(FL.filter(f => keep.has(f.serial) && Date.parse(f.net) < cutoff));
  const best = {}; for (const g of gs) if (!best[g.serial] || g.days < best[g.serial].days) best[g.serial] = g;
  $('fast').innerHTML = Object.values(best).sort((a, b) => a.days - b.days).slice(0, 10).map(g => `<li><button class="lk" data-s="${esc(g.serial)}">${esc(g.serial)} — ${g.days.toFixed(1)} days</button></li>`).join('');
  document.querySelectorAll('button.lk').forEach(el => el.onclick = () => open(el.dataset.s));
}
function firstsPanel() {
  const rows = L.firsts(FL, all);
  $('firsts').innerHTML = rows.map(r => `<div data-first="${esc(r.label)}"><b>${esc(r.label)}</b><br><button class="lk" data-s="${esc(r.serial)}">${esc(r.serial)}</button> · ${(r.net || '').slice(0, 10)} · <a href="${safeUrl(r.source)}" target="_blank" rel="noopener">${esc(r.mission)}</a></div>`).join('');
  $('firsts').querySelectorAll('button.lk').forEach(el => el.onclick = () => open(el.dataset.s));
}
function recordsPanel() {
  const r = L.records(all, FL), a = (u, t) => `<a href="${safeUrl(u)}" target="_blank" rel="noopener">${esc(t)}</a>`;
  $('records').innerHTML = [
    r.firstReflight && `<div id="rec-first"><b>First reflight</b><br>${esc(r.firstReflight.serial)} on ${d10(r.firstReflight.net)} · ${a(r.firstReflight.source, r.firstReflight.mission)}</div>`,
    r.fastestTurnaround && `<div id="rec-fast"><b>Fastest turnaround</b><br>${esc(r.fastestTurnaround.serial)}: ${r.fastestTurnaround.days.toFixed(1)} days, before ${a(r.fastestTurnaround.source, r.fastestTurnaround.mission)}</div>`,
    r.mostFlights && `<div id="rec-most"><b>Most flights</b><br>${esc(r.mostFlights.serial)}: ${r.mostFlights.flights} · <a href="${safeUrl(r.mostFlights.source)}" target="_blank" rel="noopener">record</a></div>`,
    (() => { const lf = L.launchFailures(FL); return lf.length ? `<div id="rec-fail"><b>Launch failures</b><br>${lf.map(f => `${esc(f.serial)} · ${a(f.source, f.mission)}`).join('<br>')}</div>` : ''; })(),
    r.busiestDroneship && `<div id="rec-ds"><b>Busiest droneship</b><br>${esc(r.busiestDroneship.name)}: ${r.busiestDroneship.success}/${r.busiestDroneship.attempts} landings</div>`,
  ].filter(Boolean).join('');
}
const CW = () => ({ w: innerWidth < 700 ? 400 : 640 });
function trend() { const r = C.trendSVG(L.turnaroundByYear(FL), NOWY, CW()); $('trendsvg').setAttribute('viewBox', r.viewBox); $('trendsvg').innerHTML = r.svg; }
function cmpChart(sa, sb) { const r = C.cmpSVG(L.cumulative(FL, sa), L.cumulative(FL, sb), sa, sb, CW()); if (!r) return; $('cmpsvg').setAttribute('viewBox', r.viewBox); $('cmpsvg').innerHTML = r.svg; }
function cmp() {
  const [a, b] = L.compare(all, FL, $('ca').value, $('cb').value); if (!a || !b) return; cmpChart(a.serial, b.serial);
  const rows = [['Status', 'status'], ['Block', '_block'], ['Flights', 'flights'], ['Landings', 'landings'], ['First flight', 'first', d10], ['Last flight', 'last', d10],
    ['Median turnaround', 'medianGap', v => v == null ? '—' : v.toFixed(1) + ' d'], ['Fastest turnaround', 'fastestGap', v => v == null ? '—' : v.toFixed(1) + ' d'], ['Most-used landing spot', 'topSpot']];
  const block = s => L.blockOf(all.find(x => x.serial === s)?.details, s);
  a._block = block(a.serial); b._block = block(b.serial);
  const lbA = L.landingBreakdown(L.flightsFor(FL, a.serial)), lbB = L.landingBreakdown(L.flightsFor(FL, b.serial));
  const spots = [...new Set([...lbA, ...lbB].map(x => x.where))].slice(0, 8);
  $('ctable').innerHTML = `<tr><th></th><th>${esc(a.serial)}</th><th>${esc(b.serial)}</th></tr>` + rows.map(([k, f, fmt = v => v ?? '—']) => `<tr data-k="${f}"><th>${k}</th><td>${esc(fmt(a[f]))}</td><td>${esc(fmt(b[f]))}</td></tr>`).join('')
    + spots.map(w => { const x = lbA.find(e => e.where === w), y = lbB.find(e => e.where === w); return `<tr data-k="spot-${esc(w)}"><th>${esc(w)}</th><td>${x ? `${x.success}/${x.attempts}` : '—'}</td><td>${y ? `${y.success}/${y.attempts}` : '—'}</td></tr>`; }).join('');
}
function years() { const r = C.yearsSVG(L.flightsByYear(FL), NOWY, CW()); $('yearsvg').setAttribute('viewBox', r.viewBox); $('yearsvg').innerHTML = r.svg; }
function prog() {
  const P = L.recordProgression(FL), r = C.progSVG(P, Date.parse(fsnap.fetched_at), CW()); if (!r) return;
  $('progsvg').setAttribute('viewBox', r.viewBox); $('progsvg').innerHTML = r.svg;
  $('progsvg').querySelectorAll('circle').forEach(c => c.onclick = () => open(c.dataset.s));
  const last = P.at(-1), a = f => `<a href="${safeUrl(f.source)}" target="_blank" rel="noopener">${esc(f.mission)}</a>`;
  $('progtxt').innerHTML = `Flight 10 first reached by ${esc(P[9]?.serial ?? '—')} (${d10(P[9]?.net)}${P[9] ? ', ' + a(P[9]) : ''}); flight ${last.n} by ${esc(last.serial)} (${d10(last.net)}, ${a(last)}).`;
}
function pads() {
  const row = (k, x) => `<tr data-${k}="${esc(x.name)}"><td>${esc(x.name)}</td><td>${x.count}</td></tr>`;
  $('padtable').innerHTML = '<tr><th>Pad / rocket</th><th>Booster flights</th></tr>' + L.countBy(FL, 'pad').map(x => row('pad', x)).join('') + L.countBy(FL, 'rocket').map(x => row('rocket', x)).join('');
}
function spots() {
  $('spottable').innerHTML = '<tr><th>Spot</th><th>Type</th><th>Landed / tried</th><th></th></tr>' + L.spotsFleet(FL).map(x => `<tr data-w="${esc(x.where)}"><td>${esc(x.name)} (${esc(x.where)})</td><td>${esc(x.type)}</td><td>${x.success}/${x.attempts}</td><td><span class="bar"><i style="width:${100 * x.success / x.attempts}%"></i></span></td></tr>`).join('');
}
function syncUrl() {
  const y = cutoff === Infinity ? null : new Date(cutoff - 1).getUTCFullYear(); const q = L.serializeState({ q: $('q').value, status: $('status').value, sort: $('sort').value, fh: $('fh').checked, lt: $('lt').value, y, a: $('ca').value, b: $('cb').value });
  history.replaceState(null, '', location.pathname + q + ($('drawer').open ? location.hash : ''));
}
function open(s) {
  const b = all.find(x => x.serial === s); if (!b) return;
  const fs = L.flightsFor(FL, s), lr = L.landingRate(b), fpy = L.flightsPerYear(b), lb = L.landingBreakdown(fs);
  history.replaceState(null, '', '#' + s);
  $('detail').innerHTML = `<h2 id="dtitle">${esc(b.serial)}</h2><p>Status: <b>${esc(b.status)}</b> · ${esc(L.blockOf(b.details, b.serial))} · #${L.rankOf(all, b.serial)} of ${all.length} by flights${lr != null ? ` · ${Math.round(lr * 100)}% landings` : ''}</p>
  <p>${b.flights} flights · ${b.landings_ok}/${b.landings_attempted ?? '?'} landings · first ${d10(b.first)} · last ${d10(b.last)}${fpy ? ` · ${fpy.toFixed(1)} flights/yr` : ''}</p>
  <p class="sub">${esc(b.details)}</p>${(() => { const hr = L.heavyRole(FL, b.serial); return hr ? `<p class="sub">Flew Falcon Heavy ${hr.flights}× · pads ${hr.pads.map(esc).join(', ')}</p>` : ''; })()}
  ${(() => { const g = L.gaps(fs); if (g.length < 2) return ''; return `<h3>Days between flights</h3><svg id="spark" viewBox="0 0 640 70" preserveAspectRatio="none"><polyline points="${C.sparkPoints(g)}" fill="none" stroke="#4fb3ff" stroke-width="2"/></svg><p class="sub">From ${Math.round(g[0].days)} days before flight 2 to ${Math.round(g.at(-1).days)} days before flight ${fs.length}; fastest ${Math.min(...g.map(x => x.days)).toFixed(1)}.</p>`; })()}${(() => { const r = C.timelineSVG(fs, { w: innerWidth < 700 ? 400 : 640 }); if (!r) return ''; return `<h3>Mission timeline</h3><svg id="tline" viewBox="${r.viewBox}" role="img" aria-label="mission timeline">${r.svg}</svg>`; })()}
  <h3>Where it landed</h3><p id="lb">${lb.map(x => `${esc(x.where)} ${x.success}/${x.attempts}`).join(' · ')}</p>
  <h3>Every flight</h3><div class="tl"><table><tr><th>#</th><th>Date</th><th>Mission</th><th>Landing</th></tr>${fs.map(f => `<tr${f.launch_status && f.launch_status !== 'Success' ? ` class="fail" title="Launch outcome: ${esc(f.launch_status)}"` : ''}><td>${f.n ?? ''}</td><td>${d10(f.net)}</td><td><a href="${safeUrl(f.source)}" target="_blank" rel="noopener">${esc(f.mission)}</a>${f.launch_status && f.launch_status !== 'Success' ? ' <span class="bad">(launch failure)</span>' : ''}${f.rocket === 'Falcon Heavy' ? ' <span class="sub">· Falcon Heavy</span>' : ''}</td><td class="${f.landing_success ? 'ok' : f.landing_attempt ? 'bad' : ''}">${f.landing_attempt ? esc(f.landing_loc || f.landing_type) + (f.landing_success ? ' ✓' : ' ✗') : 'expended'}</td></tr>`).join('')}</table></div>
  <p><a href="${safeUrl(b.source)}" target="_blank" rel="noopener">Booster source record</a></p>`;
  if (!$('drawer').open) $('drawer').showModal();
  $('close').focus({ preventScroll: true }); $('drawer').scrollTop = 0;
}
function current() {
  let bs = L.filterWithMissions(all, FL, { q: $('q').value, status: $('status').value }).filter(b => !$('fh').checked || HEAVY.has(b.serial));
  const lt = $('lt').value; if (lt && lt !== 'all') { const keep = L.serialsWithLandingType(FL, lt); bs = bs.filter(b => keep.has(b.serial)); }
  return bs;
}
function render() { const bs = L.asOf(current(), FL, cutoff); stats(bs); fate(bs); lanes(bs); lists(bs); const mn = $('matchn'); if (mn) mn.textContent = `${bs.length} shown`; }
for (const k of Object.keys(L.statusCounts(all))) $('status').insertAdjacentHTML('beforeend', `<option value="${esc(k)}">${esc(k)}</option>`);
const opts = L.sortBy(all, 'flights').map(b => `<option>${esc(b.serial)}</option>`).join('');
$('ca').innerHTML = $('cb').innerHTML = opts; $('ca').selectedIndex = 0; $('cb').selectedIndex = 1;
const st = L.parseState(location.search, all.map(b => b.serial));
$('q').value = st.q; if ([...$('status').options].some(o => o.value === st.status)) $('status').value = st.status; $('sort').value = st.sort; $('fh').checked = st.fh; if (st.lt) $('lt').value = st.lt;
if (st.a) $('ca').value = st.a; if (st.b) $('cb').value = st.b;
$('ca').onchange = $('cb').onchange = () => { cmp(); syncUrl(); };
$('q').oninput = $('status').onchange = $('sort').onchange = $('fh').onchange = $('lt').onchange = () => { render(); syncUrl(); };
$('quick')?.querySelectorAll('button').forEach(btn => btn.onclick = () => { $('status').value = btn.dataset.st; render(); syncUrl(); });
$('csv').onclick = () => { const cols = ['serial', 'status', 'flights', 'landings_ok', 'landings_attempted', 'first', 'last', 'source']; const blob = new Blob([L.toCSV(L.sortBy(current(), $('sort').value), cols)], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'booster-ledger.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
$('fcsv') && ($('fcsv').onclick = () => {
  const keep = new Set(current().map(b => b.serial));
  const rows = FL.filter(f => keep.has(f.serial));
  const cols = ['serial','n','mission','net','launch_status','rocket','pad','landing_attempt','landing_success','landing_loc','landing_type','source'];
  const blob = new Blob([L.toCSV(rows, cols)], { type: 'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'booster-flights.csv'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});
$('json').onclick = () => { const rows = L.sortBy(current(), $('sort').value).map(b => ({ serial: b.serial, status: b.status, block: L.blockOf(b.details, b.serial), flights: b.flights, landings_ok: b.landings_ok, landings_attempted: b.landings_attempted, first: b.first, last: b.last, source: b.source })); const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), boosters: rows }, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'booster-ledger.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); };
$('share').onclick = async () => { syncUrl(); try { await navigator.clipboard.writeText(location.href); $('share').textContent = '✓ Copied'; } catch { $('share').textContent = '✓ In address bar'; } setTimeout(() => $('share').textContent = '🔗 Link', 1500); }; $('close').onclick = () => $('drawer').close();
let playing = false;
$('play').onclick = async () => {
  if (playing) return; playing = true; $('play').disabled = true;
  for (let y = Y0; y <= Y1; y++) { setCutoffYear(y); $('year').textContent = `${y} · ${L.activeAt(current(), cutoff).length} flying`; await new Promise(r => setTimeout(r, matchMedia('(prefers-reduced-motion: reduce)').matches ? 120 : 450)); }
  setCutoffYear(null); playing = false; $('play').disabled = false;
};
document.addEventListener('keydown', e => {
  if (e.target.matches('input,select,textarea')) { if (e.key === 'Escape') e.target.blur(); return; }
  if (e.key === 'j' || e.key === 'k') {
    e.preventDefault();
    const rows = ordered();
    if ($('drawer').open) {
      const cur = L.serialFromHash(location.hash);
      const i = rows.findIndex(b => b.serial === cur);
      focusIdx = i < 0 ? 0 : i;
    }
    stepBooster(e.key === 'j' ? 1 : -1);
    return;
  }
  if (e.key === '?' && !e.target.matches('input,select,textarea')) {
    e.preventDefault(); $('help')?.showModal(); return;
  }
  if ((e.key === '[' || e.key === ']') && !$('drawer').open) {
    e.preventDefault();
    const max = Y1 - Y0 + 1; let v = +$('scrub').value;
    v = e.key === '[' ? Math.max(0, v - 1) : Math.min(max, v + 1);
    setCutoffYear(v > Y1 - Y0 ? null : Y0 + v);
    syncUrl();
    return;
  }
  if ($('drawer').open) return;
  if (e.key === '/') { e.preventDefault(); $('q').focus(); }
  else if (e.key === ' ' && !e.target.matches('button,.lane')) { e.preventDefault(); $('play').click(); }
});
$('drawer').addEventListener('close', () => history.replaceState(null, '', location.pathname + location.search));
addEventListener('hashchange', () => { const s = L.serialFromHash(location.hash); if (s) open(s); });
let rz, lastCW = CW().w; addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { render(); if (CW().w !== lastCW) { lastCW = CW().w; trend(); years(); prog(); cmp(); cumFleet(); fleet(); matrixChart(); rate(); heat(); hist(); reuse(); padsChart(); recoveredChart(); } }, 120); });
$('src').innerHTML = `Data: <a href="https://thespacedevs.com/llapi">The Space Devs Launch Library 2</a> — boosters snapshot ${d10(snap.fetched_at)}, flights snapshot ${d10(fsnap.fetched_at)}. Unofficial; not affiliated with SpaceX.`;
function padsChart() {
  const r = C.padSVG(L.padCadence(FL), NOWY, CW()); if (!r) return;
  $('padsvg').setAttribute('viewBox', r.viewBox); $('padsvg').innerHTML = r.svg;
}
function recoveredChart() {
  const r = C.recoveredSVG(L.recoveredShareByYear(FL), NOWY, CW()); if (!r) return;
  $('recoveredsvg').setAttribute('viewBox', r.viewBox); $('recoveredsvg').innerHTML = r.svg;
}
function reuse() {
  const r = C.reuseSVG(L.reuseCurve(all), CW()); if (!r) return;
  $('reusesvg').setAttribute('viewBox', r.viewBox); $('reusesvg').innerHTML = r.svg;
}
function heat() {
  const r = C.heatSVG(L.flightsByMonth(FL), CW()); if (!r) return;
  $('heatsvg').setAttribute('viewBox', r.viewBox); $('heatsvg').innerHTML = r.svg;
}
function hist() {
  const r = C.histSVG(L.turnaroundHistogram(FL, 10), CW()); if (!r) return;
  $('histsvg').setAttribute('viewBox', r.viewBox); $('histsvg').innerHTML = r.svg;
}
function matrixChart() {
  const r = C.matrixSVG(L.landingMatrix(FL), CW()); if (!r) return;
  $('matrixsvg').setAttribute('viewBox', r.viewBox); $('matrixsvg').innerHTML = r.svg;
}
function rate() {
  const r = C.rateSVG(L.landingSuccessByYear(FL), NOWY, CW()); if (!r) return;
  $('ratesvg').setAttribute('viewBox', r.viewBox); $('ratesvg').innerHTML = r.svg;
}
function cumFleet() {
  const r = C.cumFleetSVG(L.cumulativeFleetFlights(FL), CW()); if (!r) return;
  $('cumfleetsvg').setAttribute('viewBox', r.viewBox); $('cumfleetsvg').innerHTML = r.svg;
}
function fleet() {
  const series = L.fleetSizeByYear(all, FL, Y0, Y1);
  const r = C.fleetSVG(series, NOWY, CW()); if (!r) return;
  $('fleetsvg').setAttribute('viewBox', r.viewBox); $('fleetsvg').innerHTML = r.svg;
  $('blocks').textContent = L.blockCounts(all).map(x => `${x.block} ${x.count}`).join(' · ');
}
function setCutoffYear(y) {
  if (y == null || y > Y1) { cutoff = Infinity; $('year').textContent = ''; $('scrub').value = String(Y1 - Y0 + 1); }
  else { cutoff = Date.UTC(y + 1, 0); $('year').textContent = `${y}`; $('scrub').value = String(y - Y0); }
  render();
}
$('scrub').min = '0'; $('scrub').max = String(Y1 - Y0 + 1); $('scrub').value = String(Y1 - Y0 + 1);
$('scrub').oninput = () => { const v = +$('scrub').value; setCutoffYear(v > Y1 - Y0 ? null : Y0 + v); };
if (st.y != null && st.y >= Y0 && st.y <= Y1) setCutoffYear(st.y);

let focusIdx = 0;
function ordered() { return L.sortBy(current(), $('sort').value); }
function stepBooster(dir) {
  const rows = ordered(); if (!rows.length) return;
  focusIdx = (focusIdx + dir + rows.length) % rows.length;
  open(rows[focusIdx].serial);
}

if (st.y != null && st.y >= Y0 && st.y <= Y1) { /* applied after scrubber init below */ } axis(); render(); recordsPanel(); firstsPanel(); trend(); years(); spots(); pads(); prog(); cmp(); cumFleet(); fleet(); matrixChart(); rate(); heat(); hist(); reuse(); padsChart(); recoveredChart();
const lw = $('lanewrap'); if (lw.scrollWidth > lw.clientWidth) lw.scrollLeft = lw.scrollWidth; // newest years in view on narrow screens
const deep = L.serialFromHash(location.hash); if (deep) open(deep);
function tvCard(list, i) {
  const b = list[i], fs = L.flightsFor(FL, b.serial), g = L.gaps(fs), lb = L.landingBreakdown(fs)[0];
  const mx = Math.max(1, ...g.map(x => x.days)), pts = g.map((x, k) => `${(10 + 980 * k / Math.max(1, g.length - 1)).toFixed(1)},${(110 - 95 * x.days / mx).toFixed(1)}`).join(' ');
  $('tv').innerHTML = `<div class="card" data-s="${esc(b.serial)}"><div class="foot"><span>BOOSTER LEDGER · most-flown Falcon boosters</span><span>${i + 1} / ${list.length}</span></div>
  <h1>${esc(b.serial)}</h1><p class="big"><b>${b.flights}</b> flights · <b>${b.landings_ok}</b> landings · ${esc(b.status)}</p>
  <p class="big">First flew ${d10(b.first)}${fs[0] ? ' on ' + esc(fs[0].mission) : ''}${lb ? ` · lands most on <b>${esc(lb.where)}</b>` : ''}</p>
  ${g.length > 1 ? `<svg viewBox="0 0 1000 120" preserveAspectRatio="none"><polyline points="${pts}" fill="none" stroke="#4fb3ff" stroke-width="3"/></svg><p class="big">Days between flights: ${Math.round(g[0].days)} → ${Math.round(g.at(-1).days)} · fastest ${Math.min(...g.map(x => x.days)).toFixed(1)}</p>` : ''}
  <div class="foot"><span>Data: The Space Devs Launch Library 2, snapshot ${d10(snap.fetched_at)}</span><span class="dots">${list.map((_, k) => `<span class="${k === i ? 'on' : ''}"></span>`).join('')}</span></div></div>`;
}
if (new URLSearchParams(location.search).get('mode') === 'tv') {
  const list = L.leaderboard(all, 10), ms = Math.max(2000, Number(new URLSearchParams(location.search).get('every')) || 8000); let i = 0;
  document.documentElement.classList.add('tv'); document.body.classList.add('tv'); $('tv').hidden = false; tvCard(list, 0);
  setInterval(() => { i = (i + 1) % list.length; tvCard(list, i); }, ms);
  document.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { i = (i + 1) % list.length; tvCard(list, i); } if (e.key === 'ArrowLeft') { i = (i + list.length - 1) % list.length; tvCard(list, i); } if (e.key === 'Escape') location.search = ''; });
}
(() => { const toc = document.getElementById('tocwrap'); if (toc && matchMedia('(max-width: 899px)').matches) toc.open = false; })();
$('helpclose') && ($('helpclose').onclick = () => $('help').close());
document.body.dataset.ready = '1';
