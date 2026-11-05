# Booster Ledger

Every Falcon first stage with a B10xx serial on one screen: how many times it flew, how it ended, and how fast it turned around.

![demo](screenshots/demo.gif)

- **Lifelines:** one bar per booster from its first to its last flight. Color shows status (blue active, gold expended, red lost or destroyed). Opacity shows flight count.
- **Most flown** and **fastest turnaround** leaderboards. Click any booster to see its record and a link to the source entry.
- **Replay the years:** watch the fleet grow and reuse take off year by year.

## Data
Public data only, from [The Space Devs Launch Library 2 API](https://thespacedevs.com/llapi) (`/2.3.0/launchers/`). The snapshot is committed at `src/boosters.json` with its `fetched_at` time, and each booster links its source record. Run `npm run refresh` to re-pull it (the anonymous API allows about 15 requests an hour). This project isn't affiliated with SpaceX. The server only serves files from `src/`.

## Run
```
npm i && npm start            # http://127.0.0.1:4477
npm test                      # unit tests
npx playwright test           # browser tests (set PW_CHROME to a local chromium if needed)
```
