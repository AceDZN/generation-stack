// The crank's gust, simulated with Rapier. Each floor row is one rigid box resting on the
// row below; the gust pushes every row sideways in proportion to its mass, first one way
// then the other. The run is stepped at a fixed rate, so the same tower always gives the
// same result, and every few steps the row poses are recorded for the scene to replay.

import RAPIER from '@dimforge/rapier3d-compat';
import type { Tower } from '../model/types.ts';
import type { Judge, JudgeResult } from '../model/game.ts';
import { CELL_D, CELL_H, CELL_W, centreX } from '../model/tower.ts';

export const STEP = 1 / 60;
export const STEPS = 330;
export const RECORD_EVERY = 2;
const G = 9.81;

export interface Pose {
  x: number;
  y: number;
  z: number;
  qx: number;
  qy: number;
  qz: number;
  qw: number;
}

/** frames[f][tower][band] = pose of that row (null for empty rows) */
export interface Recording {
  frames: (Pose | null)[][][];
  dt: number;
  result: JudgeResult;
}

let ready: Promise<void> | null = null;
export function initPhysics(): Promise<void> {
  ready ??= RAPIER.init();
  return ready;
}

/** gust strength over time: a push right that rises, holds and eases, then the same to the left */
export function gustAt(t: number): number {
  const p = (a: number) => {
    const u = t - a;
    if (u <= 0 || u >= 1.8) return 0;
    if (u < 0.4) return Math.sin((u / 0.4) * (Math.PI / 2)) ** 2;
    if (u < 1.4) return 1;
    return Math.cos(((u - 1.4) / 0.4) * (Math.PI / 2)) ** 2;
  };
  return p(0.3) - p(2.4);
}

export function simulate(towers: Tower[], wind: number, shake: number[] = []): Recording {
  const world = new RAPIER.World({ x: 0, y: -G, z: 0 });
  world.timestep = STEP;
  const ground = world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0, -0.5, 0));
  world.createCollider(RAPIER.ColliderDesc.cuboid(60, 0.5, 20).setFriction(1), ground);
  const bodies: (RAPIER.RigidBody | null)[][] = [];
  const start: { x: number; y: number }[][] = [];
  towers.forEach((tower, ti) => {
    bodies.push([]);
    start.push([]);
    tower.rows.forEach((row, b) => {
      if (!row.cells.length) {
        bodies[ti].push(null);
        start[ti].push({ x: 0, y: 0 });
        return;
      }
      const x = (tower.baseX + centreX(row)) * CELL_W;
      const y = b * CELL_H + CELL_H / 2;
      const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y, 0).setCanSleep(false));
      // a hair shorter than a full row so neighbours never start interpenetrating
      const col = RAPIER.ColliderDesc.cuboid((row.cells.length * CELL_W) / 2 - 0.01, CELL_H / 2 - 0.002, CELL_D / 2)
        .setDensity(1)
        .setFriction(0.9)
        .setRestitution(0);
      world.createCollider(col, body);
      bodies[ti].push(body);
      start[ti].push({ x, y });
    });
  });
  const frames: (Pose | null)[][][] = [];
  let maxTilt = 0;
  let collapsed = false;
  let fallenTower: number | undefined;
  const pose = (b: RAPIER.RigidBody): Pose => {
    const t = b.translation();
    const r = b.rotation();
    return { x: t.x, y: t.y, z: t.z, qx: r.x, qy: r.y, qz: r.z, qw: r.w };
  };
  for (let s = 0; s <= STEPS; s++) {
    const t = s * STEP;
    const g = gustAt(t);
    bodies.forEach((rows, ti) => {
      rows.forEach((body, b) => {
        if (!body) return;
        body.resetForces(true);
        const m = body.mass();
        body.addForce({ x: wind * G * m * g, y: 0, z: 0 }, true);
        // unserved people hop: little alternating kicks on their tower
        const k = shake[ti] ?? 0;
        if (k > 0 && s % 20 === 0 && s > 0 && s < 200) body.applyImpulse({ x: (s % 40 ? 1 : -1) * 0.06 * k * m, y: 0.04 * m, z: 0 }, true);
      });
    });
    if (s % RECORD_EVERY === 0) frames.push(bodies.map((rows) => rows.map((b) => (b ? pose(b) : null))));
    if (s === STEPS) break;
    world.step();
    bodies.forEach((rows, ti) =>
      rows.forEach((body, b) => {
        if (!body) return;
        const r = body.rotation();
        // angle between the row's up axis and world up
        const upY = 1 - 2 * (r.x * r.x + r.z * r.z);
        const tilt = (Math.acos(Math.max(-1, Math.min(1, upY))) * 180) / Math.PI;
        maxTilt = Math.max(maxTilt, tilt);
        const p = body.translation();
        const s0 = start[ti][b];
        if (tilt > 15 || Math.abs(p.x - s0.x) > 0.75 || p.y < s0.y - 0.45) {
          if (!collapsed) fallenTower = ti;
          collapsed = true;
        }
      }),
    );
  }
  world.free();
  return { frames, dt: STEP * RECORD_EVERY, result: { collapsed, maxTiltDeg: collapsed ? Math.max(maxTilt, 25) : maxTilt, fallenTower } };
}

/** A Judge for LevelRun.crank that also keeps the last recording for the scene. */
export function rapierJudge(onRecord?: (r: Recording) => void): Judge {
  return (towers, wind, shake) => {
    const rec = simulate(towers, wind, shake);
    onRecord?.(rec);
    return rec.result;
  };
}
