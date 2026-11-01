// Births, deaths, aging, needs and supply. Pure functions over per-band counts.

import { BAND_COUNT, type Band, type DecadePlan, type Group, type MortalityProfile, groupOf } from './types.ts';

/** Natural increase per 1,000 per year: births minus deaths (ריבוי טבעי = ילודה − תמותה). */
export function naturalIncrease(cbr: number, cdr: number): number {
  return Math.round((cbr - cdr) * 10) / 10;
}

/** Migration balance: arrivals minus departures (מאזן הגירה = נכנסים − יוצאים). */
export function migrationBalance(arrivals: number, departures: number): number {
  return arrivals - departures;
}

export function total(counts: number[]): number {
  return counts.reduce((a, b) => a + b, 0);
}

/** Baby blocks born in a decade: population × births per 1,000 per year × 10 years. */
export function birthsInDecade(population: number, plan: DecadePlan): number {
  if (plan.births !== undefined) return plan.births;
  return Math.round((population * plan.cbr * 10) / 1000);
}

/** Deaths in a decade, before they are spread over the bands. */
export function deathsInDecade(population: number, plan: DecadePlan): number {
  if (plan.deathsByBand) return total(plan.deathsByBand);
  return Math.round((population * plan.cdr * 10) / 1000);
}

/** Relative risk of dying in a decade, per band, for each mortality profile. */
export const MORTALITY: Record<MortalityProfile, number[]> = {
  // stage 1: children die often too
  high: [3, 1, 1, 1, 1.5, 2, 3, 4],
  // stage 2: medicine arrives, child deaths fall first
  falling: [1, 0.3, 0.4, 0.6, 1, 2, 4, 8],
  // stages 3–4: deaths are mostly at the top of the tower
  low: [0.1, 0.03, 0.05, 0.1, 0.3, 1, 4, 14],
};

/**
 * Spread `deaths` over the bands by risk × count, largest remainder first, never more
 * than a band has. Deterministic: ties go to the older band.
 */
export function spreadDeaths(counts: number[], deaths: number, profile: MortalityProfile): number[] {
  const out = new Array(BAND_COUNT).fill(0);
  let left = Math.min(deaths, total(counts));
  const cap = counts.slice();
  while (left > 0) {
    const w = MORTALITY[profile].map((r, b) => (cap[b] > 0 ? r * cap[b] : 0));
    const sw = total(w);
    if (sw === 0) break;
    const share = w.map((x) => (x / sw) * left);
    let given = 0;
    for (let b = 0; b < BAND_COUNT; b++) {
      const k = Math.min(cap[b], Math.floor(share[b]));
      out[b] += k;
      cap[b] -= k;
      given += k;
    }
    let rest = left - given;
    if (rest > 0) {
      const order = [...Array(BAND_COUNT).keys()]
        .filter((b) => cap[b] > 0)
        .sort((a, b) => share[b] - Math.floor(share[b]) - (share[a] - Math.floor(share[a])) || b - a);
      for (const b of order) {
        if (rest === 0) break;
        out[b] += 1;
        cap[b] -= 1;
        rest -= 1;
        given += 1;
      }
    }
    left -= given;
    if (given === 0) break;
  }
  return out;
}

export function profileOf(plan: DecadePlan): MortalityProfile {
  if (plan.mortality) return plan.mortality;
  if (plan.stage === 1) return 'high';
  if (plan.stage === 2) return 'falling';
  return 'low';
}

/** Everyone ages ten years: band b moves to b+1, the top band keeps its survivors. */
export function age(counts: number[]): number[] {
  const out = new Array(BAND_COUNT).fill(0);
  for (let b = 0; b < BAND_COUNT; b++) out[Math.min(BAND_COUNT - 1, b + 1)] += counts[b];
  return out;
}

export function groupCounts(counts: number[]): Record<Group, number> {
  const g: Record<Group, number> = { child: 0, adult: 0, elder: 0 };
  counts.forEach((n, b) => (g[groupOf(b)] += n));
  return g;
}

/** People one service piece looks after: elders need more care than workers. */
export const CAPACITY: Record<Group, number> = { child: 3, adult: 4, elder: 2 };

export function servicesNeeded(people: number, group: Group): number {
  return Math.ceil(people / CAPACITY[group]);
}

/** Dependency ratio: dependents (children + elders) per adult. */
export function dependencyRatio(counts: number[]): number {
  const g = groupCounts(counts);
  return g.adult === 0 ? Infinity : (g.child + g.elder) / g.adult;
}

/** Building points the working floors produce in a decade. */
export function supply(adults: number, factor: number): number {
  return Math.floor(adults * factor + 1e-9);
}

export function bandsOf(map: Partial<Record<Band, number>>): number[] {
  const out = new Array(BAND_COUNT).fill(0);
  for (const [b, n] of Object.entries(map)) out[Number(b)] += n ?? 0;
  return out;
}

/**
 * The whole counts trajectory of a tower if everyone is placed and nothing collapses:
 * the authoritative numbers every level is built on. counts[d] is the tower at the
 * start of decade d's placement (before births); the last entry is the end state.
 */
export function trajectory(start: number[], decades: DecadePlan[]): { counts: number[][]; births: number[]; deaths: number[][] } {
  const counts = [start.slice()];
  const births: number[] = [];
  const deaths: number[][] = [];
  let c = start.slice();
  for (const plan of decades) {
    const pop = total(c);
    const b = birthsInDecade(pop, plan);
    births.push(b);
    // during the decade: babies into band 0, arrivals in, departures out
    const during = c.slice();
    during[0] += b;
    for (const g of plan.arrivals ?? []) bandsOf(g.bands).forEach((n, k) => (during[k] += n));
    for (const g of plan.departures ?? []) bandsOf(g.bands).forEach((n, k) => (during[k] = Math.max(0, during[k] - n)));
    // the crank: deaths, then aging
    const d = plan.deathsByBand ?? spreadDeaths(during, deathsInDecade(pop, plan), profileOf(plan));
    deaths.push(d);
    const survivors = during.map((n, k) => n - d[k]);
    c = age(survivors);
    counts.push(c);
  }
  return { counts, births, deaths };
}
