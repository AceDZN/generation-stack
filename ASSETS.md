# Generation Stack: 3D assets

All runtime models live in `public/models/`. Per-model facts for the engine (scale, forward axis, clip names and durations, quirks) are in `public/models/manifest.json`. This file records provenance: where each model came from, the exact prompt, the Tripo task, the licence basis, credits, and the processing.

Design mockups (not shipped in the build) are in `docs/visual-targets/`, with prompts in `docs/visual-targets/PROMPTS.md`.

## Licence basis

- **New Tripo generations:** text-to-3D in the user's own Tripo Studio account (Pro plan), in the user's signed-in Chrome, visibility **Private**, paid from the account's existing credit balance.
  - Use is governed by Tripo's Terms of Service for that account. Paid-plan output may be used commercially (Tripo terms §5.2.2, as cited in the sibling repos).
  - No API tokens, no other account, no other generator. Nothing was bought or upgraded.
- **Tripo community gallery (fountain, plane, bench):** exported from the public gallery for 5 credits each.
  - The model pages show the creator and prompt but **no explicit licence text**. Use falls under Tripo's general terms for community models.
  - Confirm before any commercial release, and keep the creator credit below.
- **Reused (classroom, workplace, workplace-bakery, house, boat, locomotive, trees):** copied from sibling repos in `/Users/acedzn/dev/AceDZN-exp/`.
  - All were generated in the same Tripo account. Their provenance is in each repo's `ASSETS.md`.
  - They cost 0 new credits.
- **No** third-party marketplace models, CC-BY assets or scraped meshes.

## Credits (this crew, 2026-11-01)

The Tripo balance is **shared with other crews generating at the same time**, so the balance moved for reasons beyond these tasks. My own spend is counted from the cost Tripo displayed for each action.

| Item | Limit | Used | Displayed credits |
|---|---|---|---|
| New generations (HD Model, H3.1 Best Quality, Private) | 8 | 6: stork, mayor, walker, clinic, townhouse, carriage | 6 × 30 = 180 |
| Auto-rig (Humanoid + Mixamo) | 3 rig/animation jobs | 3: stork, mayor, walker | 3 × 20 = 60 |
| Preset animation retargets | (see note) | 24 (8 per character) | 0 each (balance unchanged) |
| Community gallery exports | — | 3: fountain, plane, bench | 3 × 5 = 15 |
| **Total** | 600 | | **255** |

- **Balance:** 2140 at the start → 2135 after the fountain export → about 1585 at the end. The difference beyond 255 was spent by other crews.
- **Retarget note:** each preset click in the Animate tab starts a retarget job that displayed 0 credits and did not change the balance.
  - Per character: idle, walk, cheer, greet_04, wave_goodbye_01, plus 3 role clips.
  - wave_goodbye_01 was left out of the final exports because it is a crouched pose.
- **Re-exports:** stork, mayor and walker were re-exported from the Animate page at 0 credits, to add greet_04 and drop wave_goodbye_01.

## Common processing

Every new Tripo model went through the same steps:

1. Export from Tripo Studio as GLB with 2k textures. Characters were exported from the Animate page with "Export Skeleton" and "Animation stay in Place" on.
2. Save the raw file to `assets-src/tripo/<name>-raw.glb` (gitignored).
3. Optimize with `@gltf-transform/cli` 4.5.1 into `public/models/<name>.glb`. All final files need only `EXT_texture_webp` (some reused ones also need `KHR_mesh_quantization`). No draco or meshopt.

```sh
# characters (keep the skin/skeleton intact)
npx gltf-transform optimize in.glb out.glb --compress false --texture-compress webp --texture-size 1024 \
  --simplify false --flatten false --join false --instance false
# props
npx gltf-transform optimize in.glb out.glb --compress false --texture-compress webp --texture-size 1024 \
  --simplify-ratio 0.6 --simplify-error 0.0005
# reused files (decode meshopt, keep geometry)
npx gltf-transform optimize in.glb out.glb --compress false --texture-compress webp --texture-size 1024 --simplify false
```

Helper scripts are in `assets-src/tools/`:

- `report.mjs`: bbox, tris, exact clip durations, joints and extensions.
- `hips.mjs`: per-clip Hips translation, used to find baked root motion.
- `pin-hips.mjs`: pins a clip's Hips X/Z to the bind pose.
- `normalize.mjs`: adds a root node that scales the largest extent to 1, puts the base at y=0 and centres X/Z.

**Verification:**

- Every final file passes `gltf-transform validate` with 0 errors. The only warnings are generated-tangent-space and, on the characters, skinned-mesh-non-root.
- Every file loads in `THREE.GLTFLoader` (three 0.186.1) in headless Chromium, with its texture decoded and clip names and durations as listed.
- Forward axes were checked on three-view renders: front, +X and −X.

### Mesh simplification (crew lead, after integration)

To keep a full tower scene under about 0.7 M triangles per frame, these final files were run through `npx gltf-transform simplify <in> <out> --ratio 0.25 --error 0.01` (classroom `--ratio 0.15 --error 0.012`, clinic `--ratio 0.18 --error 0.004`): classroom.glb, clinic.glb, tree-olive.glb, tree-palm.glb, townhouse.glb, bench.glb, fountain.glb, locomotive.glb, boat.glb, carriage.glb, plane.glb, house.glb. The sha256 values in this file are the simplified files; byte and triangle counts quoted per model are from before simplification. The pre-simplify files are kept in `assets-src/pre-simplify/` (git-ignored).

## Models

Sizes are final bytes. sha256 is the final file in `public/models/`.

### stork.glb (Shula the stork): new, rigged

- **Prompt** (text-to-3D; the spread-wing T-pose comes from the prompt text): "Stylized cartoon game character: Shula, a cute friendly white stork mascot, full body, standing upright on two long thin bright red legs, both wings spread straight out wide to the sides like a T-pose with the wing feathers clearly separated from the body, white body and head, black flight-feather tips on the wings, a long bright red pointed beak, big friendly round eyes with white highlights, rosy cheeks, a small brown leather courier satchel bag with a strap across her chest. Chunky, bright, clean mobile game style like Pixar, simple readable shapes, smooth hand-painted colours, not realistic. Single character, no ground plane, no base."
- **Task:** https://studio.tripo3d.ai/workspace/generate/2fd8333c-c018-4c19-8d3a-c61446a4bde3. The rig and animate pages use the same id.
- **Rig:** Humanoid + Mixamo, so the wings map to the arm bones (20 credits).
- **Clips:** idle, walk, cheer, greet_04, jump, bow, afraid.
- **Processing:** character optimize. 3,865,216 → 1,811,380 bytes, 19,124 tris, 65 joints.
- sha256 `1159840ed7cf2bfea54d8a755fcfd9ea5d914b7b137744456cde5e1b1a4470b4`

### mayor.glb: new, rigged

- **Prompt** (T-Pose toggle on): "Stylized cartoon game character: a cheerful town mayor, full body standing in T-pose, arms straight out to the sides, legs slightly apart, hands open and empty. Short, round and chubby with a big belly, big warm smile, rosy cheeks, small round glasses, neat brown hair with a bald spot and a friendly bushy moustache. Wears a navy blue suit jacket with gold buttons over a white shirt, a wide red ceremonial mayor's sash with gold trim worn diagonally across the chest with a round gold medal, light grey trousers, shiny brown shoes. A small brown clipboard with white paper is clipped to his belt at the left hip. Chunky, bright, clean mobile game style like Pixar, simple readable shapes, smooth hand-painted colours, not realistic. Single character, no ground plane, no base."
- **Task:** https://studio.tripo3d.ai/workspace/generate/93bc6442-c4f9-4289-aaff-e6f9c6615e96
- **Rig:** Humanoid + Mixamo (20 credits).
- **Clips:** idle, walk, cheer, greet_04, clap, frightened, fall.
- **Quirk:** the clipboard did not generate in the mesh.
- **Processing:** character optimize. 4,551,740 → 2,013,776 bytes, 19,986 tris.
- sha256 `e5dcac04b96b68712cbd8a73a1b3df6256ba4a4ccb49ee54bb3934f1a3303cf0`

### walker.glb (townsperson): new, rigged

- **Prompt** (T-Pose toggle on): "Stylized cartoon game character: a cheerful young townsperson, full body standing in T-pose, arms straight out to the sides, legs slightly apart, hands open and empty. Friendly big smile, big round eyes, short curly brown hair, slightly chunky toy-like proportions with a big head. Wears a bright yellow short-sleeve t-shirt, a teal zip-up vest, rolled-up blue jeans, red sneakers with white soles, and a small green crossbody bag. Generic, not tied to any real nationality or uniform. Chunky, bright, clean mobile game style like Pixar, simple readable shapes, smooth hand-painted colours, not realistic. Single character, no ground plane, no base."
- **Task:** https://studio.tripo3d.ai/workspace/generate/33474d4a-df80-4489-a04b-5ee54aebdc78
- **Rig:** Humanoid + Mixamo (20 credits).
- **Clips:** idle, walk, run, greet_04, cheer, clap, scared_01.
- **Processing:**
  - `pin-hips.mjs ... run` pinned the baked Hips offset in `run` (X −0.021, Z +0.405) back to the bind values (0.002, 0.002).
  - Then character optimize. 4,274,344 → 1,869,688 bytes, 19,634 tris.
- sha256 `2403366393184b6dfaa3b0969cca5f7b0c395426861ef4eea9a995cc60615c32`

### clinic.glb: new

- **Prompt:** "Stylized cartoon game prop: a small cute neighbourhood health clinic building, one storey, clean white rounded walls with soft mint-green trim, a round sky-blue dome roof on top with a big glossy red heart symbol mounted on the front of the dome, a wide glass double door with a little canopy, two round windows, a small potted plant beside the door, a short ramp at the entrance. Chunky, bright, clean low-to-mid poly mobile game style, simple readable shapes, smooth hand-painted colours, not realistic. No red cross, no text, no flags. Isolated single building on a flat base, three-quarter view."
- **Task:** https://studio.tripo3d.ai/workspace/generate/f5caa828-21ec-4eca-a6ee-a4318b661ee7
- **Processing:** prop optimize. 2,274,228 → 461,524 bytes, 14,918 tris.
- sha256 `be782011c55c2888a36157c9c1821e40e95f46ddb49cf10e6babd29eea2be917`

### townhouse.glb: new

- **Prompt:** "Stylized cartoon game prop: a cute narrow two-storey Mediterranean town house for a miniature city plaza, warm cream and peach plastered walls, a steep orange-red clay tile pitched roof with a small chimney, light blue wooden shutters on arched windows, a little flower box with red geraniums under the upper window, a rounded green front door with a small step, a tiny wall lamp. Chunky, bright, clean low-to-mid poly mobile game style, simple readable shapes, smooth hand-painted colours, not realistic. No text, no flags. Isolated single building on a flat base, three-quarter view."
- **Task:** https://studio.tripo3d.ai/workspace/generate/e687f865-bdd1-4a54-ae4c-560f675a218b
- **Processing:** prop optimize. 2,891,524 → 522,400 bytes, 15,530 tris.
- **Quirk:** the front door faces −X.
- sha256 `ae3e464ef354b6114304e89697075734fb8bc7b57a713f2126b6c997d038151b`

### carriage.glb: new

- **Prompt:** "Stylized cartoon game vehicle: a single small toy-like passenger railway carriage to be pulled behind a toy steam locomotive, short chunky body, deep teal-blue painted wooden sides with brass trim bands, a rounded bright red roof, three big round-cornered windows on each side with cream frames, little open platforms with railings at both ends, four big red spoked wheels, simple couplers at both ends. Chunky, bright, clean low-to-mid poly mobile game style, simple readable shapes, smooth hand-painted colours, not realistic. No text, no people. Isolated single object on a short piece of rail track, side three-quarter view."
- **Task:** https://studio.tripo3d.ai/workspace/generate/c0446f11-1887-44ff-a152-485e70abafa7
- **Processing:** prop optimize. 2,993,244 → 678,092 bytes, 14,563 tris.
- sha256 `844ae8fe7ec2844aed8100f4ad7c28f7b1f2a12713fc20504a813d83bd3f47fc`

### fountain.glb: Tripo community gallery

- **Source:** "three-tier stone fountain on a grassy circular base with small flowers" by **woohyun5689** (4K · PBR · H2.5): https://studio.tripo3d.ai/3d-model/three-tier-stone-fountain-on-a-grassy-circular-base-with-small-flowers-0c159058-a862-457d-aaff-8b14913836d1
- **Original prompt:** "three-tier stone fountain on a grassy circular base with small flowers".
- **Licence:** no licence text on the page (see Licence basis). Export cost 5 credits; balance 2140 → 2135.
- **Processing:** prop optimize. 4,246,404 → 528,372 bytes, 11,053 tris.
- sha256 `ca400bbe7e992aad5947078c6fd2efa63937c5e8e145374cf3eba95fc78b41ce`

### plane.glb: Tripo community gallery

- **Source:** "red propeller plane with fixed landing gear, single-engine vintage aircraft" by **benjafuentesy** (H3.1): https://studio.tripo3d.ai/3d-model/red-propeller-plane-with-fixed-landing-gear-single-engine-vintage-air-f45eaf61-e422-4cad-8449-78679f9dd9a5
- **Licence:** no licence text on the page. Export cost 5 credits.
- **Processing:**
  - The raw export is 32,160,916 bytes, about 961k tris.
  - `gltf-transform simplify` stalled at about 98k tris because the geometry is disconnected.
  - Headless Blender (`Blender -b --factory-startup`): merge by distance (0.0008), then a collapse Decimate modifier. Result: `assets-src/tripo/plane-decimated.glb`.
  - Then optimize with `--simplify false`. Final: 827,144 bytes, 26,808 tris.
- sha256 `48c96c997f14968a4f5c9e19748bb4ad8a7febea6e65d443bd66b6bd9def4c19`

### bench.glb: Tripo community gallery

- **Source:** "Park bench with wooden slats and ornate black metal arms" by **rizkyharyono030818** (2K · PBR · H3.1): https://studio.tripo3d.ai/3d-model/park-bench-with-wooden-slats-and-ornate-black-metal-arms-f2eb173e-4909-4233-a624-2fa3e5168d74
- **Licence:** no licence text on the page. Export cost 5 credits.
- **Processing:**
  - Prop optimize.
  - The export was not normalised (about 97.8 units wide), so `normalize.mjs` added a root node with scale 0.010227, base at y=0.
  - 3,028,872 → 555,720 bytes, 13,699 tris.
- sha256 `4c109e87a175d779bb4183cf7784066cef0cd1e43b58fe7b53f8add146faa1e9`

### Reused from sibling repos (0 credits)

The source copies are in `assets-src/reused/` (gitignored). Each was run through the reused-file optimize step, which decodes meshopt and re-encodes textures as 1024 webp; geometry was not simplified. Prompts are quoted in full in the source repo's `ASSETS.md`.

| Final file | Source file (repo) | Original Tripo task | Final bytes | Tris | sha256 |
|---|---|---|---|---|---|
| classroom.glb | school.glb (ph-rangers) | https://studio.tripo3d.ai/workspace/generate/a8878565-a61f-4102-b680-cc21be6a71bf | 468,556 | 13,920 | `1ab468f7c61adee977181263cb1aae726bf7b963d1a2558f8b602ba6328ffd87` |
| workplace.glb | foundry.glb (clean-flow) | https://studio.tripo3d.ai/workspace/generate/93e9263a-5526-419a-8be8-0ac9cae9dea1 | 226,036 | 4,688 | `1d1869c3e22daadd03d4d40ad9704a2f2057c67a56526ec327922ad490a857ae` |
| workplace-bakery.glb | bakery.glb (clean-flow) | https://studio.tripo3d.ai/workspace/generate/ac23e5de-9aa2-44c9-90ef-280c478a21c1 | 270,364 | 4,554 | `6f83113e91d790035e1f238e30851e868a83708f2d2d7b8996bd75eabb4f9698` |
| house.glb | house.glb (ph-rangers round 2, via landscape-detective) | https://studio.tripo3d.ai/workspace/generate/36e90e5a-1cd3-44df-a308-74347b1890ab | 503,692 | 13,956 | `a32df567b6780aa0d9fabc43b5ed8668790f3f9097bd76f1f6ea272cef6f584f` |
| boat.glb | boat.glb (storm-proof) | https://studio.tripo3d.ai/workspace/generate/880dbb6c-3be1-43f1-915f-4517ba7a55a4 | 487,664 | 13,387 | `47bd13e009b37b7d3dc122ae0262b8772326e6ec3ca30446b3ae1d3bf6aa8e15` |
| locomotive.glb | locomotive.glb (tilt-world) | https://studio.tripo3d.ai/workspace/generate/16877449-1ada-4406-805b-b01c5ffe1413 | 641,512 | 18,283 | `929e4c7f7863160fcb8ef50f86815242a2174065b204eb05fb5658300857dc25` |
| tree-olive.glb | olive.glb (ph-rangers) | https://studio.tripo3d.ai/workspace/generate/cf63a88e-5fc4-4735-90da-d2e7712d043d | 744,404 | 19,291 | `2899d8e7601fc14c45ad802e47eba70ff44d4922b9b20a038ab64251beb1cf57` |
| tree-cypress.glb | cypress.glb (ph-rangers) | https://studio.tripo3d.ai/workspace/generate/0758e7c2-13d5-490b-9a2f-fcd318dac973 | 262,852 | 4,783 | `f439f4636e6005487099f033bf3674f646c90c826f907f5616e700e5860f89f7` |
| tree-palm.glb | palm.glb (halfpipe-joule) | https://studio.tripo3d.ai/workspace/generate/896752c3-1a08-4f00-8c43-7edec4cb9e41 | 836,204 | 19,119 | `f1dc0a8450c1c019502efd55e7594a72b523eb10f51efc934fb8ab0d1e5276d9` |

Some reused files are larger than their sources: the sources were meshopt-compressed and are now decoded, so that no decoder is needed at runtime.

**Sensitivity check on reused models:**

- The classroom has a small **plain blue flag** (no emblem) on its roof ridge.
- The locomotive chimney is a stack of calendar pages, carried over from its original game.
- No real landmarks, national flags, borders or walls appear in any final model.

**Not used:**

- `stone-house_cloud-shepherd.glb` renders identical to `house.glb`.
- `acacia_landscape-detective.glb`, the villagers and the kid were not needed.
