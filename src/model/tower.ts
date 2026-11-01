// Tower layout: rows of one-unit cells, one row per age band. Pieces enter at a row's
// left or right end. This is the authoritative geometry the physics bodies are built from.

import { BAND_COUNT, type Band, type Cell, type Row, type ServiceType, type Side, type Tower, groupOf, SERVICE_FOR } from './types.ts';
import { CAPACITY } from './demography.ts';

/** Cell sizes in metres, shared with the scene and the physics. */
export const CELL_W = 1;
export const CELL_H = 0.9;
export const CELL_D = 1.6;

let nextId = 1;
export function newId(): number {
  return nextId++;
}
export function resetIds(): void {
  nextId = 1;
}

export function emptyRow(): Row {
  return { leftX: 0, cells: [], services: [] };
}

export function buildTower(start: number[], baseX = 0): Tower {
  const rows: Row[] = [];
  for (let b = 0; b < BAND_COUNT; b++) {
    const n = start[b] ?? 0;
    const cells: Cell[] = [];
    for (let i = 0; i < n; i++) cells.push({ kind: 'person', origin: 'native', id: newId() });
    rows.push({ leftX: -Math.floor(n / 2), cells, services: [] });
  }
  return { rows, baseX };
}

export function rightX(row: Row): number {
  return row.leftX + row.cells.length - 1;
}

/** Insert a cell at one end. An empty row starts under the centre of the row above it. */
export function insert(tower: Tower, band: Band, side: Side, cell: Cell): void {
  const row = tower.rows[band];
  if (row.cells.length === 0) {
    const ref = nearestNonEmpty(tower, band);
    row.leftX = ref ? Math.round(centreX(ref)) : 0;
    row.cells.push(cell);
    return;
  }
  if (side === 'left') {
    row.cells.unshift(cell);
    row.leftX -= 1;
  } else row.cells.push(cell);
}

function nearestNonEmpty(tower: Tower, band: Band): Row | null {
  for (let d = 1; d < BAND_COUNT; d++) {
    for (const b of [band + d, band - d]) {
      const r = tower.rows[b];
      if (r && r.cells.length) return r;
    }
  }
  return null;
}

export function centreX(row: Row): number {
  return row.leftX + (row.cells.length - 1) / 2;
}

/** Remove one cell by index and close the gap: the shorter side moves inward. */
export function removeAt(row: Row, i: number): Cell {
  const [cell] = row.cells.splice(i, 1);
  const leftPart = i;
  const rightPart = row.cells.length - i;
  // cells right of i keep their x if the left part slid right, else the left part stays
  if (leftPart <= rightPart) row.leftX += 1;
  return cell;
}

/**
 * Remove `n` people from a row, alternately from the right and the left end (the
 * outermost person on that side), starting on the right. Returns removed ids.
 */
export function removePeople(row: Row, n: number, startSide: Side = 'right'): number[] {
  const out: number[] = [];
  let side = startSide;
  for (let k = 0; k < n; k++) {
    const idx = side === 'right' ? lastPersonIndex(row) : firstPersonIndex(row);
    if (idx < 0) break;
    out.push(removeAt(row, idx).id);
    side = side === 'right' ? 'left' : 'right';
  }
  return out;
}

function firstPersonIndex(row: Row): number {
  return row.cells.findIndex((c) => c.kind === 'person');
}
function lastPersonIndex(row: Row): number {
  for (let i = row.cells.length - 1; i >= 0; i--) if (row.cells[i].kind === 'person') return i;
  return -1;
}

export function people(row: Row): number {
  return row.cells.reduce((n, c) => n + (c.kind === 'person' ? 1 : 0), 0);
}

export function counts(tower: Tower): number[] {
  return tower.rows.map(people);
}

export function services(row: Row, type?: ServiceType): number {
  return row.services.reduce((n, c) => n + (!type || c.service === type ? 1 : 0), 0);
}

/**
 * Ten years pass for the rows: every row moves up a band, the old top row's people join
 * the new top row (alternating ends), beams are taken out, services are renovated for
 * their new age group (a classroom becomes a workplace, a workplace a clinic) and extras
 * beyond what the floor needs are dismantled.
 * Returns the ids of dismantled cells. The new nursery row is empty.
 */
export function ageRows(tower: Tower): number[] {
  const removed: number[] = [];
  const old = tower.rows;
  const top = old[BAND_COUNT - 1];
  const rows: Row[] = [emptyRow()];
  for (let b = 0; b < BAND_COUNT - 1; b++) rows.push(old[b]);
  // the old 70+ survivors join the new 70+ row
  const merged = rows[BAND_COUNT - 1];
  let side: Side = 'right';
  merged.services.push(...top.services);
  for (const c of top.cells) {
    if (merged.cells.length === 0) {
      merged.leftX = top.leftX;
      merged.cells.push(c);
    } else if (side === 'right') merged.cells.push(c);
    else {
      merged.cells.unshift(c);
      merged.leftX -= 1;
    }
    side = side === 'right' ? 'left' : 'right';
  }
  tower.rows = rows;
  for (let b = 0; b < BAND_COUNT; b++) {
    const row = rows[b];
    const want = SERVICE_FOR[groupOf(b)];
    for (const c of row.services) c.service = want;
    // beams leave with the jack
    for (let i = row.cells.length - 1; i >= 0; i--) if (row.cells[i].kind === 'beam') removed.push(removeAt(row, i).id);
    const need = Math.ceil(people(row) / CAPACITY[groupOf(b)]);
    while (row.services.length > need) removed.push(row.services.pop()!.id);
  }
  return removed;
}

// ---------- static stability ----------

export interface StabilityReport {
  /** smallest margin (cell units) between the centre of mass above a floor and the edge of the floor below */
  margin: number;
  /** the floor whose support is weakest */
  weakBand: number;
  /** the side it would tip to */
  tipSide: Side | null;
  /** true when some floor's load has no support at all */
  unsupported: boolean;
}

/**
 * Lever rule for a stack of rigid rows, with a sideways wind on each row proportional to
 * its width. For every floor k ≥ 1 the cells of k and above must keep their combined centre
 * of mass, pushed by the wind's tipping moment, inside the footprint of floor k−1.
 * The nursery row stands on the plaza (infinitely wide).
 */
export function stability(tower: Tower, wind = 0): StabilityReport {
  const rows = tower.rows;
  let top = -1;
  for (let b = BAND_COUNT - 1; b >= 0; b--) if (rows[b].cells.length) { top = b; break; }
  let margin = Infinity;
  let weakBand = -1;
  let tipSide: Side | null = null;
  let unsupported = false;
  for (let k = 1; k <= top; k++) {
    let mass = 0;
    let mx = 0;
    let windMoment = 0;
    for (let j = k; j <= top; j++) {
      const r = rows[j];
      if (!r.cells.length) continue;
      mass += r.cells.length;
      mx += r.cells.length * centreX(r);
      // height of the row's centre above the top of floor k-1, in cell heights
      windMoment += wind * r.cells.length * (j - k + 0.5) * (CELL_H / CELL_W);
    }
    if (mass === 0) continue;
    const below = rows[k - 1];
    if (!below.cells.length) {
      unsupported = true;
      margin = -Infinity;
      weakBand = k;
      tipSide = null;
      continue;
    }
    const com = mx / mass;
    const shift = windMoment / mass;
    const lo = below.leftX - 0.5;
    const hi = rightX(below) + 0.5;
    // wind can blow either way; the worse side counts
    const mRight = hi - (com + shift);
    const mLeft = com - shift - lo;
    const m = Math.min(mRight, mLeft);
    if (m < margin) {
      margin = m;
      weakBand = k;
      tipSide = mRight < mLeft ? 'right' : 'left';
    }
  }
  return { margin, weakBand, tipSide, unsupported };
}
