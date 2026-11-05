import { it, expect } from 'vitest'; import fs from 'node:fs'; import { validate } from '../validate.mjs';
const B = JSON.parse(fs.readFileSync('src/boosters.json', 'utf8')).boosters.filter(b => (b.flights || 0) > 0);
const F = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights;
it('committed snapshots are mutually consistent (counts, landings, LL2 fastest turnaround = computed)', () => expect(validate(B, F)).toEqual([]));
it('detects a missing flight', () => expect(validate(B, F.slice(1)).length).toBeGreaterThan(0));
it('detects a landing mismatch', () => { const f2 = F.map((f, i) => i === 0 ? { ...f, landing_success: !f.landing_success } : f); expect(validate(B, f2).join()).toMatch(/landings/); });
it('detects orphan flights', () => expect(validate(B, [...F, { ...F[0], serial: 'B1999' }]).join()).toMatch(/B1999/));
it('detects bad source', () => expect(validate([{ ...B[0], source: 'http://evil' }], F.filter(f => f.serial === B[0].serial)).join()).toMatch(/bad source/));
it('empty inputs', () => expect(validate([], [])).toEqual(['no boosters', 'no flights']));
