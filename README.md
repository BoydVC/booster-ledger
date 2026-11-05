# Booster Ledger

Every Falcon first stage with a B10xx serial on one screen: how many times it flew, how it ended, how fast it turned around, and where it landed.

![demo](screenshots/demo.gif)

![wall](screenshots/wall-1440x900.png)

## What's on the screen
- **Lifelines:** one bar per booster, from its first flight to its last. Blue is active, gold expended, red lost or destroyed, and the number is its flight count. You can sort by most flown, first flight or newest, filter by status or to Falcon Heavy boosters, or search by serial.
- **Replay the years** (Space): watch the fleet grow. The stats, bars and leaderboards show counts as of each year.
- **Booster drawer** (click a bar or open `#B1067`): every flight with its mission, date, landing spot and source link, plus days between flights, where it landed, its rank and landing rate. Launch failures and Falcon Heavy flights are tagged.
- **Records:** first reflight, fastest turnaround, most flights, every launch failure, and the busiest droneship. Each one links its source.
- **Turnaround trend:** median and fastest days between reflights, by year.
- **Flights per year** split by how the booster came home (droneship, back to land, ocean or expended).
- **Reuse record progression:** the first booster to reach each flight count.
- **Landing spots** and **launch pads and rockets** tables.
- **Compare two boosters:** cumulative-flights chart and a side-by-side table.
- **Link** copies a URL with the current filters and comparison, and **CSV** downloads the boosters shown.
- **TV mode** (`?mode=tv`, optional `&every=8000`): big-type cards that cycle through the 10 most-flown boosters. Use the arrow keys to step and Esc to exit.

## Data
Public data only, from [The Space Devs Launch Library 2 API](https://thespacedevs.com/llapi). Both snapshots are committed in `src/` with their fetch times, and every booster and flight links its LL2 record. See [docs/DATA.md](docs/DATA.md) for fields and caveats, such as AMOS-6 counting as a flight. `validate.mjs` checks that the two snapshots agree for every booster, and `npm run refresh` refuses to save a pull that fails those checks. This project isn't affiliated with SpaceX. The server only serves files from `src/`, and the page makes no outside requests at runtime.

## Run (2 minutes)
```
npm i
npm start                        # http://127.0.0.1:4477
npm test                         # unit + data-consistency tests
npx playwright test              # browser tests: features, DOM numbers vs raw JSON, a11y (axe), security
# If Playwright's bundled browser is missing, point it at a local one:
# PW_CHROME=/path/to/chrome-headless-shell npx playwright test
npm run refresh                  # re-pull both snapshots (~10 requests; anonymous LL2 allows ~15/hour)
```

## Layout
`src/ledger.js` holds pure data functions, `src/charts.js` pure SVG builders, `src/app.js` the DOM wiring and `server.js` a static server for `src/` only. `scripts-flights.mjs` derives `flights.json` from the raw API pages, and `validate.mjs` does the cross-checks. Tests live in `test/` (vitest) and `e2e/` (Playwright).
