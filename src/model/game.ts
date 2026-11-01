// The level run: decades, the tray, placement, the crank, outcomes and stars.
// Pure state machine; the scene renders it and the physics judges the crank.

import {
  BAND_COUNT,
  type Band,
  type Cell,
  type DecadePlan,
  type FailReason,
  type Group,
  type LevelDef,
  type MigrantKind,
  type ServiceType,
  type Side,
  type Tower,
  type Transport,
  groupOf,
  SERVICE_FOR,
} from './types.ts';
import { bandsOf, birthsInDecade, deathsInDecade, groupCounts, profileOf, servicesNeeded, spreadDeaths, supply, total } from './demography.ts';
import { ageRows, buildTower, counts, insert, newId, people, removePeople, services, stability, type StabilityReport } from './tower.ts';

export const NEAR_MARGIN = 0.25;
/** a gust tilt at or above this many degrees counts as a near-collapse */
export const NEAR_TILT_DEG = 1.5;
export const DEFAULT_SUPPLY = 0.5;

export interface Piece {
  id: number;
  kind: 'baby' | 'migrant';
  tower: number;
  /** the band these people really belong in */
  band: Band;
  count: number;
  migrant?: MigrantKind;
  transport?: Transport;
  labelHe: string;
  groupId?: string;
}

export interface JudgeResult {
  collapsed: boolean;
  /** largest floor tilt seen during the gust, degrees */
  maxTiltDeg: number;
  /** which tower fell first, if any */
  fallenTower?: number;
}

/** Decides whether the towers survive the crank's gust. The game uses Rapier; tests can use the lever rule. */
export type Judge = (towers: Tower[], wind: number, shake: number[]) => JudgeResult;

export const staticJudge: Judge = (towers, wind) => {
  let collapsed = false;
  let worst = Infinity;
  let fallenTower: number | undefined;
  towers.forEach((t, i) => {
    const s = stability(t, wind);
    if (s.margin < 0 || s.unsupported) {
      collapsed = true;
      fallenTower ??= i;
    }
    worst = Math.min(worst, s.margin);
  });
  // a rough tilt from the margin, for the near-collapse star in tests
  const maxTiltDeg = collapsed ? 90 : worst < NEAR_MARGIN ? 2 : 0.5;
  return { collapsed, maxTiltDeg, fallenTower };
};

export type Phase = 'place' | 'won' | 'failed';

export interface LogEvent {
  t: number;
  level: number;
  decade: number;
  action: string;
  detail?: Record<string, unknown>;
  outcome?: string;
  hinted: boolean;
  attempt: number;
}

export interface NeedsReport {
  tower: number;
  group: Group;
  people: number;
  needed: number;
  have: number;
}

export interface CrankResult {
  ok: boolean;
  reason?: FailReason;
  judge?: JudgeResult;
  needs: NeedsReport[];
  deaths: number[][];
  deathIds: number[][];
  dismantledIds: number[][];
  yearFrom: number;
  yearTo: number;
}

interface Snapshot {
  towers: Tower[];
  tray: Piece[];
  points: number;
  decade: number;
  departedIds: number[][];
}

const clone = <T>(x: T): T => structuredClone(x);

export class LevelRun {
  readonly def: LevelDef;
  towers: Tower[];
  tray: Piece[] = [];
  /** building points left this decade (shared by all towers) */
  points = 0;
  decade = 0;
  phase: Phase = 'place';
  failReason: FailReason | null = null;
  choiceMade: number | null = null;
  choiceCorrectFirst: boolean | null = null;
  attempt = 1;
  retries = 0;
  mistakes = 0;
  nearCollapse = false;
  hintUsed = false;
  maxTiltDeg = 0;
  stars = 0;
  startedAt = 0;
  durationMs = 0;
  log: LogEvent[] = [];
  /** ids of people who left on departures this decade, per tower (for the scene) */
  departedIds: number[][] = [];
  lastCrank: CrankResult | null = null;
  private snap: Snapshot | null = null;
  private clock: () => number;

  constructor(def: LevelDef, clock: () => number = () => 0) {
    this.def = def;
    this.clock = clock;
    this.startedAt = clock();
    this.towers = def.towers.map((p, i) => {
      const t = buildTower(p.start, p.baseX ?? i * 0);
      seedServices(t);
      return t;
    });
    this.beginDecade();
  }

  get year(): number {
    return this.def.startYear + this.decade * 10;
  }
  get targetYear(): number {
    return this.def.startYear + this.def.decades * 10;
  }
  plan(tower = 0): DecadePlan {
    const ds = this.def.towers[tower].decades;
    return ds[Math.min(this.decade, ds.length - 1)];
  }
  population(tower = 0): number {
    return total(counts(this.towers[tower]));
  }
  totalPopulation(): number {
    return this.towers.reduce((n, _, i) => n + this.population(i), 0);
  }
  mandatoryLeft(): number {
    return this.tray.length;
  }
  needsChoice(): boolean {
    return !!this.def.choice && this.choiceMade === null && this.decade === 0;
  }
  canCrank(): boolean {
    return this.phase === 'place' && this.tray.length === 0 && !this.needsChoice() && this.decade < this.def.decades;
  }

  private record(action: string, detail?: Record<string, unknown>, outcome?: string): void {
    this.log.push({ t: this.clock(), level: this.def.id, decade: this.decade, action, detail, outcome, hinted: this.hintUsed, attempt: this.attempt });
  }

  /** Start of a decade: departures leave, babies and arrivals wait in the tray, the working floors build. */
  private beginDecade(): void {
    this.tray = [];
    let seq = 0;
    const pid = () => this.decade * 1000 + ++seq;
    this.departedIds = this.towers.map(() => []);
    if (this.decade >= this.def.decades) return;
    let adults = 0;
    this.towers.forEach((tower, ti) => {
      const plan = this.plan(ti);
      const pop = total(counts(tower));
      const babies = birthsInDecade(pop, plan);
      // departures first: they leave from the ends of their floors
      for (const dep of plan.departures ?? []) {
        bandsOf(dep.bands).forEach((n, b) => {
          if (!n) return;
          const ids = removePeople(tower.rows[b], n, b % 2 ? 'left' : 'right');
          this.departedIds[ti].push(...ids);
          if (dep.toTower != null) {
            this.tray.push({ id: pid(), kind: 'migrant', tower: dep.toTower, band: b, count: ids.length, migrant: dep.kind, transport: dep.transport, labelHe: dep.labelHe, groupId: dep.id });
          }
        });
      }
      if (babies > 0) splitBabies(babies).forEach((n) => this.tray.push({ id: pid(), kind: 'baby', tower: ti, band: 0, count: n, labelHe: 'תינוקות' }));
      for (const g of plan.arrivals ?? []) {
        bandsOf(g.bands).forEach((n, b) => {
          if (n) this.tray.push({ id: pid(), kind: 'migrant', tower: g.tower ?? ti, band: b, count: n, migrant: g.kind, transport: g.transport, labelHe: g.labelHe, groupId: g.id });
        });
      }
    });
    this.towers.forEach((tower) => (adults += groupCounts(counts(tower)).adult));
    for (const p of this.tray) if (p.kind === 'migrant' && groupOf(p.band) === 'adult') adults += p.count;
    this.points = supply(adults, this.def.supplyFactor ?? DEFAULT_SUPPLY);
    this.snap = { towers: clone(this.towers), tray: clone(this.tray), points: this.points, decade: this.decade, departedIds: clone(this.departedIds) };
  }

  /** Floors a tray piece may go to: its own floor, or any populated floor when the player picks. */
  allowedBands(piece: Piece): Band[] {
    if (piece.kind === 'baby') return [0];
    if (this.def.migrantFloors === 'choose') return [...Array(BAND_COUNT).keys()];
    return [piece.band];
  }

  /**
   * Slide a tray piece in at a floor's end. A migrant group sent to the wrong floor
   * bounces back to the tray (a recoverable, logged mistake).
   */
  place(pieceId: number, band: Band, side: Side): 'ok' | 'wrong-floor' | 'invalid' {
    if (this.phase !== 'place') return 'invalid';
    const i = this.tray.findIndex((p) => p.id === pieceId);
    if (i < 0) return 'invalid';
    const piece = this.tray[i];
    if (!this.allowedBands(piece).includes(band)) return 'invalid';
    if (band !== piece.band) {
      this.mistakes++;
      this.record('place', { piece: piece.labelHe, band, trueBand: piece.band, side }, 'wrong-floor');
      return 'wrong-floor';
    }
    const tower = this.towers[piece.tower];
    for (let k = 0; k < piece.count; k++) {
      const cell: Cell = { kind: 'person', origin: piece.kind === 'baby' ? 'baby' : piece.migrant ?? 'native', id: newId() };
      insert(tower, band, side, cell);
    }
    this.tray.splice(i, 1);
    this.record('place', { piece: piece.labelHe, band, side, count: piece.count }, 'ok');
    return 'ok';
  }

  /** Spend a building point on a service piece or a beam. Beams only go in the nursery floor. */
  build(kind: ServiceType | 'beam', towerIdx: number, band: Band, side: Side): 'ok' | 'no-points' | 'invalid' | 'wasted' {
    if (this.phase !== 'place') return 'invalid';
    if (this.points <= 0) return 'no-points';
    const tower = this.towers[towerIdx];
    if (!tower) return 'invalid';
    if (kind === 'beam') {
      if (band !== 0) return 'invalid';
      insert(tower, 0, side, { kind: 'beam', id: newId() });
    } else {
      const row = tower.rows[band];
      // a floor's front face has one dock per person
      if (!row || people(row) === 0 || row.services.length >= people(row)) return 'invalid';
      row.services.push({ service: kind, id: newId() });
    }
    this.points--;
    const wasted = kind !== 'beam' && SERVICE_FOR[groupOf(band)] !== kind;
    if (wasted) this.mistakes++;
    this.record('build', { kind, tower: towerIdx, band, side }, wasted ? 'wasted' : 'ok');
    return wasted ? 'wasted' : 'ok';
  }

  makeChoice(i: number): boolean {
    const c = this.def.choice;
    if (!c || this.phase !== 'place') return false;
    this.choiceMade = i;
    const right = i === c.correct;
    if (this.choiceCorrectFirst === null) this.choiceCorrectFirst = right;
    this.record('choice', { option: i }, right ? 'right' : 'wrong');
    return right;
  }

  needs(): NeedsReport[] {
    const out: NeedsReport[] = [];
    this.towers.forEach((tower, ti) => {
      for (const group of ['child', 'adult', 'elder'] as Group[]) {
        let ppl = 0;
        let have = 0;
        tower.rows.forEach((row, b) => {
          if (groupOf(b) !== group) return;
          ppl += people(row);
          have += services(row, SERVICE_FOR[group]);
        });
        out.push({ tower: ti, group, people: ppl, needed: servicesNeeded(ppl, group), have });
      }
    });
    return out;
  }

  stability(towerIdx = 0): StabilityReport {
    return stability(this.towers[towerIdx], this.def.wind);
  }

  /** Pull the decade crank. The judge runs the gust; then deaths, aging and the next decade. */
  crank(judge: Judge = staticJudge): CrankResult {
    const yearFrom = this.year;
    const needs = this.needs();
    const unmet = needs.filter((n) => n.have < n.needed);
    const base = { needs, deaths: [], deathIds: [], dismantledIds: [], yearFrom, yearTo: yearFrom };
    if (!this.canCrank()) return { ok: false, ...base };
    // unserved people hop and complain, shaking their tower
    const shake = this.towers.map((_, ti) => unmet.filter((n) => n.tower === ti).reduce((s, n) => s + (n.needed - n.have), 0));
    const empty = this.towers.some((t) => t.rows[0].cells.length === 0 && t.rows.some((r, b) => b > 0 && r.cells.length));
    const j = judge(this.towers, this.def.wind, shake);
    this.maxTiltDeg = Math.max(this.maxTiltDeg, j.maxTiltDeg);
    this.record('crank', { year: yearFrom, unmet: unmet.length, maxTilt: Math.round(j.maxTiltDeg) }, j.collapsed ? 'collapse' : unmet.length ? 'needs' : 'stand');
    let reason: FailReason | undefined;
    if (empty && j.collapsed) reason = 'empty-base';
    else if (j.collapsed) reason = 'collapse';
    else if (unmet.length) reason = 'needs';
    else if (this.def.choice && this.decade === 0 && this.choiceMade !== this.def.choice.correct) reason = 'wrong-call';
    if (reason) {
      this.phase = 'failed';
      this.failReason = reason;
      this.lastCrank = { ok: false, reason, judge: j, ...base };
      return this.lastCrank;
    }
    if (j.maxTiltDeg >= NEAR_TILT_DEG) this.nearCollapse = true;
    // deaths fade, everyone ages
    const deaths: number[][] = [];
    const deathIds: number[][] = [];
    const dismantledIds: number[][] = [];
    this.towers.forEach((tower, ti) => {
      const plan = this.plan(ti);
      const popAtStart = total(counts(this.snap!.towers[ti])) + this.departedIds[ti].length;
      const now = counts(tower);
      const d = plan.deathsByBand ?? spreadDeaths(now, deathsInDecade(popAtStart, plan), profileOf(plan));
      deaths.push(d);
      const ids: number[] = [];
      d.forEach((n, b) => ids.push(...removePeople(tower.rows[b], n, b % 2 ? 'right' : 'left')));
      deathIds.push(ids);
      dismantledIds.push(ageRows(tower));
    });
    this.decade++;
    const res: CrankResult = { ok: true, judge: j, needs, deaths, deathIds, dismantledIds, yearFrom, yearTo: this.year };
    this.lastCrank = res;
    const exact = this.def.goal === 'exact';
    const over = exact && this.totalPopulation() > (this.def.exactTarget ?? Infinity);
    if (over || (exact && this.decade >= this.def.decades && this.totalPopulation() !== this.def.exactTarget)) {
      // cranked past the mayor's number: retry this decade (the snapshot is still its start)
      this.mistakes++;
      this.phase = 'failed';
      this.failReason = 'overshoot';
      res.ok = false;
      res.reason = 'overshoot';
    } else if (this.decade >= this.def.decades && !exact) this.win();
    else this.beginDecade();
    return res;
  }

  /** Goal 'exact': ring the bell when the tower holds exactly the target. */
  ringBell(): boolean {
    if (this.def.goal !== 'exact' || this.phase !== 'place') return false;
    const ok = this.totalPopulation() === this.def.exactTarget;
    this.record('bell', { population: this.totalPopulation(), year: this.year }, ok ? 'right' : 'wrong');
    if (ok) this.win();
    else {
      this.mistakes++;
      this.phase = 'failed';
      this.failReason = 'wrong-call';
    }
    return ok;
  }

  private win(): void {
    this.phase = 'won';
    this.durationMs = Math.max(1, this.clock() - this.startedAt);
    let s = 1;
    if (!this.nearCollapse) s++;
    if (this.mistakes === 0 && this.retries === 0 && this.choiceCorrectFirst !== false) s++;
    this.stars = s;
    this.record('win', { stars: s, retries: this.retries }, 'won');
  }

  /** Retry from the start of the decade that failed. */
  retry(): void {
    if (!this.snap) return;
    this.towers = clone(this.snap.towers);
    this.tray = clone(this.snap.tray);
    this.points = this.snap.points;
    this.decade = this.snap.decade;
    this.departedIds = clone(this.snap.departedIds);
    this.phase = 'place';
    this.failReason = null;
    if (this.decade === 0) this.choiceMade = null;
    this.retries++;
    this.attempt++;
    this.record('retry');
  }

  useHint(): void {
    this.hintUsed = true;
    this.record('hint');
  }
}

/** Shula carries at most three babies per bundle. */
export function splitBabies(n: number): number[] {
  const out: number[] = [];
  while (n > 0) {
    const k = Math.min(3, n);
    out.push(k);
    n -= k;
  }
  return out;
}

/** A level's starting tower already has the services its people need, alternating ends. */
function seedServices(tower: Tower): void {
  tower.rows.forEach((row, b) => {
    const n = people(row);
    if (!n) return;
    const need = servicesNeeded(n, groupOf(b));
    for (let k = 0; k < need; k++) row.services.push({ service: SERVICE_FOR[groupOf(b)], id: newId() });
  });
}
