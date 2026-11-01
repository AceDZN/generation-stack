# Generation Stack · מגדל הדורות — build handoff

Read `../COMMON.md` (and the round-1 COMMON it points to) first. Repo `/Users/acedzn/dev/AceDZN-exp/generation-stack`, GitHub AceDZN/generation-stack, dev port 5246, preview 4246.

## The pitch

A wobbly, funny **3D physics stacking puzzle** in the spirit of the great tower-stacking party games: chunky pieces, real physics, wobble, near-collapse, cheers. The twist is that **the tower is a living population**: every floor is an age group, so the tower's silhouette *is* the country's age pyramid. The map's blend was Tricky Towers × Frostpunk (density 0.656; it did **not** pass the relatedness gate, so treat it as weak evidence, kept because grade 7 has no game yet). Take the feel of physical stacking with stakes for a society. Don't recreate either game: no copied pieces, wizards, modes, names or art.

**Story.** A stork named Shula (שולה), who flies the Israel route like the real migrating storks, delivers newborn "family blocks" to towers around the world. Each tower's mayor needs it to reach a target decade without toppling and with its people looked after.

**The core loop (the verbs are yours, the numbers are the country's):**
- **Catch and place.** New blocks arrive: babies from Shula at the bottom chute, migrant groups by boat, train or plane at the side doors. You rotate and drop or slide them into place. Their *number* is fixed by the level's country and stage (births and deaths per 1,000, migration in and out), shown on the mayor's board. The player never sets a rate.
- **The decade crank (מנוף העשור).** When you pull it, ten years pass: every floor rises one band (everyone ages), a new empty band slides in at the bottom for newborns, and blocks crumble off by the death rate, mostly from the top. Timing the crank matters: crank before the base can carry the weight above and the tower sways.
- **Support beams.** Each floor needs what its people need: classrooms on the children's floors, workplaces on the working-age floors, clinics and benches on the elderly floors. The working-age floors carry the beams that hold up the young and the old. That's the dependency burden, felt as weight.
- **Win:** reach the target year standing, with every floor's needs met. Stars for matching the mayor's target silhouette (a real country's pyramid) and for no near-collapse.
- **Fail is funny:** the tower sways, people blocks squeak and hop to safety, the mayor faints, and you retry from the last decade.

**What you learn (grade 7, chapters 3–4; grade 9, chapter 4):**
- **Births, deaths and natural increase** (ריבוי טבעי = ילודה − תמותה), and the stages of the demographic transition, felt as how fast the base grows when the death rate falls before the birth rate does (התפוצצות אוכלוסין).
- **Age pyramids:** a wide base in less-developed countries vs a narrow base and heavy top in developed, aging ones (הזדקנות), and why both are problems.
- **Migration:** the migration balance (מאזן הגירה = נכנסים − יוצאים); migration types by direction and character (internal vs international, permanent vs temporary, labor migrants vs refugees, עלייה וירידה as Workbook uses them); causes as push and pull; effects such as who arrives (mostly working age for labor migration) and brain drain from the origin.
- **Israel:** population growth from both natural increase and aliyah, and why a planner needs to know which (grade 9, demographic change).

Check every term and number against `reports/geography-games-claude-2026-11-01/curriculum/` (grade-7 chapter-3 and chapter-4, grade-9 demographic-change), plus round 1's saved `grade-7_chapter-3_*` and `grade-7_chapter-4_*` files. Country pyramids come from real UN World Population Prospects data, rounded to bands; record the source and year in `CURRICULUM.md`.

## Not like (check before each world)

| Existing | Its verb | Generation Stack instead |
|---|---|---|
| AgePyramidShapeLab | two sliders set the base and top width | the shape grows from placing and aging real blocks; no width slider |
| BirthDeathBalanceLab | sliders for births and deaths, a tank fills | rates are fixed by the level; you handle the consequences physically |
| PopulationGrowthEngineLab | four rate sliders to hit a target growth | no rate controls; the target is a standing tower in a target year |
| MigrationPushPullLab | push, pull and barrier sliders | migrants arrive by transport; you place them and see the effect; no barrier wall |
| BrainDrainBalanceBoard | drag worker cards between two countries | you never move people between countries; the origin country's tower is a visible second tower that loses blocks |
| MigrationBalanceMeter | inflow and outflow sliders | arrivals and departures are events on the timeline |
| Rush Hour Israel | rotate and snap road pieces | pieces are people floors with physics, not connectors |

## Sensitivity rules

People blocks are cheerful families, never faces of real nationalities. No borders, walls, deportation, rejection or "keep them out" mechanics; refugees are never a penalty. Aliyah and yerida only with Workbook's wording. Death is shown gently, as blocks that softly fade away with a little light, never as violence.

## Worlds and levels (18)

**World 1: born and counted (ילודה ותמותה)**
1. **השולה הראשונה**: tutorial. Catch Shula's blocks, pull the crank once, watch everyone age a floor.
2. **רפואה טובה יותר**: the death rate drops while births stay high; the base explodes and you race to support it.
3. **בדיוק לפי החשבון**: reach a target population exactly; the board shows births and deaths per 1,000 and you plan cranks by natural increase.
4. **ארבעת השלבים**: one tower through the demographic transition stages, each stage a different stacking feel.
5. **Transfer: מגדל אלמוני**: a mystery country; read its tower and say (by choosing the mayor's banner) which stage it's in.

**World 2: the shape of the tower (פירמידות גיל)**
6. **בסיס רחב**: a young, fast-growing country; schools first.
7. **מגדל מזדקן**: a narrow base and a heavy top; clinics and the beams of the working floors.
8. **מי מחזיק את מי**: the dependency burden as weight on the working floors.
9. **שתי מדינות, שני מגדלים**: build two towers side by side, developed and less developed.
10. **Transfer: התאימו לצללית**: match a real country's pyramid with no hints.

**World 3: the doors open (תנועות הגירה)**
11. **נכנסים ויוצאים**: the migration balance; arrivals and departures both on the timeline.
12. **מי מגיע?**: labor migrants (working age), refugees (all ages), internal moves from the countryside to the city; place each where it belongs.
13. **דוחפים ומושכים**: two towers, an origin and a destination; push and pull factors as events, and the origin's tower loses its skilled working floors (brain drain).
14. **Transfer: מגדל ההגירה**: a country whose growth is mostly migration.

**World 4: Israel's tower (המגדל הישראלי)**
15. **גלי עלייה**: the big waves of aliyah, each arriving at once.
16. **ריבוי טבעי ועלייה**: growth from both sources; the planner's board needs to know which.
17. **ישראל היום**: Israel's present pyramid.
18. **Final transfer: מגדל העתיד**: no hints, a remix that projects a tower forward decades.

After the campaign: **endless towers**, solver-verified country scenarios with a daily seed.

## Look and feel

A sunny miniature city on a turntable; the tower is a stack of chunky, colour-coded floors (children, working age, elderly) with little rigged people walking around them, window lights and tiny furniture. Shula swoops in with a wobble. Wind, sway and wobble are real physics. Hebrew RTL HUD: the mayor's board (year, births and deaths per 1,000, migration events), a decade counter, needs icons per floor, and the target silhouette ghosted beside the tower.

**Tripo:** Shula the stork (rigged quadruped/bird rig: fly, land, drop, cheer), the mayor (rigged humanoid: wave, cheer, faint), little townspeople (rigged walkers), boats, a train, a plane, classroom, workplace and clinic props. Floors, physics, counts, rates and the silhouette are procedural and authoritative, never a mesh.

## Tech notes

Use Rapier for the stacking physics (physics matters here), with deterministic stepping so levels are reproducible. The demography (aging, deaths per band, births per stage, migration events, needs) lives in a pure TypeScript model with tests: natural increase, migration balance, band shifting and the solvability of each level. `render_game_to_text()` reports the year, band counts, rates, needs met, tower stability and objective.
