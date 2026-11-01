# Playtest

An independent AI tester played the game on 2026-11-01 for about an hour in the built-in browser at 1024×768. It used clicks and the keyboard only, with no autoplay and no solver. It did not see the code, the level plans or the designer's notes. Its full notes stay in `scratch/` (git-ignored); this page summarises them and records what was changed.

**This is an AI tester's judgement, not measured fun.** Nobody aged 12–15 has played the game yet. A real classroom playtest is still needed before claiming the game is fun or that it teaches.

## Caveats about the session

- The page hot-reloaded about six times while other files were being edited. Each reload sent the tester back to the start of the level and cleared `mistakes` and `retries`, so **the star counts below are unreliable**.
- localStorage already held 54/54 stars, so the tester never saw the locks a new player sees.
- Screenshots blurred the window, and the game paused on blur. That is expected behaviour.

## Per level

| Level | What happened | Time | Stars shown |
| --- | --- | --- | --- |
| Level select | Readable world board; mini pyramids liked. The info box covers the L11–12 stars and always describes level 1 | — | — |
| L1 Niger | Won first try. Confused that 10–19 turns ✗ when babies arrive (needs are per group) | 1–2 min | 3 |
| L2 Mali | Failed once with no classrooms (good explanation), then won. Felt mechanical: the ✓/✗ icons say what to build | 4 min | 3 (after a reload) |
| L3 India, bell | Rang too early twice; the second time the HUD said 30 while the bell judged a different count | 4 min | 2 |
| L5 hidden country | The flag question opened before the evidence (the nursery width) could be seen; Enter after a fail picked an answer by accident | 4 min | 2 |
| L7 Japan, beams | Collapsed with all babies through one door, while the HUD said "ready". The collapse message taught the beam idea well | 4 min | 3 (after a reload) |
| L9 two towers | Japan showed 46 million here against 144 million in L7. One beam did nothing measurable; collapsed once, then won | 6 min | 2 |
| L12 migration | Wrong-floor lines contradicted themselves; the tray overflowed and hid the service cards; two collapses with no visible lean. Not finished | — | — |
| L14 Germany | Intro only; the hook ("fewer births, yet the tower grows") was liked | — | — |
| L18 Israel 2050 | Two classrooms landed on an adult floor by keyboard accident; the prediction was never revealed; won with ✗ on four floors | 7 min | 2 |

Tone check by the tester: refugees are described with respect, nobody is turned away, deaths read "נפרדו בשקט". No issues found.

## Issues and what was done

Bugs:

| # | Issue | Status |
| --- | --- | --- |
| 1 | The bell judged a different count from the HUD | ✅ Fixed. The bell, the HUD and the board all read the population at the start of the year on the counter, and the miss line says how far off it was |
| 2 | Services docked silently on floors that don't need them | ✅ Fixed. Picking a service moves the keyboard cursor to the busiest floor that needs it; a wasted build shows a toast naming the right service and counts as a mistake. It is still allowed (an honest mistake, not a refusal) |
| 3 | "Ready? Pull the crank" showed while the tower leaned | ✅ Fixed. A lean warning names the floor and side instead |
| 4 | Wrong-floor migrant lines contradicted themselves | ✅ Fixed. The line names the band from the card |
| 5 | Japan's population differed between L7 and L9 | ✅ Fixed. Each tower has its own block size; Japan reads about 128 million in both |
| 6 | The tray overflowed and hid the service cards | ✅ Fixed. Pieces and tools are split; the tools never scroll away |
| 7 | The population label dropped at each crank | ✅ Fixed (same change as #1) |
| 8 | L18 never revealed the prediction; won with ✗ showing | ⚠️ Partly fixed. The win panel now shows the correct answer with its explanation. The ✗ after the last ageing still show |
| 9 | One beam often had no visible effect | ⚠️ Open. The new lean note shows whether the beam helped, but a single beam still may not be enough |
| 10 | The first piece in an empty nursery lands off-centre | ⚠️ Open. Recentring was tried and reverted: it made "always use one door" win too many levels |
| 11 | Choice questions reopened on retry, and Enter could answer them | ✅ Fixed. The question waits for the first crank, and Enter never answers it |

Clarity:

| # | Issue | Status |
| --- | --- | --- |
| 12 | Hebrew fixes (singular death line, העשור, מיליארד, קוביות, migration "+3 / −0", Shula not introduced) | ✅ Fixed. Migration reads "נכנסים X · יוצאים Y"; L1 introduces "שולה החסידה" |
| 13 | Needs are shown per floor but counted per age group | ✅ Fixed in the HUD simplification. One badge per age group, beside its floors |
| 14 | The L5 question came before its evidence | ✅ Fixed. Place the babies first, then answer at the crank |
| 15 | No lean indicator | ✅ Fixed. A note under the stability bar names the side and floor ("נוטה לשמאל · קומה 0–9") |
| 16 | Win panels don't teach | ⚠️ Partly fixed. Choice levels now reveal the answer; no population recap yet |
| 17 | Two-tower tray cards don't say which country | ✅ Fixed. Each card names its country |
| 18 | Decade counter direction in RTL | ➖ Not changed. The counter already reads right to left (this year on the right, ← towards the target); the dashes were the year-flip animation caught mid-way. At the end it shows the target year twice |
| 19 | Camera framing (70+ under the board, L9 edges, huge ghost) | ⚠️ Partly fixed. The camera target and distance were retuned and a phone layout was added; L9 at 1024×768 was not re-checked |
| 20 | Level select info box | ⚠️ Open |

Feel:

| # | Note | Status |
| --- | --- | --- |
| 21 | After L2 the loop runs on autopilot because the HUD does the arithmetic | ⚠️ Open, and the HUD simplification below makes it easier still. The biggest design question left |
| 22 | Collapses are the most fun moment, but they came from things the player couldn't see | ✅ Improved by the lean note and the warning toast |
| 23 | The stork's arrival gates the first selection | ✅ Fixed. The first piece is picked automatically each decade |

## After the playtest: HUD simplification

Following feedback that the screen was crowded and hard to read, the HUD was simplified without changing the art:

- A coach line under the year counter gives one next step at a time and makes the matching control pulse.
- Per-floor ✓/✗ icons and head counts were replaced by an aligned column of age labels and one need badge per age group; a red badge builds the missing service on tap.
- Services are one tap (they dock on the floor of their group that needs them most). The beam card appears from level 4.
- An undo button takes back the last placement or build; the pause menu can restart the decade.
- The mayor's board shows births and deaths in blocks as well as per 1,000; the stage, block size and news moved behind "עוד נתונים" or into a toast.
- Sound, reduced motion and the level map moved into the pause menu, leaving one round button.

All 18 levels were re-run through real input at 1280×720, 1024×768 and 812×375 (18/18 with 3 stars each) and at 375×812 (16/18; the two two-tower levels need the phone sideways and say so).

## The tester's verdict (AI judgement, not measured)

The tester thought a 13-year-old would enjoy the first ten minutes: the plaza, the stork's drop and the crank feel good, and the first collapse is a genuine "whoa" moment. Interest was expected to sag in world 2, because most decades are bookkeeping the HUD has already solved and the interesting decisions (door side, beams) gave little feedback until the tower fell. Several of those complaints are addressed above (lean feedback, honest bell, revealed answers). The autopilot concern (#21) is not, and it should be the first thing a real classroom test checks.
