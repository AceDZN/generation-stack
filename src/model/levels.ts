// The 18 authored levels. Every number comes from src/model/countries.ts (UN WPP 2024, or
// Workbook's own rounded numbers where the module quotes them); see CURRICULUM.md for the
// source of each level and LEVELS.md for its verified solution. Pure data, no Three.js.

import type { DecadePlan, LevelDef, MigrantGroup, TowerPlan, Departure } from './types.ts';
import { type CountryId, WORKBOOK, rates, silhouette, startTower, stageOf } from './countries.ts';

/** One decade of a country's real rates (WPP decade means, rounded), plus events. */
function wpp(id: CountryId, decade: number, extra: Partial<DecadePlan> = {}): DecadePlan {
  const r = rates(id, decade);
  return { cbr: r.cbr, cdr: r.cdr, stage: r.stage, ...extra };
}

/** A decade with given rates (Workbook's numbers or a model stage). */
function given(cbr: number, cdr: number, extra: Partial<DecadePlan> = {}): DecadePlan {
  return { cbr, cdr, stage: stageOf(cbr, cdr), ...extra };
}

function tower(nameHe: string, id: CountryId, startYear: number, blocks: number, decades: DecadePlan[], opts: Partial<TowerPlan> & { silhouetteYear?: number } = {}): TowerPlan {
  const { silhouetteYear, ...rest } = opts;
  const sy = silhouetteYear ?? startYear + 10 * decades.length;
  const t: TowerPlan = { nameHe, start: startTower(id, startYear, blocks), decades, ...rest };
  if (sy <= 2020 && !('silhouette' in opts)) {
    t.silhouette = silhouette(id, sy);
    t.silhouetteLabelHe = `${nameHe} ${sy}`;
  }
  return t;
}

const group = (id: string, kind: MigrantGroup['kind'], transport: MigrantGroup['transport'], bands: MigrantGroup['bands'], labelHe: string, tower?: number): MigrantGroup => ({ id, kind, transport, bands, labelHe, ...(tower !== undefined ? { tower } : {}) });
const leave = (id: string, kind: Departure['kind'], transport: Departure['transport'], bands: Departure['bands'], labelHe: string, toTower?: number | null, tower?: number): Departure => ({
  id,
  kind,
  transport,
  bands,
  labelHe,
  ...(toTower !== undefined ? { toTower } : {}),
  ...(tower !== undefined ? { tower } : {}),
});

const STAGE_OPTIONS = [
  { labelHe: 'שלב 1: ילודה ותמותה גבוהות' },
  { labelHe: 'שלב 2: התמותה ירדה, הילודה עוד גבוהה' },
  { labelHe: 'שלב 3: הילודה יורדת' },
  { labelHe: 'שלב 4: ילודה ותמותה נמוכות' },
];

export const LEVELS: LevelDef[] = [
  // ───────────── World 1: born and counted (ילודה ותמותה) ─────────────
  {
    id: 1,
    world: 1,
    titleHe: 'השולה הראשונה',
    conceptHe: 'ילודה: שולה מביאה תינוקות לפי שיעור הילודה, ומנוף העשור מזקין את כולם בעשר שנים.',
    introHe: [
      'שלום! אני ראש העיר, וזה המגדל של ניז\'ר. כל קומה היא עשר שנים של גיל.',
      'שולה הביאה תינוקות: החליקו אותם לקומת התינוקות למטה, ובנו להם כיתות.',
      'כשהכול מוכן, משכו את מנוף העשור וראו את כולם עולים קומה.',
    ],
    startYear: 2010,
    decades: 1,
    towers: [tower('ניז\'ר', 'niger', 2010, 12, [given(WORKBOOK.niger.cbr, WORKBOOK.niger.cdr, { eventHe: 'בניז\'ר נולדים 45 תינוקות לכל 1000 תושבים בשנה' })])],
    goal: 'reach',
    peoplePerBlock: 1400000,
    wind: 0,
    supplyFactor: 0.3,
    hints: true,
    failHe: {
      needs: 'לילדים חסרו כיתות. כל כיתה מחזיקה 3 ילדים: ספרו את הילדים, חלקו ב-3 ועגלו למעלה.',
      collapse: 'המגדל נטה לצד אחד. החליקו תינוקות משני הצדדים כדי שקומת התינוקות תישאר באמצע.',
    },
  },
  {
    id: 2,
    world: 1,
    titleHe: 'רפואה טובה יותר',
    conceptHe: 'שלב 2: התמותה יורדת לפני הילודה, הריבוי הטבעי גדל, והבסיס מתרחב (התפוצצות אוכלוסין).',
    introHe: [
      'במאלי נולדים הרבה תינוקות, ובעבר רבים גם מתו צעירים.',
      'עכשיו מגיעה רפואה טובה יותר: התמותה יורדת, והילודה נשארת גבוהה.',
      'הבסיס יגדל מהר. היו מוכנים עם כיתות!',
    ],
    startYear: 1970,
    decades: 3,
    towers: [
      tower('מאלי', 'mali', 1970, 14, [
        wpp('mali', 1970, { eventHe: 'ילודה ותמותה גבוהות' }),
        wpp('mali', 1980, { eventHe: 'רפואה טובה יותר: התמותה יורדת' }),
        wpp('mali', 1990, { eventHe: 'התמותה ממשיכה לרדת, הילודה עדיין גבוהה' }),
      ]),
    ],
    goal: 'reach',
    peoplePerBlock: 450000,
    wind: 0.1,
    supplyFactor: 0.35,
    hints: true,
    failHe: {
      needs: 'בכל עשור נולדו יותר תינוקות, כי התמותה ירדה והילודה לא. ריבוי טבעי = ילודה − תמותה: ככל שהפער גדל, צריך יותר כיתות.',
      collapse: 'הבסיס גדל מהר לצד אחד. פזרו את התינוקות בין שתי הדלתות.',
    },
  },
  {
    id: 3,
    world: 1,
    titleHe: 'בדיוק לפי החשבון',
    conceptHe: 'ריבוי טבעי = ילודה − תמותה, לכל 1000 תושבים בשנה. בעשור שבו הילודה 30 והתמותה 10, המגדל גדל בכ-20%.',
    introHe: [
      'ראש העיר של הודו רוצה לחגוג כשבמגדל יהיו בדיוק 28 קוביות.',
      'הלוח מראה ילודה ותמותה לכל 1000. הריבוי הטבעי הוא ההפרש ביניהן.',
      'צלצלו בפעמון בעשור הנכון. משיכה נוספת של המנוף תעבור את היעד!',
    ],
    startYear: 1990,
    decades: 3,
    towers: [tower('הודו', 'india', 1990, 20, [wpp('india', 1990), wpp('india', 2000), wpp('india', 2010)], { silhouetteYear: 2010 })],
    goal: 'exact',
    exactTarget: 28,
    peoplePerBlock: 43000000,
    wind: 0.1,
    supplyFactor: 0.3,
    hints: true,
    failHe: {
      overshoot: 'המנוף עבר את היעד. חשבו מראש: בכל עשור נוסף בערך (ילודה − תמותה) × 10 לכל 1000, כלומר כחמישית מהמגדל.',
      'wrong-call': 'הפעמון צלצל מוקדם מדי: המגדל עוד לא הגיע ל-28. הוסיפו את הריבוי הטבעי של העשור הבא.',
      needs: 'גם בדרך ליעד כל ילד צריך כיתה וכל בוגר מקום עבודה.',
    },
  },
  {
    id: 4,
    world: 1,
    titleHe: 'ארבעת השלבים',
    conceptHe: 'מודל המעבר הדמוגרפי: 1 ילודה ותמותה גבוהות, 2 התמותה יורדת, 3 הילודה יורדת, 4 שתיהן נמוכות.',
    introHe: [
      'המגדל הזה עובר את כל ארבעת שלבי המעבר הדמוגרפי, שלב בכל עשור.',
      'בכל עשור הלוח מראה ילודה ותמותה אחרות. שימו לב איך המגדל מרגיש בכל שלב.',
      'במציאות כל שלב נמשך עשרות שנים. כאן זה מואץ, כמו בסרט.',
    ],
    startYear: 1950,
    decades: 4,
    towers: [
      tower('מדינת המודל', 'kenya', 1950, 18, [
        given(51, 35, { stage: 1, mortality: 'high', eventHe: 'שלב 1: הרבה לידות והרבה פטירות (כמו במאלי ב-1950)' }),
        given(WORKBOOK.niger.cbr, WORKBOOK.niger.cdr, { stage: 2, eventHe: 'שלב 2: רפואה ותזונה מורידות את התמותה (כמו בניז\'ר היום)' }),
        given(WORKBOOK.israel.cbr, WORKBOOK.israel.cdr, { stage: 3, eventHe: 'שלב 3: משפחות קטנות יותר, הילודה יורדת (כמו בישראל היום)' }),
        given(WORKBOOK.germany.cbr, WORKBOOK.germany.cdr, { stage: 4, eventHe: 'שלב 4: ילודה ותמותה נמוכות (כמו בגרמניה היום)' }),
      ], { silhouette: undefined }),
    ],
    goal: 'reach',
    peoplePerBlock: 300000,
    wind: 0.15,
    supplyFactor: 0.4,
    hints: true,
    failHe: {
      collapse: 'בשלב 4 נולדים מעט תינוקות והבסיס צר. קורות בקומת התינוקות מרחיבות אותו.',
      'empty-base': 'בלי תינוקות וקורות בקומה התחתונה, אין למגדל על מה לעמוד.',
      needs: 'בכל שלב משתנה מה שחסר: בשלב 2 הרבה כיתות, בשלב 4 יותר מרפאות.',
    },
  },
  {
    id: 5,
    world: 1,
    titleHe: 'מגדל אלמוני',
    conceptHe: 'זיהוי שלב: מסתכלים על הפער בין הילודה לתמותה ועל צורת הבסיס.',
    introHe: ['הגיע מגדל בלי שם! הלוח מראה רק ילודה ותמותה.', 'קראו את המגדל ובחרו את הדגל הנכון: באיזה שלב הוא?', 'אחר כך שמרו עליו עד 2020.'],
    startYear: 2000,
    decades: 2,
    towers: [tower('מגדל אלמוני', 'mexico', 2000, 24, [wpp('mexico', 2000), wpp('mexico', 2010)], { silhouetteLabelHe: 'מקסיקו 2020' })],
    goal: 'stage',
    choice: {
      promptHe: 'באיזה שלב של המעבר הדמוגרפי נמצא המגדל?',
      options: STAGE_OPTIONS,
      correct: 2,
      explainHe: 'הילודה (22 לכל 1000) כבר ירדה מתחת ל-30, אבל היא עדיין גבוהה בהרבה מהתמותה (6): זה שלב 3. התינוקות של העשור ממלאים קומה צרה יותר מזו שמעליהם, סימן שהילודה יורדת. זה המגדל של מקסיקו.',
    },
    peoplePerBlock: 4000000,
    wind: 0.15,
    supplyFactor: 0.25,
    hints: false,
    failHe: {
      'wrong-call': 'בשלב 2 הילודה עדיין 30 ומעלה, ובשלב 4 גם הילודה נמוכה. כאן הילודה 22 והתמותה 6: הילודה כבר יורדת, אבל עדיין גבוהה מהתמותה.',
      needs: 'בשלב 3 עדיין נולדים ילדים רבים, ובמקביל הבוגרים מתרבים: צריך גם כיתות וגם מקומות עבודה.',
      collapse: 'הקומה התחתונה צרה מהקומות שמעליה. פזרו את התינוקות בשני הצדדים.',
    },
  },

  // ───────────── World 2: the shape of the tower (פירמידות גיל) ─────────────
  {
    id: 6,
    world: 2,
    titleHe: 'בסיס רחב',
    conceptHe: 'פירמידה רחבה בבסיס: ילודה גבוהה, הרבה ילדים, התפוצצות אוכלוסין. צריך להשקיע בחינוך.',
    introHe: [
      'באוגנדה כמעט שישה מכל עשרה תושבים הם ילדים ובני נוער.',
      'הבסיס רחב, ושולה עובדת שעות נוספות.',
      'כיתות קודם! בלי מספיק כיתות הילדים קופצים ומנערים את המגדל.',
    ],
    startYear: 1990,
    decades: 3,
    towers: [tower('אוגנדה', 'uganda', 1990, 12, [wpp('uganda', 1990), wpp('uganda', 2000), wpp('uganda', 2010)])],
    goal: 'reach',
    peoplePerBlock: 1500000,
    wind: 0.15,
    supplyFactor: 0.4,
    hints: true,
    failHe: {
      needs: 'רוב המגדל ילדים, ולכל 3 ילדים צריך כיתה. כשבונים מקומות עבודה לפני הכיתות, נגמרות נקודות הבנייה.',
      collapse: 'קומת התינוקות רחבה, אבל רק אם ממלאים אותה משני הצדדים.',
    },
  },
  {
    id: 7,
    world: 2,
    titleHe: 'מגדל מזדקן',
    conceptHe: 'פירמידה צרה בבסיס ורחבה למעלה: ילודה נמוכה ותוחלת חיים ארוכה. זו הזדקנות האוכלוסייה.',
    introHe: [
      'ביפן נולדים מעט תינוקות, ואנשים חיים הרבה שנים.',
      'הבסיס צר והגג כבד. קורות בקומת התינוקות עוזרות לבסיס להחזיק.',
      'וקשישים צריכים מרפאות: כל מרפאה מטפלת רק ב-2.',
    ],
    startYear: 2000,
    decades: 2,
    towers: [tower('יפן', 'japan', 2000, 40, [wpp('japan', 2000), wpp('japan', 2010)])],
    goal: 'reach',
    peoplePerBlock: 3200000,
    wind: 0.2,
    supplyFactor: 0.3,
    hints: true,
    failHe: {
      collapse: 'קומת התינוקות צרה מדי בשביל מגדל כבד כל כך. בנו קורות משני צידי התינוקות.',
      'empty-base': 'בלי תינוקות וקורות, אין למגדל על מה לעמוד.',
      needs: 'חסרו מרפאות. בכל עשור עוד בוגרים עולים לקומות הקשישים, ומרפאה מטפלת רק ב-2.',
    },
  },
  {
    id: 8,
    world: 2,
    titleHe: 'מי מחזיק את מי',
    conceptHe: 'יחס התלות: כמה ילדים וקשישים נתמכים על ידי הבוגרים. בסיס רחב או ראש רחב מעמיסים על הבוגרים.',
    introHe: [
      'את כל חלקי השירות בונות הקומות העובדות, הבוגרים.',
      'בארגנטינה יש גם הרבה ילדים וגם יותר ויותר קשישים, וכולם נשענים על אותם בוגרים.',
      'חלקו את נקודות הבנייה בין כיתות, מקומות עבודה ומרפאות.',
    ],
    startYear: 1990,
    decades: 3,
    towers: [tower('ארגנטינה', 'argentina', 1990, 30, [wpp('argentina', 1990), wpp('argentina', 2000), wpp('argentina', 2010)])],
    goal: 'reach',
    peoplePerBlock: 1100000,
    wind: 0.2,
    supplyFactor: 0.2,
    hints: true,
    failHe: {
      needs: 'נקודות הבנייה נגמרו לפני שכל הקבוצות קיבלו שירות. הבוגרים בונים, וכל ילד וכל קשיש צריכים חלק ממה שהם בונים.',
      collapse: 'גם בארגנטינה הבסיס מצטמצם עם הזמן. השאירו נקודה לקורה כשהקומה התחתונה צרה.',
    },
  },
  {
    id: 9,
    world: 2,
    titleHe: 'שתי מדינות, שני מגדלים',
    conceptHe: 'מדינה פחות מפותחת מול מדינה מפותחת: התפוצצות אוכלוסין מול הזדקנות. שתי בעיות הפוכות.',
    introHe: [
      'שני מגדלים בכיכר אחת: ניז\'ר משמאל, יפן מימין.',
      'צוות בנייה אחד לשניהם. במגדל אחד חסרות כיתות, בשני מרפאות וקורות.',
      'קראו כל מגדל ותנו לו את מה שהוא צריך.',
    ],
    startYear: 2000,
    decades: 2,
    towers: [
      tower('ניז\'ר', 'niger', 2000, 10, [wpp('niger', 2000), wpp('niger', 2010)], { baseX: -7 }),
      tower('יפן', 'japan', 2000, 40, [wpp('japan', 2000), wpp('japan', 2010)], { baseX: 7, peoplePerBlock: 3200000 }),
    ],
    goal: 'reach',
    peoplePerBlock: 1150000,
    wind: 0.2,
    supplyFactor: 0.25,
    hints: true,
    failHe: {
      needs: 'כל מגדל צריך משהו אחר: בניז\'ר רוב האנשים ילדים (כיתות), ביפן יותר ויותר קשישים (מרפאות).',
      collapse: 'המגדל של יפן עומד על בסיס צר. בנו קורות בקומת התינוקות שלו.',
      'empty-base': 'בלי תינוקות וקורות, המגדל של יפן אין לו על מה לעמוד.',
    },
  },
  {
    id: 10,
    world: 2,
    titleHe: 'התאימו לצללית',
    conceptHe: 'מבנה הגילים משתנה עם הזמן: כשהילודה יורדת, הבסיס מצטמצם והקומות הרחבות עולות לאמצע.',
    introHe: ['זה המגדל של תאילנד ב-1990: צעיר ורחב.', 'לפני שמתחילים, בחרו: איזו צללית תהיה לו ב-2020?', 'אחר כך הביאו אותו לשם בשלום.'],
    startYear: 1990,
    decades: 3,
    towers: [tower('תאילנד', 'thailand', 1990, 26, [wpp('thailand', 1990), wpp('thailand', 2000), wpp('thailand', 2010)])],
    goal: 'choose',
    choice: {
      promptHe: 'איזו צללית תהיה למגדל ב-2020?',
      options: [{ labelHe: 'בסיס רחב עוד יותר, כמו ניז\'ר' }, { labelHe: 'בסיס צר ובטן רחבה באמצע' }, { labelHe: 'אותה צורה כמו היום' }],
      correct: 1,
      explainHe: 'הילודה בתאילנד יורדת מ-18 ל-11 לכל 1000, אז כל קומת תינוקות חדשה צרה מהקודמת, והקומות הרחבות של 1990 עולות לאמצע המגדל.',
    },
    peoplePerBlock: 2100000,
    wind: 0.2,
    supplyFactor: 0.25,
    hints: false,
    failHe: {
      'wrong-call': 'הסתכלו על הלוח: הילודה יורדת בכל עשור. מעט תינוקות = בסיס צר, והילדים הרבים של היום יהיו הבוגרים של מחר.',
      needs: 'הילדים של 1990 נהיים בוגרים, ואחריהם קשישים. בכל עשור השירות שחסר משתנה.',
      collapse: 'הבסיס מצטמצם עם הזמן. קורות בקומת התינוקות שומרות על המגדל.',
    },
  },

  // ───────────── World 3: the doors open (תנועות הגירה) ─────────────
  {
    id: 11,
    world: 3,
    titleHe: 'נכנסים ויוצאים',
    conceptHe: 'מאזן הגירה = נכנסים − יוצאים. שינוי האוכלוסייה = ריבוי טבעי + מאזן הגירה.',
    introHe: [
      'לספרד נכנסים אנשים, וגם יוצאים ממנה, וכולם מופיעים על לוח הזמנים.',
      'מאזן הגירה = נכנסים − יוצאים. הוא מוסיף למגדל או מוריד ממנו, בנוסף לריבוי הטבעי.',
      'צלצלו בפעמון כשבמגדל יהיו בדיוק 29 קוביות.',
    ],
    startYear: 1990,
    decades: 3,
    towers: [
      tower('ספרד', 'spain', 1990, 28, [
        wpp('spain', 1990, {
          arrivals: [group('s90in', 'labor', 'plane', { 3: 1, 2: 1 }, 'מהגרי עבודה בשנות ה-20 וה-30 לחייהם')],
          departures: [leave('s90out', 'emigrant', 'plane', { 3: 1 }, 'יוצאים לגור במדינה אחרת')],
          eventHe: 'נכנסים 2, יוצאים 1: מאזן הגירה +1',
        }),
        wpp('spain', 2000, {
          arrivals: [group('s00in', 'labor', 'plane', { 2: 2, 3: 2 }, 'מהגרי עבודה בשנות ה-20 וה-30 לחייהם')],
          eventHe: 'נכנסים 4, כמעט אף אחד לא יוצא: מאזן הגירה +4',
        }),
        wpp('spain', 2010, {
          arrivals: [group('s10in', 'labor', 'train', { 2: 2, 3: 1 }, 'מהגרי עבודה בשנות ה-20 וה-30 לחייהם')],
          departures: [leave('s10out', 'emigrant', 'plane', { 2: 1, 3: 1 }, 'צעירים שיוצאים לעבוד בחו"ל')],
          eventHe: 'נכנסים 3, יוצאים 2: מאזן הגירה +1',
        }),
      ], { silhouetteYear: 2000 }),
    ],
    goal: 'exact',
    exactTarget: 29,
    peoplePerBlock: 1400000,
    wind: 0.3,
    supplyFactor: 0.15,
    hints: true,
    failHe: {
      overshoot: 'עברתם את היעד. גם בעשור הזה נכנסו יותר אנשים מאשר יצאו, והמאזן החיובי הוסיף למגדל.',
      'wrong-call': 'מוקדם מדי. חברו את הריבוי הטבעי (כמעט אפס בספרד) ואת מאזן ההגירה של העשור.',
      collapse: 'מעט תינוקות נולדים בספרד, והבסיס צר. בנו קורה בקומת התינוקות.',
      needs: 'המהגרים הם בעיקר בגיל העבודה: הם צריכים מקומות עבודה כבר בעשור שבו הגיעו.',
    },
  },
  {
    id: 12,
    world: 3,
    titleHe: 'מי מגיע?',
    conceptHe: 'סוגי הגירה: מהגרי עבודה (לרוב בגיל העבודה), פליטים (משפחות בכל הגילים) והגירה פנימית מהכפר לעיר (בעיקר צעירים).',
    introHe: [
      'לעיר הגדולה מגיעים אנשים בשלוש דרכים שונות.',
      'מהגרי עבודה, צעירים מהכפר, ומשפחות פליטים שברחו מסכנה וקיבלו כאן מקלט.',
      'שימו כל קבוצה בקומת הגיל שלה. קבוצה בקומה הלא נכונה חוזרת למגש.',
    ],
    startYear: 2000,
    decades: 2,
    towers: [
      tower('העיר הגדולה', 'spain', 2000, 24, [
        wpp('spain', 2000, {
          arrivals: [
            group('c-lab', 'labor', 'plane', { 2: 1 }, 'מהגרי עבודה בשנות ה-20 לחייהם'),
            group('c-lab2', 'labor', 'plane', { 3: 1 }, 'מהגרי עבודה בשנות ה-30 לחייהם'),
            group('c-int', 'internal', 'bus', { 2: 1 }, 'צעירים מהכפר שבאו לעבוד וללמוד'),
          ],
          eventHe: 'מושך: מקומות עבודה ולימודים בעיר',
        }),
        wpp('spain', 2010, {
          arrivals: [
            group('c-ref-kids', 'refugee', 'train', { 0: 1 }, 'ילדים קטנים של משפחת פליטים'),
            group('c-ref-teen', 'refugee', 'train', { 1: 1 }, 'בני נוער של משפחת פליטים'),
            group('c-ref-par', 'refugee', 'train', { 3: 1 }, 'הורים במשפחת הפליטים, בשנות ה-30'),
            group('c-ref-old', 'refugee', 'train', { 6: 1 }, 'סבא וסבתא של המשפחה, בשנות ה-60'),
            group('c-int2', 'internal', 'bus', { 2: 1 }, 'צעירים מהכפר שבאו לעבוד וללמוד'),
          ],
          eventHe: 'משפחות פליטים מקבלות מקלט, וצעירים ממשיכים להגיע מהכפר',
        }),
      ], { silhouette: undefined }),
    ],
    goal: 'reach',
    migrantFloors: 'choose',
    peoplePerBlock: 50000,
    wind: 0.15,
    supplyFactor: 0.2,
    hints: true,
    failHe: {
      needs: 'כל קבוצה מביאה צרכים לקומה שלה: מהגרי עבודה ומהכפר צריכים מקומות עבודה, ומשפחת פליטים צריכה גם כיתות וגם מרפאה.',
      collapse: 'המגדל נטה. כשמכניסים קבוצה, בחרו את הצד שמחזיר אותו למרכז.',
    },
  },
  {
    id: 13,
    world: 3,
    titleHe: 'דוחפים ומושכים',
    conceptHe: 'גורמים דוחפים בארץ המוצא וגורמים מושכים בארץ היעד. בריחת מוחות: מומחים עוזבים, וארץ המוצא מאבדת את מי שהשקיעה בחינוכם.',
    introHe: [
      'משמאל ארץ המוצא, מימין ארץ היעד.',
      'בארץ המוצא יש אבטלה (גורם דוחף), ובארץ היעד יש מקומות עבודה (גורם מושך).',
      'רופאים ומהנדסים יעברו מהמגדל השמאלי לימני. דאגו לשניהם.',
    ],
    startYear: 2000,
    decades: 2,
    towers: [
      tower('ארץ המוצא', 'philippines', 2000, 22, [
        wpp('philippines', 2000, {
          departures: [leave('bd1', 'labor', 'plane', { 2: 1, 3: 2 }, 'רופאים ומהנדסים שעוברים לארץ היעד', 1)],
          eventHe: 'דוחף: אבטלה ושכר נמוך. מושך: מקומות עבודה ושכר גבוה בארץ היעד',
        }),
        wpp('philippines', 2010, {
          departures: [leave('bd2', 'labor', 'plane', { 2: 2, 3: 1 }, 'מדענים ואחיות שעוברים לארץ היעד', 1)],
          eventHe: 'בריחת מוחות: עוד מומחים עוזבים, והקומות העובדות בארץ המוצא מצטמצמות',
        }),
      ], { baseX: -7, silhouette: undefined }),
      tower('ארץ היעד', 'canada', 2000, 20, [wpp('canada', 2000), wpp('canada', 2010)], { baseX: 7, silhouette: undefined }),
    ],
    goal: 'reach',
    peoplePerBlock: 500000,
    wind: 0.2,
    supplyFactor: 0.2,
    hints: true,
    failHe: {
      needs: 'המומחים לקחו איתם את הצורך במקומות עבודה: עכשיו ארץ היעד צריכה אותם. ארץ המוצא נשארה עם ילדים רבים ופחות בוגרים.',
      collapse: 'ארץ היעד עומדת על בסיס צר. השאירו נקודה לקורה.',
    },
  },
  {
    id: 14,
    world: 3,
    titleHe: 'מגדל ההגירה',
    conceptHe: 'כשהריבוי הטבעי שלילי, הגירה נכנסת יכולה להיות הסיבה העיקרית לגידול. מהגרי עבודה צעירים עוזרים למדינה מזדקנת.',
    introHe: ['בגרמניה נולדים פחות תינוקות ממספר האנשים שנפטרים.', 'ובכל זאת המגדל גדל. מאיפה?', 'קבלו את כל המגיעים לקומות שלהם, ושמרו על המגדל עד 2020.'],
    startYear: 2000,
    decades: 2,
    towers: [
      tower('גרמניה', 'germany', 2000, 46, [
        wpp('germany', 2000, {
          arrivals: [group('g0-lab', 'labor', 'train', { 2: 1 }, 'מהגרי עבודה בשנות ה-20 לחייהם')],
          departures: [leave('g0-out', 'emigrant', 'plane', { 4: 1 }, 'יוצאים לגור במדינה אחרת')],
        }),
        wpp('germany', 2010, {
          arrivals: [
            group('g1-lab', 'labor', 'train', { 2: 1 }, 'מהגרי עבודה בשנות ה-20 לחייהם'),
            group('g1-lab2', 'labor', 'plane', { 3: 1 }, 'מהגרי עבודה בשנות ה-30 לחייהם'),
            group('g1-ref', 'refugee', 'train', { 1: 1 }, 'בני נוער ממשפחות פליטים שקיבלו מקלט'),
            group('g1-ref2', 'refugee', 'train', { 2: 1 }, 'צעירים ממשפחות פליטים שקיבלו מקלט'),
          ],
          departures: [leave('g1-out', 'emigrant', 'plane', { 3: 1 }, 'יוצאים לגור במדינה אחרת')],
        }),
      ]),
    ],
    goal: 'reach',
    migrantFloors: 'choose',
    peoplePerBlock: 1800000,
    wind: 0.2,
    supplyFactor: 0.2,
    hints: false,
    failHe: {
      collapse: 'גרמניה מזדקנת: מעט תינוקות והרבה קשישים. הבסיס צריך קורות.',
      needs: 'המגיעים צריכים מקומות עבודה וכיתות, והקשישים הרבים צריכים מרפאות. כל הקבוצות צריכות שירות.',
    },
  },

  // ───────────── World 4: Israel's tower (המגדל הישראלי) ─────────────
  {
    id: 15,
    world: 4,
    titleHe: 'גלי עלייה',
    conceptHe: 'עלייה היא הגירת יהודים לישראל. גל עלייה מגיע בבת אחת ובכל הגילים, ומגדיל את האוכלוסייה בזמן קצר.',
    introHe: [
      'ברוכים הבאים לישראל של 1950! בעשור הראשון הגיעו עולים רבים מאירופה ומארצות ערב.',
      'כל גל עלייה מגיע בבת אחת, עם ילדים, הורים וסבים.',
      'שימו כל קבוצת עולים בקומת הגיל שלה, ובנו להם מה שהם צריכים.',
    ],
    startYear: 1950,
    decades: 2,
    towers: [
      tower('ישראל', 'israel', 1950, 13, [
        wpp('israel', 1950, {
          arrivals: [
            group('a50-kids', 'aliyah', 'boat', { 0: 1 }, 'עולים: ילדים קטנים'),
            group('a50-teen', 'aliyah', 'boat', { 1: 1 }, 'עולים: בני נוער'),
            group('a50-20', 'aliyah', 'boat', { 2: 1 }, 'עולים בשנות ה-20 לחייהם'),
            group('a50-30', 'aliyah', 'plane', { 3: 1 }, 'עולים בשנות ה-30 לחייהם'),
            group('a50-40', 'aliyah', 'plane', { 4: 1 }, 'עולים בשנות ה-40 לחייהם'),
            group('a50-60', 'aliyah', 'boat', { 6: 1 }, 'עולים בשנות ה-60 לחייהם'),
          ],
          eventHe: 'גל עלייה גדול מאירופה ומארצות ערב',
        }),
        wpp('israel', 1960, {
          arrivals: [
            group('a60-kids', 'aliyah', 'boat', { 0: 1 }, 'עולים: ילדים קטנים'),
            group('a60-20', 'aliyah', 'plane', { 2: 1 }, 'עולים בשנות ה-20 לחייהם'),
            group('a60-30', 'aliyah', 'boat', { 3: 1 }, 'עולים בשנות ה-30 לחייהם'),
            group('a60-50', 'aliyah', 'plane', { 5: 1 }, 'עולים בשנות ה-50 לחייהם'),
          ],
          eventHe: 'עוד גל עלייה',
        }),
      ], { silhouetteYear: 1970 }),
    ],
    goal: 'reach',
    migrantFloors: 'choose',
    peoplePerBlock: 100000,
    wind: 0.15,
    supplyFactor: 0.3,
    hints: true,
    failHe: {
      needs: 'הגל הביא בבת אחת אנשים לכמה קומות. כל קומה שקיבלה עולים צריכה עכשיו עוד שירות: כיתות, מקומות עבודה או מרפאה.',
      collapse: 'הגל הכביד על צד אחד. הכניסו את העולים מהצד שמאזן את המגדל.',
    },
  },
  {
    id: 16,
    world: 4,
    titleHe: 'ריבוי טבעי ועלייה',
    conceptHe: 'אוכלוסיית ישראל גדלה משני מקורות. גידול מלידות מגיע לאט ומורגש קודם בגנים, גידול מעלייה מגיע בבת אחת ובכל הגילים.',
    introHe: [
      'בשנות ה-90 הגיעו לישראל כמיליון עולים, רובם ממדינות ברית המועצות לשעבר.',
      'במקביל המשיכו להיוולד תינוקות רבים.',
      'לוח המתכנן שואל: מתי כל אחד משני מנועי הגידול יצטרך מקומות עבודה?',
    ],
    startYear: 1990,
    decades: 2,
    towers: [
      tower('ישראל', 'israel', 1990, 23, [
        wpp('israel', 1990, {
          arrivals: [
            group('a90-teen', 'aliyah', 'plane', { 1: 1 }, 'עולים: בני נוער'),
            group('a90-30', 'aliyah', 'plane', { 3: 1 }, 'עולים בשנות ה-30 לחייהם'),
            group('a90-40', 'aliyah', 'plane', { 4: 1 }, 'עולים בשנות ה-40 לחייהם'),
            group('a90-50', 'aliyah', 'plane', { 5: 1 }, 'עולים בשנות ה-50 לחייהם'),
            group('a90-70', 'aliyah', 'plane', { 7: 1 }, 'עולים בני 70 ומעלה'),
          ],
          eventHe: 'כמיליון עולים ממדינות ברית המועצות לשעבר, ועולים מאתיופיה',
        }),
        wpp('israel', 2000, {
          arrivals: [group('a00-30', 'aliyah', 'plane', { 3: 1 }, 'עולים בשנות ה-30 לחייהם')],
          eventHe: 'העלייה קטנה, הלידות נמשכות',
        }),
      ], { silhouetteYear: 2010 }),
    ],
    goal: 'choose',
    choice: {
      promptHe: 'העולים ותינוקות העשור מוסיפים אנשים. מי מהם יצטרך מקומות עבודה כבר בעשור הזה?',
      options: [{ labelHe: 'העולים: רובם כבר בגיל העבודה' }, { labelHe: 'התינוקות: הם יגדלו מהר' }, { labelHe: 'אף אחד, רק בעוד 20 שנה' }],
      correct: 0,
      explainHe: 'גידול מעלייה מגיע בבת אחת ובכל הגילים, ולכן צריך דיור ומקומות עבודה באותו עשור. התינוקות יגיעו לגיל העבודה רק בעוד כ-20 שנה: קודם הם צריכים גנים וכיתות.',
    },
    peoplePerBlock: 200000,
    wind: 0.15,
    supplyFactor: 0.2,
    hints: true,
    failHe: {
      'wrong-call': 'תינוק שנולד היום יגיע לכיתה א בעוד שש שנים ולעבודה בעוד כעשרים. עולה בן 35 צריך עבודה כבר השנה.',
      needs: 'העולים הגיעו לכמה קומות בבת אחת: הם צריכים מקומות עבודה ומרפאות עכשיו, והתינוקות צריכים כיתות.',
      collapse: 'גל העלייה הכביד על הקומות העליונות. אזנו את המגדל בצד ההכנסה.',
    },
  },
  {
    id: 17,
    world: 4,
    titleHe: 'ישראל היום',
    conceptHe: 'ישראל היא מדינה מפותחת עם ריבוי טבעי גבוה: הבסיס נשאר רחב, ובמקביל הקשישים מתרבים.',
    introHe: [
      'ישראל היא מהמדינות המפותחות הבודדות שאוכלוסייתן עדיין גדלה מהר.',
      'הבסיס נשאר רחב, ובאותו זמן יש יותר ויותר קשישים.',
      'בנו את ישראל של 2020: כיתות, מקומות עבודה ומרפאות, כולם יחד.',
    ],
    startYear: 2000,
    decades: 2,
    towers: [
      tower('ישראל', 'israel', 2000, 30, [
        wpp('israel', 2000, { arrivals: [group('i00', 'aliyah', 'plane', { 3: 1 }, 'עולים בשנות ה-30 לחייהם')] }),
        wpp('israel', 2010, { arrivals: [group('i10', 'aliyah', 'plane', { 2: 1 }, 'עולים בשנות ה-20 לחייהם')] }),
      ]),
    ],
    goal: 'reach',
    peoplePerBlock: 200000,
    wind: 0.2,
    supplyFactor: 0.25,
    hints: true,
    failHe: {
      needs: 'ישראל צריכה גם הרבה כיתות (ילודה גבוהה) וגם יותר מרפאות (הזדקנות). חסר אחד מהשניים, והמגדל לא עומד ביעד.',
      collapse: 'גם מגדל רחב צריך איזון: פזרו את התינוקות בין שתי הדלתות.',
    },
  },
  {
    id: 18,
    world: 4,
    titleHe: 'מגדל העתיד',
    conceptHe: 'פירמידת הגילים היא כלי תכנון: לפי התחזית, עד 2050 מספר הקשישים בישראל יגדל הכי מהר.',
    introHe: ['קדימה לעתיד: ישראל מ-2020 עד 2050, לפי תחזית האו"ם.', 'בלי רמזים הפעם. קודם בחרו: איזו קבוצה תגדל הכי מהר?', 'ואז הביאו את המגדל ל-2050 בשלום.'],
    startYear: 2020,
    decades: 3,
    towers: [
      tower('ישראל', 'israel', 2020, 36, [
        given(WORKBOOK.israel.cbr, WORKBOOK.israel.cdr, { arrivals: [group('f20', 'aliyah', 'plane', { 3: 1 }, 'עולים בשנות ה-30 לחייהם')], eventHe: 'התחזית: 19 לידות ו-5 פטירות לכל 1000. הערכה: עולים, אם העלייה תימשך כמו בשנות ה-2010' }),
        wpp('israel', 2030, { arrivals: [group('f30', 'aliyah', 'plane', { 2: 1 }, 'עולים בשנות ה-20 לחייהם')], eventHe: 'התחזית: 17 לידות ו-6 פטירות לכל 1000. הערכה: עולים, אם העלייה תימשך כמו בשנות ה-2010' }),
        wpp('israel', 2040, { arrivals: [group('f40', 'aliyah', 'plane', { 4: 1 }, 'עולים בשנות ה-40 לחייהם')], eventHe: 'התחזית: 17 לידות ו-6 פטירות לכל 1000. הערכה: עולים, אם העלייה תימשך כמו בשנות ה-2010' }),
      ]),
    ],
    goal: 'choose',
    choice: {
      promptHe: 'איזו קבוצה תגדל הכי מהר עד 2050?',
      options: [{ labelHe: 'ילדים' }, { labelHe: 'בוגרים' }, { labelHe: 'קשישים' }],
      correct: 2,
      explainHe: 'הבוגרים הרבים של היום יעלו לקומות הקשישים, ואנשים חיים יותר. לפי תחזית האו"ם בני 65 ומעלה בישראל כמעט יוכפלו עד 2050, ומספר הצעירים יגדל לאט יותר.',
    },
    peoplePerBlock: 250000,
    wind: 0.25,
    migrantFloors: 'choose',
    supplyFactor: 0.2,
    hints: false,
    failHe: {
      'wrong-call': 'הקומות הרחבות של היום הן הבוגרים. בעוד 30 שנה הם יהיו בקומות הקשישים, ולכן הקשישים גדלים הכי מהר.',
      needs: 'בעתיד צריך יותר מרפאות בכל עשור, אבל הילודה בישראל נשארת גבוהה: גם הכיתות ממשיכות.',
      collapse: 'המגדל גבוה וכבד. פזרו תינוקות לשני הצדדים, ושמרו נקודה לקורה.',
    },
  },
];
