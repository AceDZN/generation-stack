// The endless (daily) tower: a seeded level built from a real country's WPP rates and
// age shares (src/model/countries.ts). Every level it returns has been solved by the
// solver, so a seed can never hand the player an impossible tower. Pure: no network,
// no storage, no clock; the same seed always gives the same level.

import type { DecadePlan, GoalType, LevelDef, TowerPlan } from './types.ts';
import { type CountryId, COUNTRIES, peoplePerBlock, rates, silhouette, startTower } from './countries.ts';
import { solve, replay } from './solver.ts';
import { LevelRun } from './game.ts';

const MAX_ROW = 14;
const MAX_CELLS = 70;
const MIN_MARGIN = 0.25; // a little above the campaign's 0.2, since the daily tower is not Rapier-checked here

const STAGE_OPTIONS = [
  { labelHe: 'שלב 1: ילודה ותמותה גבוהות' },
  { labelHe: 'שלב 2: התמותה ירדה, הילודה עוד גבוהה' },
  { labelHe: 'שלב 3: הילודה יורדת' },
  { labelHe: 'שלב 4: ילודה ותמותה נמוכות' },
];

function rng(seed: number): () => number {
  // mulberry32
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];

/** Largest row and total cells over the whole solved run (people + beams). */
function size(def: LevelDef, actions: ReturnType<typeof solve>['actions']): { row: number; cells: number } {
  const out = { row: 0, cells: 0 };
  for (let k = 0; k <= actions.length; k++) {
    const run: LevelRun = replay(def, actions.slice(0, k));
    let cells = 0;
    for (const t of run.towers)
      for (const row of t.rows) {
        out.row = Math.max(out.row, row.cells.length);
        cells += row.cells.length;
      }
    out.cells = Math.max(out.cells, cells);
  }
  return out;
}

/** Tower totals after each crank of a solved run, for picking an exact target. */
function totalsAfterCranks(def: LevelDef, actions: ReturnType<typeof solve>['actions']): number[] {
  const totals: number[] = [];
  actions.forEach((a, i) => {
    if (a.type === 'crank') totals.push(replay(def, actions.slice(0, i + 1)).totalPopulation());
  });
  return totals;
}

function build(seed: number, attempt: number): LevelDef | null {
  const r = rng(seed * 7919 + attempt * 104729 + 1);
  const ids = Object.keys(COUNTRIES) as CountryId[];
  const id = pick(r, ids);
  const c = COUNTRIES[id];
  const decades = 2 + Math.floor(r() * 2); // 2 or 3
  const starts = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020].filter((y) => y + 10 * decades <= 2050);
  const startYear = pick(r, starts);
  const endYear = startYear + 10 * decades;
  const blocks = 14 + Math.floor(r() * 17); // 14..30
  const wind = Math.round((0.1 + r() * 0.2) * 20) / 20; // 0.1..0.3
  const plans: DecadePlan[] = [];
  for (let d = 0; d < decades; d++) {
    const x = rates(id, startYear + 10 * d);
    plans.push({ cbr: x.cbr, cdr: x.cdr, stage: x.stage, eventHe: `${startYear + 10 * d}: ${x.cbr} לידות ו-${x.cdr} פטירות לכל 1000 תושבים בשנה` });
  }
  const roll = r();
  const goal: GoalType = roll < 0.6 ? 'reach' : roll < 0.8 ? 'stage' : 'exact';
  const hidden = goal === 'stage';
  const nameHe = hidden ? 'מגדל אלמוני' : c.nameHe;
  const tower: TowerPlan = { nameHe, start: startTower(id, startYear, blocks), decades: plans };
  if (endYear <= 2020) {
    tower.silhouette = silhouette(id, endYear);
    tower.silhouetteLabelHe = `${c.nameHe} ${endYear}`;
  }
  const base: LevelDef = {
    id: 100,
    world: 4,
    titleHe: hidden ? 'מגדל אלמוני' : `המגדל של ${c.nameHe}`,
    conceptHe: 'אתגר יומי: מדינה אמיתית, שיעורי ילודה ותמותה אמיתיים (האו"ם, WPP 2024).',
    introHe: [
      hidden ? `מגדל בלי שם, ${startYear}. הלוח מראה רק ילודה ותמותה.` : `${c.nameHe}, ${startYear}. המספרים על הלוח הם של ${c.nameHe} באמת.`,
      'בכל עשור: החליקו את התינוקות, בנו את מה שחסר, ומשכו את מנוף העשור.',
      `שמרו על המגדל עומד עד ${endYear}.`,
    ],
    startYear,
    decades,
    towers: [tower],
    goal: 'reach',
    peoplePerBlock: peoplePerBlock(id, Math.min(startYear, 2020), blocks),
    wind,
    hints: true,
  };
  if (goal === 'stage') {
    const st = plans[0].stage ?? 4;
    base.goal = 'stage';
    base.introHe[2] = `בחרו את הדגל הנכון, ואז שמרו על המגדל עד ${endYear}.`;
    base.choice = {
      promptHe: 'באיזה שלב של המעבר הדמוגרפי נמצא המגדל?',
      options: STAGE_OPTIONS,
      correct: st - 1,
      explainHe: `הילודה ${plans[0].cbr} והתמותה ${plans[0].cdr} לכל 1000: זה שלב ${st}. זה המגדל של ${c.nameHe} ב-${startYear}.`,
    };
  }
  // the smallest supply the solver can live with, so the points stay tight
  for (let sf = 0.2; sf <= 0.6 + 1e-9; sf += 0.05) {
    const def: LevelDef = { ...base, supplyFactor: Math.round(sf * 100) / 100 };
    let s = solve(def);
    if (!s.won || s.minMargin < MIN_MARGIN) continue;
    if (goal === 'exact') {
      // ring after an intermediate crank whose next decade still grows, so cranking past fails
      const totals = totalsAfterCranks(def, s.actions);
      const k = totals.findIndex((t, i) => i < totals.length - 1 && totals[i + 1] > t);
      if (k < 0) return null;
      def.goal = 'exact';
      def.exactTarget = totals[k];
      def.introHe = [...def.introHe.slice(0, 2), `צלצלו בפעמון כשבמגדל יהיו בדיוק ${totals[k]} משפחות.`];
      s = solve(def);
      if (!s.won || s.minMargin < MIN_MARGIN) continue;
    }
    const sz = size(def, s.actions);
    if (sz.row > MAX_ROW || sz.cells > MAX_CELLS) return null;
    return def;
  }
  return null;
}

/** A known-good tower for the (never yet seen) case where every seeded attempt fails. */
function fallback(): LevelDef {
  const def = build(1, 0);
  if (def) return def;
  const plans: DecadePlan[] = [2000, 2010].map((y) => {
    const x = rates('niger', y);
    return { cbr: x.cbr, cdr: x.cdr, stage: x.stage };
  });
  return {
    id: 100,
    world: 4,
    titleHe: `המגדל של ${COUNTRIES.niger.nameHe}`,
    conceptHe: 'אתגר יומי: מדינה אמיתית, שיעורי ילודה ותמותה אמיתיים (האו"ם, WPP 2024).',
    introHe: [`${COUNTRIES.niger.nameHe}, 2000.`, 'שמרו על המגדל עומד עד 2020.'],
    startYear: 2000,
    decades: 2,
    towers: [{ nameHe: COUNTRIES.niger.nameHe, start: startTower('niger', 2000, 12), decades: plans, silhouette: silhouette('niger', 2020) }],
    goal: 'reach',
    peoplePerBlock: peoplePerBlock('niger', 2000, 12),
    wind: 0.1,
    supplyFactor: 0.5,
    hints: true,
  };
}

/** The endless tower for a seed (the app passes a daily seed, then seed + 1, ...). */
export function endlessLevel(seed: number): LevelDef {
  for (let attempt = 0; attempt < 40; attempt++) {
    const def = build(seed, attempt);
    if (def) return def;
  }
  return fallback();
}
