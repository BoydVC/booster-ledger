// Pure SVG builders. Each returns { viewBox, svg } and never touches the DOM.
import * as L from './ledger.js';
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ytd = (y, nowYear) => y === nowYear ? '*' : '';
const yl = (y, short) => short ? "'" + String(y).slice(2) : String(y);
export function trendSVG(t, nowYear, { w = 640 } = {}) {
  const short = w < 500;
  const h = 260, pad = 44, max = Math.max(...t.map(x => x.median));
  const x = i => pad + (w - pad * 2) * (t.length < 2 ? .5 : i / (t.length - 1)), y = v => h - 30 - (h - 60) * v / max;
  let g = '';
  for (let v = 0; v <= max; v += Math.ceil(max / 5 / 50) * 50 || 50) g += `<line x1="${pad}" x2="${w - pad}" y1="${y(v)}" y2="${y(v)}" stroke="#1e2838"/><text x="4" y="${y(v) + 4}" fill="#8a96a8" font-size="11">${v}d</text>`;
  g += `<polyline fill="none" stroke="#4fb3ff" stroke-width="3" points="${t.map((p, i) => `${x(i)},${y(p.median)}`).join(' ')}"/>`;
  g += `<polyline fill="none" stroke="#ffc94f" stroke-width="2" stroke-dasharray="5 4" points="${t.map((p, i) => `${x(i)},${y(p.min)}`).join(' ')}"/>`;
  t.forEach((p, i) => g += `<g class="pt" data-y="${p.year}"><circle cx="${x(i)}" cy="${y(p.median)}" r="4" fill="#4fb3ff"><title>${p.year}: median ${p.median.toFixed(1)} d, fastest ${p.min.toFixed(1)} d, ${p.reflights} reflights</title></circle><text x="${x(i)}" y="${h - 10}" text-anchor="middle" fill="#8a96a8" font-size="11">${yl(p.year, short)}${ytd(p.year, nowYear)}</text><text x="${x(i)}" y="${y(p.median) - 8}" text-anchor="middle" fill="#e8edf5" font-size="11">${Math.round(p.median)}</text></g>`);
  g += `<text x="${w - pad}" y="16" text-anchor="end" fill="#4fb3ff" font-size="12">— median</text><text x="${w - pad}" y="32" text-anchor="end" fill="#ffc94f" font-size="12">- - fastest</text>`;
  return { viewBox: `0 0 ${w} ${h}`, svg: g };
}
export const TCOL = { ASDS: '#4fb3ff', RTLS: '#5fd38d', Ocean: '#b48cff', EXP: '#ffc94f', Other: '#8a96a8' };
export function yearsSVG(t, nowYear, { w = 640 } = {}) {
  const short = w < 500;
  const h = 260, pad = 44, max = Math.max(...t.map(x => x.total)), bw = (w - pad * 2) / t.length;
  const y = v => h - 30 - (h - 60) * v / max;
  let g = '';
  t.forEach((p, i) => {
    let acc = 0; const x = pad + i * bw + bw * .15;
    for (const k of ['ASDS', 'RTLS', 'Ocean', 'EXP', 'Other']) { if (!p[k]) continue; g += `<rect class="seg" data-y="${p.year}" data-k="${k}" x="${x}" y="${y(acc + p[k])}" width="${bw * .7}" height="${y(acc) - y(acc + p[k])}" fill="${TCOL[k]}"><title>${p.year} ${k}: ${p[k]}</title></rect>`; acc += p[k]; }
    g += `<text x="${x + bw * .35}" y="${y(p.total) - 5}" text-anchor="middle" fill="#e8edf5" font-size="11" class="tot" data-y="${p.year}">${p.total}</text><text x="${x + bw * .35}" y="${h - 10}" text-anchor="middle" fill="#8a96a8" font-size="11">${yl(p.year, short)}${ytd(p.year, nowYear)}</text>`;
  });
  g += Object.entries(TCOL).slice(0, 4).map(([k, c], i) => `<rect x="${pad + i * (short ? 64 : 80)}" y="8" width="10" height="10" fill="${c}"/><text x="${pad + 14 + i * (short ? 64 : 80)}" y="17" fill="#8a96a8" font-size="11">${k}</text>`).join('');
  return { viewBox: `0 0 ${w} ${h}`, svg: g };
}
export function cmpSVG(A, B2, sa, sb, { w = 640 } = {}) {
  const pts = [...A, ...B2]; if (!pts.length) return null; const short = w < 500;
  const h = 220, pad = 40, t0 = Math.min(...pts.map(p => p.t)), t1 = Math.max(...pts.map(p => p.t)), m = Math.max(...pts.map(p => p.n));
  const x = p => pad + (w - pad * 2) * (p.t - t0) / ((t1 - t0) || 1), y = p => h - 28 - (h - 50) * p.n / m;
  const stepped = P => P.flatMap((p, i) => i ? [{ t: p.t, n: P[i - 1].n }, p] : [p]);
  let g = '';
  for (let yy = new Date(t0).getUTCFullYear() + 1; yy <= new Date(t1).getUTCFullYear(); yy++) { const xx = x({ t: Date.UTC(yy, 0) }); g += `<line x1="${xx}" x2="${xx}" y1="10" y2="${h - 24}" stroke="#1e2838"/><text x="${xx + 2}" y="${h - 8}" fill="#8a96a8" font-size="11">${yl(yy, short)}</text>`; }
  g += `<path d="${L.linePath(stepped(A), x, y)}" fill="none" stroke="#4fb3ff" stroke-width="2.5"/><path d="${L.linePath(stepped(B2), x, y)}" fill="none" stroke="#ffc94f" stroke-width="2.5"/>`;
  g += `<text x="${pad}" y="18" fill="#4fb3ff" font-size="12">${esc(sa)} · ${A.length}</text><text x="${pad + 110}" y="18" fill="#ffc94f" font-size="12">${esc(sb)} · ${B2.length}</text><text x="${w - pad}" y="18" text-anchor="end" fill="#8a96a8" font-size="11">cumulative flights</text>`;
  return { viewBox: `0 0 ${w} ${h}`, svg: g };
}
export function progSVG(P, tEnd, { w = 640 } = {}) {
  if (!P.length) return null;
  const h = 240, pad = 40, t0 = Date.parse(P[0].net), t1 = tEnd, m = P.at(-1).n;
  const x = f => pad + (w - pad * 2) * (Date.parse(f.net) - t0) / (t1 - t0), y = n => h - 28 - (h - 50) * n / m;
  let g = '';
  for (let yy = new Date(t0).getUTCFullYear() + 1; yy <= new Date(t1).getUTCFullYear(); yy++) { const xx = pad + (w - pad * 2) * (Date.UTC(yy, 0) - t0) / (t1 - t0); g += `<line x1="${xx}" x2="${xx}" y1="10" y2="${h - 24}" stroke="#1e2838"/><text x="${xx + 2}" y="${h - 8}" fill="#8a96a8" font-size="11">${String(yy).slice(2)}</text>`; }
  g += `<path d="${P.map((f, i) => `${i ? `L${x(f).toFixed(1)},${y(P[i - 1].n).toFixed(1)}L` : 'M'}${x(f).toFixed(1)},${y(f.n).toFixed(1)}`).join('')}" fill="none" stroke="#ffc94f" stroke-width="2.5"/>`;
  g += P.map(f => `<circle class="rp" data-n="${f.n}" data-s="${esc(f.serial)}" cx="${x(f).toFixed(1)}" cy="${y(f.n).toFixed(1)}" r="3.5" fill="#ffc94f"><title>Flight ${f.n}: ${esc(f.serial)}, ${(f.net || '').slice(0, 10)}, ${esc(f.mission)}</title></circle>`).join('');
  g += `<text x="${pad}" y="18" fill="#e8edf5" font-size="12">${m} flights</text>`;
  return { viewBox: `0 0 ${w} ${h}`, svg: g };
}
export function sparkPoints(gaps, w = 640, h = 70, padX = 10, padY = 8) {
  if (gaps.length < 2) return '';
  const mx = Math.max(...gaps.map(x => x.days));
  return gaps.map((x, i) => `${(padX + (w - 2 * padX) * i / (gaps.length - 1)).toFixed(1)},${(h - padY - (h - 2 * padY - 2) * x.days / mx).toFixed(1)}`).join(' ');
}

export function fleetSVG(series, nowYear, { w = 640 } = {}) {
  if (!series.length) return null;
  const short = w < 500;
  const h = 220, pad = 44, max = Math.max(1, ...series.map(x => x.debuted));
  const x = i => pad + (w - pad * 2) * (series.length < 2 ? .5 : i / (series.length - 1));
  const y = v => h - 30 - (h - 60) * v / max;
  let g = '';
  for (let v = 0; v <= max; v += Math.ceil(max / 5 / 10) * 10 || 10) g += `<line x1="${pad}" x2="${w - pad}" y1="${y(v)}" y2="${y(v)}" stroke="#1e2838"/><text x="4" y="${y(v) + 4}" fill="#8a96a8" font-size="11">${v}</text>`;
  g += `<polyline fill="none" stroke="#4fb3ff" stroke-width="3" points="${series.map((p, i) => `${x(i)},${y(p.flying)}`).join(' ')}"/>`;
  g += `<polyline fill="none" stroke="#8a96a8" stroke-width="2" stroke-dasharray="4 3" points="${series.map((p, i) => `${x(i)},${y(p.debuted)}`).join(' ')}"/>`;
  series.forEach((p, i) => g += `<g data-y="${p.year}"><circle cx="${x(i)}" cy="${y(p.flying)}" r="3.5" fill="#4fb3ff"><title>${p.year}: ${p.flying} flying, ${p.debuted} ever flown</title></circle><text x="${x(i)}" y="${h - 10}" text-anchor="middle" fill="#8a96a8" font-size="11">${yl(p.year, short)}${ytd(p.year, nowYear)}</text></g>`);
  g += `<text x="${w - pad}" y="16" text-anchor="end" fill="#4fb3ff" font-size="12">— flying</text><text x="${w - pad}" y="32" text-anchor="end" fill="#8a96a8" font-size="12">- - ever flown</text>`;
  return { viewBox: `0 0 ${w} ${h}`, svg: g };
}

// Horizontal mission timeline for one booster's flights.
export function timelineSVG(flights, { w = 640 } = {}) {
  if (!flights.length) return null;
  const h = 90, pad = 28, t0 = Date.parse(flights[0].net), t1 = Date.parse(flights.at(-1).net);
  const span = (t1 - t0) || 1;
  const x = t => pad + (w - pad * 2) * (t - t0) / span;
  const COL = { ASDS: '#4fb3ff', RTLS: '#5fd38d', Ocean: '#b48cff', EXP: '#ffc94f', Other: '#8a96a8' };
  let g = `<line x1="${pad}" x2="${w - pad}" y1="40" y2="40" stroke="#2a3547" stroke-width="2"/>`;
  for (const f of flights) {
    const xx = x(Date.parse(f.net)), k = !f.landing_attempt ? 'EXP' : (COL[f.landing_type] ? f.landing_type : 'Other');
    const fill = f.landing_success ? COL[k] : (f.landing_attempt ? '#ff6b6b' : COL.EXP);
    g += `<g class="tm" data-n="${f.n}"><circle cx="${xx}" cy="40" r="5" fill="${fill}"><title>#${f.n} ${(f.net || '').slice(0, 10)} ${esc(f.mission)} · ${f.landing_attempt ? (f.landing_loc || f.landing_type) + (f.landing_success ? ' ✓' : ' ✗') : 'expended'}</title></circle></g>`;
  }
  g += `<text x="${pad}" y="16" fill="#8a96a8" font-size="11">${esc((flights[0].net || '').slice(0, 10))}</text>`;
  g += `<text x="${w - pad}" y="16" text-anchor="end" fill="#8a96a8" font-size="11">${esc((flights.at(-1).net || '').slice(0, 10))}</text>`;
  g += `<text x="${pad}" y="72" fill="#8a96a8" font-size="11">${flights.length} flights · blue ASDS · green RTLS · gold expended · red failed landing</text>`;
  return { viewBox: `0 0 ${w} ${h}`, svg: g };
}
