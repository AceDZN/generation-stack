# Geography 3D games, round 2 (Claude Code crews) — shared builder rules

1 November 2026. **Read `/Users/acedzn/idea-plotter/handoffs/geography-claude-2026-10-31/COMMON.md` first and follow all of it** (authorization and the user's verbatim block, the no-duplicate rule, crew roles, mockups, Tripo search-then-generate with rigging, stack, curriculum, politics, Hebrew RTL, quality bar, tests and deliverables). This file only lists what changes for round 2. Then read your game's `BUILD_HANDOFF.md` in this folder. The ideas and the map evidence are in `/Users/acedzn/idea-plotter/reports/geography-games-claude-2026-11-01/IDEAS.md`; Workbook snapshots for your modules are in `/Users/acedzn/idea-plotter/reports/geography-games-claude-2026-11-01/curriculum/`.

## Why this round

The user has a geography games site (geography-games.workbook.co.il, `apps/geography-games` in acedzn-tools) and wants nine games on it. Seven exist: Tilt World, Rift Makers, Cloud Shepherd, Landscape Detective (Claude crews) and Windshift Riders, Basin Breakers, Rush Hour Israel (Codex crews). The user's words: "let's add another 5 games … find some really cool and fun games to 'copy', it can be anything - from platformers to puzzles to action and sims", then "Yes, 3 Codex + 2 new". You're one of the two new games. "Copy" means borrow the genre and the feel of a great game, not recreate a specific game: no copied characters, levels, names, art or signature mechanics.

## Repositories and ports

| Game | Local repo | GitHub (public) | Dev / preview port |
|---|---|---|---|
| Pocket Planets | `/Users/acedzn/dev/AceDZN-exp/pocket-planets` | AceDZN/pocket-planets | 5245 / 4245 |
| Generation Stack | `/Users/acedzn/dev/AceDZN-exp/generation-stack` | AceDZN/generation-stack | 5246 / 4246 |

- Auto mode refuses `gh repo create --public`, so the user creates the repo. Init the repo locally, commit to `main` from the start, and check `gh repo view AceDZN/<slug>` from time to time. Once it exists, add the remote and push `main`: `git remote add origin https://github.com/AceDZN/<slug>.git && git push -u origin main`. If pushing is refused, keep committing locally and say so in `progress.md` and your report.
- Ports 3000, 3010, 4018, 5173–5246 (except your own), 5301–5303 and their 41xx–43xx twins belong to other apps and games. `strictPort: true`. Never kill a process you didn't start.

## No duplicate mechanics: the list grew

Everything in round 1's `EXISTING.md` still counts (`/Users/acedzn/idea-plotter/reports/geography-games-claude-2026-10-31/EXISTING.md`, one sim per Workbook geography module). Add these, all read-only in `~/dev/AceDZN-exp`:

| Game | Its core verb (don't reuse it) |
|---|---|
| Tilt World | walk a pocket Earth, commit sleep hours or a dated train ticket, photograph sky events |
| Rift Makers | place hot plumes and cold drips in the mantle, commit deep time |
| Cloud Shepherd | steer a cloud over Israel's ridges and pour rain |
| Landscape Detective | read a real 3D landscape with field-tool charges, pin it on a relief map |
| Windshift Riders | fly a sailplane on Israel's weather |
| Basin Breakers | cut and raise terrain to route water |
| Rush Hour Israel | grab, rotate and snap road pieces to rescue a bus |
| Rift Runner (English) | first-person portal puzzle rooms |
| Clumpus (science) | Katamari-style sticky rolling blob |
| Goblin Kitchen (English) | Overcooked-style kitchen orders |
| Halfpipe Joule (science) | skateboarding on ramps with an energy ring |
| Slope Sled, Splash Arc, Bank Shot (math) | sledding on a slope, launching arcs, banking shots |
| Rooftop Radio (English) | cloth glider courier across rooftops |
| Pie Duel, Perspective Thief (math) | probability duel, forced-perspective heist |

Your handoff names the Workbook sims closest to your topic and the verbs they own. Record the check in the "Not like" table in `GAME_IDENTITY.md`.

## Workbook host from day one

The game goes on geography-games.workbook.co.il when it's finished, so build the host contract in as you go rather than retrofitting it: follow `/Users/acedzn/idea-plotter/handoffs/geography-claude-2026-11-01/HOST_PREP.md` items 1–7 (bridge `src/host.ts` copied from pie-duel, `?level=N`, relative assets, `workbook/poster.jpg`, `tests/host-embed.mjs`, `workbook/LEVELS.md`). Don't release to R2 and don't edit acedzn-tools; the lead does that.

Shared Chrome: up to seven agents may use the user's Chrome at once. Work only in your own new tab, never touch other tabs, and respect `/Users/acedzn/dev/AceDZN-exp/.geography-tripo-ui-lock` if a Codex crew holds it.
