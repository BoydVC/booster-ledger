// Pure SVG builders. Each returns { viewBox, svg } and never touches the DOM.
import * as L from './ledger.js';
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ytd = (y, nowYear) => y === nowYear ? '*' : '';
export function trendSVG(t, nowYear) {
  const w = 640, h = 260, pad = 44, max = Math.max(...t.map(x => x.median));
  const x = i => pad + (w - pad * 2) * (t.length < 2 ? .5 : i / (t.length - 1)), y = v => h - 30 - (h - 60) * v / max;
  let g = '';
  for (let v = 0; v <= max; v += Math.ceil(max / 5 / 50) * 50 || 50) g += `<line x1="${pad}" x2="${w - pad}" y1="${y(v)}" y2="${y(v)}" stroke="#1e2838"/><text x="4" y="${y(v) + 4}" fill="#8a96a8" font-size="11">${v}d</text>`;
  g += `<polyline fill="none" stroke="#4fb3ff" stroke-width="3" points="${t.map((p, i) => `${x(i)},${y(p.median)}`).join(' ')}"/>`;
  g += `<polyline fill="none" stroke="#ffc94f" stroke-width="2" stroke-dasharray="5 4" points="${t.map((p, i) => `${x(i)},${y(p.min)}`).join(' ')}"/>`;
  t.forEach((p, i) => g += `<g class="pt" data-y="${p.year}"><circle cx="${x(i)}" cy="${y(p.median)}" r="4" fill="#4fb3ff"><title>${p.year}: median ${p.median.toFixed(1)} d, fastest ${p.min.toFixed(1)} d, ${p.reflights} reflights</title></circle><text x="${x(i)}" y="${h - 10}" text-anchor="middle" fill="#8a96a8" font-size="11">${p.year}${ytd(p.year, nowYear)}</text><text x="${x(i)}" y="${y(p.median) - 8}" text-anchor="middle" fill="#e8edf5" font-size="11">${Math.round(p.median)}</text></g>`);
  g += `<text x="${w - pad}" y="16" text-anchor="end" fill="#4fb3ff" font-size="12">— median</text><text x="${w - pad}" y="32" text-anchor="end" fill="#ffc94f" font-size="12">- - fastest</text>`;
  return { viewBox: `0 0 ${w} ${h}`, svg: g };
}
export const TCOL = { ASDS: '#4fb3ff', RTLS: '#5fd38d', Ocean: '#b48cff', EXP: '#ffc94f', Other: '#8a96a8' };
export function yearsSVG(t, nowYear) {
  const w = 640, h = 260, pad = 44, max = Math.max(...t.map(x => x.total)), bw = (w - pad * 2) / t.length;
  const y = v => h - 30 - (h - 60) * v / max;
  let g = '';
  t.forEach((p, i) => {
    let acc = 0; const x = pad + i * bw + bw * .15;
    for (const k of ['ASDS', 'RTLS', 'Ocean', 'EXP', 'Other']) { if (!p[k]) continue; g += `<rect class="seg" data-y="${p.year}" data-k="${k}" x="${x}" y="${y(acc + p[k])}" width="${bw * .7}" height="${y(acc) - y(acc + p[k])}" fill="${TCOL[k]}"><title>${p.year} ${k}: ${p[k]}</title></rect>`; acc += p[k]; }
    g += `<text x="${x + bw * .35}" y="${y(p.total) - 5}" text-anchor="middle" fill="#e8edf5" font-size="11" class="tot" data-y="${p.year}">${p.total}</text><text x="${x + bw * .35}" y="${h - 10}" text-anchor="middle" fill="#8a96a8" font-size="11">${p.year}${ytd(p.year, nowYear)}</text>`;
  });
  g += Object.entries(TCOL).slice(0, 4).map(([k, c], i) => `<rect x="${pad + i * 80}" y="8" width="10" height="10" fill="${c}"/><text x="${pad + 14 + i * 80}" y="17" fill="#8a96a8" font-size="11">${k}</text>`).join('');
  return { viewBox: `0 0 ${w} ${h}`, svg: g };
}
export function cmpSVG(A, B2, sa, sb) {
  const pts = [...A, ...B2]; if (!pts.length) return null;
  const w = 640, h = 220, pad = 40, t0 = Math.min(...pts.map(p => p.t)), t1 = Math.max(...pts.map(p => p.t)), m = Math.max(...pts.map(p => p.n));
  const x = p => pad + (w - pad * 2) * (p.t - t0) / ((t1 - t0) || 1), y = p => h - 28 - (h - 50) * p.n / m;
  const stepped = P => P.flatMap((p, i) => i ? [{ t: p.t, n: P[i - 1].n }, p] : [p]);
  let g = '';
  for (let yy = new Date(t0).getUTCFullYear() + 1; yy <= new Date(t1).getUTCFullYear(); yy++) { const xx = x({ t: Date.UTC(yy, 0) }); g += `<line x1="${xx}" x2="${xx}" y1="10" y2="${h - 24}" stroke="#1e2838"/><text x="${xx + 2}" y="${h - 8}" fill="#8a96a8" font-size="11">${yy}</text>`; }
  g += `<path d="${L.linePath(stepped(A), x, y)}" fill="none" stroke="#4fb3ff" stroke-width="2.5"/><path d="${L.linePath(stepped(B2), x, y)}" fill="none" stroke="#ffc94f" stroke-width="2.5"/>`;
  g += `<text x="${pad}" y="18" fill="#4fb3ff" font-size="12">${esc(sa)} · ${A.length}</text><text x="${pad + 110}" y="18" fill="#ffc94f" font-size="12">${esc(sb)} · ${B2.length}</text><text x="${w - pad}" y="18" text-anchor="end" fill="#8a96a8" font-size="11">cumulative flights</text>`;
  return { viewBox: `0 0 ${w} ${h}`, svg: g };
}
export function progSVG(P, tEnd) {
  if (!P.length) return null;
  const w = 640, h = 240, pad = 40, t0 = Date.parse(P[0].net), t1 = tEnd, m = P.at(-1).n;
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
