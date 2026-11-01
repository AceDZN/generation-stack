# מגדל הדורות · Generation Stack

A Hebrew 3D physics stacking puzzle where **the tower is a country's age pyramid**. Every floor is a ten-year age band; every block is a family of people. Slide newborns into the nursery, dock classrooms, workplaces and clinics on the floors that need them, then pull the **decade crank**: everyone ages one floor, deaths fade out gently, births and migrants arrive, and a gust of wind tests whether the shape you built still stands.

Covers grade 7 geography (chapters 3–4: population, demography, migration) and grade 9 demographic change. See [CURRICULUM.md](CURRICULUM.md) and [LEVELS.md](LEVELS.md).

## Run

```bash
npm install
npm run dev        # http://localhost:5246
npm test           # model, level and host unit tests
npm run build      # typecheck + production build into dist/
npm run preview    # serves dist/ on http://localhost:4246
npm run host-embed # iframe bridge check against the running dev server
```

Deep link a level: `http://localhost:5246/?level=7`.

## Controls

| Action | Mouse / touch | Keyboard |
| --- | --- | --- |
| Pick a piece from the tray | tap a card | `1`–`9` |
| Slide a family in | tap a glowing door at either end of a floor | `↑`/`↓` floor, `←`/`→` side, `Enter` |
| Dock a service | pick a service card, tap a floor | pick, `↑`/`↓`, `Enter` |
| Prop the nursery | pick the beam, tap a nursery door | pick, `Enter` |
| Pull the decade crank | the crank, bottom left | `Space` or `C` |
| Ring the bell (exact-target levels) | the bell | `B` |
| Orbit / zoom | drag, pinch, wheel | — |
| Retry after a fall | panel button | `R` / `Enter` |
| Pause, mute | top-left buttons | `Esc`/`P`, `M` |

A reduced-motion toggle (🌀) turns off the camera sway, gust amplification and the red alert pulse.

## How it works

- `src/model/` is pure TypeScript (no Three or Rapier): demography (births, deaths, aging, services needed, building points), tower rows and the static lever-rule stability check, the `LevelRun` state machine, a greedy solver used by the tests, the 18 authored levels and the daily-seed endless tower.
- `src/physics/judge.ts` runs a deterministic Rapier simulation of each crank: one rigid box per floor, a gust right then left. The recorded poses are what you see wobble on screen.
- `src/game/` is the Three.js client: plaza and turntable, tower view, HUD, tray, characters (Tripo models with procedural fallbacks), synthesized sound.
- `src/host.ts` is the Workbook host bridge (verbatim from pie-duel): `ready`, `level-start`, `level-complete {level, stars, durationMs}`.

## Implemented vs planned

Implemented:
- 18 authored levels in 4 worlds, each verified winnable by the solver under the Rapier judge, plus an endless daily-seed tower.
- Real Rapier wobble playback, near-collapse warnings, gentle fading deaths, migrant arrivals by plane, boat, train and bus.
- Stars (win, no near-collapse, clean first try), saved in `localStorage` (`generation-stack:v1`).
- Workbook host contract, `?level=N` deep links, relative asset paths.

Planned:
- A 3D diorama level select (the current select is an HTML world board).
- Voice-over for the intro lines.

## Deploy to Vercel

The game is a static Vite build with relative asset paths.

1. Import the GitHub repo `AceDZN/generation-stack` in Vercel.
2. Framework preset: **Vite**. Build command `npm run build`, output directory `dist`.
3. No environment variables are needed.

Or from the CLI, inside the repo:

```bash
npx vercel --prod
```
