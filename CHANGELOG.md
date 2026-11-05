# Changelog

## 0.2.0 — 2026-11-05 (draft PR #1)

TokenMax final-day burn rounds 17–46 on branch `v0.2`.

### Added
- `r` opens a random active booster (`?seed=` for tests)
- Most-landings sort (shareable `?sort=landings`)
- Drawer copy-link + per-booster flights CSV
- Cumulative fleet flights chart; `?` keyboard help dialog
- Year scrubber + `[`/`]` nudge; Space replay shares the same cutoff
- Mission-name search; landing-type filter; quick Active/Expended/All chips
- Drawer mission timeline SVG; block version; Falcon Heavy flight note
- Active fleet over time, landing success rate, monthly heatmap, turnaround histogram
- Reuse curve; pad cadence; recovered share by year; Firsts panel
- Compare table: block + per-spot landing rows
- JSON + Flights CSV downloads; shareable `?y=` / `?lt=`
- Compact sticky on-this-page TOC (open on desktop, collapsed on phone)
- Mutation suite (18 mutants) and deep DOM-vs-raw number tests

### Fixed
- DOM-vs-raw checks for launch failures + stats cards (r44)
- TV mode uses a 60s default interval under prefers-reduced-motion (r43)
- Property tests: spots↔attempts, rank uniqueness, asOf monotonic, cumfleet end (r41)
- Empty state hides lanewrap; drawer per-booster flights CSV (r40)
- Empty filters show Clear filters; skip link; focus-visible rings; snapshot badge (r39)
- Phone: TOC starts collapsed, keyboard hint hidden, tighter controls (r38)
- Playwright / shots / mutation honor `PORT` (default 4477); mutation never `fuser`-kills an unrelated listener
- Interrupted mutation no longer leaves `server.js` path guard disabled
- Year-bar total labels no longer clip above tall phone bars
- TV mode overflow/`html.tv` height lock
- Traversal tests hit a path that actually escapes (`/..%2f…`)

### Data
- Still the committed Launch Library 2 snapshots only; `validate.mjs` cross-checks.
