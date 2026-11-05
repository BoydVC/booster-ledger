# Adversarial review (Round 18)

Findings from a fresh read of `src/ledger.js`, `src/charts.js`, `src/app.js`, `server.js`, and the committed snapshots.

## Fixed this round
1. **Interrupted mutation left `server.js` path guard as `if (false)`.** Restored the `startsWith(root)` check before any further work. Mutation suite now restores every file before the next mutant and covers charts/app/server too.
2. **Search only matched serials.** Mission names (e.g. `CRS-2 SpX-22`) now resolve to the booster that flew them via `filterWithMissions`.
3. **No way to scrub the as-of year except full replay.** Added a range scrubber wired through the same `cutoff` path as Replay.
4. **Drawer had a table but no visual flight arc.** Added `timelineSVG` (one mark per flight, colored by landing outcome).
5. **No fleet-size-over-time view.** Added `fleetSizeByYear` + chart; final-year `flying` equals the active count (tested).
6. **Block version mostly missing from LL2 details.** `blockOf` prefers details text, else public serial ranges (B1046+ = Block 5), documented in DATA.md.
7. **Playwright config assumed a missing browser build and refused an already-running :4477.** Pinned `PW_CHROME` to the installed headless shell and set `reuseExistingServer: true`.

## Accepted / deferred
- **Charts sit below a long lifelines list** (94 rows). By design; sticky year axis keeps years visible while scrolling lanes. Year labels inside SVG charts sit at `y = h - 10` inside the viewBox (not clipped).
- **Records / trend / spots stay fleet-wide** when filters are on. Lifelines and stats respect filters; records are labeled as fleet records. Changing that would surprise deep-links to `#rec-*` style content.
- **B1099 (0 flights) is in the raw snapshot but filtered from the wall.** Documented; `load` requires `flights > 0`.
- **TV mode still cycles the unfiltered top 10.** Intentional for the wall display.

## Blast radius of Round 18 changes
| Change | Callers | Tests covering them |
|---|---|---|
| `filterWithMissions` replaces `filter` in `current()` | stats, fate, lanes, lists, replay, j/k order, CSV | unit r18 + e2e mission search; existing filter e2e still pass |
| `setCutoffYear` shared by scrubber + replay | render path | e2e scrubber; existing replay as-of tests |
| `timelineSVG` in drawer | `#detail` HTML | e2e circle count == flightsFor |
| `fleetSVG` / `blockCounts` | new `#fleetsvg` / `#blocks` | unit series invariants + e2e year attrs |
| `blockOf(details, serial)` | drawer subtitle + blocks legend | unit serial ranges + e2e "Block 5" on B1067 |
| keydown j/k | opens drawer, walks `ordered()` | e2e j/k |
| playwright.config.js | all e2e | 77 passed against live :4477 |


## Round 25 mutation hardening
All 18 mutants in `scripts-mutation.mjs` now die (was 13/18). Fixes:
- Unit test that trend titles use `min` not `median`.
- Drawer verify includes B1012 (failed landing) so ✓/✗ mutant dies.
- Fastest-list e2e scrubs to 2020 and asserts B1058 · 51.1 days.
- `safeUrl` moved to `ledger.js` with unit tests; mutation is unit-scoped.
- Traversal e2e uses `/..%2fpackage.json` (actually escapes) and expects 403; mutation runner sets `MUTATION=1` so Playwright does not reuse the pre-mutant server on :4477.


## Round 37–50 (final-day burn, 2026-11-05)

### Fixed
- Mutation no longer `fuser -k`s :4477; kills only our PORT pid file.
- Playwright/shots honor `PORT` so a pre-existing :4477 server is left alone.
- Phone TOC starts collapsed; keyboard hint hidden; controls tightened.
- Empty filters: Clear filters button, lanewrap hidden, stats go to zero honestly.
- Drawer `#dserial` + copy-link so title asserts stay stable; per-booster flights CSV.
- Quick chips keep `aria-pressed` in sync with `#status`.
- TV default interval 60s under `prefers-reduced-motion`.

### Accepted
- Records/firsts stay fleet-wide when lifelines are filtered (deep-linkable fleet facts).
- PAC expended splashdowns have `landing_loc` but `landing_attempt=false`, so they correctly omit from `spotsFleet`.
- Narrow screens scroll lanewrap to the newest years on purpose.

### Verification posture
Unit + property + Playwright DOM-vs-raw + axe + 18-mutant suite. Screenshots OCR-clean of family names.
