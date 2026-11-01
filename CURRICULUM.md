# Generation Stack · מגדל הדורות: curriculum map

Every level sits on Workbook geography modules. The terms below are spelled the way Workbook spells them; I checked them against the module content in `apps/workbook/Data/Modules/geography` on 2026-11-01. Content that is not in Workbook is either left out or labelled **העשרה** in the game.

## Data sources

- **Country pyramids, rates and migration:** UN, *World Population Prospects 2024*, as processed by Our World in Data (CSV exports dated 2024-07-12). The direct UN data API needs a key, so I used the OWID mirror of the same release.
  - **Age shares:** five-year groups, merged into 10-year floors (0–9 … 60–69, 70+).
  - **Rates:** birth and death rates are the decade means of the yearly crude rates, rounded to whole numbers per 1,000.
  - **Projections:** values from 2020 on are the WPP medium-variant projection.
  - **Where to look:** all the numbers are in `src/model/countries.ts`, together with the rounding and apportioning rules.
- **Workbook's own numbers** take priority wherever a module quotes them (`WORKBOOK` in `countries.ts`):
  - Niger 45/9 (children 49%, elders 3%).
  - Israel 19/5 (the Growth Engine sim uses 20/5; children 28%, elders 12%).
  - Germany 9/12.
  - Japan 7/12 (children 12%, elders 29%).
  - Worked examples 30 − 10 = 20 and 50,000 − 30,000 = +20,000.
- **Aliyah totals:** Israel CBS, *Statistical Abstract of Israel 2012*, Table 4.2. I read them through the Wikipedia article "Aliyah" because I could not open the CBS table directly. **Treat them as approximate.**
  - 1948–51: 687,624. 1952–60: 297,138. 1961–71: 427,828.
  - 1990–99: 1,059,993. Workbook rounds this as "כמיליון" in grade-9/chapter-4/demographic-change.
- **Rounding to blocks:** one block is a fixed number of people per level (`peoplePerBlock`). Shares are apportioned by largest remainder. A start tower is the real pyramid at the start year moved up one floor, with an empty nursery for the first decade's babies.

## Game simplifications (stated to teachers)

- **Age groups:** the game groups people as **children 0–19, adults (working age) 20–59, elders 60+**. These cutoffs are a game simplification so that a floor is a 10-year band. Statistics usually use 0–14 / 15–64 / 65+. Workbook's age-pyramids module names the three groups (ילדים, בוגרים, קשישים) without giving cutoffs.
- **Deaths:** spread by stage. Stage 1 deaths fall on all ages, including babies; from stage 3 they fall mostly on the oldest floors. Deaths are shown gently: blocks fade.
- **Stage banner:** follows Workbook's stage rule.
  - Stage 1: births ≥ 30 and deaths ≥ 28.
  - Stage 2: births ≥ 30.
  - Stage 3: births ≥ 15.
  - Stage 4: otherwise.
- **Gross migration splits:** in L11, L13 and L14 the split into arrivals and departures is illustrative, because WPP publishes only net migration. The net balance follows WPP's sign and rough size.
- **Unnamed towers:** L12 'העיר הגדולה' and L13 'ארץ המוצא' / 'ארץ היעד' are unnamed templates. They are built on Spain 2000, Philippines 2000 and Canada 2000 shares.
- **Future aliyah in L18:** projections give no aliyah, so L18's arrivals are labelled העשרה in-game ("if aliyah continues as in the 2010s"). Israel's 2010s net migration was about 2.3 per 1,000 per year, which is about one block per decade at 250,000 people per block.

## Per level

Paths are on https://geography.workbook.co.il/.

| # | Title | Workbook modules | Concept | Misconception it checks | Workbook terms |
|---|---|---|---|---|---|
| 1 | השולה הראשונה | [grade-7/chapter-3/demographic-processes](https://geography.workbook.co.il/grade-7/chapter-3/demographic-processes) | Births per 1,000 per year fill the nursery. One crank = 10 years, and everyone ages a floor. | "A birth rate is a number of babies" (it is per 1,000 people per year) | ילודה, שיעור ילודה, לכל 1000 תושבים |
| 2 | רפואה טובה יותר | [grade-7/chapter-3/demographic-processes](https://geography.workbook.co.il/grade-7/chapter-3/demographic-processes), [grade-7/chapter-3/age-pyramids](https://geography.workbook.co.il/grade-7/chapter-3/age-pyramids) | Mali 1970–2000 (WPP 51/29 → 47/18): deaths fall while births stay high, so the base explodes. | "Better medicine shrinks the population" (it grows it fastest) | תמותה, שלב 2: התמותה יורדת, התפוצצות אוכלוסין |
| 3 | בדיוק לפי החשבון | [grade-7/chapter-3/demographic-processes](https://geography.workbook.co.il/grade-7/chapter-3/demographic-processes) | India 1990–2010: natural increase = births − deaths. You plan cranks to reach exactly 28. | "Growth = births alone" (deaths are subtracted) | ריבוי טבעי, ילודה, תמותה |
| 4 | ארבעת השלבים | [grade-7/chapter-3/demographic-processes](https://geography.workbook.co.il/grade-7/chapter-3/demographic-processes) | One model country through stages 1→4, one stage per decade, using Workbook's example rates (Niger 45/9, Israel 19/5, Germany 9/12; stage 1 is Mali 1950, 51/35). The start shape is Kenya 1950. | "Stage 4 means no births" (births ≈ deaths, both low) | מודל המעבר הדמוגרפי, שלב 1–4 |
| 5 | מגדל אלמוני (transfer) | [grade-7/chapter-3/demographic-processes](https://geography.workbook.co.il/grade-7/chapter-3/demographic-processes), [grade-7/chapter-3/age-pyramids](https://geography.workbook.co.il/grade-7/chapter-3/age-pyramids) | Mexico 2000–2020, unnamed until the end. Read 22/6 and the base, then name stage 3. | "Any growing country is in stage 2" (stage 3: births have fallen below 30) | שלבי המעבר הדמוגרפי, ילודה יורדת |
| 6 | בסיס רחב | [grade-7/chapter-3/age-pyramids](https://geography.workbook.co.il/grade-7/chapter-3/age-pyramids) | Uganda 1990–2020: a young, fast-growing country; classrooms first. | "A wide base means a lot of elders" | פירמידת גיל, בסיס רחב, ילדים, מדינה פחות מפותחת |
| 7 | מגדל מזדקן | [grade-7/chapter-3/age-pyramids](https://geography.workbook.co.il/grade-7/chapter-3/age-pyramids) | Japan 2000–2020: a narrow base under a heavy top, so clinics and beams are needed. | "An aging country needs more classrooms" | הזדקנות אוכלוסייה, בסיס צר, קשישים, מדינה מפותחת |
| 8 | מי מחזיק את מי | [grade-7/chapter-3/age-pyramids](https://geography.workbook.co.il/grade-7/chapter-3/age-pyramids) | Argentina 1990–2020: the dependency ratio as weight on the working floors. | "Only children are dependants" (elders are too) | יחס התלות, בוגרים, מפרנסים |
| 9 | שתי מדינות, שני מגדלים | [grade-7/chapter-3/age-pyramids](https://geography.workbook.co.il/grade-7/chapter-3/age-pyramids), [grade-7/chapter-3/demographic-processes](https://geography.workbook.co.il/grade-7/chapter-3/demographic-processes) | Niger and Japan 2000–2020 side by side, with one shared supply: opposite needs. | "All countries have the same population problem" | מדינה פחות מפותחת מול מפותחת, התפוצצות אוכלוסין מול הזדקנות |
| 10 | התאימו לצללית (transfer) | [grade-7/chapter-3/age-pyramids](https://geography.workbook.co.il/grade-7/chapter-3/age-pyramids) | Thailand 1990–2020, no hints: name the shape (narrow base, wide middle) and bring it to the 2020 silhouette. | "Every pyramid is a triangle" | מבנה הגילים משתנה עם הזמן |
| 11 | נכנסים ויוצאים | [grade-7/chapter-4/migration-types](https://geography.workbook.co.il/grade-7/chapter-4/migration-types), [grade-7/chapter-3/demographic-processes](https://geography.workbook.co.il/grade-7/chapter-3/demographic-processes) | Spain 1990–2000: change = natural increase (≈ 0) + migration balance. You reach exactly 29. | "Migration balance = arrivals" (departures are subtracted) | מאזן הגירה, הגירה נכנסת, הגירה יוצאת |
| 12 | מי מגיע? | [grade-7/chapter-4/migration-types](https://geography.workbook.co.il/grade-7/chapter-4/migration-types), [grade-7/chapter-4/migration-effects](https://geography.workbook.co.il/grade-7/chapter-4/migration-effects) | A model city: labour migrants (working age), refugee families (all ages), internal moves from village to city (young). Each goes on its age floor. | "All migrants are working-age men" | מהגרי עבודה, פליטים, הגירה פנימית |
| 13 | דוחפים ומושכים | [grade-7/chapter-4/migration-causes](https://geography.workbook.co.il/grade-7/chapter-4/migration-causes), [grade-7/chapter-4/migration-effects](https://geography.workbook.co.il/grade-7/chapter-4/migration-effects) | An origin and a destination, built on Philippines and Canada 2000–2020. Push and pull factors are events, and the origin loses young skilled floors. | "Migration only affects the destination" | גורמים דוחפים, גורמים מושכים, בריחת מוחות, ארץ המוצא, ארץ היעד |
| 14 | מגדל ההגירה (transfer) | [grade-7/chapter-4/migration-types](https://geography.workbook.co.il/grade-7/chapter-4/migration-types), [grade-7/chapter-4/migration-effects](https://geography.workbook.co.il/grade-7/chapter-4/migration-effects), [grade-7/chapter-3/age-pyramids](https://geography.workbook.co.il/grade-7/chapter-3/age-pyramids) | Germany 2000–2020: deaths exceed births, so growth comes from migration. No hints; you place each group by age. | "A country with more deaths than births must shrink" | מאזן הגירה, מהגרי עבודה, מבקשי מקלט, פליטים |
| 15 | גלי עלייה | [grade-9/chapter-4/demographic-change](https://geography.workbook.co.il/grade-9/chapter-4/demographic-change), [grade-7/chapter-4/migration-types](https://geography.workbook.co.il/grade-7/chapter-4/migration-types) | Israel 1950–1970: big waves from Europe and Arab countries arrive at once and at every age. | "Aliyah adds only young adults" | גל עלייה, עלייה, ריבוי טבעי |
| 16 | ריבוי טבעי ועלייה | [grade-9/chapter-4/demographic-change](https://geography.workbook.co.il/grade-9/chapter-4/demographic-change) | Israel 1990–2010: about a million olim from the former Soviet Union. The banner: growth from aliyah arrives mostly at working age, now; natural increase shows up in kindergartens. | "Natural increase and aliyah feel the same to a planner" | ריבוי טבעי, עלייה, גלי העלייה |
| 17 | ישראל היום | [grade-9/chapter-4/demographic-change](https://geography.workbook.co.il/grade-9/chapter-4/demographic-change), [grade-7/chapter-3/age-pyramids](https://geography.workbook.co.il/grade-7/chapter-3/age-pyramids) | Israel 2000–2020: a developed country with a wide base (Workbook: children 28%, elders 12%). | "A developed country always has a narrow base" | פירמידת גילים, אוכלוסייה צעירה |
| 18 | מגדל העתיד (final transfer) | [grade-9/chapter-4/demographic-change](https://geography.workbook.co.il/grade-9/chapter-4/demographic-change), [grade-7/chapter-3/age-pyramids](https://geography.workbook.co.il/grade-7/chapter-3/age-pyramids) | Israel 2020–2050 on the WPP projection (2020s: Workbook's 19/5). Choose the fastest-growing group (elders), then carry the tower. | "A young country does not age" | הזדקנות, פירמידת גילים, ריבוי טבעי |

## Endless (daily) towers

`src/model/endless.ts` builds a daily tower from any of the 28 countries in `countries.ts`, using that country's WPP rates and start pyramid. It covers start years 1950–2020, with 2–3 decades and projections up to 2050. The goal is one of three: reach a year, name the stage banner, or reach an exact total. The solver checks every tower before the app gets it, and the tower posts nothing.
