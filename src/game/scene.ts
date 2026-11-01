// The world around the tower: renderer, camera rig, sunlight, the plaza and town ring,
// the turntable with its brass scissor jack, the ghost silhouette and Tripo characters.

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { GROUP_COLOR, plazaTexture, skyTexture } from './textures.ts';
import { CELL_H, CELL_W } from '../model/tower.ts';
import { groupOf } from '../model/types.ts';

export const BASE_Y = 0.55; // top of the turntable, where the nursery floor stands

export interface ModelEntry {
  file: string;
  role?: string;
  heightM?: number;
  yawOffsetRad?: number;
  clips?: Record<string, string>;
}

export interface Actor {
  root: THREE.Object3D;
  mixer: THREE.AnimationMixer | null;
  clips: Map<string, THREE.AnimationClip>;
  roles: Record<string, string>;
  current: THREE.AnimationAction | null;
  play(role: string, opts?: { once?: boolean; fade?: number }): void;
}

export class World {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  sun: THREE.DirectionalLight;
  root = new THREE.Group(); // tower anchor (turntable top)
  turntable = new THREE.Group();
  jack = new THREE.Group();
  jackLift = 0; // 0..1 extension shown
  jackTarget: number | null = null; // eases toward this when set
  ghost = new THREE.Group();
  props = new THREE.Group();
  dressing = new THREE.Group();
  actors: Actor[] = [];
  models = new Map<string, { scene: THREE.Object3D; anims: THREE.AnimationClip[]; entry: ModelEntry }>();
  // camera rig
  yaw = -0.22;
  pitch = 0.13;
  dist = 18;
  target = new THREE.Vector3(0, 4, 0);
  private wantTarget = new THREE.Vector3(0, 4, 0);
  private wantDist = 18;
  userZoom = 1;
  private scissorArms: THREE.Mesh[] = [];

  constructor(public canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.1, 400);
    this.scene.background = skyTexture();
    this.scene.fog = new THREE.Fog(0xf4dfc0, 60, 140);

    const hemi = new THREE.HemisphereLight(0xcfe8ff, 0xc9a77a, 1.15);
    this.scene.add(hemi);
    this.sun = new THREE.DirectionalLight(0xfff1d6, 2.6);
    this.sun.position.set(-14, 26, 18);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.left = -22;
    sc.right = 22;
    sc.top = 22;
    sc.bottom = -12;
    sc.near = 1;
    sc.far = 80;
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.03;
    this.scene.add(this.sun, this.sun.target);

    this.buildPlaza();
    this.buildTurntable();
    this.scene.add(this.root, this.ghost, this.props, this.dressing);
    this.root.position.y = BASE_Y;
    this.ghost.position.y = BASE_Y;
  }

  private buildPlaza(): void {
    const plaza = new THREE.Mesh(new THREE.CircleGeometry(70, 64), new THREE.MeshStandardMaterial({ map: plazaTexture(), roughness: 0.95 }));
    plaza.rotation.x = -Math.PI / 2;
    plaza.receiveShadow = true;
    this.scene.add(plaza);
    // a low ring of procedural houses: cream walls, terracotta roofs
    let s = 9;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const wall = new THREE.MeshStandardMaterial({ color: 0xf3e2c2, roughness: 0.9 });
    const wall2 = new THREE.MeshStandardMaterial({ color: 0xe8c99a, roughness: 0.9 });
    const roof = new THREE.MeshStandardMaterial({ color: 0xc8553d, roughness: 0.8 });
    const win = new THREE.MeshStandardMaterial({ color: 0x3a6ea5, roughness: 0.4 });
    const leaf = new THREE.MeshStandardMaterial({ color: 0x5aa04a, roughness: 0.9 });
    const trunk = new THREE.MeshStandardMaterial({ color: 0x7a5232, roughness: 0.9 });
    // a far ring of smaller rooftops, so the town reads as dense like the mockups
    for (let i = 0; i < 46; i++) {
      const a = (i / 46) * Math.PI * 2 + r() * 0.06;
      const rad = 46 + r() * 10;
      const h = 4 + r() * 6;
      const w = 4 + r() * 3;
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), r() < 0.5 ? wall : wall2);
      body.position.set(Math.cos(a) * rad, h / 2, Math.sin(a) * rad);
      body.lookAt(0, h / 2, 0);
      const top = new THREE.Mesh(new THREE.ConeGeometry(w * 0.75, 2, 4), roof);
      top.position.set(body.position.x, h + 1, body.position.z);
      top.rotation.y = Math.PI / 4 - a;
      this.props.add(body, top);
    }
    for (let i = 0; i < 34; i++) {
      const a = (i / 34) * Math.PI * 2 + r() * 0.05;
      // keep the view behind the tower open: fewer houses straight ahead of the camera
      const rad = 30 + r() * 10;
      const h = 3 + r() * 4;
      const w = 3 + r() * 2.5;
      const house = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, w * 0.9), r() < 0.5 ? wall : wall2);
      body.position.y = h / 2;
      body.castShadow = body.receiveShadow = true;
      const top = new THREE.Mesh(new THREE.ConeGeometry(w * 0.78, 1.6, 4), roof);
      top.position.y = h + 0.8;
      top.rotation.y = Math.PI / 4;
      top.castShadow = true;
      house.add(body, top);
      for (let k = 0; k < 2; k++) {
        const wnd = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.8), win);
        wnd.position.set(-w / 4 + (k * w) / 2, h * 0.62, (w * 0.9) / 2 + 0.01);
        house.add(wnd);
      }
      house.position.set(Math.cos(a) * rad, 0, Math.sin(a) * rad);
      house.lookAt(0, 0, 0);
      this.props.add(house);
      if (r() < 0.7) {
        const tree = new THREE.Group();
        const t = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 1.4), trunk);
        t.position.y = 0.7;
        const crown = new THREE.Mesh(new THREE.SphereGeometry(0.9 + r() * 0.5, 12, 10), leaf);
        crown.position.y = 2;
        crown.castShadow = t.castShadow = true;
        tree.add(t, crown);
        const ta = a + 0.09;
        tree.position.set(Math.cos(ta) * (rad - 6), 0, Math.sin(ta) * (rad - 6));
        this.props.add(tree);
      }
    }
  }

  private buildTurntable(): void {
    const stone = new THREE.MeshStandardMaterial({ color: 0xcdb08a, roughness: 0.9 });
    const wood = new THREE.MeshStandardMaterial({ color: 0x8a5a33, roughness: 0.6 });
    const brass = new THREE.MeshStandardMaterial({ color: 0xd6a640, metalness: 0.85, roughness: 0.3 });
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(10.5, 11, 0.35, 64), stone);
    ring.position.y = 0.175;
    const deck = new THREE.Mesh(new THREE.CylinderGeometry(9.8, 9.8, 0.2, 64), wood);
    deck.position.y = 0.45;
    const rim = new THREE.Mesh(new THREE.TorusGeometry(9.8, 0.08, 8, 96), brass);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.55;
    for (const m of [ring, deck]) {
      m.receiveShadow = true;
      m.castShadow = true;
    }
    this.turntable.add(ring, deck, rim);
    this.scene.add(this.turntable);
    // brass scissor jack: shown while the tower is lifted for a new nursery floor
    const armGeo = new THREE.BoxGeometry(2.6, 0.12, 0.12);
    for (const z of [-0.5, 0.5]) {
      for (const sgn of [1, -1]) {
        const arm = new THREE.Mesh(armGeo, brass);
        arm.position.z = z;
        arm.userData.sgn = sgn;
        arm.castShadow = true;
        this.jack.add(arm);
        this.scissorArms.push(arm);
      }
    }
    const plate = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 1.4), brass);
    plate.name = 'jackTop';
    this.jack.add(plate);
    this.jack.position.y = BASE_Y;
    this.scene.add(this.jack);
    this.setJack(0);
  }

  /** Show the scissor jack extended by `u` floors (0 = folded flat under the tower). */
  setJack(u: number): void {
    this.jackTarget = null;
    this.applyJack(u);
  }

  private applyJack(u: number): void {
    this.jackLift = u;
    const h = Math.max(0.06, u * CELL_H);
    const ang = Math.asin(Math.min(0.95, h / 2.6));
    for (const arm of this.scissorArms) {
      arm.rotation.z = ang * arm.userData.sgn;
      arm.position.y = h / 2;
    }
    const top = this.jack.getObjectByName('jackTop')!;
    top.position.y = h;
    this.jack.visible = u > 0.02;
  }

  /** Ghost bars of the target pyramid: shares per band scaled to `total` blocks. */
  setGhost(shares: number[] | undefined, total: number, x: number, z = 0): void {
    this.ghost.clear();
    if (!shares) return;
    // a glowing target outline like the mockups: group-coloured glass floors with bright cyan edges and a halo
    const edge = new THREE.LineBasicMaterial({ color: 0xe8fbff, transparent: true, opacity: 1 });
    const halo = new THREE.MeshBasicMaterial({ color: 0x1f78d8, transparent: true, opacity: 0.38, depthWrite: false });
    shares.forEach((sh, b) => {
      const w = Math.max(0.2, sh * total) * CELL_W;
      const y = b * CELL_H + CELL_H / 2;
      const geo = new THREE.BoxGeometry(w, CELL_H * 0.9, 0.7);
      const fill = new THREE.MeshBasicMaterial({ color: new THREE.Color(GROUP_COLOR[groupOf(b)]).lerp(new THREE.Color(0x9fe4ff), 0.35), transparent: true, opacity: 0.55, depthWrite: false });
      const m = new THREE.Mesh(geo, fill);
      m.position.set(x, y, z);
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo), edge);
      e.position.copy(m.position);
      const h = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.3, CELL_H + 0.02), halo);
      h.position.set(x, y, z - 0.4);
      this.ghost.add(h, m, e);
    });
  }

  async loadModels(base: string): Promise<void> {
    let manifest: Record<string, ModelEntry> = {};
    try {
      const res = await fetch(base + 'manifest.json');
      if (res.ok) {
        const raw = await res.json();
        manifest = raw.models ?? raw;
      }
    } catch {
      /* no models yet: procedural stand-ins */
    }
    const loader = new GLTFLoader();
    await Promise.all(
      Object.entries(manifest).map(async ([name, entry]) => {
        if (!entry?.file) return;
        try {
          const gltf = await loader.loadAsync(base + entry.file.replace(/^.*\//, ''));
          this.models.set(name, { scene: gltf.scene, anims: gltf.animations, entry });
        } catch (e) {
          console.warn('model failed', name, e);
        }
      }),
    );
  }

  /** Tripo props around the plaza (only the ones that loaded): fountain, benches, trees, townhouses. */
  dressTown(): void {
    this.dressing.clear();
    const put = (name: string, h: number, x: number, z: number, yaw: number) => {
      const a = this.spawn(name, h);
      if (!a) return;
      a.root.position.set(x, 0, z);
      a.root.rotation.y = yaw;
      this.dressing.add(a.root);
    };
    const face = (x: number, z: number) => Math.atan2(-x, -z); // +Z forward turned to the tower
    put('fountain', 2.2, 15, -11, 0);
    for (const [x, z] of [[-16, -3], [17, 3], [-12, 12], [12, -15]]) put('bench', 0.9, x, z, face(x, z));
    const trees = ['tree-olive', 'tree-cypress', 'tree-palm'];
    for (let i = 0; i < 10; i++) {
      const a = Math.PI * (1.02 + i * 0.1); // behind the tower, never between it and the camera
      const r = 20 + (i % 3) * 1.6;
      put(trees[i % 3], trees[i % 3] === 'tree-cypress' ? 5 : 3.6, Math.cos(a) * r, Math.sin(a) * r, i * 1.3);
    }
    for (const [x, z] of [[-24, -14], [24, -16], [-26, 4]]) {
      put('townhouse', 6, x, z, face(x, z) + Math.PI / 2); // its door faces -X
    }
  }

  /** A fresh instance of a loaded model scaled to heightM, or null. */
  spawn(name: string, heightM?: number): Actor | null {
    const m = this.models.get(name);
    if (!m) return null;
    const obj = SkeletonUtils.clone(m.scene);
    const box = new THREE.Box3().setFromObject(obj);
    const h = box.max.y - box.min.y || 1;
    const want = heightM ?? m.entry.heightM ?? 1;
    const holder = new THREE.Group();
    obj.scale.setScalar(want / h);
    obj.position.y = -box.min.y * (want / h);
    obj.rotation.y = m.entry.yawOffsetRad ?? 0;
    obj.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        (o as THREE.Mesh).frustumCulled = false;
      }
    });
    holder.add(obj);
    const mixer = m.anims.length ? new THREE.AnimationMixer(obj) : null;
    const clips = new Map(m.anims.map((c) => [c.name, c]));
    const actor: Actor = {
      root: holder,
      mixer,
      clips,
      roles: m.entry.clips ?? {},
      current: null,
      play(role, opts = {}) {
        if (!this.mixer) return;
        const name = this.roles[role] ?? role;
        const clip = this.clips.get(name) ?? [...this.clips.values()].find((c) => c.name.toLowerCase().includes(role));
        if (!clip) return;
        const action = this.mixer.clipAction(clip);
        if (this.current === action && !opts.once) return;
        action.reset();
        action.setLoop(opts.once ? THREE.LoopOnce : THREE.LoopRepeat, Infinity);
        action.clampWhenFinished = !!opts.once;
        action.fadeIn(opts.fade ?? 0.25).play();
        this.current?.fadeOut(opts.fade ?? 0.25);
        this.current = action;
      },
    };
    this.actors.push(actor);
    return actor;
  }

  resize(w: number, h: number): void {
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
  }

  /** Aim the camera at a box (the towers), keeping it fully in view. */
  frame(minX: number, maxX: number, height: number, portrait: boolean): void {
    const cx = (minX + maxX) / 2;
    const w = maxX - minX + 6;
    const h = height + 2.6;
    // a little below the middle: the HUD covers more of the top than the bottom
    // on a phone the tray, crank and objective take the bottom third, so aim lower and the tower rides higher
    this.wantTarget.set(cx, BASE_Y + h * (portrait ? 0.22 : 0.36), 0);
    const vfov = (this.camera.fov * Math.PI) / 180;
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * this.camera.aspect);
    const dh = h / 2 / Math.tan(vfov / 2);
    const dw = w / 2 / Math.tan(hfov / 2);
    // never back out past the plaza trees and houses
    this.wantDist = Math.min(Math.max(dh, dw) * (portrait ? 1.0 : 0.98) + 1.6, portrait ? 24 : 34);
  }

  update(dt: number, reduced: boolean): void {
    if (this.jackTarget !== null) {
      const next = reduced ? this.jackTarget : this.jackLift + (this.jackTarget - this.jackLift) * Math.min(1, dt * 8);
      const t = this.jackTarget;
      this.applyJack(Math.abs(next - t) < 0.01 ? t : next);
      if (this.jackLift === t) this.jackTarget = null;
    }
    const k = reduced ? 1 : 1 - Math.exp(-dt * 3);
    this.target.lerp(this.wantTarget, k);
    this.dist += (this.wantDist * this.userZoom - this.dist) * k;
    const cp = Math.cos(this.pitch);
    this.camera.position.set(this.target.x + Math.sin(this.yaw) * cp * this.dist, this.target.y + Math.sin(this.pitch) * this.dist, this.target.z + Math.cos(this.yaw) * cp * this.dist);
    this.camera.lookAt(this.target);
    for (const a of this.actors) a.mixer?.update(dt);
  }

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }
}
