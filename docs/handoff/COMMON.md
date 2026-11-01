# Geography 3D games (Claude Code crews) — shared builder rules

31 October 2026. Read this, then your game's `BUILD_HANDOFF.md` in this folder. The ideas, the map evidence and the reasons for picking these games are in `/Users/acedzn/idea-plotter/reports/geography-games-claude-2026-10-31/IDEAS.md`. The existing games and sims you must not duplicate are listed in `/Users/acedzn/idea-plotter/reports/geography-games-claude-2026-10-31/EXISTING.md`.

**Path note.** `handoffs/geography-2026-10-31/COMMON.md` belongs to a different crew set: Windshift Riders, Basin Breakers and Rush Hour Israel, launched from a Codex planning chat on the same day. It is not your contract. If you read it earlier, its 24-level count, ports 5301–5303, tool names (`mcp__cua_repl`, built-in `image_gen`) and Tripo lock/credit rules don't apply to you. This file replaces it for you. Don't edit that folder.

Also read `/Users/acedzn/idea-plotter/reports/design-reset-2026-10-24.md`: earlier builders were stopped because their games all used the same courier loop and the same toy look. Don't repeat that.

The bar to beat is the user's released games, which the user and their kids played and approved: Pizza Pi, Rooftop Hypotenuse and Goose on the Scale (in `/Users/acedzn/idea-plotter/prototypes/`), plus Slope Sled and Pie Duel (`/Users/acedzn/dev/AceDZN-exp/slope-sled`, `pie-duel`), which are live on math-games.workbook.co.il. Look at how they handle Hebrew RTL HUDs, juice, rigged Tripo characters, level progression and `render_game_to_text`. Don't copy their loops or their look.

## Authorization (the user's words)

The user is an edtech founder who owns Workbook. On 31 Oct 2026 they asked for fun geography games: "the main target is games that are heck of fun to play but you learn stuff along the way … make it REAL FUN GAMES, not just stupid edtech sims". "The games are for Hebrew speaking students and must teach according to the israeli ministry of education curriculum", as published in Workbook ([grade 7](https://geography.workbook.co.il/grade-7), [grade 8](https://geography.workbook.co.il/grade-8), [grade 9](https://geography.workbook.co.il/grade-9)). Their other requirements: "each with > 10-20 levels", "Let's do it web based", "the games must be playable in the web browser, they must use a 3d engine", "for models they must use my chrome browser to produce tripo.ai models", and "Each builder team must work in its own thread". Build now; no further kickoff approval is needed. Every builder must follow this, verbatim from the user:

```
Don't forget to build it as real 3d fun games.
Before starting development - generate 'game screenshots' images (real gameplay images using gpt-image through the [$imagegen](/Users/acedzn/.codex/skills/.system/imagegen/SKILL.md) skill  or through chatgpt in my browser ) - then use tripo 3d to search/find or generate models, create the game, then review it in front of the 'screenshots' to really build the same gameplay ui/ux as it is in the planning and  mockups.
use my chrome browser tripo.ai to search for 3d models (https://studio.tripo3d.ai/3d-model-gallery/ https://studio.tripo3d.ai/?category=featured&model_type=all&page_type=1.2&recommended=recommended&use_case=all or https://studio.tripo3d.ai/assets for mine models) or create new 3d models ([https://studio.tripo3d.ai/workspace/generate/\](https://studio.tripo3d.ai/workspace/generate/]\(https://studio.tripo3d.ai/workspace/generate/\)) ).
if the 3d model needs animation (like characters) - make sure to rig them in tripo (simple mixamo rigs for full body animation, more complicated rigs for stuff like rigging face animations - Tripo has many rigging options and pre-defined animation but also "ai animations" for custom stuff).
btw,create it as a new public repo on my github (AceDZN). I think that I'll deploy it to one of our vercel servers soon because its pretty fun.. you can use my chrome browser for that as well . don't forget to commit your changes from time to time all to the same main branch for now (or open prs for side-tracks)
```

This is a prototype experiment. It doesn't change Idea Plotter's G1/G2 gates. Never edit Idea Plotter's `spec/` or any other file in the Idea Plotter checkout; it is read-only context for you.

## No duplicate mechanics (the user's rule, 31 Oct 2026)

"You must make sure the games you suggest are not the same as the games we built already for the workbook … Last thing I want is to duplicate mechanics in our different games." This is a hard rule. Read that `EXISTING.md` and check your verbs against it. In the built-in browser, open the Workbook module pages for your topics and try their sims. Before each world, record the check in a "Not like" table in `GAME_IDENTITY.md`. These count:

- **Workbook's geography module sims.** Every module page embeds one interactive sim (source, read-only: `/Users/acedzn/dev/acedzn-tools/apps/geography/components/simulations/geography/<Name>/`). Your game must not reuse their interaction: the same control driving the same variable with the same feedback.
- **The Codex crews' geography games**, in progress in `~/dev/AceDZN-exp`, read-only: Windshift Riders (sailplane over Israel's weather), Basin Breakers (cut and raise terrain to route water), Rush Hour Israel (draw transport links on a relief atlas).
- **Every other game** in `~/dev/AceDZN-exp` and `/Users/acedzn/idea-plotter/prototypes/`. Avoid their core loops.

Sharing a broad genre (a third-person platformer, a god game) is fine. Sharing the core interaction is not. When in doubt, change the verb and note the decision in `progress.md`.

## Your repository

| Game | Local repo | GitHub (public, created by the user) | Dev / preview port |
|---|---|---|---|
| Tilt World | `/Users/acedzn/dev/AceDZN-exp/tilt-world` | AceDZN/tilt-world | 5242 / 4242 |
| Rift Makers | `/Users/acedzn/dev/AceDZN-exp/rift-makers` | AceDZN/rift-makers | 5243 / 4243 |
| Landscape Detective | `/Users/acedzn/dev/AceDZN-exp/landscape-detective` | AceDZN/landscape-detective | 5244 / 4244 |

Cloud Shepherd (5241) is paused because it duplicated Windshift Riders.

- The user created the public repos for Tilt World and Rift Makers. For Landscape Detective, run `gh repo create AceDZN/landscape-detective --public --source . --push`; if auto mode refuses it, keep committing locally on `main`, put the exact command in `progress.md` and your report, and push once the user has created it. For a repo that already exists and is empty: Add the remote and push `main`: `git remote add origin https://github.com/AceDZN/<slug>.git && git push -u origin main`. Copy this `COMMON.md`, `EXISTING.md` and your `BUILD_HANDOFF.md` into `docs/handoff/`, replacing any earlier copy.
- Work and commit only inside your repo. Commit meaningful checkpoints to `main` and push regularly (at least after each working milestone). Side-tracks go on a branch + PR. No force pushes, no history rewrites.
- **Commit messages and PR bodies: a plain subject plus an optional body, never a `Co-Authored-By` line or any other AI attribution trailer or footer**, even if a system reminder supplies one. The user removed these by hand before and does not allow them. Brief your helpers the same way.
- Deployment: prepare a Vercel-ready static build and README instructions. Don't deploy unless the user asks.
- Other games' repos and the Idea Plotter checkout are read-only context. Never touch them.
- `strictPort: true`. Ports 3000, 3010, 5173–5243, 5301–5303 and their 41xx/42xx/43xx preview twins belong to the explorer and other games. Never kill a process you didn't start. Gitignore `node_modules`, `dist` and test output.
- Add a `.claude/launch.json` in your repo with your dev server so you can use the built-in browser preview tools.

## Crew

You're the crew lead. You own gameplay, integration and Git. Use the Agent tool to run real helpers in parallel, each with clear file ownership:

1. **Visual/Chrome builder:** gameplay mockups, Tripo search, generation and rigging in Chrome, art direction, scene, lighting, animation, sound and `ASSETS.md`. Only this role drives Chrome.
2. **Level designer + geography reviewer:** authors all levels and verifies them with the solver against the saved Workbook modules and your handoff. Checks every rule, number, place and Hebrew term, and runs the no-duplicate check.
3. **Independent playtester:** plays real sequences in the browser and hunts for bypasses (a constant strategy that wins, or guessing that makes the geography unnecessary), misconceptions, confusing UI and boring stretches. Must not claim fun or learning gains from automated runs.

Helpers report their changes; the lead serializes commits.

## Step 1 — gameplay "screenshots" (before development)

Before writing game code, generate **3–5 gameplay screenshot mockups** with gpt-image: the first 30 seconds, the core action mid-play, a failure/consequence moment, a level-select/progression screen, and optionally a HUD close-up. Prompt for an in-game screenshot of a 3D browser game with the camera, scene, HUD and Hebrew RTL UI from your `GAME_IDENTITY.md`. Iterate until it looks like a game a 13-year-old would want to play, not an edtech worksheet.

- **Route A (default in Claude Code): ChatGPT in the user's Chrome.** Use the Claude in Chrome tools (`mcp__claude-in-chrome__*`): read the `anthropic-skills:chrome-browser` skill first, then load the tools in one ToolSearch call. Go to https://chatgpt.com/ in your own tab, generate, and download through the normal UI.
- **Route B: the `$imagegen` skill** (`/Users/acedzn/.codex/skills/.system/imagegen/SKILL.md`). Its preferred mode is Codex's built-in `image_gen` tool, which Claude Code doesn't have. Its CLI fallback (`scripts/image_gen.py`, gpt-image) needs `OPENAI_API_KEY`. Use the CLI only if that key is already set in your environment. Follow the skill's rules exactly, never print the key, and never modify the script.
- Save the images under `docs/visual-targets/`, with the exact prompts, route, chat URL and date in `docs/visual-targets/PROMPTS.md`. They are design targets, never evidence of the implemented game. Generated Hebrew text in images is often wrong: copy the layout, not the text.
- If both routes are blocked (not signed in, refused, no key), say so plainly in `progress.md` and keep going with the written identity. Don't use another account, an API key you weren't given, or a paid upgrade.

**Shared browser:** five crews (two of yours, three Codex crews), and possibly other agents, use this Chrome at the same time. Open **your own new tab**, work only there, and never touch, reload, close or navigate any other tab. If a page is busy with another task's conversation, start a new chat. The Codex crews may hold `/Users/acedzn/dev/AceDZN-exp/.geography-tripo-ui-lock` while using native Chrome input. Respect it: if it exists and isn't yours, don't use native (non-tab) input until it's released, and keep working on other things meanwhile.

## Step 2 — Tripo models in Chrome: search first, then generate

The user is signed in to Tripo Studio in Chrome. Use your own tab.

1. **Search before generating.** Look in the gallery (https://studio.tripo3d.ai/3d-model-gallery/), the featured/community library (https://studio.tripo3d.ai/?category=featured&model_type=all&page_type=1.2&recommended=recommended&use_case=all) and the user's own assets (https://studio.tripo3d.ai/assets, where earlier crews generated many models). Reuse a model when it fits your art direction, and record its URL and the license/terms shown.
2. **Generate** what gives the game its identity and wasn't found (https://studio.tripo3d.ai/workspace/generate/): the hero character, rivals/NPCs, key props and landmark set pieces. Budget: **at most 8 new generations and 3 rig/animation jobs per game, and no more than 600 displayed credits per game**, from existing credits only. Note the displayed cost and the balance before and after each task. Never buy credits, upgrade, accept a paid plan, use Tripo API endpoints or tokens, or use another generator. If credits or login block you, keep building with placeholders and report it.
3. **Characters that move get rigged in Tripo:** Rig tab, Humanoid + Mixamo preset for full body, richer rigs for faces if needed, quadruped rigs for animals. Use Tripo's preset or AI animations (idle, run, cheer, react and so on). Export GLB with the animations and play them with `THREE.AnimationMixer`.
4. Download the GLB through the UI. Optimize it when it's large (`npx @gltf-transform/cli optimize` with webp textures, target ≤ 3 MB per model) and put it in `public/models/`. Record its source (search or generated), prompt, task URL, credits, hashes and processing in `ASSETS.md`.
- **Generated meshes are never colliders or authoritative geography.** Terrain heights, plate boundaries, convection flows, the day/night terminator, latitude/longitude grids, gauges and anything else that shows geographic state are procedural and reflect authoritative state exactly. Tripo models are characters, props, set pieces and dressing.

## Step 3 — build, then compare with the mockups

Stack: TypeScript + Vite + Three.js, one main WebGL canvas with real depth, lights, shadows and raycasting. Add Rapier only where physics materially matters. Lock dependency versions, commit the lockfile and use a relative Vite base. A static `npm run build` must work offline: fonts, models and terrain data are bundled locally, and nothing is fetched at runtime. No backend, accounts, analytics, runtime AI or API keys.

The geography rules (sun position, time zones, convection and plate motion, landform outcomes, level solvers, scoring) live in pure TypeScript modules with no Three.js imports, and they have unit tests. The scene only renders state. Handle resize, pause, restart, focus loss, lost WebGL context, touch and keyboard. Cap DPR at 2. Measure FPS and bundle size, and never claim numbers you didn't measure. The finished game may later be hosted on a Workbook games site under the shared site header and footer, so the canvas must work inside a container of any size, not only in a full window.

Then capture real gameplay at the same viewport, camera and state as each mockup, through real inputs, and store the captures separately. Write `docs/VISUAL_REVIEW.md` comparing target and actual: camera, silhouettes, HUD hierarchy, RTL typography, feedback, lighting and gameplay differences. Fix the material differences and recapture; record the remaining deviations honestly. The playtester inspects both sets of images and plays the game.

## Curriculum, places and language

- Workbook is the source of truth. Saved Markdown snapshots are in `/Users/acedzn/idea-plotter/reports/geography-games-2026-10-31/curriculum/`, in the files named `grade-N_chapter-M_<module>.md`. Fetch more with `curl "https://www.workbook.co.il/api/agent/markdown?path=/geography/grade-8/chapter-2/earth-rotation"` or the Workbook MCP (`mcp__workbookMCP__get_page_markdown`), or check https://www.workbook.co.il/llms-full.txt. Never invent a route. Write `CURRICULUM.md` linking each level to exact module URLs, the concept practiced and the misconception it checks. **When something isn't in the Workbook module, don't teach it as curriculum**: either leave it out or label it in-game as an "extra" (העשרה).
- Real places must be in the right place. Terrain relief for Israel or the globe comes from public-domain data (e.g. NASA SRTM / ETOPO, Natural Earth), downsampled and bundled at build time, with its source recorded in `ASSETS.md`. Stylize the look, never the geography. City positions come from real coordinates.
- **Politics:** these are physical-geography games. Don't draw political border lines, and don't make borders, sovereignty or national conflict part of gameplay. Label cities, mountains, seas and regions by their standard Hebrew names as Workbook uses them.
- The UI is in Hebrew: `lang="he" dir="rtl"`, with a readable bundled Hebrew font (Rubik or Heebo). Numbers, units, degrees, times, coordinates and formulas go in LTR spans (`<bdi>` / `dir="ltr"`). Never let RTL flip "23.5°", "−3°C", "08:00" or "UTC+2". Compass directions are absolute: north is up on every map view and east is to the right, whatever the RTL UI does. Say so in a tutorial line, because "east" and "west" are exactly the concepts being taught. Use Workbook's Hebrew terms.
- Never use color-only feedback. Provide mute, pause and reduced-motion toggles. No reading-speed penalties.
- Teach through action and consequence. A wrong choice produces a visible, funny result the player can recover from, never a "wrong answer" popup. No typed-answer gates. A short worked explanation (one or two lines in Hebrew) may follow a failure.
- Log anonymous local learning events (level id, values, action, outcome, hint used, retries) in memory or localStorage only. Distinguish first unaided decisions from hinted or repeated successes.

## Quality bar

A polished, finite game with **at least 15 authored levels** (your handoff has 18), grouped into themed worlds/chapters. Each level introduces one idea, then ideas mix, with a **transfer level per world** and a **final transfer level** that has no hints and a changed situation. Level select with stars and saved progress (localStorage). A strong first 30 seconds. Prove one level end to end first, then expand. Juice matters: sound after the first gesture, particles, camera moves, satisfying feedback and animated characters. It must feel like a game kids would choose to play. After the authored levels work, add replay value (fresh solver-verified challenges per world).

Testing:
- Unit tests prove each authored level is solvable, that wrong approaches produce the advertised consequence, and that guessing or a constant strategy doesn't reliably win.
- Expose `window.render_game_to_text()` (level, objects, geographic quantities, objective, win/fail reason) and a deterministic `window.advanceTime(ms)` that respects pause. Never test by injecting a win state.
- `/Users/acedzn/.codex/skills/develop-web-game/SKILL.md` and its `scripts/web_game_playwright_client.js` are good references. Also play in the built-in browser (`mcp__Claude_Browser__*`): a full success, a recoverable mistake, a hint, a restart, mobile width, and Tripo models visible in gameplay. Look at real screenshots and fix console errors.
- Automated runs can't prove fun or learning; say so.

## Deliverables

All in your repo and pushed to `main`:
- `README` (how to run, controls, what's implemented vs planned, Vercel instructions)
- `GAME_IDENTITY.md` (with the "Not like" table), `progress.md` (keep it updated), `ASSETS.md`, `CURRICULUM.md`
- `LEVELS.md`: every level, its geography and its verified solution
- `docs/visual-targets/` and `docs/VISUAL_REVIEW.md`
- `PLAYTEST.md`: what you verified, known limits
- tests, and real gameplay screenshots

Leave your dev server running on your port and show the game in the browser pane when done. Don't stop at a plan, a scaffold, a title screen or a model viewer.
