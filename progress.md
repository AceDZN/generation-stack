# Progress

## Order of work

1. Read the round-1 and round-2 COMMON briefs, BUILD_HANDOFF and HOST_PREP (copied to `docs/handoff/`).
2. **Mockups first.** The four gameplay targets in `docs/visual-targets/` were generated with gpt-image in ChatGPT before any game code was written (prompts in `docs/visual-targets/PROMPTS.md`).
3. Tripo: gallery search plus a small number of generations and rigs for the stork (Shula), mayor and walker; exports optimized with gltf-transform. Details and credits in [ASSETS.md](ASSETS.md).
4. Pure model (demography, tower, level run, solver), then the Rapier judge calibrated against the static lever rule (289/300 random towers agree).
5. Three.js client, HUD, tray, crank sequence, host bridge.
6. 18 levels and the endless daily tower from the level designer; every level checked by the solver with both the static and the Rapier judge.
7. Visual review against the mockups ([docs/VISUAL_REVIEW.md](docs/VISUAL_REVIEW.md)), an independent playtest pass ([PLAYTEST.md](PLAYTEST.md)).

## Environment notes

- The dev server was started with `npm run dev` in a background shell, because the desktop preview refused another named dev server for this folder (5-server cap). It runs on port 5246 with `strictPort`.
- Screenshots and captures live in `scratch/` (git-ignored). Only the mockups in `docs/visual-targets/` and `workbook/poster.jpg` are committed.

## Repo status

- Commits go to `main` locally.
- The public GitHub repo `AceDZN/generation-stack` could not be created from this session (auto mode refuses `gh repo create --public`). Once it exists:

  ```bash
  git remote add origin https://github.com/AceDZN/generation-stack.git
  git push -u origin main
  ```
