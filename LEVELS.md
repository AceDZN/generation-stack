# Generation Stack · מגדל הדורות: levels

Every level is verified in `tests/levels.test.ts`. The solver (`src/model/solver.ts`) wins it with a static margin of at least 0.2, and replaying the solver's actions under the Rapier judge also wins. Below is each level's geography and the solver's decade-by-decade solution.

How to read the solutions:
- Floors are 10-year bands (0–9 … 70+), and doors are `left`/`right`.
- `T0`/`T1` name the tower in two-tower levels.
- 'tower n' is the number of people blocks after the crank.
- Services: כיתה = classroom, מקום עבודה = workplace, מרפאה = clinic, קורה = beam.
- Services seeded at the start and services renovated at aging are not listed, only the ones the player builds.

## World 1: born and counted (ילודה ותמותה)

### 1. השולה הראשונה
**Niger, 2010→2020, 1 decade, reach.** Workbook's Niger 45/9. Twelve blocks of 1.4M people (Niger 2010 pyramid). The tutorial: 5 babies arrive. The children (0–19) are then 4 + 5 = 9, and at 3 per classroom that is 3 classrooms. Two are already there, so you build one.

- 2010→2020: place 3 babies → 0–9 (left); 2 babies → 0–9 (right); build 1× כיתה 0–9; crank (tower 16)
- Result: won, 3 stars, min margin 0.50

### 2. רפואה טובה יותר
**Mali, 1970→2000, 3 decades, reach.** WPP Mali: 51/29 (stage 1), then 49/22 and 47/18 (stage 2). Deaths fall while births stay high: each decade brings more babies than the last (7, 8, 10), so the nursery needs 2, 3, 3 classrooms and both doors.

- 1970→1980: place 3 babies → 0–9 (left); 3 babies → 0–9 (right); 1 baby → 0–9 (left); build 2× כיתה 0–9; crank (tower 17)
- 1980→1990: place 3 babies → 0–9 (left); 3 babies → 0–9 (right); 2 babies → 0–9 (left); build 3× כיתה 0–9; crank (tower 21)
- 1990→2000: place 3 babies → 0–9 (left); 3 babies → 0–9 (right); 3 babies → 0–9 (left); 1 baby → 0–9 (right); build 3× כיתה 0–9; crank (tower 27)
- Result: won, 3 stars, min margin 0.36

### 3. בדיוק לפי החשבון
**India, 1990→2010, exact 28.** WPP India: 30/10, 25/8, 19/7. Natural increase fills the tower: 20 → 24 → 28. You ring at 2010; cranking to 2020 overshoots.

- 1990→2000: place 3 babies → 0–9 (left); 3 babies → 0–9 (right); build 2× כיתה 0–9; crank (tower 24)
- 2000→2010: place 3 babies → 0–9 (left); 3 babies → 0–9 (right); build 2× כיתה 0–9; crank (tower 28)
- 2010: ring the bell at 28 → won
- Result: won, 3 stars, min margin 0.41

### 4. ארבעת השלבים
**Model country, 1950→1990, 4 decades, reach.** One decade per stage: 51/35 (Mali 1950), Workbook's Niger 45/9, Israel 19/5, Germany 9/12. The start shape is Kenya 1950. Births shrink from 9 to 3 per decade, and the last decade needs a clinic for the first elders.

- 1950→1960: place 3 babies → 0–9 (left); 3 babies → 0–9 (right); 3 babies → 0–9 (left); build 3× כיתה 0–9, 1× קורה 0–9; crank (tower 21)
- 1960→1970: place 3 babies → 0–9 (left); 3 babies → 0–9 (right); 3 babies → 0–9 (left); build 3× כיתה 0–9; crank (tower 28)
- 1970→1980: place 3 babies → 0–9 (left); 2 babies → 0–9 (right); build 2× כיתה 10–19; crank (tower 32)
- 1980→1990: place 3 babies → 0–9 (left); build 3× כיתה 10–19, 1× מרפאה 60–69; crank (tower 31)
- Result: won, 3 stars, min margin 0.30

### 5. מגדל אלמוני
**Mexico (unnamed), 2000→2020, stage banner (transfer).** WPP Mexico: 22/6, then 19/6. Births are under 30 but well above deaths, which is stage 3.

- Banner: שלב 3: הילודה יורדת
- 2000→2010: place 3 babies → 0–9 (left); 2 babies → 0–9 (right); build 2× כיתה 10–19; crank (tower 28)
- 2010→2020: place 3 babies → 0–9 (left); 2 babies → 0–9 (right); build 4× כיתה 0–9; crank (tower 31)
- Result: won, 3 stars, min margin 0.43

## World 2: the shape of the tower (פירמידות גיל)

### 6. בסיס רחב
**Uganda, 1990→2020, reach.** WPP Uganda: 50/17, 46/12, 40/7. A wide base: 6–8 babies a decade, so classrooms first.

- 1990→2000: place 3 babies → 0–9 (left); 3 babies → 0–9 (right); build 2× כיתה 0–9; crank (tower 16)
- 2000→2010: place 3 babies → 0–9 (left); 3 babies → 0–9 (right); 1 baby → 0–9 (left); build 2× כיתה 0–9; crank (tower 21)
- 2010→2020: place 3 babies → 0–9 (left); 3 babies → 0–9 (right); 2 babies → 0–9 (left); build 3× כיתה 0–9; crank (tower 28)
- Result: won, 3 stars, min margin 0.30

### 7. מגדל מזדקן
**Japan, 2000→2020, reach.** WPP Japan: 9/9, 8/11 (stage 4). A big elder floor (10 blocks on 70+) over a nursery of 3–4. It needs a clinic and a beam, and without beams it collapses (static and Rapier).

- 2000→2010: place 3 babies → 0–9 (left); 1 baby → 0–9 (right); build 1× כיתה 0–9; crank (tower 40)
- 2010→2020: place 3 babies → 0–9 (left); build 2× כיתה 10–19, 1× מרפאה 70+, 1× קורה 0–9; crank (tower 39)
- Result: won, 3 stars, min margin 0.82

### 8. מי מחזיק את מי
**Argentina, 1990→2020, reach.** WPP Argentina: 21/8, 19/8, 17/8. Children and elders weigh on the working floors (dependency ratio); by 2010 the elders need a clinic as well.

- 1990→2000: place 3 babies → 0–9 (left); 3 babies → 0–9 (right); build 2× כיתה 0–9; crank (tower 34)
- 2000→2010: place 3 babies → 0–9 (left); 3 babies → 0–9 (left); build 2× כיתה 0–9; crank (tower 37)
- 2010→2020: place 3 babies → 0–9 (right); 3 babies → 0–9 (left); build 2× כיתה 0–9, 1× מרפאה 70+; crank (tower 40)
- Result: won, 3 stars, min margin 0.41

### 9. שתי מדינות, שני מגדלים
**Niger + Japan, 2000→2020, reach.** Niger (52/15, 47/11) at left and Japan (9/9, 8/11) at right, with one shared supply. Niger needs classrooms; Japan needs classrooms for its few children, a clinic for the elders and a beam under its narrow base.

- 2000→2010: place 3 babies → 0–9 T0 (left); 3 babies → 0–9 T1 (left); 2 babies → 0–9 T0 (right); 1 baby → 0–9 T1 (right); build 1× כיתה 0–9 T0, 1× כיתה 0–9 T1, 1× קורה 0–9 T0; crank (tower 13 + 40)
- 2010→2020: place 3 babies → 0–9 T0 (left); 3 babies → 0–9 T0 (right); 3 babies → 0–9 T1 (left); build 3× כיתה 0–9 T0, 2× כיתה 10–19 T1, 1× מרפאה 70+ T1, 1× קורה 0–9 T1; crank (tower 18 + 39)
- Result: won, 3 stars, min margin 0.32

### 10. התאימו לצללית
**Thailand, 1990→2020, shape banner (transfer).** WPP Thailand: 18/6, 14/7, 11/7 (stage 3→4). The shape is a narrow base and a wide middle, and the tower has to match the Thailand 2020 silhouette.

- Banner: בסיס צר ובטן רחבה באמצע
- 1990→2000: place 3 babies → 0–9 (left); 2 babies → 0–9 (right); build 2× כיתה 0–9; crank (tower 29)
- 2000→2010: place 3 babies → 0–9 (left); 1 baby → 0–9 (right); build 1× כיתה 10–19, 1× מרפאה 60–69; crank (tower 31)
- 2010→2020: place 3 babies → 0–9 (left); build 3× כיתה 10–19, 1× מרפאה 60–69, 1× קורה 0–9; crank (tower 32)
- Result: won, 3 stars, min margin 0.41

## World 3: the doors open (תנועות הגירה)

### 11. נכנסים ויוצאים
**Spain, 1990→2000, exact 29.** WPP Spain: about 10/9, so natural increase ≈ 0. In the 1990s 2 people arrive and 1 leaves (balance +1). The tower goes 27 → 29 at 2000 (3 babies, −2 deaths, +1 migration balance). The 2000s bring 4 more arrivals and no departures, so cranking past 2000 overshoots.

- 1990→2000: place 3 babies → 0–9 (right); 1 מהגרי עבודה בשנות ה-20 וה-30 לחייהם → 20–29 (right); 1 מהגרי עבודה בשנות ה-20 וה-30 לחייהם → 30–39 (right); build 1× כיתה 0–9, 1× קורה 0–9; crank (tower 29)
- 2000: ring the bell at 29 → won
- Result: won, 3 stars, min margin 0.52

### 12. מי מגיע?
**Model city, 2000→2020, reach, choose floors.** Spain 2000 shares. 2000s: two labour migrants (20s and 30s) and young people from the village. 2010s: a refugee family at every age, plus more internal migrants. Pieces hide their age, and their label tells the floor.

- 2000→2010: place 2 babies → 0–9 (left); 1 מהגרי עבודה בשנות ה-20 לחייהם → 20–29 (left); 1 מהגרי עבודה בשנות ה-30 לחייהם → 30–39 (left); 1 צעירים מהכפר שבאו לעבוד וללמוד → 20–29 (left); build 1× כיתה 0–9, 1× מקום עבודה 20–29; crank (tower 27)
- 2010→2020: place 2 babies → 0–9 (left); 1 ילדים קטנים של משפחת פליטים → 0–9 (right); 1 בני נוער של משפחת פליטים → 10–19 (right); 1 הורים במשפחת הפליטים, בשנות ה-30 → 30–39 (left); 1 סבא וסבתא של המשפחה, בשנות ה-60 → 60–69 (right); 1 צעירים מהכפר שבאו לעבוד וללמוד → 20–29 (right); build 1× כיתה 0–9, 1× מרפאה 70+; crank (tower 32)
- Result: won, 3 stars, min margin 0.49

### 13. דוחפים ומושכים
**Origin + destination (Philippines + Canada data), 2000→2020, reach.** Origin 28/5, 23/6; destination 11/7. Departures from the origin's 20s and 30s floors arrive at the destination (brain drain), and the destination has to give them workplaces.

- 2000→2010: place 3 babies → 0–9 T0 (left); 3 babies → 0–9 T0 (right); 2 רופאים ומהנדסים שעוברים לארץ היעד → 30–39 T1 (right); 2 babies → 0–9 T1 (right); 1 רופאים ומהנדסים שעוברים לארץ היעד → 20–29 T1 (right); build 2× כיתה 0–9 T0, 1× כיתה 10–19 T1, 1× קורה 0–9 T0, 1× קורה 0–9 T1; crank (tower 21 + 24)
- 2010→2020: place 3 babies → 0–9 T0 (left); 3 babies → 0–9 T0 (right); 3 babies → 0–9 T1 (left); 2 מדענים ואחיות שעוברים לארץ היעד → 20–29 T1 (right); 1 מדענים ואחיות שעוברים לארץ היעד → 30–39 T1 (right); build 2× כיתה 0–9 T0, 2× כיתה 0–9 T1, 1× מקום עבודה 20–29 T1, 1× מרפאה 70+ T1; crank (tower 26 + 28)
- Result: won, 3 stars, min margin 0.32

### 14. מגדל ההגירה
**Germany, 2000→2020, reach, choose floors (transfer).** WPP Germany: 9/10, 9/11, so deaths exceed births. Labour migrants and refugee families keep it growing (44 → 47), with one emigrant each decade.

- 2000→2010: place 3 babies → 0–9 (left); 1 baby → 0–9 (right); 1 מהגרי עבודה בשנות ה-20 לחייהם → 20–29 (left); build 1× כיתה 0–9; crank (tower 44)
- 2010→2020: place 3 babies → 0–9 (left); 1 baby → 0–9 (right); 1 מהגרי עבודה בשנות ה-20 לחייהם → 20–29 (left); 1 מהגרי עבודה בשנות ה-30 לחייהם → 30–39 (left); 1 בני נוער ממשפחות פליטים שקיבלו מקלט → 10–19 (left); 1 צעירים ממשפחות פליטים שקיבלו מקלט → 20–29 (left); build 2× כיתה 10–19, 2× מרפאה 70+; crank (tower 47)
- Result: won, 3 stars, min margin 1.09

## World 4: Israel's tower (המגדל הישראלי)

### 15. גלי עלייה
**Israel, 1950→1970, reach, choose floors.** WPP Israel 33/7, 26/7. One block = 100,000 people. Aliyah waves of 6 blocks (≈ 600k, 1950s) and 4 blocks (≈ 400k, 1960s; CBS 1961–71: 427,828) arrive at every age.

- 1950→1960: place 3 babies → 0–9 (left); 1 baby → 0–9 (right); 1 עולים: ילדים קטנים → 0–9 (right); 1 עולים: בני נוער → 10–19 (left); 1 עולים בשנות ה-20 לחייהם → 20–29 (right); 1 עולים בשנות ה-30 לחייהם → 30–39 (right); 1 עולים בשנות ה-40 לחייהם → 40–49 (right); 1 עולים בשנות ה-60 לחייהם → 60–69 (left); build 2× כיתה 0–9; crank (tower 22)
- 1960→1970: place 3 babies → 0–9 (left); 3 babies → 0–9 (right); 1 עולים: ילדים קטנים → 0–9 (left); 1 עולים בשנות ה-20 לחייהם → 20–29 (right); 1 עולים בשנות ה-30 לחייהם → 30–39 (right); 1 עולים בשנות ה-50 לחייהם → 50–59 (right); build 2× כיתה 0–9; crank (tower 30)
- Result: won, 3 stars, min margin 0.43

### 16. ריבוי טבעי ועלייה
**Israel, 1990→2010, planning banner.** WPP Israel 21/6, 21/5. One block = 200,000 people. 1990s: 5 blocks of olim (≈ 1M, Workbook: כמיליון), mostly working age; 2000s: 1 block.

- Banner: העולים: רובם כבר בגיל העבודה
- 1990→2000: place 3 babies → 0–9 (left); 2 babies → 0–9 (right); 1 עולים: בני נוער → 10–19 (left); 1 עולים בשנות ה-30 לחייהם → 30–39 (right); 1 עולים בשנות ה-40 לחייהם → 40–49 (left); 1 עולים בשנות ה-50 לחייהם → 50–59 (right); 1 עולים בני 70 ומעלה → 70+ (left); build 2× כיתה 10–19; crank (tower 32)
- 2000→2010: place 3 babies → 0–9 (left); 3 babies → 0–9 (right); 1 baby → 0–9 (left); 1 עולים בשנות ה-30 לחייהם → 30–39 (right); build 4× כיתה 0–9; crank (tower 38)
- Result: won, 3 stars, min margin 0.84

### 17. ישראל היום
**Israel, 2000→2020, reach.** WPP Israel 21/5. A developed country with a wide base: 6–7 babies a decade, plus a clinic as the elders grow.

- 2000→2010: place 3 babies → 0–9 (left); 3 babies → 0–9 (right); 1 עולים בשנות ה-30 לחייהם → 30–39 (left); build 2× כיתה 0–9; crank (tower 35)
- 2010→2020: place 3 babies → 0–9 (left); 3 babies → 0–9 (left); 1 baby → 0–9 (right); 1 עולים בשנות ה-20 לחייהם → 20–29 (right); build 3× כיתה 0–9, 1× מרפאה 60–69; crank (tower 41)
- Result: won, 3 stars, min margin 0.91

### 18. מגדל העתיד
**Israel, 2020→2050, group banner, choose floors (final transfer).** 2020s: Workbook's 19/5; 2030s and 2040s: WPP projection 17/6. The arrivals are labelled העשרה. The elder floors fill fastest; WPP has 65+ going from 1.06M to 2.05M.

- Banner: קשישים
- 2020→2030: place 3 babies → 0–9 (left); 3 babies → 0–9 (right); 1 baby → 0–9 (left); 1 עולים בשנות ה-30 לחייהם → 30–39 (right); build 2× כיתה 0–9; crank (tower 42)
- 2030→2040: place 3 babies → 0–9 (left); 3 babies → 0–9 (right); 1 baby → 0–9 (left); 1 עולים בשנות ה-20 לחייהם → 20–29 (left); build 3× כיתה 0–9, 1× מרפאה 70+; crank (tower 47)
- 2040→2050: place 3 babies → 0–9 (left); 3 babies → 0–9 (right); 2 babies → 0–9 (left); 1 עולים בשנות ה-40 לחייהם → 40–49 (right); build 2× כיתה 0–9, 1× מרפאה 70+; crank (tower 53)
- Result: won, 3 stars, min margin 0.89
