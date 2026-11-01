// Scripted players for the level tests: the solver's good habits with one habit swapped
// for a constant or wrong one, so each test shows what that habit costs.

import { type Band, type Group, type LevelDef, type ServiceType, type Side, BAND_COUNT, groupOf, SERVICE_FOR } from '../src/model/types.ts';
import { LevelRun, NEAR_MARGIN, staticJudge, type Judge } from '../src/model/game.ts';
import { centreX, insert, people, stability } from '../src/model/tower.ts';

export interface Policy {
  /** which door each piece goes in */
  side?: 'best' | 'right' | 'left' | 'alternate';
  /** 'correct' = what each group needs; a ServiceType = always that piece; 'none' = build nothing */
  services?: 'correct' | 'none' | ServiceType;
  /** spend spare points on beams while the base is shaky */
  beams?: boolean;
  /** banner index, 'correct', or a seeded random pick */
  choice?: number | 'correct' | { random: number };
  /** ring the bell on the exact target, or never ring and keep cranking */
  bell?: 'correct' | 'never' | 'early';
  /** in 'choose' levels, send migrant pieces to this floor offset from their real one first */
  wrongFloorFirst?: boolean;
  /** waste this many points on the wrong service each decade before building the right ones */
  wasteEachDecade?: number;
  judge?: Judge;
}

export interface PlayResult {
  run: LevelRun;
  won: boolean;
  reason: string | null;
  bounces: number;
  minMargin: number;
  /** per decade: points at the start, points left at the crank */
  points: { start: number; left: number }[];
  maxRow: number;
  maxCells: number;
}

function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

/** The steadier door, like the solver: a tie goes to the door that keeps the row centred over its neighbour. */
function bestSide(run: LevelRun, tower: number, band: Band, count: number, beam = false): Side {
  let best: Side = 'right';
  let bestM = -Infinity;
  let bestOff = Infinity;
  for (const side of ['right', 'left'] as Side[]) {
    const t = structuredClone(run.towers[tower]);
    for (let k = 0; k < count; k++) insert(t, band, side, beam ? { kind: 'beam', id: 0 } : { kind: 'person', origin: 'native', id: 0 });
    const m = stability(t, run.def.wind).margin;
    const row = t.rows[band];
    const ref = t.rows[band + 1]?.cells.length ? t.rows[band + 1] : t.rows[band - 1];
    const off = ref?.cells.length ? Math.abs(centreX(row) - centreX(ref)) : 0;
    if (m > bestM + 1e-9 || (Math.abs(m - bestM) <= 1e-9 && off < bestOff)) {
      bestM = m;
      best = side;
      bestOff = off;
    }
  }
  return best;
}

function busiestBand(run: LevelRun, tower: number, group: Group): Band {
  let best = -1;
  let bestN = 0;
  for (let b = 0; b < BAND_COUNT; b++) {
    if (groupOf(b) !== group) continue;
    const n = people(run.towers[tower].rows[b]) - run.towers[tower].rows[b].services.length;
    if (n > bestN) {
      bestN = n;
      best = b;
    }
  }
  return best;
}

function measure(run: LevelRun, r: { maxRow: number; maxCells: number }): void {
  let cells = 0;
  for (const t of run.towers)
    for (const row of t.rows) {
      r.maxRow = Math.max(r.maxRow, row.cells.length);
      cells += row.cells.length;
    }
  r.maxCells = Math.max(r.maxCells, cells);
}

export function play(def: LevelDef, p: Policy = {}): PlayResult {
  const policy: Required<Omit<Policy, 'judge'>> & { judge: Judge } = {
    side: 'best',
    services: 'correct',
    beams: true,
    choice: 'correct',
    bell: 'correct',
    wrongFloorFirst: false,
    wasteEachDecade: 0,
    judge: staticJudge,
    ...p,
  };
  const run = new LevelRun(def);
  const res: PlayResult = { run, won: false, reason: null, bounces: 0, minMargin: Infinity, points: [], maxRow: 0, maxCells: 0 };
  let alt: Side = 'right';
  const side = (tower: number, band: Band, count: number, beam = false): Side => {
    if (policy.side === 'right' || policy.side === 'left') return policy.side;
    if (policy.side === 'alternate') return (alt = alt === 'right' ? 'left' : 'right');
    return bestSide(run, tower, band, count, beam);
  };
  if (def.choice) {
    const c = policy.choice;
    const n = def.choice.options.length;
    run.makeChoice(c === 'correct' ? def.choice.correct : typeof c === 'number' ? c : Math.floor(rng(c.random)() * n));
  }
  for (let guard = 0; guard < 40 && run.phase === 'place'; guard++) {
    if (def.goal === 'exact') {
      const ringNow = policy.bell === 'correct' ? run.totalPopulation() === def.exactTarget : policy.bell === 'early' && run.decade === 0;
      if (ringNow) {
        run.ringBell();
        break;
      }
    }
    if (run.decade >= def.decades) break;
    const decStart = run.points;
    const tray = [...run.tray].sort((a, b) => b.count - a.count);
    for (const piece of tray) {
      if (policy.wrongFloorFirst && def.migrantFloors === 'choose' && piece.kind === 'migrant') {
        const wrong = piece.band === BAND_COUNT - 1 ? piece.band - 1 : piece.band + 1;
        if (run.place(piece.id, wrong, 'right') === 'wrong-floor') res.bounces++;
      }
      run.place(piece.id, piece.band, side(piece.tower, piece.band, piece.count));
      measure(run, res);
    }
    // wasted pieces: the wrong service on a crowded floor
    for (let k = 0; k < policy.wasteEachDecade && run.points > 0; k++) {
      const n = run.needs().find((x) => x.people > 0 && x.group !== 'child') ?? run.needs()[0];
      const band = busiestBand(run, n.tower, n.group);
      if (band >= 0) run.build(n.group === 'child' ? 'workplace' : 'classroom', n.tower, band, 'right');
    }
    if (policy.services !== 'none') {
      for (const n of run.needs()) {
        for (let k = n.have; k < n.needed && run.points > 0; k++) {
          const band = busiestBand(run, n.tower, n.group);
          if (band < 0) break;
          const kind: ServiceType = policy.services === 'correct' ? SERVICE_FOR[n.group] : policy.services;
          if (run.build(kind, n.tower, band, 'right') === 'invalid') break;
        }
      }
    }
    if (policy.beams) {
      for (let t = 0; t < run.towers.length; t++) {
        while (run.points > 0 && stability(run.towers[t], def.wind).margin < NEAR_MARGIN + 0.1) {
          const before = stability(run.towers[t], def.wind).margin;
          run.build('beam', t, 0, side(t, 0, 1, true));
          measure(run, res);
          if (stability(run.towers[t], def.wind).margin <= before + 1e-9) break;
        }
      }
    }
    run.towers.forEach((t) => (res.minMargin = Math.min(res.minMargin, stability(t, def.wind).margin)));
    res.points.push({ start: decStart, left: run.points });
    if (!run.canCrank()) break;
    run.crank(policy.judge);
  }
  if (def.goal === 'exact' && run.phase === 'place' && policy.bell === 'correct' && run.totalPopulation() === def.exactTarget) run.ringBell();
  res.won = run.phase === 'won';
  res.reason = run.failReason;
  return res;
}
