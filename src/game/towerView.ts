// Renders the model's towers. Every cell, service and beam has a mesh keyed by its model id;
// sync() tweens meshes to the layout, so aging, compaction, arrivals and deaths animate
// themselves. During the crank the recorded Rapier poses drive whole rows.

import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { BAND_COUNT, type Group, type ServiceType, type Side, type Tower, groupOf } from '../model/types.ts';
import { CELL_D, CELL_H, CELL_W } from '../model/tower.ts';
import type { Pose, Recording } from '../physics/judge.ts';
import { beamTexture, groupTexture, iconTexture, windowTexture } from './textures.ts';

type Kind = 'person' | 'beam' | 'service';

interface Item {
  id: number;
  kind: Kind;
  obj: THREE.Object3D;
  /** current animated position (local to root) */
  pos: THREE.Vector3;
  to: THREE.Vector3;
  from: THREE.Vector3;
  t: number;
  dur: number;
  arc: number; // hop height while moving
  group?: Group;
  service?: ServiceType;
  dying: 'none' | 'fade' | 'leave';
  life: number;
  topper?: THREE.Object3D;
  tower: number;
  band: number;
  local: THREE.Vector3; // offset from the row centre (for physics playback)
  squash: number;
}

export interface DoorSpec {
  tower: number;
  band: number;
  side: Side;
}

const ease = (u: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, u)), 3);

export class TowerView {
  group = new THREE.Group();
  private items = new Map<number, Item>();
  private boxGeo = new RoundedBoxGeometry(CELL_W * 0.95, CELL_H * 0.93, CELL_D, 3, 0.12);
  private mats: Record<Group, THREE.MeshStandardMaterial>;
  private winMats: THREE.MeshStandardMaterial[];
  private winGeo = new THREE.PlaneGeometry(CELL_W * 0.52, CELL_H * 0.62);
  private beamMat: THREE.MeshStandardMaterial;
  private doors = new THREE.Group();
  private hit = new THREE.Group();
  private sparkles: { s: THREE.Sprite; v: THREE.Vector3; life: number }[] = [];
  private sparkleMat: THREE.SpriteMaterial;
  private serviceProto: Record<ServiceType, THREE.Object3D>;
  private porchMat = new THREE.MeshStandardMaterial({ color: 0xa8743f, roughness: 0.7 });
  private treeProto: THREE.Object3D;
  playback: { rec: Recording; t: number; amp: number; members: { item: Item; tower: number; band: number }[] } | null = null;
  reduced = false;
  towersCache: Tower[] = [];

  constructor() {
    this.mats = {
      child: new THREE.MeshStandardMaterial({ map: groupTexture('child'), roughness: 0.55 }),
      adult: new THREE.MeshStandardMaterial({ map: groupTexture('adult'), roughness: 0.55 }),
      elder: new THREE.MeshStandardMaterial({ map: groupTexture('elder'), roughness: 0.55 }),
    };
    this.winMats = [0, 1, 2, 3].map((v) => {
      const t = windowTexture(v);
      return new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffc070, emissiveIntensity: 0.55, transparent: true, alphaTest: 0.1 });
    });
    this.beamMat = new THREE.MeshStandardMaterial({ map: beamTexture(), roughness: 0.6 });
    this.sparkleMat = new THREE.SpriteMaterial({ map: sparkleTexture(), color: 0xfff1b0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    this.serviceProto = { classroom: makeService('classroom'), workplace: makeService('workplace'), clinic: makeService('clinic') };
    this.treeProto = makeTree();
    this.group.add(this.doors, this.hit);
  }

  private layout(towers: Tower[]): Map<number, { kind: Kind; pos: THREE.Vector3; tower: number; band: number; group?: Group; service?: ServiceType; local: THREE.Vector3; exposed?: boolean }> {
    const out = new Map();
    towers.forEach((tower, ti) => {
      tower.rows.forEach((row, b) => {
        const y = b * CELL_H + CELL_H / 2;
        const cx = (tower.baseX + row.leftX + (row.cells.length - 1) / 2) * CELL_W;
        const above = tower.rows[b + 1];
        row.cells.forEach((c, i) => {
          const x = (tower.baseX + row.leftX + i) * CELL_W;
          const ax = row.leftX + i;
          const exposed = !above || ax < above.leftX || ax > above.leftX + above.cells.length - 1;
          out.set(c.id, { kind: c.kind, pos: new THREE.Vector3(x, y, 0), tower: ti, band: b, group: groupOf(b), local: new THREE.Vector3(x - cx, 0, 0), exposed });
        });
        const n = row.services.length;
        row.services.forEach((s, k) => {
          const i = row.cells.length ? Math.min(row.cells.length - 1, Math.floor(((k + 0.5) * row.cells.length) / Math.max(1, n))) : 0;
          // two services on one cell sit side by side
          const sameCell = row.services.slice(0, k).filter((_, j) => Math.floor(((j + 0.5) * row.cells.length) / n) === i).length;
          const x = (tower.baseX + row.leftX + i) * CELL_W + (sameCell ? 0.3 : 0);
          out.set(s.id, { kind: 'service', pos: new THREE.Vector3(x, b * CELL_H + 0.02, CELL_D / 2 + 0.36 + sameCell * 0.05), tower: ti, band: b, service: s.service, local: new THREE.Vector3(x - cx, -CELL_H / 2 + 0.02, CELL_D / 2 + 0.36) });
        });
      });
    });
    return out;
  }

  /**
   * Bring meshes in line with the model. `enter` says where new ids come from:
   * a side door, a drop from above, or nowhere (appear in place).
   */
  sync(towers: Tower[], enter: { side?: Side; drop?: boolean } = {}, instant = false): void {
    this.towersCache = towers;
    const lay = this.layout(towers);
    for (const [id, item] of this.items) {
      if (!lay.has(id) && item.dying === 'none') this.kill(item, 'fade');
    }
    for (const [id, L] of lay) {
      let item = this.items.get(id);
      if (!item) {
        item = this.make(id, L.kind, L.group, L.service);
        const from = L.pos.clone();
        if (!instant) {
          if (L.kind === 'service' || enter.drop) from.y += 3.5;
          else if (enter.side) from.x += enter.side === 'right' ? 3.2 : -3.2;
          else from.y += 0.01;
        }
        item.pos.copy(from);
        item.from.copy(from);
        item.obj.position.copy(from);
        item.squash = instant ? 0 : 1;
      }
      if (L.kind === 'person' && item.group !== L.group) {
        item.group = L.group;
        (item.obj.children[0] as THREE.Mesh).material = this.mats[L.group!];
        item.squash = 1;
      }
      if (L.kind === 'service' && item.service !== L.service) {
        this.group.remove(item.obj);
        item.obj = this.serviceProto[L.service!].clone();
        this.group.add(item.obj);
        item.service = L.service;
        item.squash = 1;
      }
      item.tower = L.tower;
      item.band = L.band;
      item.local.copy(L.local);
      if (item.topper) item.topper.visible = !!L.exposed;
      if (!item.to.equals(L.pos) || instant) {
        item.from.copy(item.pos);
        item.to.copy(L.pos);
        item.t = 0;
        const d = item.from.distanceTo(item.to);
        item.dur = instant || this.reduced ? 0.0001 : Math.min(0.9, 0.25 + d * 0.08);
        item.arc = L.kind === 'service' || d < 0.5 ? 0 : Math.min(0.6, d * 0.12);
      }
    }
    this.buildHitBoxes(towers);
  }

  private make(id: number, kind: Kind, group?: Group, service?: ServiceType): Item {
    let obj: THREE.Object3D;
    let topper: THREE.Object3D | undefined;
    if (kind === 'service') obj = this.serviceProto[service!].clone();
    else if (kind === 'beam') {
      obj = new THREE.Group();
      const m = new THREE.Mesh(new THREE.BoxGeometry(CELL_W * 0.55, CELL_H * 0.96, CELL_D * 0.85), this.beamMat);
      m.castShadow = m.receiveShadow = true;
      obj.add(m);
    } else {
      obj = new THREE.Group();
      const m = new THREE.Mesh(this.boxGeo, this.mats[group!]);
      m.castShadow = m.receiveShadow = true;
      const w = new THREE.Mesh(this.winGeo, this.winMats[id % 4]);
      w.position.set(0, -0.02, CELL_D / 2 + 0.004);
      obj.add(m, w);
      // a little tree or flower pot on top when nothing stands above
      topper = this.treeProto.clone();
      topper.position.set(((id * 37) % 5) * 0.08 - 0.16, CELL_H / 2, ((id * 13) % 3) * 0.3 - 0.3);
      topper.visible = false;
      obj.add(topper);
    }
    this.group.add(obj);
    const item: Item = {
      id,
      kind,
      obj,
      pos: new THREE.Vector3(),
      to: new THREE.Vector3(),
      from: new THREE.Vector3(),
      t: 1,
      dur: 0.3,
      arc: 0,
      group,
      service,
      dying: 'none',
      life: 1,
      topper,
      tower: 0,
      band: 0,
      local: new THREE.Vector3(),
      squash: 0,
    };
    this.items.set(id, item);
    return item;
  }

  /** People who die rise softly and fade in a little light; leavers slide away. */
  kill(item: Item, how: 'fade' | 'leave', side: Side = 'right'): void {
    item.dying = how;
    item.life = 1;
    item.from.copy(item.pos);
    item.to.copy(item.pos).add(how === 'fade' ? new THREE.Vector3(0, 1.6, 0.6) : new THREE.Vector3(side === 'right' ? 6 : -6, 0, 1));
    item.t = 0;
    item.dur = how === 'fade' ? 1.4 : 1.2;
    item.arc = 0;
    item.obj.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.material = (m.material as THREE.Material).clone();
        (m.material as THREE.Material).transparent = true;
      }
    });
    if (how === 'fade' && !this.reduced) for (let k = 0; k < 6; k++) this.sparkle(item.pos);
  }

  markLeaving(ids: number[], side: Side = 'right'): void {
    for (const id of ids) {
      const it = this.items.get(id);
      if (it && it.dying === 'none') this.kill(it, 'leave', side);
    }
  }

  sparkle(at: THREE.Vector3): void {
    const s = new THREE.Sprite(this.sparkleMat);
    s.position.copy(at).add(new THREE.Vector3((Math.random() - 0.5) * 0.8, (Math.random() - 0.2) * 0.6, 0.9));
    s.scale.setScalar(0.35 + Math.random() * 0.3);
    this.group.add(s);
    this.sparkles.push({ s, v: new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.8 + Math.random() * 0.8, 0), life: 1 });
  }

  /** Every item that belongs to a row gets its offset from the row centre, for physics playback. */
  startPlayback(rec: Recording, collapsed: boolean): void {
    const members: { item: Item; tower: number; band: number }[] = [];
    for (const item of this.items.values()) if (item.dying === 'none') members.push({ item, tower: item.tower, band: item.band });
    this.playback = { rec, t: 0, amp: collapsed || this.reduced ? 1 : 3.5, members };
  }

  get playbackDuration(): number {
    return this.playback ? this.playback.rec.frames.length * this.playback.rec.dt : 0;
  }

  endPlayback(): void {
    this.playback = null;
    for (const item of this.items.values()) {
      item.obj.quaternion.identity();
      item.from.copy(item.pos);
    }
  }

  private applyPose(item: Item, p: Pose, amp: number, base: THREE.Vector3): void {
    const q = new THREE.Quaternion(p.qx, p.qy, p.qz, p.qw);
    if (amp !== 1) {
      // show the sway bigger than it is, so a near-collapse reads on screen
      const id = new THREE.Quaternion();
      q.copy(id.slerp(q, amp));
    }
    const c = new THREE.Vector3(p.x, p.y, p.z);
    if (amp !== 1) c.sub(base).multiplyScalar(Math.min(amp, 2)).add(base);
    const v = item.local.clone().applyQuaternion(q).add(c);
    item.obj.position.copy(v);
    item.obj.quaternion.copy(q);
  }

  update(dt: number): void {
    if (this.playback) {
      const pb = this.playback;
      pb.t += dt;
      const f = Math.min(pb.rec.frames.length - 1, Math.floor(pb.t / pb.rec.dt));
      const frame = pb.rec.frames[f];
      const first = pb.rec.frames[0];
      for (const m of pb.members) {
        const p = frame[m.tower]?.[m.band];
        const p0 = first[m.tower]?.[m.band];
        if (p && p0) this.applyPose(m.item, p, pb.amp, new THREE.Vector3(p0.x, p0.y, p0.z));
      }
    }
    for (const item of [...this.items.values()]) {
      if (this.playback && item.dying === 'none') continue;
      if (item.t < 1) {
        item.t = Math.min(1, item.t + dt / item.dur);
        const u = ease(item.t);
        item.pos.lerpVectors(item.from, item.to, u);
        item.pos.y += Math.sin(Math.PI * item.t) * item.arc;
        if (item.kind === 'service' && item.t < 1) item.pos.y = item.from.y + (item.to.y - item.from.y) * bounce(item.t);
      }
      item.obj.position.copy(item.pos);
      if (item.squash > 0) {
        item.squash = Math.max(0, item.squash - dt * 2.5);
        const s = Math.sin(item.squash * Math.PI * 2) * 0.12 * item.squash;
        item.obj.scale.set(1 + s, 1 - s, 1 + s);
      } else item.obj.scale.set(1, 1, 1);
      if (item.dying !== 'none') {
        item.life -= dt / item.dur;
        item.obj.traverse((o) => {
          const m = o as THREE.Mesh;
          if (m.isMesh) (m.material as THREE.MeshStandardMaterial).opacity = Math.max(0, item.life);
        });
        if (item.dying === 'fade') {
          (item.obj.children[0] as THREE.Mesh | undefined)?.material && ((item.obj.children[0] as THREE.Mesh).material as THREE.MeshStandardMaterial).emissive?.setRGB(0.6 * (1 - item.life), 0.5 * (1 - item.life), 0.2 * (1 - item.life));
        }
        if (item.life <= 0) {
          this.group.remove(item.obj);
          this.items.delete(item.id);
        }
      }
    }
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const sp = this.sparkles[i];
      sp.life -= dt * 0.9;
      sp.s.position.addScaledVector(sp.v, dt);
      sp.s.material.opacity = sp.life;
      if (sp.life <= 0) {
        this.group.remove(sp.s);
        this.sparkles.splice(i, 1);
      }
    }
    const t = performance.now() / 1000;
    for (const d of this.doors.children) {
      d.scale.setScalar(1.35 * (1 + Math.sin(t * 6) * 0.08));
    }
  }

  get busy(): boolean {
    for (const it of this.items.values()) if (it.t < 1 || it.dying !== 'none') return true;
    return false;
  }

  /** Where the door for a floor end sits (local to the tower root). */
  doorPosition(s: DoorSpec): THREE.Vector3 | null {
    const tower = this.towersCache[s.tower];
    if (!tower) return null;
    const row = tower.rows[s.band];
    let x: number;
    if (row.cells.length) x = (tower.baseX + (s.side === 'left' ? row.leftX - 1 : row.leftX + row.cells.length)) * CELL_W;
    else {
      // an empty floor: doors at the ends of the floor above, where the new row will grow from
      const above = tower.rows.find((r, b) => b > s.band && r.cells.length);
      x = above ? (tower.baseX + (s.side === 'left' ? above.leftX - 0.5 : above.leftX + above.cells.length - 0.5)) * CELL_W : (tower.baseX + (s.side === 'left' ? -1 : 1)) * CELL_W;
    }
    return new THREE.Vector3(x, s.band * CELL_H + CELL_H / 2, 0.2);
  }

  /** Glowing arrows at the floor ends where the selected piece may go. */
  showDoors(specs: DoorSpec[]): void {
    this.doors.clear();
    for (const s of specs) {
      const pos = this.doorPosition(s);
      if (!pos) continue;
      const door = makeDoor(s.side);
      door.scale.setScalar(1.35);
      door.position.copy(pos);
      door.userData = { door: s };
      this.doors.add(door);
    }
  }

  private buildHitBoxes(towers: Tower[]): void {
    this.hit.clear();
    const mat = new THREE.MeshBasicMaterial({ visible: false });
    towers.forEach((tower, ti) => {
      tower.rows.forEach((row, b) => {
        if (!row.cells.length) return;
        const w = row.cells.length * CELL_W;
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, CELL_H, CELL_D + 1), mat);
        m.position.set((tower.baseX + row.leftX + (row.cells.length - 1) / 2) * CELL_W, b * CELL_H + CELL_H / 2, 0.3);
        m.userData = { row: { tower: ti, band: b, left: (tower.baseX + row.leftX - 0.5) * CELL_W, right: (tower.baseX + row.leftX + row.cells.length - 0.5) * CELL_W } };
        this.hit.add(m);
      });
    });
  }

  doorObjects(): THREE.Object3D[] {
    return this.doors.children;
  }
  rowObjects(): THREE.Object3D[] {
    return this.hit.children;
  }

  /** world anchor at the right end of a row, for HTML labels */
  rowAnchor(tower: number, band: number, side: Side = 'right'): THREE.Vector3 | null {
    const t = this.towersCache[tower];
    if (!t) return null;
    const row = t.rows[band];
    let x: number;
    if (row.cells.length) x = (t.baseX + (side === 'right' ? row.leftX + row.cells.length - 0.5 : row.leftX - 0.5)) * CELL_W;
    else {
      // empty floor: anchor under the widest row so labels stay in a neat column
      let edge = side === 'right' ? -Infinity : Infinity;
      for (const r of t.rows) if (r.cells.length) edge = side === 'right' ? Math.max(edge, r.leftX + r.cells.length - 0.5) : Math.min(edge, r.leftX - 0.5);
      x = (t.baseX + (Number.isFinite(edge) ? edge : 0)) * CELL_W;
    }
    return new THREE.Vector3(x, band * CELL_H + CELL_H / 2, CELL_D / 2);
  }

  bounds(): { minX: number; maxX: number; top: number } {
    let minX = Infinity;
    let maxX = -Infinity;
    let top = 1;
    this.towersCache.forEach((t) =>
      t.rows.forEach((r, b) => {
        if (!r.cells.length) return;
        minX = Math.min(minX, (t.baseX + r.leftX - 0.5) * CELL_W);
        maxX = Math.max(maxX, (t.baseX + r.leftX + r.cells.length - 0.5) * CELL_W);
        top = Math.max(top, (b + 1) * CELL_H);
      }),
    );
    if (!Number.isFinite(minX)) return { minX: -3, maxX: 3, top: BAND_COUNT * CELL_H };
    return { minX, maxX, top: Math.max(top, 4 * CELL_H) };
  }

  /** world position of a cell id (for pop-ups) */
  posOf(id: number): THREE.Vector3 | null {
    return this.items.get(id)?.pos.clone() ?? null;
  }

  clear(): void {
    for (const it of this.items.values()) this.group.remove(it.obj);
    this.items.clear();
    this.doors.clear();
    this.playback = null;
  }
}

function bounce(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
}

function sparkleTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.3, 'rgba(255,240,160,0.8)');
  grad.addColorStop(1, 'rgba(255,200,80,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function makeTree(): THREE.Object3D {
  const g = new THREE.Group();
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.07, 0.12, 8), new THREE.MeshStandardMaterial({ color: 0xc2643a }));
  pot.position.y = 0.06;
  const crown = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.36, 8), new THREE.MeshStandardMaterial({ color: 0x3f8f3a, roughness: 0.8 }));
  crown.position.y = 0.3;
  pot.castShadow = crown.castShadow = true;
  g.add(pot, crown);
  return g;
}

function makeDoor(side: Side): THREE.Object3D {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0xffe066, transparent: true, opacity: 0.9 });
  const arch = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.07, 8, 20, Math.PI), mat);
  arch.position.y = -0.05;
  const shape = new THREE.Shape();
  const dir = side === 'right' ? -1 : 1;
  shape.moveTo(0, 0.18);
  shape.lineTo(0.28 * dir, 0);
  shape.lineTo(0, -0.18);
  const arrow = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
  arrow.position.set(-0.14 * dir, -0.12, 0.9);
  const glow = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24), new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.35, depthWrite: false }));
  glow.position.z = 0.88;
  arch.position.z = 0.9;
  // a large invisible hit target for fingers
  const hitbox = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 2.4), new THREE.MeshBasicMaterial({ visible: false }));
  g.add(glow, arch, arrow, hitbox);
  return g;
}

/** Small procedural buildings for service pieces (kept distinct by shape, sign and colour). */
function makeService(type: ServiceType): THREE.Object3D {
  const g = new THREE.Group();
  const porch = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.62), new THREE.MeshStandardMaterial({ color: 0xa8743f }));
  porch.position.y = 0.03;
  g.add(porch);
  const std = (c: number) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7 });
  let sign: 'book' | 'case' | 'heart';
  if (type === 'classroom') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.42, 0.44), std(0xfff4dc));
    body.position.y = 0.27;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.3, 4), std(0xd2462f));
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 0.63;
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshStandardMaterial({ color: 0xe0b040, metalness: 0.8, roughness: 0.3 }));
    bell.position.y = 0.82;
    g.add(body, roof, bell);
    sign = 'book';
  } else if (type === 'workplace') {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.5, 0.44), std(0x9fb7d6));
    body.position.y = 0.31;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.08, 0.5), std(0x56657a));
    roof.position.y = 0.6;
    const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.3), std(0x8a5a44));
    chimney.position.set(0.2, 0.75, 0);
    g.add(body, roof, chimney);
    sign = 'case';
  } else {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.44, 0.44), std(0xffffff));
    body.position.y = 0.28;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), std(0x2f74d0));
    dome.position.y = 0.5;
    g.add(body, dome);
    sign = 'heart';
  }
  const icon = new THREE.Mesh(new THREE.CircleGeometry(0.13, 20), new THREE.MeshStandardMaterial({ map: iconTexture(sign), emissive: 0xffffff, emissiveIntensity: 0.15, emissiveMap: iconTexture(sign) }));
  icon.position.set(0, 0.3, 0.226);
  g.add(icon);
  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return g;
}
