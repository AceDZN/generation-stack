# Generation Stack · מגדל הדורות — game identity

A wobbly 3D physics stacking puzzle. The tower **is** a country's population: every floor is one age band of ten years, so the tower's silhouette is the country's age pyramid. You keep the tower standing and its people looked after while the decades roll by.

## The 60-second hook

1. A sunny miniature city on a turntable. A short, wide tower of chunky coloured floors stands in the plaza. Shula the stork (שולה) swoops in from the top right with a bundle and drops a baby block into the chute at the bottom of the tower.
2. The player drags the baby block from the tray to the left or right nursery door. It slides into the bottom floor with a squeak. The tower shifts a little on its jack.
3. The mayor's board (top right) says: births 45 per 1,000, deaths 9 per 1,000. The tray also holds service pieces built by the working floors: a classroom, a workplace, a clinic, a beam. The player reads the tower (lots of children) and slides classrooms into the children's floors.
4. The player pulls the big brass **decade crank (מנוף העשור)**. The jack lowers the tower onto its new base; a gust of wind tests it; the tower wobbles. Then everyone ages: the floors are renumbered one band up, the oldest blocks softly fade away in a little light, the jack lifts the whole tower and a new empty nursery floor slides in underneath. The year counter flips from 1970 to 1980.
5. If the base is too narrow or a floor is lopsided, the tower sways, the people blocks squeak and hop, the mayor faints and you retry from the last decade.

## The verbs (ours)

- **Slide in.** Every piece (baby, migrant group, service piece, beam) enters the tower through a door at the left or right end of a floor and fuses onto that end of the row. Which floor and which side are the player's decisions. The number of pieces is fixed by the country's numbers; the player never sets a rate.
- **Serve.** Each floor needs what its people need: classrooms (כיתה) on the children's floors, workplaces (מקום עבודה) on the working-age floors, clinics (מרפאה) on the elderly floors. Service pieces are built by the working-age floors, so a country with few workers gets few pieces: the dependency burden. Unserved people hop and complain, which shakes the tower.
- **Prop up.** Beams (קורה) are pillars that slide into the nursery gap beside the babies to widen a narrow base. They are also built by the working floors.
- **Crank.** Ten years pass. Settle, gust, deaths fade from the top, everyone ages, the jack lifts, a new nursery floor slides in.
- **Read and call.** Some levels ask the player to predict: how many decades until the population hits the mayor's target, which stage of the demographic transition the mystery tower is in (the mayor's banner), which floor each arriving migrant group belongs on.

## Look

- Sunny late-morning light, warm stone plaza, a ring of tiny buildings and trees around the turntable, blue sky with soft clouds. Miniature (tilt-shift-ish depth of field optional), not the toy-industrial look of earlier games.
- The tower: chunky rounded floor rows, each block a little apartment with a window that lights up and a tiny family silhouette. Colour by group, plus a pattern so colour is never the only cue:
  - ילדים (0–19): sunny yellow, polka dots
  - בוגרים (20–59): leaf green, stripes
  - קשישים (60+): lavender, small stars
- Service pieces are different shapes: a classroom with a pitched red roof and a bell, a workplace with a little chimney, a clinic with a dome and a heart, a beam as a striped wooden pillar.
- The jack under the tower: a brass scissor lift. The crank: a big brass lever with a ratchet on the right side of the plinth.
- The target silhouette: a ghosted translucent pyramid outline beside the tower (from real UN data), filling in as you match it.

## Camera and HUD (Hebrew, RTL)

- Camera: 3/4 view from slightly above, tower in the centre, drag to orbit the turntable a little, wheel/pinch to zoom. North/east don't matter in this game (no map), so compass rules don't apply.
- Top right: the mayor's board (לוח ראש העיר): country, year, births and deaths per 1,000 (LTR digits), natural increase, migration events this decade.
- Top centre: decade counter `1970 → 2020` with pips.
- Top left: pause, mute, reduced motion.
- Right of the tower: floor labels with age band (`0–9`, `10–19` … `70+`) and a need icon per floor (met / missing, icon + tick/cross, never colour only).
- Bottom: the tray of pieces to place (babies, migrants, services, beams) with counts; drag a piece to a glowing door.
- Bottom left: the big crank button (מנוף העשור).
- Left of the tower: the ghosted target silhouette.

## Characters (Tripo)

- **Shula the stork (שולה)**: white with black wing tips, red beak and legs, a little courier satchel. Rigged; fly, land, drop, cheer.
- **The mayor (ראש העיר)**: a round cheerful person with a sash and a clipboard. Rigged humanoid; wave, cheer, faint.
- **Townspeople**: little walkers around the plaza. Rigged humanoid; walk, cheer.
- Props: boat, train, small plane (migrant arrivals at the side doors), classroom, workplace, clinic, bench, trees, houses.

People blocks are cheerful generic families, never faces of real nationalities. No borders, walls, deportation or "keep them out" mechanics; refugees are never a penalty. Death is gentle: blocks fade with a soft light.

## Not like (checked before each world)

| Existing | Its verb | Generation Stack instead |
|---|---|---|
| AgePyramidShapeLab (Workbook) | two sliders set the base and top width | the shape grows from placing and aging real blocks; no width slider |
| BirthDeathBalanceLab (Workbook) | sliders for births and deaths, a tank fills | rates are fixed by the level; you handle the consequences physically |
| PopulationGrowthEngineLab (Workbook) | four rate sliders to hit a target growth | no rate controls; the target is a standing tower in a target year |
| MigrationPushPullLab (Workbook) | push, pull and barrier sliders | migrants arrive by transport; you place them and see the effect; no barrier wall |
| BrainDrainBalanceBoard (Workbook) | drag worker cards between two countries | you never move people between countries; the origin country's tower is a second tower that loses blocks |
| MigrationBalanceMeter (Workbook) | inflow and outflow sliders | arrivals and departures are events on the timeline |
| Rush Hour Israel | grab, rotate and snap road pieces | pieces are people floors with physics, not connectors |
| Basin Breakers / Rift Makers / Landscape Detective / Tilt World / Cloud Shepherd / Windshift Riders | terrain, plumes, field tools, walking a globe, steering a cloud, flying a glider | no terrain, no map, no avatar: a tower on a turntable |
| Clumpus, Goblin Kitchen, Halfpipe Joule, Slope Sled, Splash Arc, Bank Shot, Rooftop Radio, Rift Runner, Pie Duel, Perspective Thief | rolling, orders, ramps, sledding, arcs, gliding, portals, duels, perspective | stacking with side insertion and a decade crank |

## Not-like check per world

- **World 1 (ילודה ותמותה):** BirthDeathBalanceLab and PopulationGrowthEngineLab have rate sliders. Here the rates are fixed per decade from WPP or Workbook, and the player only places the babies, builds classrooms and cranks. L3 hits an exact population by reading the board, without changing any rate.
- **World 2 (פירמידות גיל):** AgePyramidShapeLab sets the base and top widths with sliders. Here the shape grows only from real start pyramids aging floor by floor. The ghosted silhouette is a target to compare against, and it is never dragged.
- **World 3 (תנועות הגירה):** MigrationPushPullLab, MigrationBalanceMeter and BrainDrainBalanceBoard have barrier sliders, inflow/outflow sliders and draggable worker cards. Here arrivals and departures are timeline events, and there is no barrier, wall or refusal. In L13 the departures leave the origin as events, and the player only slides the arrivals into the destination tower.
- **World 4 (המגדל הישראלי):** IsraelPopulationMosaicLab shows the composition. Here aliyah waves arrive all at once at every age, and the player supports them with workplaces, classrooms and clinics. Israel's tower is about age structure only: no borders, sovereignty or conflict.
