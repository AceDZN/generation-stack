// A greedy solver over the real game rules, used to prove every authored level is
// solvable and to drive autoplay in browser tests. It plays through LevelRun only.

import { type Band, type Cell, type Group, type LevelDef, type ServiceType, type Side, BAND_COUNT, groupOf, SERVICE_FOR } from './types.ts';
import { LevelRun, NEAR_MARGIN, staticJudge, type Judge } from './game.ts';
import { centreX, insert, people, stability } from './tower.ts';

export type Action =
  | { type: 'place'; piece: number; band: Band; side: Side }
  | { type: 'build'; kind: ServiceType | 'beam'; tower: number; band: Band; side: Side }
  | { type: 'choice'; option: number }
  | { type: 'crank' }
  | { type: 'bell' };

export interface SolveResult {
  won: boolean;
  stars: number;
  actions: Action[];
  run: LevelRun;
  minMargin: number;
}

/** Try both ends on a copy of the tower and keep the one that leaves it steadier. */
function bestSide(run: LevelRun, tower: number, band: Band, cell: () => Cell, count = 1): Side {
  let best: Side = 'right';
  let bestM = -Infinity;
  let bestOff = Infinity;
  for (const side of ['right', 'left'] as Side[]) {
    const t = structuredClone(run.towers[tower]);
    for (let k = 0; k < count; k++) insert(t, band, side, cell());
    const m = stability(t, run.def.wind).margin;
    // on a tie keep the floor centred over its neighbour, or the tower grows into a staircase
    const near = t.rows[band + 1]?.cells.length ? t.rows[band + 1] : t.rows[band - 1];
    const off = near?.cells.length ? Math.abs(centreX(t.rows[band]) - centreX(near)) : 0;
    if (m > bestM + 1e-9 || (Math.abs(m - bestM) <= 1e-9 && off < bestOff)) {
      bestM = m;
      bestOff = off;
      best = side;
    }
  }
  return best;
}

export function solve(def: LevelDef, judge: Judge = staticJudge): SolveResult {
  const run = new LevelRun(def);
  const actions: Action[] = [];
  let minMargin = Infinity;
  const act = (a: Action) => {
    actions.push(a);
    if (a.type === 'place') run.place(a.piece, a.band, a.side);
    else if (a.type === 'build') run.build(a.kind, a.tower, a.band, a.side);
    else if (a.type === 'choice') run.makeChoice(a.option);
    else if (a.type === 'crank') run.crank(judge);
    else run.ringBell();
  };
  if (def.choice) act({ type: 'choice', option: def.choice.correct });
  for (let guard = 0; guard < 40 && run.phase === 'place'; guard++) {
    if (def.goal === 'exact' && run.totalPopulation() === def.exactTarget) {
      act({ type: 'bell' });
      break;
    }
    // mandatory pieces: biggest first
    const tray = [...run.tray].sort((a, b) => b.count - a.count);
    for (const p of tray) {
      const side = bestSide(run, p.tower, p.band, () => ({ kind: 'person', origin: 'native', id: 0 }), p.count);
      act({ type: 'place', piece: p.id, band: p.band, side });
    }
    // services where they are missing, on the floor of that group with most people
    for (const n of run.needs()) {
      for (let k = n.have; k < n.needed && run.points > 0; k++) {
        const band = busiestBand(run, n.tower, n.group);
        if (band < 0) break;
        act({ type: 'build', kind: SERVICE_FOR[n.group], tower: n.tower, band, side: 'right' });
      }
    }
    // spare points become beams while the base is shaky
    for (let t = 0; t < run.towers.length; t++) {
      while (run.points > 0 && stability(run.towers[t], def.wind).margin < NEAR_MARGIN + 0.1) {
        const before = stability(run.towers[t], def.wind).margin;
        const side = trySide(run, t, 'beam', 0);
        act({ type: 'build', kind: 'beam', tower: t, band: 0, side });
        if (stability(run.towers[t], def.wind).margin <= before + 1e-9) break;
      }
    }
    run.towers.forEach((t) => (minMargin = Math.min(minMargin, stability(t, def.wind).margin)));
    act({ type: 'crank' });
    if (def.goal === 'exact' && run.phase === 'place' && run.totalPopulation() === def.exactTarget) {
      act({ type: 'bell' });
      break;
    }
  }
  return { won: run.phase === 'won', stars: run.stars, actions, run, minMargin };
}

function busiestBand(run: LevelRun, tower: number, group: Group): Band {
  let best = -1;
  let bestN = 0;
  for (let b = 0; b < BAND_COUNT; b++) {
    if (groupOf(b) !== group) continue;
    const n = people(run.towers[tower].rows[b]);
    if (n > bestN) {
      bestN = n;
      best = b;
    }
  }
  return best;
}

function trySide(run: LevelRun, tower: number, kind: ServiceType | 'beam', band: Band): Side {
  return bestSide(run, tower, band, () => (kind === 'beam' ? { kind: 'beam', id: 0 } : { kind: 'person', origin: 'native', id: 0 }));
}

/** Replay a list of actions (from the solver or a test) on a fresh run. */
export function replay(def: LevelDef, actions: Action[], judge: Judge = staticJudge): LevelRun {
  const run = new LevelRun(def);
  for (const a of actions) {
    if (a.type === 'place') run.place(a.piece, a.band, a.side);
    else if (a.type === 'build') run.build(a.kind, a.tower, a.band, a.side);
    else if (a.type === 'choice') run.makeChoice(a.option);
    else if (a.type === 'crank') run.crank(judge);
    else run.ringBell();
  }
  return run;
}
