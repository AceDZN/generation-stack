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

In world 1 (levels 1–5) a line under the year counter says the one next step (① put the newcomers in, ② build what is missing, ③ pull the crank), and the matching card or button pulses. From world 2 on it shows only the goal and a **💡 רמז** button (`H`) that reveals the step for the rest of that decade, so the later levels stay a puzzle.

| Action | Mouse / touch | Keyboard |
| --- | --- | --- |
| Pick a group to put in | tap its card under "להכניס למגדל" (identical bundles stack into one card) | `1`–`9` |
| Slide a group in | tap a glowing yellow arrow at either end of a floor | `↑`/`↓` floor, `←`/`→` side, `Enter` |
| Build a classroom, workplace or clinic | one tap on its card, or on the red **+** badge beside the age group that needs it; it goes to the floor that needs it most | `1`–`9` |
| Prop the nursery (from level 4) | pick the beam, tap a nursery arrow | pick, `Enter` |
| Undo the last placement or build | **↶ ביטול** in the tray | `Z` / `Backspace` |
| Pull the decade crank | the crank, bottom left | `Space` or `C` |
| Ring the bell (exact-target levels) | the bell | `B` |
| Orbit / zoom | drag, pinch, wheel | — |
| Retry after a fall | panel button | `R` / `Enter` |
| Pause menu: restart the decade, level map, sound, reduced motion | ⏸ top left | `Esc`/`P` (`M` mutes) |

Beside the tower, the age labels form one column and each age group (children, adults, elders) has one badge: ✓ when it has enough, or what it is missing. Above the crank, a pill says whether the tower is balanced or which way it leans. The mayor's board shows the year, the population, and the decade's births and deaths both per 1,000 and in blocks; "עוד נתונים" opens the rest.

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
- Phone layouts: upright, the coach line runs across the top, the board is a small summary above the tray and the crank sits in the tray; sideways, everything shrinks and the camera lifts the tower above the tray. Two-tower levels ask an upright phone to turn sideways.
- Endless mode: one daily tower per date (seeded), the same for every player that day.

Planned:
- A 3D diorama level select (the current select is an HTML world board).
- Voice-over for the intro lines.

Known limitations:
- Building only classrooms still wins 8 of the 18 levels with young towers, because ageing turns classrooms into workplaces. The bypass tests record this.
- The first piece in an empty nursery lands one cell off-centre, depending on the door.
- The level-select preview covers some stars and always describes level 1.
- One-tap services and the need badges still make the bookkeeping easy; from world 2 the coach stays quiet unless asked, but whether that is enough to keep the later levels a puzzle is untested (PLAYTEST.md, issue 21).
- Not yet played by real students; [PLAYTEST.md](PLAYTEST.md) is an AI tester's judgement.

## Deploy to Vercel

The game is a static Vite build with relative asset paths.

1. Import the GitHub repo `AceDZN/generation-stack` in Vercel.
2. Framework preset: **Vite**. Build command `npm run build`, output directory `dist`.
3. No environment variables are needed.

Or from the CLI, inside the repo:

```bash
npx vercel --prod
```
