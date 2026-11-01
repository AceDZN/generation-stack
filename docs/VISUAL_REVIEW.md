# Visual review: real captures vs mockups

The four targets in `docs/visual-targets/` were generated before any game code. Each was compared with live captures from the running game at 1280×720 (captures kept in `scratch/review/`, not committed).

## 01 · First 30 seconds (`01-first-30s.png`)

| Mockup | Game | Status |
| --- | --- | --- |
| Tower on a turntable over a brass scissor jack, plaza and town around | Same composition: turntable, jack, plaza, ring of houses and trees, far rooftops | ✅ |
| Floors coloured by group with patterns (yellow dots, green stripes, lavender stars) and lit windows with family silhouettes | Same, using canvas textures; windows enlarged and brightened after the first review | ✅ |
| Glowing blue ghost pyramid on the left | Ghost rebuilt after review: group-tinted glass floors, bright edges, blue halo. Was nearly invisible against the plaza before | ✅ fixed |
| A baby block sliding into a glowing door at the nursery end | Doors glow at both nursery ends as soon as the decade starts (first tray piece auto-selected). Doors now draw over the jack, which used to hide them | ✅ fixed |
| Stork (Shula) flying in with the delivery | Tripo stork model delivers each decade's babies | ✅ |
| Floor labels with group icon and ✓/✗ need markers on the right | Same | ✅ |
| Mayor's board top right with ילודה/תמותה | Same, plus natural increase, migration, stage and population | ✅ |
| Tray of 3D piece cards at the bottom, crank bottom left | Cards show the real 3D pieces rendered to thumbnails; crank bottom left | ✅ |
| Tower fills about half the frame | Camera pulled in after review; small towers still read smaller than the mockup's hero shot | ⚠️ smaller |
| Painterly depth of field and dense, detailed town | Low-poly town, no depth of field (kept for frame rate) | ⚠️ simpler by design |

## 02 · Core crank (`02-core-crank.png`)

| Mockup | Game | Status |
| --- | --- | --- |
| Jack lifts the tower and the new nursery slides in underneath | Jack lifts when the nursery empties at aging and folds as the first family slides in | ✅ |
| Elders fade upward with sparkles at the top | Deaths fade with light and sparkles (gentle, no falling) | ✅ |
| "+1" hearts and people pop-ups | "+N" pop-ups on placement and arrivals | ✅ |
| Services as little houses on the floor ends | Services dock on a floor's front porch so the silhouette stays the real pyramid. They read as small buildings, not end-caps. This is a deliberate rule change, see GAME_IDENTITY | ⚠️ by design |
| Year flip on the decade counter | Year digits flip each decade | ✅ |

## 03 · Near collapse (`03-near-collapse.png`)

| Mockup | Game | Status |
| --- | --- | --- |
| Tower leaning in a gust, leaves and wind streaks | Rapier playback with amplified sway, leaves blowing past | ✅ |
| Red alert vignette at the screen edges | Pulsing red vignette while a collapse plays (off with reduced motion) | ✅ added in review |
| People tumbling out of windows | Not done: blocks tip and slide but nobody falls out (deliberately gentle) | ➖ omitted |
| Fail card "המגדל מתנודד!" with retry-from-last-decade and a hint | Fail panel in Hebrew explaining why (which floor, which side), retry from the decade start, hint line | ✅ |
| Mayor knocked over in the plaza | Mayor plays a worried/fall reaction | ✅ |

## 04 · Level select (`04-level-select.png`)

| Mockup | Game | Status |
| --- | --- | --- |
| 3D diorama island map with 4 regions and a path | HTML world board: 4 coloured region panels in the mockup's 2×2 arrangement, mini tower per level, stone number, stars, locks | ⚠️ 2D, planned |
| Star total top right, big green שחקו bottom left | Same | ✅ |
| Preview card bottom right with tower and target silhouette | Preview card with the level's concept line | ⚠️ text only |

## Fixes made during the review

1. Ghost silhouette given contrast (group-tinted fill, bright edges, halo).
2. Doors drawn on top of the jack and not tone-mapped, so they glow yellow.
3. First tray piece auto-selected each decade, so doors light up without a click.
4. Red collapse vignette.
5. Denser town (a far ring of rooftops) and lighter fog for warmer colour.
6. Tray cards show 3D-rendered pieces instead of emoji.
7. Level select laid out 2×2 like the mockup; RTL ribbon clipping fixed.
8. Camera framing tightened.
