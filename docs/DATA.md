# Data notes

Both snapshots come from the public [Launch Library 2 API](https://thespacedevs.com/llapi) by The Space Devs. Nothing in the app is typed in by hand.

| File | Endpoint | What it holds |
|---|---|---|
| `src/boosters.json` | `/2.3.0/launchers/` | One record per first-stage serial: flights, landings, status, first/last flight, LL2's fastest turnaround, a short description and the record URL. |
| `src/flights.json` | `/2.3.0/launches/previous/?lsp__name=SpaceX&mode=detailed` | One row per booster per launch: the booster's flight number, mission, date (NET, UTC), pad, rocket, landing attempt/success/location/type and the launch URL. |

`validate.mjs` checks that the two agree for every booster (flight count, successful landings, and LL2's own fastest-turnaround value against the gap computed from launch dates). `npm run refresh` refuses to save a new pull that fails these checks.

## Caveats, straight from the data
- **AMOS-6 (2016)** counts as a flight for B1028 in LL2 even though the rocket was lost on the pad before launch. It shows as a launch failure, with OCISLY assigned but no landing attempt.
- **Turnaround** is the time between two consecutive launch dates for the same booster, not the time from landing to the next launch.
- **Status** (active, expended, lost, destroyed, retired) is the booster's *current* status. Replay shows counts as of each year but keeps the final status colors, because the data doesn't give a dated status history.
- The current year is a partial year and is marked `*`.
- The only boosters included are those with B10xx serials, which covers Falcon 9 Block 1 through Block 5 and the Falcon Heavy side and core stages.

## Block version
`blockOf` prefers an explicit "Block N" (or "Falcon Heavy core") phrase in the LL2 `details` field. When details omit it, the serial is mapped with the public Falcon 9 ranges: B1046+ is Block 5 (first Block 5 flight was Bangabandhu-1 on B1046, May 2018), B1021–B1045 is Full Thrust (Block 3/4 era), and earlier B10xx cores are v1.0/v1.1. Zero-flight boosters such as B1099 stay in the raw snapshot but are filtered out of the on-screen fleet (`flights > 0`).
