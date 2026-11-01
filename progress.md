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

## Performance (measured 2026-11-01, Apple-silicon Mac, 1280×720 at DPR 2 = 2560×1440 drawing buffer)

- Level 14 (Germany, widest tower), 120 frames of update + render with `gl.finish()`: median 1.4–2.1 ms, p95 2.1–3.8 ms (that is far above 60 fps on this machine; slower school laptops will have much less headroom).
- Before simplifying the Tripo props: 1.37 M triangles and 508 draw calls per frame (shadow pass included). After `gltf-transform simplify` on the service buildings, trees, townhouse, bench, fountain and vehicles, and with no shadow casting from the small service buildings: 0.69 M triangles and 451 draw calls. Originals are kept in `assets-src/pre-simplify/` (git-ignored).
- Real rAF frame rate could not be read here because the desktop browser pane was hidden (rAF paused); the numbers above time the game's own frame step directly.
- Bundle: `dist/assets/index-*.js` 5.12 MB (1.88 MB gzip), mostly Rapier's inlined WASM and three.js; fonts limited to the Hebrew and Latin subsets; models load at runtime from `models/` (about 12 MB).
