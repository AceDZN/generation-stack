// The authored campaign and the endless tower: every level is solvable (static and Rapier),
// and every consequence a level advertises actually happens.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from '../src/model/levels.ts';
import { endlessLevel } from '../src/model/endless.ts';
import { solve, replay } from '../src/model/solver.ts';
import { initPhysics, rapierJudge } from '../src/physics/judge.ts';
import { play } from './strategies.ts';
import type { LevelDef } from '../src/model/types.ts';

before(async () => {
  await initPhysics();
});

const HANDOFF: [number, 1 | 2 | 3 | 4, string][] = [
  [1, 1, 'השולה הראשונה'],
  [2, 1, 'רפואה טובה יותר'],
  [3, 1, 'בדיוק לפי החשבון'],
  [4, 1, 'ארבעת השלבים'],
  [5, 1, 'מגדל אלמוני'],
  [6, 2, 'בסיס רחב'],
  [7, 2, 'מגדל מזדקן'],
  [8, 2, 'מי מחזיק את מי'],
  [9, 2, 'שתי מדינות, שני מגדלים'],
  [10, 2, 'התאימו לצללית'],
  [11, 3, 'נכנסים ויוצאים'],
  [12, 3, 'מי מגיע?'],
  [13, 3, 'דוחפים ומושכים'],
  [14, 3, 'מגדל ההגירה'],
  [15, 4, 'גלי עלייה'],
  [16, 4, 'ריבוי טבעי ועלייה'],
  [17, 4, 'ישראל היום'],
  [18, 4, 'מגדל העתיד'],
];

const L = (id: number): LevelDef => LEVELS.find((l) => l.id === id)!;

test('18 levels with the handoff ids, titles and worlds', () => {
  assert.equal(LEVELS.length, 18);
  for (const [id, world, title] of HANDOFF) {
    const l = L(id);
    assert.ok(l, `level ${id}`);
    assert.equal(l.world, world, `L${id} world`);
    assert.equal(l.titleHe, title, `L${id} title`);
  }
});

test('level shape: empty nursery, 2–5 decades, calm wind, intro and concept, worked fail lines', () => {
  for (const l of LEVELS) {
    for (const t of l.towers) {
      assert.equal(t.start[0], 0, `L${l.id} starts with an empty nursery`);
      assert.equal(t.decades.length, l.decades, `L${l.id} one plan per decade`);
    }
    if (l.id === 1) assert.ok(l.decades >= 1 && l.decades <= 5);
    else assert.ok(l.decades >= 2 && l.decades <= 5, `L${l.id} has ${l.decades} decades`);
    assert.ok(l.wind >= 0 && l.wind <= 0.3, `L${l.id} wind ${l.wind}`);
    assert.ok(l.introHe.length >= 1 && l.introHe.length <= 3, `L${l.id} intro is 1–3 lines`);
    assert.ok(l.conceptHe.length > 0);
    assert.ok(l.failHe && Object.keys(l.failHe).length > 0, `L${l.id} explains its failures`);
    for (const line of Object.values(l.failHe!)) assert.ok(!/תשובה שגויה|טעות!/.test(line!), `L${l.id} fail line explains, not scolds`);
    if (l.goal === 'exact') assert.ok(Number.isInteger(l.exactTarget));
    if (l.goal === 'stage' || l.goal === 'choose') assert.ok(l.choice && l.choice.correct >= 0 && l.choice.correct < l.choice.options.length);
  }
});

test('each world ends with a no-hint transfer level, and L18 is the final one', () => {
  for (const id of [5, 10, 14, 18]) assert.equal(L(id).hints, false, `L${id} is a transfer`);
  for (const w of [1, 2, 3, 4]) {
    const last = LEVELS.filter((l) => l.world === w).at(-1)!;
    assert.equal(last.hints, false, `world ${w} ends with a transfer`);
  }
  assert.ok(L(18).startYear >= 2020, 'the final transfer projects forward');
});

for (const l of LEVELS) {
  test(`L${l.id} ${l.titleHe}: the solver wins with margin ≥ 0.2, replay wins, Rapier replay wins`, () => {
    const s = solve(l);
    assert.ok(s.won, `solver fails: ${s.run.failReason}`);
    assert.ok(s.minMargin >= 0.2, `margin ${s.minMargin.toFixed(2)}`);
    assert.equal(replay(l, s.actions).phase, 'won');
    const rr = replay(l, s.actions, rapierJudge());
    assert.equal(rr.phase, 'won', `Rapier: ${rr.failReason}`);
  });

  test(`L${l.id}: the solved tower fits the stage (rows ≤ 14 cells, ≤ 70 cells in all)`, () => {
    const p = play(l);
    assert.ok(p.won);
    assert.ok(p.maxRow <= 14, `row ${p.maxRow}`);
    assert.ok(p.maxCells <= 70, `cells ${p.maxCells}`);
  });

  test(`L${l.id}: building nothing leaves needs unmet`, () => {
    assert.equal(play(l, { services: 'none' }).reason, 'needs');
  });

  test(`L${l.id}: supply is tight (two wasted pieces a decade fail)`, () => {
    assert.equal(play(l, { wasteEachDecade: 2 }).won, false);
  });
}

test('aging levels: classrooms alone leave needs unmet', () => {
  for (const id of [7, 8, 9, 10, 14, 17, 18]) assert.equal(play(L(id), { services: 'classroom' }).reason, 'needs', `L${id}`);
});

test('narrow-base levels: no beams collapses, under the static judge and in Rapier', () => {
  for (const id of [7, 9, 11]) {
    const st = play(L(id), { beams: false });
    const rp = play(L(id), { beams: false, judge: rapierJudge() });
    assert.ok(st.reason === 'collapse' || st.reason === 'empty-base', `L${id} static: ${st.reason}`);
    assert.ok(rp.reason === 'collapse' || rp.reason === 'empty-base', `L${id} Rapier: ${rp.reason}`);
  }
});

test('banner levels: every wrong banner is a wrong call', () => {
  for (const id of [5, 10, 16, 18]) {
    const l = L(id);
    l.choice!.options.forEach((_, i) => {
      if (i === l.choice!.correct) assert.ok(play(l, { choice: i }).won, `L${id} correct banner wins`);
      else assert.equal(play(l, { choice: i }).reason, 'wrong-call', `L${id} banner ${i}`);
    });
  }
});

test('exact levels: cranking past the target overshoots, ringing too early is a wrong call', () => {
  for (const id of [3, 11]) {
    assert.equal(play(L(id), { bell: 'never' }).reason, 'overshoot', `L${id} never ringing`);
    assert.equal(play(L(id), { bell: 'early' }).reason, 'wrong-call', `L${id} ringing at once`);
  }
});

test("'choose' levels: a migrant piece on the wrong floor bounces back to the tray", () => {
  const choose = LEVELS.filter((l) => l.migrantFloors === 'choose');
  assert.ok(choose.length >= 4);
  for (const l of choose) {
    const p = play(l, { wrongFloorFirst: true });
    assert.ok(p.bounces > 0, `L${l.id} bounced ${p.bounces}`);
    assert.ok(p.run.log.some((e) => e.outcome === 'wrong-floor'), `L${l.id} logs the bounce`);
    assert.ok(p.won, `L${l.id} still winnable after the bounce: ${p.reason}`);
  }
});

test('endless: 30 seeds give solvable, deterministic towers (static and Rapier) within size limits', () => {
  for (let i = 0; i < 30; i++) {
    const seed = 20260101 + i * 37;
    const l = endlessLevel(seed);
    assert.deepEqual(endlessLevel(seed), l, `seed ${seed} deterministic`);
    assert.equal(l.towers[0].start[0], 0);
    assert.ok(l.decades >= 2 && l.decades <= 5);
    assert.ok(l.wind >= 0 && l.wind <= 0.3);
    const s = solve(l);
    assert.ok(s.won, `seed ${seed}: ${s.run.failReason}`);
    assert.ok(s.minMargin >= 0.2);
    assert.equal(replay(l, s.actions, rapierJudge()).phase, 'won', `seed ${seed} Rapier`);
    const p = play(l);
    assert.ok(p.maxRow <= 14 && p.maxCells <= 70, `seed ${seed} size ${p.maxRow}/${p.maxCells}`);
  }
});
