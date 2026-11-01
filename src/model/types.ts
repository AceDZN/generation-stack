// Shared types for the pure game model. No Three.js or Rapier imports in src/model.

/** Ten-year age bands, bottom floor first. Band 7 is "70+". */
export const BANDS = ['0–9', '10–19', '20–29', '30–39', '40–49', '50–59', '60–69', '70+'] as const;
export const BAND_COUNT = BANDS.length;
export type Band = number; // 0..7

/** Workbook's three age groups (grade 7, age pyramids). In this game a floor is ten years. */
export type Group = 'child' | 'adult' | 'elder';
export const GROUP_HE: Record<Group, string> = { child: 'ילדים', adult: 'בוגרים', elder: 'קשישים' };
export function groupOf(band: Band): Group {
  if (band <= 1) return 'child';
  if (band <= 5) return 'adult';
  return 'elder';
}

export type ServiceType = 'classroom' | 'workplace' | 'clinic';
export const SERVICE_FOR: Record<Group, ServiceType> = { child: 'classroom', adult: 'workplace', elder: 'clinic' };
export const SERVICE_HE: Record<ServiceType, string> = { classroom: 'כיתה', workplace: 'מקום עבודה', clinic: 'מרפאה' };

export type MigrantKind = 'labor' | 'refugee' | 'aliyah' | 'internal' | 'return' | 'emigrant';
export type Transport = 'boat' | 'train' | 'plane' | 'bus';

/** One cell of a floor row. Rows are contiguous runs of cells, one unit wide each. */
export type Cell = { kind: 'person'; origin: 'native' | 'baby' | MigrantKind; id: number } | { kind: 'beam'; id: number };

/** A service piece docked on a floor's front face. It never widens the floor, so the row width stays the real population. */
export interface ServicePiece {
  service: ServiceType;
  id: number;
}

export interface Row {
  /** x of the leftmost cell centre, in cell units */
  leftX: number;
  cells: Cell[];
  services: ServicePiece[];
}

export interface Tower {
  /** rows[band]; rows[0] is the nursery floor at the bottom */
  rows: Row[];
  /** x offset of this tower on the plaza, in cell units (two-tower levels) */
  baseX: number;
}

export type Side = 'left' | 'right';

/** Mortality profile: how a decade's deaths spread across the bands. */
export type MortalityProfile = 'high' | 'falling' | 'low';

export interface MigrantGroup {
  id: string;
  kind: MigrantKind;
  transport: Transport;
  /** blocks per band, e.g. { 2: 3, 3: 1 } = three 20–29s and one 30–39 */
  bands: Partial<Record<Band, number>>;
  labelHe: string;
  /** which tower they join (default 0) */
  tower?: number;
}

export interface Departure {
  id: string;
  kind: MigrantKind;
  transport: Transport;
  bands: Partial<Record<Band, number>>;
  labelHe: string;
  tower?: number;
  /** where they go: another tower in this level (brain drain), or away (null) */
  toTower?: number | null;
}

/** One decade of the level's authoritative data for one tower. */
export interface DecadePlan {
  /** births and deaths per 1,000 people per year, as on the mayor's board */
  cbr: number;
  cdr: number;
  /** demographic transition stage (1–4) for the board and stage levels */
  stage?: 1 | 2 | 3 | 4;
  mortality?: MortalityProfile;
  /** overrides: exact baby blocks this decade / deaths per band at the crank */
  births?: number;
  deathsByBand?: number[];
  arrivals?: MigrantGroup[];
  departures?: Departure[];
  /** one-line Hebrew event for the board, e.g. "רפואה טובה יותר: התמותה יורדת" */
  eventHe?: string;
}

export interface TowerPlan {
  nameHe: string;
  /** starting person blocks per band (length 8) */
  start: number[];
  decades: DecadePlan[];
  /** a real country's pyramid to ghost beside the tower, shares per band summing to ~1 */
  silhouette?: number[];
  silhouetteLabelHe?: string;
  baseX?: number;
}

export type GoalType = 'reach' | 'exact' | 'stage' | 'choose';

export interface Choice {
  promptHe: string;
  options: { labelHe: string }[];
  correct: number;
  /** when to ask: before the first crank (default) */
  explainHe: string;
}

export interface LevelDef {
  id: number;
  world: 1 | 2 | 3 | 4;
  titleHe: string;
  conceptHe: string;
  introHe: string[];
  startYear: number;
  /** number of cranks to the target year (targetYear = startYear + 10 * decades) */
  decades: number;
  towers: TowerPlan[];
  goal: GoalType;
  /** goal 'exact': ring the bell when the total population equals this many blocks */
  exactTarget?: number;
  /** goal 'stage' or 'choose': a call the player makes before the first crank */
  choice?: Choice;
  /** people per block, for the board */
  peoplePerBlock: number;
  /** horizontal wind gust strength at the crank (0 = calm) */
  wind: number;
  /** building points per adult block per decade */
  supplyFactor?: number;
  /** migrant floors: 'auto' = groups go to their own floor, 'choose' = the player picks */
  migrantFloors?: 'auto' | 'choose';
  /** transfer levels hide the per-floor need counts and the stability hint */
  hints: boolean;
  /** extra Hebrew line shown on failure, keyed by reason */
  failHe?: Partial<Record<FailReason, string>>;
}

export type FailReason = 'collapse' | 'needs' | 'overshoot' | 'wrong-call' | 'empty-base';
