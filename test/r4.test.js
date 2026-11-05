import { it, expect } from 'vitest'; import fs from 'node:fs'; import * as L from '../src/ledger.js'; import { boosterRow } from '../scripts-refresh.mjs';
const FL = JSON.parse(fs.readFileSync('src/flights.json', 'utf8')).flights;
it('launch failures are exactly the non-success outcomes', () => expect(L.launchFailures(FL).every(f => f.launch_status !== 'Success')).toBe(true));
it('launch failures listed are CRS-7, AMOS-6, Starlink 9-3 in snapshot', () => expect(L.launchFailures(FL).map(f => f.serial)).toEqual(['B1018', 'B1028', 'B1063']));
it('boosterRow maps API fields', () => expect(boosterRow({ serial_number: 'B1067', flights: 3, successful_landings: 3, attempted_landings: 3, first_launch_date: 'a', last_launch_date: 'b', status: { name: 'active' }, fastest_turnaround: 'P1D', details: 'x'.repeat(400), url: 'u' })).toMatchObject({ serial: 'B1067', status: 'active', details: 'x'.repeat(300) }));
it('boosterRow tolerates missing status/details', () => expect(boosterRow({ serial_number: 'B1', url: 'u' })).toMatchObject({ status: undefined, details: '' }));
