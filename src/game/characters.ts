// Shula the stork, the mayor, townspeople and the arrival vehicles. Tripo models when they
// are in public/models (manifest.json); simple procedural stand-ins otherwise.

import * as THREE from 'three';
import type { Actor, World } from './scene.ts';
import type { Transport } from '../model/types.ts';

interface Walker {
  actor: Actor | null;
  obj: THREE.Object3D;
  angle: number;
  radius: number;
  speed: number;
}

export class Characters {
  shula: THREE.Object3D;
  shulaActor: Actor | null = null;
  private shulaWings: THREE.Object3D[] = [];
  private shulaPath: { t: number; dur: number; from: THREE.Vector3; mid: THREE.Vector3; to: THREE.Vector3 } | null = null;
  mayorObj: THREE.Object3D;
  mayorActor: Actor | null = null;
  private mayorState: 'idle' | 'wave' | 'cheer' | 'faint' = 'idle';
  private mayorT = 0;
  private walkers: Walker[] = [];
  private vehicles: { obj: THREE.Object3D; t: number; dur: number; from: THREE.Vector3; to: THREE.Vector3 }[] = [];
  private protestT = 0;
  private cheerT = 0;
  private towerXs: number[] = [0];

  constructor(private world: World) {
    this.shula = new THREE.Group();
    this.mayorObj = new THREE.Group();
    world.scene.add(this.shula, this.mayorObj);
    this.rebuild();
  }

  /** Called again once models load. */
  rebuild(): void {
    this.shula.clear();
    this.mayorObj.clear();
    for (const w of this.walkers) this.world.scene.remove(w.obj);
    this.walkers = [];
    this.shulaActor = this.world.spawn('shula', 1.6);
    if (this.shulaActor) {
      this.shula.add(this.shulaActor.root);
      this.shulaActor.play('fly');
    } else this.shula.add(this.proceduralStork());
    this.shula.position.set(14, 12, -6);
    this.mayorActor = this.world.spawn('mayor', 1.5);
    if (this.mayorActor) {
      this.mayorObj.add(this.mayorActor.root);
      this.mayorActor.play('idle');
    } else this.mayorObj.add(this.proceduralPerson(0xc8402a, 1.4, true));
    for (let i = 0; i < 7; i++) {
      const actor = this.world.spawn('townsperson', 1.1 + (i % 3) * 0.08);
      const obj = actor ? actor.root : this.proceduralPerson([0x3f7fd6, 0xe0a030, 0x6fbf4a, 0xd46ab0][i % 4], 1.1, false);
      actor?.play('walk');
      this.world.scene.add(obj);
      this.walkers.push({ actor, obj, angle: (i / 7) * Math.PI * 2, radius: 12.5 + (i % 3) * 1.6, speed: (0.05 + (i % 4) * 0.015) * (i % 2 ? 1 : -1) });
    }
    this.layout(this.towerXs);
  }

  layout(towerXs: number[]): void {
    this.towerXs = towerXs;
    const right = Math.max(...towerXs);
    this.mayorObj.position.set(right + 7.5, 0.55, 4.2);
    this.mayorObj.rotation.y = -0.5;
  }

  private proceduralStork(): THREE.Object3D {
    const g = new THREE.Group();
    const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
    const black = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const red = new THREE.MeshStandardMaterial({ color: 0xe0452a });
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 12), white);
    body.scale.set(1.5, 0.8, 0.8);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.7), white);
    neck.position.set(0.6, 0.35, 0);
    neck.rotation.z = -0.8;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 10), white);
    head.position.set(0.9, 0.6, 0);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.6, 8), red);
    beak.position.set(1.22, 0.55, 0);
    beak.rotation.z = -Math.PI / 2;
    const bag = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), new THREE.MeshStandardMaterial({ color: 0xfff6e0 }));
    bag.position.set(1.5, 0.3, 0);
    for (const s of [1, -1]) {
      const wing = new THREE.Group();
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 1.1), white);
      w.position.z = 0.55 * s;
      const tip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.5), black);
      tip.position.set(-0.2, 0, 1.25 * s);
      wing.add(w, tip);
      wing.userData.s = s;
      g.add(wing);
      this.shulaWings.push(wing);
    }
    const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8), red);
    legs.position.set(-0.7, -0.2, 0);
    legs.rotation.z = Math.PI / 2.4;
    g.add(body, neck, head, beak, bag, legs);
    g.traverse((o) => ((o as THREE.Mesh).isMesh ? (o.castShadow = true) : null));
    return g;
  }

  private proceduralPerson(color: number, h: number, sash: boolean): THREE.Object3D {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(h * 0.2, h * 0.4, 6, 12), new THREE.MeshStandardMaterial({ color }));
    body.position.y = h * 0.42;
    const head = new THREE.Mesh(new THREE.SphereGeometry(h * 0.15, 14, 12), new THREE.MeshStandardMaterial({ color: 0xf2c9a0 }));
    head.position.y = h * 0.86;
    g.add(body, head);
    if (sash) {
      const s = new THREE.Mesh(new THREE.TorusGeometry(h * 0.2, 0.03, 6, 20), new THREE.MeshStandardMaterial({ color: 0xffd23f, metalness: 0.5 }));
      s.position.y = h * 0.5;
      s.rotation.set(Math.PI / 2, 0.6, 0);
      const hat = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.1, h * 0.12, h * 0.2), new THREE.MeshStandardMaterial({ color: 0x222222 }));
      hat.position.y = h * 1.05;
      g.add(s, hat);
    }
    g.traverse((o) => ((o as THREE.Mesh).isMesh ? (o.castShadow = true) : null));
    return g;
  }

  /** Shula swoops down to the nursery and back up. */
  shulaDeliver(): void {
    const x = this.towerXs[0];
    this.shulaPath = { t: 0, dur: 2.4, from: new THREE.Vector3(x + 16, 13, -4), mid: new THREE.Vector3(x + 1.5, 3.2, 3.2), to: new THREE.Vector3(x + 9, 10.5, -2) };
  }

  vehicle(kind: Transport, tower: number): void {
    const x = this.towerXs[tower] ?? 0;
    const model = this.world.spawn(kind === 'bus' ? 'train' : kind, kind === 'plane' ? 1.4 : 1.2);
    const obj = model ? model.root : this.proceduralVehicle(kind);
    const fly = kind === 'plane';
    const from = new THREE.Vector3(x - 22, fly ? 9 : 0.6, 6.5);
    const to = new THREE.Vector3(x - 6.5, fly ? 3 : 0.6, 6.5);
    obj.position.copy(from);
    obj.rotation.y = Math.PI / 2;
    this.world.scene.add(obj);
    this.vehicles.push({ obj, t: 0, dur: 3.2, from, to });
  }

  private proceduralVehicle(kind: Transport): THREE.Object3D {
    const g = new THREE.Group();
    const col = { boat: 0x2f74d0, train: 0xd8432f, plane: 0xf2f2f2, bus: 0xffb020 }[kind];
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.7, 2.2), new THREE.MeshStandardMaterial({ color: col }));
    body.position.y = 0.4;
    g.add(body);
    if (kind === 'plane') {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(3, 0.08, 0.6), new THREE.MeshStandardMaterial({ color: 0xcccccc }));
      wing.position.y = 0.45;
      g.add(wing);
    }
    g.traverse((o) => ((o as THREE.Mesh).isMesh ? (o.castShadow = true) : null));
    return g;
  }

  mayor(state: 'idle' | 'wave' | 'cheer' | 'faint'): void {
    this.mayorState = state;
    this.mayorT = 0;
    if (this.mayorActor) {
      if (state === 'faint') this.mayorActor.play('faint', { once: true });
      else if (state === 'idle') this.mayorActor.play('idle');
      else this.mayorActor.play(state, { once: true });
    }
  }

  protest(): void {
    this.protestT = 2.5;
  }
  cheer(): void {
    this.cheerT = 3;
    for (const w of this.walkers) w.actor?.play('cheer');
  }

  update(dt: number, time: number): void {
    // Shula
    if (this.shulaPath) {
      const p = this.shulaPath;
      p.t += dt / p.dur;
      const u = Math.min(1, p.t);
      const a = p.from.clone().lerp(p.mid, u);
      const b = p.mid.clone().lerp(p.to, u);
      const pos = a.lerp(b, u);
      const ahead = p.from.clone().lerp(p.mid, Math.min(1, u + 0.02)).lerp(p.mid.clone().lerp(p.to, Math.min(1, u + 0.02)), Math.min(1, u + 0.02));
      this.shula.position.copy(pos);
      this.shula.lookAt(ahead.x, pos.y, ahead.z);
      this.shula.rotateY(-Math.PI / 2);
      if (u >= 1) this.shulaPath = null;
    } else {
      // circling high above the plaza
      const x = this.towerXs[0];
      this.shula.position.set(x + 9 + Math.cos(time * 0.3) * 4, 10.5 + Math.sin(time * 0.7) * 0.5, -2 + Math.sin(time * 0.3) * 3);
      this.shula.rotation.y = -time * 0.3 + Math.PI;
    }
    for (const w of this.shulaWings) w.rotation.x = Math.sin(time * 9) * 0.6 * w.userData.s;
    // mayor procedural fallback motion
    this.mayorT += dt;
    if (!this.mayorActor) {
      const m = this.mayorObj.children[0];
      if (m) {
        if (this.mayorState === 'faint') m.rotation.x = Math.min(Math.PI / 2, this.mayorT * 4) * -1;
        else {
          m.rotation.x = 0;
          m.position.y = this.mayorState === 'cheer' ? Math.abs(Math.sin(this.mayorT * 8)) * 0.3 : 0;
          m.rotation.z = this.mayorState === 'wave' ? Math.sin(this.mayorT * 6) * 0.1 : 0;
        }
      }
    }
    if ((this.mayorState === 'wave' || this.mayorState === 'cheer') && this.mayorT > 3) this.mayor('idle');
    // townspeople stroll around the turntable
    for (const w of this.walkers) {
      w.angle += w.speed * dt;
      const jump = this.cheerT > 0 ? Math.abs(Math.sin(time * 9 + w.radius)) * 0.35 : 0;
      w.obj.position.set(Math.cos(w.angle) * w.radius + this.towerXs[0] * 0.5, jump, Math.sin(w.angle) * w.radius);
      w.obj.rotation.y = -w.angle + (w.speed > 0 ? Math.PI : 0);
    }
    if (this.cheerT > 0) {
      this.cheerT -= dt;
      if (this.cheerT <= 0) for (const w of this.walkers) w.actor?.play('walk');
    }
    this.protestT = Math.max(0, this.protestT - dt);
    // vehicles
    for (let i = this.vehicles.length - 1; i >= 0; i--) {
      const v = this.vehicles[i];
      v.t += dt / v.dur;
      const u = v.t < 0.5 ? v.t * 2 : 1;
      v.obj.position.lerpVectors(v.from, v.to, 1 - Math.pow(1 - u, 3));
      if (v.t > 0.6) v.obj.position.y -= (v.t - 0.6) * 0; // parked
      if (v.t >= 1) {
        // drive on and away
        v.obj.position.x += dt * 8;
        if (v.obj.position.x > v.to.x + 30) {
          this.world.scene.remove(v.obj);
          this.vehicles.splice(i, 1);
        }
      }
    }
  }
}
