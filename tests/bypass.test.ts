// Constant strategies must not carry the campaign: always the same door, always the same
// service, or a random banner. Each one wins somewhere at most, never reliably.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS } from '../src/model/levels.ts';
import { initPhysics, rapierJudge } from '../src/physics/judge.ts';
import { play, type Policy } from './strategies.ts';

before(async () => {
  await initPhysics();
});

const wins = (p: Policy) => LEVELS.filter((l) => play(l, p).won).map((l) => l.id);

test('always the right door wins almost nothing', () => {
  const w = wins({ side: 'right' });
  assert.ok(w.length <= 2, `right door wins ${w.join(',')}`);
});

test('always the left door wins almost nothing', () => {
  const w = wins({ side: 'left' });
  assert.ok(w.length <= 2, `left door wins ${w.join(',')}`);
});

// Alternating doors is not tested as a bypass: keeping the floors balanced is the skill itself.

test('the right door in Rapier wins almost nothing either', () => {
  const w = LEVELS.filter((l) => play(l, { side: 'right', judge: rapierJudge() }).won).map((l) => l.id);
  assert.ok(w.length <= 2, `right door (Rapier) wins ${w.join(',')}`);
});

test('one service for everyone never carries the campaign', () => {
  for (const kind of ['classroom', 'workplace', 'clinic'] as const) {
    const w = wins({ services: kind });
    assert.ok(w.length <= LEVELS.length / 2, `${kind} only wins ${w.join(',')}`);
    // it can never clear a whole world
    for (const world of [1, 2, 3, 4]) {
      const ids = LEVELS.filter((l) => l.world === world).map((l) => l.id);
      assert.ok(!ids.every((id) => w.includes(id)), `${kind} only clears world ${world}`);
    }
  }
});

test('a random banner does not reliably win the banner levels', () => {
  const banner = LEVELS.filter((l) => l.choice);
  let won = 0;
  let tries = 0;
  for (const l of banner)
    for (let seed = 1; seed <= 20; seed++) {
      tries++;
      if (play(l, { choice: { random: seed * 7919 } }).won) won++;
    }
  assert.ok(won / tries < 0.5, `random banners win ${won}/${tries}`);
});
