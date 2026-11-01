import { test } from 'node:test';
import assert from 'node:assert/strict';
import { age, birthsInDecade, deathsInDecade, migrationBalance, naturalIncrease, servicesNeeded, spreadDeaths, total, trajectory } from '../src/model/demography.ts';
import { ageRows, buildTower, insert, removePeople, stability, counts } from '../src/model/tower.ts';
import { LevelRun } from '../src/model/game.ts';
import { solve } from '../src/model/solver.ts';
import type { LevelDef } from '../src/model/types.ts';

test('natural increase is births minus deaths per 1,000 (Workbook: 30 − 10 = 20, Niger 45 − 9 = 36)', () => {
  assert.equal(naturalIncrease(30, 10), 20);
  assert.equal(naturalIncrease(45, 9), 36);
  assert.equal(naturalIncrease(9, 12), -3); // Germany: negative
});

test('migration balance is arrivals minus departures', () => {
  assert.equal(migrationBalance(5, 2), 3);
  assert.equal(migrationBalance(1, 4), -3);
});

test('births and deaths per decade come from the per-1,000 yearly rates', () => {
  assert.equal(birthsInDecade(20, { cbr: 45, cdr: 9 }), 9);
  assert.equal(deathsInDecade(20, { cbr: 45, cdr: 9 }), 2);
  assert.equal(birthsInDecade(40, { cbr: 7, cdr: 13 }), 3);
  assert.equal(deathsInDecade(40, { cbr: 7, cdr: 13 }), 5);
});

test('aging moves every band up one floor and keeps 70+ survivors', () => {
  assert.deepEqual(age([1, 2, 3, 4, 5, 6, 7, 8]), [0, 1, 2, 3, 4, 5, 6, 15]);
});

test('deaths are spread mostly at the top in low-mortality countries, never more than a band has', () => {
  const d = spreadDeaths([3, 3, 4, 5, 6, 6, 6, 6], 5, 'low');
  assert.equal(total(d), 5);
  assert.ok(d[7] >= 3);
  assert.equal(d[0] + d[1], 0);
  const high = spreadDeaths([8, 6, 5, 4, 3, 2, 1, 1], 6, 'high');
  assert.ok(high[0] >= 1, 'stage 1: children die too');
  const capped = spreadDeaths([0, 0, 0, 0, 0, 0, 1, 1], 9, 'low');
  assert.equal(total(capped), 2);
});

test('services needed: one classroom per 3 children, one clinic per 2 elders', () => {
  assert.equal(servicesNeeded(7, 'child'), 3);
  assert.equal(servicesNeeded(9, 'adult'), 3);
  assert.equal(servicesNeeded(5, 'elder'), 3);
});

test('rows grow at either end and the lever rule sees the shift', () => {
  const t = buildTower([3, 3, 3, 3, 0, 0, 0, 0]);
  const before = stability(t).margin;
  for (let i = 0; i < 3; i++) insert(t, 3, 'right', { kind: 'person', origin: 'native', id: 900 + i });
  assert.ok(stability(t).margin < before, 'a lopsided top floor is less stable');
  assert.equal(counts(t)[3], 6);
});

test('an empty nursery under a tower is unsupported', () => {
  const t = buildTower([0, 2, 2, 0, 0, 0, 0, 0]);
  assert.equal(stability(t).unsupported, true);
});

test('removing people keeps rows contiguous and alternates ends', () => {
  const t = buildTower([0, 0, 0, 0, 0, 0, 0, 6]);
  const row = t.rows[7];
  const left0 = row.leftX;
  removePeople(row, 2);
  assert.equal(row.cells.length, 4);
  assert.equal(row.leftX, left0 + 1);
});

test('aging the rows renovates services for the new age group', () => {
  const t = buildTower([0, 3, 0, 0, 0, 0, 0, 0]);
  t.rows[1].services.push({ service: 'classroom', id: 501 });
  ageRows(t);
  assert.equal(t.rows[2].services[0]?.service, 'workplace');
  assert.equal(t.rows[0].cells.length, 0);
});

const young: LevelDef = {
  id: 99, world: 1, titleHe: 't', conceptHe: '', introHe: [], startYear: 1970, decades: 2, goal: 'reach', peoplePerBlock: 1, wind: 0.1, hints: true,
  towers: [{ nameHe: 'x', start: [0, 5, 4, 3, 2, 2, 1, 1], decades: [{ cbr: 40, cdr: 10, stage: 2 }, { cbr: 38, cdr: 9, stage: 2 }] }],
};

test('the level run matches the pure trajectory when everyone is placed', () => {
  const r = solve(young);
  assert.equal(r.won, true);
  const tr = trajectory(young.towers[0].start, young.towers[0].decades);
  assert.deepEqual(counts(r.run.towers[0]), tr.counts.at(-1));
});

test('cranking with unserved floors fails the decade with "needs", and retry restores it', () => {
  const run = new LevelRun(young);
  for (const p of [...run.tray]) run.place(p.id, p.band, 'right');
  const res = run.crank();
  assert.equal(res.reason, 'needs');
  const pop = run.population();
  run.retry();
  assert.equal(run.phase, 'place');
  assert.equal(run.tray.length > 0, true);
  assert.ok(run.population() < pop, 'babies are back in the tray');
});

test('a migrant group sent to the wrong floor bounces and counts as a mistake', () => {
  const def: LevelDef = { ...young, migrantFloors: 'choose', towers: [{ ...young.towers[0], decades: [{ cbr: 40, cdr: 10, stage: 2, arrivals: [{ id: 'l', kind: 'labor', transport: 'plane', bands: { 2: 2 }, labelHe: 'מהגרי עבודה' }] }, young.towers[0].decades[1]] }] };
  const run = new LevelRun(def);
  const m = run.tray.find((p) => p.kind === 'migrant')!;
  assert.equal(run.place(m.id, 6, 'left'), 'wrong-floor');
  assert.equal(run.mistakes, 1);
  assert.equal(run.place(m.id, 2, 'left'), 'ok');
});
