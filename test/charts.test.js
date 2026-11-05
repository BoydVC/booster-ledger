import { it, expect, describe } from 'vitest'; import fs from 'node:fs'; import * as L from '../src/ledger.js'; import * as C from '../src/charts.js';
const FL = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights;
describe('chart builders', () => {
  it('trend: one point group per year', () => { const t = L.turnaroundByYear(FL); expect((C.trendSVG(t, 2026).svg.match(/class="pt"/g) || []).length).toBe(t.length); });
  it('trend marks only current year with *', () => { const s = C.trendSVG(L.turnaroundByYear(FL), 2026).svg; expect(s).toContain('2026*'); expect(s).not.toContain('2025*'); });
  it('years: totals labels equal data', () => { const t = L.flightsByYear(FL), s = C.yearsSVG(t, 2026).svg; for (const y of t) expect(s).toContain(`class="tot" data-y="${y.year}">${y.total}<`); });
  it('years: segment heights are non-negative', () => { const s = C.yearsSVG(L.flightsByYear(FL), 2026).svg; for (const m of s.matchAll(/height="([-\d.e]+)"/g)) expect(+m[1]).toBeGreaterThanOrEqual(0); });
  it('cmp: null for no data', () => expect(C.cmpSVG([], [], 'a', 'b')).toBeNull());
  it('cmp escapes serials', () => expect(C.cmpSVG([{ t: 1, n: 1 }], [{ t: 2, n: 1 }], '<x>', 'b').svg).toContain('&lt;x&gt;'));
  it('prog: one circle per record', () => { const P = L.recordProgression(FL); expect((C.progSVG(P, Date.now()).svg.match(/class="rp"/g) || []).length).toBe(P.length); });
  it('prog: null when empty', () => expect(C.progSVG([], 0)).toBeNull());
  it('spark: empty under 2 gaps', () => expect(C.sparkPoints([{ days: 3 }])).toBe(''));
  it('spark: points stay inside the box', () => { const p = C.sparkPoints([{ days: 1 }, { days: 50 }, { days: 9 }]); for (const xy of p.split(' ')) { const [x, y] = xy.split(',').map(Number); expect(x).toBeGreaterThanOrEqual(0); expect(x).toBeLessThanOrEqual(640); expect(y).toBeGreaterThanOrEqual(0); expect(y).toBeLessThanOrEqual(70); } });
  it('no NaN anywhere', () => { for (const s of [C.trendSVG(L.turnaroundByYear(FL), 2026).svg, C.yearsSVG(L.flightsByYear(FL), 2026).svg, C.progSVG(L.recordProgression(FL), Date.now()).svg]) expect(s).not.toMatch(/NaN|undefined|Infinity/); });
});
describe('narrow charts', () => {
  it('short year labels when narrow', () => { const s = C.yearsSVG(L.flightsByYear(FL), 2026, { w: 400 }).svg; expect(s).toContain("'25<"); expect(s).toContain('viewBox' in C.yearsSVG(L.flightsByYear(FL), 2026, { w: 400 }) ? '' : ''); });
  it('viewBox follows width', () => expect(C.trendSVG(L.turnaroundByYear(FL), 2026, { w: 400 }).viewBox).toBe('0 0 400 260'));
  it('wide default keeps full years', () => expect(C.trendSVG(L.turnaroundByYear(FL), 2026).svg).toContain('>2019<'));
});
