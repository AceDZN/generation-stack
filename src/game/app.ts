// The game controller: screens, the decade loop, input, the crank sequence, HUD, saving,
// the Workbook host events and the test hooks (render_game_to_text, advanceTime).

import * as THREE from 'three';
import { LevelRun, type Piece } from '../model/game.ts';
import { BANDS, BAND_COUNT, GROUP_HE, SERVICE_FOR, SERVICE_HE, type Group, type LevelDef, type ServiceType, type Side, groupOf } from '../model/types.ts';
import { CAPACITY, naturalIncrease, total } from '../model/demography.ts';
import { counts, stability } from '../model/tower.ts';
import { rapierJudge, type Recording } from '../physics/judge.ts';
import { World, BASE_Y } from './scene.ts';
import { TowerView, type DoorSpec } from './towerView.ts';
import { Sfx } from './audio.ts';
import { Characters } from './characters.ts';
import { postToHost } from '../host.ts';

type Sel = { type: 'piece'; id: number } | { type: 'service'; kind: ServiceType } | { type: 'beam' } | null;
interface Step {
  dur: number;
  start?: () => void;
  tick?: (u: number) => void;
  end?: () => void;
  t?: number;
}

const SAVE_KEY = 'generation-stack:v1';
const SERVICE_ICON: Record<ServiceType, string> = { classroom: '🏫', workplace: '🏭', clinic: '🏥' };
const NEED_ICON: Record<Group, string> = { child: '📖', adult: '💼', elder: '❤️' };
const TRANSPORT_ICON = { boat: '🚢', train: '🚆', plane: '✈️', bus: '🚌' } as const;
const $ = (id: string) => document.getElementById(id)!;

function fmtPeople(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)} מיליון`;
  if (n >= 1e3) return `${Math.round(n / 1e3)} אלף`;
  return String(n);
}
const ltr = (s: string | number) => `<bdi dir="ltr">${s}</bdi>`;

export interface Save {
  stars: Record<number, number>;
  endlessBest: number;
}

export class App {
  world: World;
  view = new TowerView();
  sfx = new Sfx();
  chars: Characters;
  run: LevelRun | null = null;
  levelIdx = -1; // index into levels, or -1 for endless
  endlessSeed = 0;
  mode: 'title' | 'select' | 'play' = 'title';
  sel: Sel = null;
  paused = false;
  reduced = false;
  clock = 0; // virtual ms
  private seq: Step[] = [];
  private raf = 0;
  private last = 0;
  private manual = false;
  private save: Save;
  private labels: HTMLElement[] = [];
  private ray = new THREE.Raycaster();
  private recording: Recording | null = null;
  private levelOpenedAt = 0;
  private readyPosted = false;
  private dragFrom: { x: number; y: number; yaw: number; pitch: number; moved: boolean; id: number } | null = null;
  private pinch: { d: number; z: number } | null = null;
  private pointers = new Map<number, { x: number; y: number }>();
  private cardDrag: Sel = null;
  private kbBand = 0;
  private kbSide: Side = 'right';
  private toastTimer = 0;
  private leaves: { m: THREE.Mesh; v: THREE.Vector3; life: number }[] = [];
  private leafGeo = new THREE.PlaneGeometry(0.25, 0.14);
  private leafMat = new THREE.MeshStandardMaterial({ color: 0x6fae3f, side: THREE.DoubleSide });
  windOn = false;
  interacted = false;
  lastPlacement: string = '';

  constructor(
    public canvas: HTMLCanvasElement,
    public levels: LevelDef[],
    public endless: ((seed: number) => LevelDef) | null,
  ) {
    this.world = new World(canvas);
    this.world.root.add(this.view.group);
    this.chars = new Characters(this.world);
    this.save = this.loadSave();
    try {
      this.reduced = localStorage.getItem('generation-stack:reduced') === '1' || matchMedia('(prefers-reduced-motion: reduce)').matches;
      this.sfx.setMuted(localStorage.getItem('generation-stack:muted') === '1');
    } catch {
      /* storage blocked */
    }
    this.view.reduced = this.reduced;
    this.bindUi();
    this.resize();
    new ResizeObserver(() => this.resize()).observe(canvas.parentElement!);
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.toast('הגרפיקה נעצרה לרגע… טוענים מחדש');
    });
    canvas.addEventListener('webglcontextrestored', () => location.reload());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.mode === 'play' && !this.paused && this.interacted) this.setPaused(true);
    });
  }

  // ---------- save ----------
  private loadSave(): Save {
    try {
      const raw = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null');
      if (raw && typeof raw === 'object') return { stars: raw.stars ?? {}, endlessBest: raw.endlessBest ?? 0 };
    } catch {
      /* ignore */
    }
    return { stars: {}, endlessBest: 0 };
  }
  private writeSave(): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.save));
    } catch {
      /* ignore */
    }
  }
  unlocked(i: number): boolean {
    return i === 0 || (this.save.stars[this.levels[i - 1].id] ?? 0) > 0 || (this.save.stars[this.levels[i].id] ?? 0) > 0;
  }
  totalStars(): number {
    return Object.values(this.save.stars).reduce((a, b) => a + b, 0);
  }

  // ---------- loop ----------
  start(): void {
    const loop = (t: number) => {
      this.raf = requestAnimationFrame(loop);
      if (this.manual) return;
      const dt = Math.min(0.05, (t - (this.last || t)) / 1000);
      this.last = t;
      this.step(dt);
      this.renderFrame();
    };
    this.raf = requestAnimationFrame(loop);
  }

  /** deterministic stepping for tests: advance the game by ms, in 1/60 s steps */
  advanceTime(ms: number): void {
    this.manual = true;
    let left = ms / 1000;
    while (left > 1e-9) {
      const dt = Math.min(1 / 60, left);
      this.step(dt);
      left -= dt;
    }
    this.renderFrame();
  }
  resumeRealtime(): void {
    this.manual = false;
    this.last = 0;
  }

  private step(dt: number): void {
    if (this.paused) {
      this.world.update(0, true);
      return;
    }
    this.clock += dt * 1000;
    // sequencer
    let budget = dt;
    while (this.seq.length && budget > 0) {
      const s = this.seq[0];
      if (s.t === undefined) {
        s.t = 0;
        s.start?.();
      }
      const take = Math.min(budget, s.dur - s.t);
      s.t += take;
      budget -= take;
      s.tick?.(s.dur > 0 ? s.t / s.dur : 1);
      if (s.t >= s.dur - 1e-9) {
        this.seq.shift();
        s.end?.();
      } else break;
    }
    this.view.update(dt);
    this.chars.update(dt, this.clock / 1000);
    this.updateLeaves(dt);
    const b = this.view.bounds();
    const portrait = this.canvas.clientHeight > this.canvas.clientWidth;
    this.world.frame(Math.min(b.minX, this.ghostX() - 2), b.maxX + (portrait ? 1 : 4), b.top + (this.world.jackLift ? 1 : 0), portrait);
    this.world.update(dt, this.reduced);
  }

  drawOnce(): void {
    this.world.update(1, true);
    this.renderFrame();
  }

  /** Tell the host which authored level is open (after `ready`). */
  announceLevel(): void {
    if (this.levelIdx >= 0 && this.mode === 'play') postToHost({ type: 'level-start', level: this.levels[this.levelIdx].id });
  }

  private renderFrame(): void {
    this.world.render();
    this.updateLabels();
    if (!this.readyPosted && this.mode !== 'title') {
      // first playable scene drawn
    }
  }

  private queue(...steps: Step[]): void {
    this.seq.push(...steps);
  }
  get animating(): boolean {
    return this.seq.length > 0;
  }

  resize(): void {
    const el = this.canvas.parentElement!;
    this.world.resize(el.clientWidth, el.clientHeight);
  }

  // ---------- screens ----------
  showTitle(): void {
    this.mode = 'title';
    const t = $('title');
    t.hidden = false;
    t.innerHTML = `<div class="title-card"><h1>מגדל הדורות</h1><h2>כל קומה היא דור. כל מגדל הוא מדינה.</h2><button class="btn green" id="btn-start" style="font-size:26px;padding:14px 44px">שחקו ▶</button></div>`;
    $('btn-start').onclick = () => {
      this.sfx.unlock();
      this.sfx.click();
      t.hidden = true;
      const next = this.levels.findIndex((l) => !(this.save.stars[l.id] > 0));
      if (next === 0) this.openLevel(0);
      else this.showSelect();
    };
    // a demo tower behind the title
    if (this.levels[0]) this.previewTower(this.levels[Math.min(5, this.levels.length - 1)]);
  }

  private previewTower(def: LevelDef): void {
    const r = new LevelRun(def);
    this.view.clear();
    this.view.sync(r.towers, {}, true);
    this.world.setGhost(undefined, 0, 0);
    this.world.setJack(0);
  }

  showSelect(): void {
    this.mode = 'select';
    this.setPaused(false);
    $('hud').hidden = true;
    $('panel').hidden = true;
    const el = $('select');
    el.hidden = false;
    const worldNames = ['ילודה ותמותה', 'פירמידות גיל', 'תנועות הגירה', 'המגדל הישראלי'];
    const current = this.levels.findIndex((l, i) => this.unlocked(i) && !(this.save.stars[l.id] > 0));
    let html = `<div class="sel-top"><div style="display:flex;gap:8px;direction:ltr"><button class="round" id="sel-mute" aria-label="צליל">${this.sfx.muted ? '🔇' : '🔊'}</button></div><div class="total">⭐ ${this.totalStars()}/${this.levels.length * 3}</div></div><h1>מגדל הדורות</h1><div class="worlds">`;
    for (let w = 1; w <= 4; w++) {
      html += `<section class="world w${w}"><div class="ribbon">${w}. ${worldNames[w - 1]}</div><div class="nodes">`;
      this.levels.forEach((l, i) => {
        if (l.world !== w) return;
        const st = this.save.stars[l.id] ?? 0;
        const open = this.unlocked(i);
        const mini = l.towers[0].silhouette ?? l.towers[0].start.map((n) => n / Math.max(1, total(l.towers[0].start)));
        const bars = mini.map((s, b) => `<i style="width:${Math.max(8, Math.min(70, s * 260))}px;background:var(--${groupOf(b)})"></i>`).join('');
        html += `<button class="node ${open ? '' : 'locked'} ${i === current ? 'current' : ''}" data-i="${i}" ${open ? '' : 'aria-disabled="true"'}><span class="mini">${bars}</span><span class="stone">${open ? l.id : '🔒'}</span><span class="nm">${l.titleHe}</span><span class="st">${'★'.repeat(st)}<span style="opacity:.3">${'★'.repeat(3 - st)}</span></span></button>`;
      });
      html += `</div></section>`;
    }
    html += `</div>`;
    if (this.endless) html += `<button class="btn endless" id="btn-endless">🏙️ מגדלים בלי סוף (אתגר יומי)${this.save.endlessBest ? ` · שיא: ${this.save.endlessBest}` : ''}</button>`;
    const pick = current >= 0 ? current : 0;
    html += `<div class="preview" id="preview"></div><button class="btn green playbtn" id="btn-play">שחקו ▶</button>`;
    el.innerHTML = html;
    const preview = (i: number) => {
      const l = this.levels[i];
      $('preview').innerHTML = `<h3>שלב ${l.id}: ${l.titleHe}</h3><p>${l.conceptHe}</p>`;
      $('btn-play').onclick = () => this.unlocked(i) && this.openLevel(i);
    };
    preview(pick);
    el.querySelectorAll<HTMLButtonElement>('.node').forEach((b) => {
      b.onclick = () => {
        this.sfx.unlock();
        const i = Number(b.dataset.i);
        if (!this.unlocked(i)) {
          this.sfx.oops();
          return;
        }
        this.sfx.click();
        this.openLevel(i);
      };
      b.onmouseenter = () => preview(Number(b.dataset.i));
    });
    const be = document.getElementById('btn-endless');
    if (be) be.onclick = () => this.openEndless();
    $('sel-mute').onclick = () => {
      this.toggleMute();
      $('sel-mute').textContent = this.sfx.muted ? '🔇' : '🔊';
    };
  }

  openEndless(): void {
    if (!this.endless) return;
    const d = new Date();
    this.endlessSeed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    this.levelIdx = -1;
    this.begin(this.endless(this.endlessSeed));
  }

  openLevel(i: number): void {
    this.levelIdx = i;
    this.begin(this.levels[i]);
    if (this.readyPosted) this.announceLevel();
  }

  private begin(def: LevelDef): void {
    this.mode = 'play';
    this.seq = [];
    $('select').hidden = true;
    $('title').hidden = true;
    $('hud').hidden = false;
    this.sel = null;
    this.run = new LevelRun(def, () => this.clock);
    this.levelOpenedAt = this.clock;
    this.view.clear();
    this.world.setJack(1);
    this.view.sync(this.run.towers, {}, true);
    this.view.showDoors([]);
    this.refreshGhost();
    this.chars.layout(this.run.towers.map((t) => t.baseX));
    this.renderHud();
    this.showIntro();
  }

  private ghostX(): number {
    if (!this.run) return -8;
    const b = this.view.bounds();
    return b.minX - 3.5;
  }

  private refreshGhost(): void {
    const r = this.run!;
    const sh = r.def.towers[0].silhouette;
    if (!sh || r.towers.length > 1) {
      this.world.setGhost(undefined, 0, 0);
      return;
    }
    const pop = Math.max(8, r.population(0));
    const maxShare = Math.max(...sh);
    const half = (maxShare * pop) / 2;
    this.world.setGhost(sh, pop, this.view.bounds().minX - half - 1.2);
  }

  // ---------- HUD ----------
  renderHud(): void {
    const r = this.run;
    if (!r) return;
    const def = r.def;
    // decade counter
    const yf = $('yr-from');
    const yt = $('yr-to');
    if (yf.textContent !== String(r.year)) {
      yf.textContent = String(r.year);
      yf.classList.remove('flip');
      void yf.offsetWidth;
      if (!this.reduced) yf.classList.add('flip');
    }
    yt.textContent = String(r.targetYear);
    $('pips').innerHTML = Array.from({ length: def.decades }, (_, i) => `<i class="${i < r.decade ? 'done' : ''}"></i>`).join('');
    // the mayor's board
    let html = '';
    r.towers.forEach((_, ti) => {
      const p = r.plan(ti);
      const tp = def.towers[ti];
      const arr = (p.arrivals ?? []).reduce((n, g) => n + total(Object.values(g.bands).map(Number)), 0);
      const dep = (p.departures ?? []).reduce((n, g) => n + total(Object.values(g.bands).map(Number)), 0);
      const inbound = r.towers.length > 1 ? (def.towers[1 - ti].decades[Math.min(r.decade, def.towers[1 - ti].decades.length - 1)]?.departures ?? []).filter((d) => d.toTower === ti).reduce((n, g) => n + total(Object.values(g.bands).map(Number)), 0) : 0;
      const ni = naturalIncrease(p.cbr, p.cdr);
      const pop = r.population(ti) * def.peoplePerBlock;
      const hideStage = !def.hints || def.goal === 'stage';
      html += `<div class="country">${tp.nameHe}</div>`;
      if (ti === 0) html += `<div class="row"><span>📅</span><span class="big">${ltr(r.year)}</span></div>`;
      html += `<div class="row"><span>👶 ילודה</span><b>${ltr(p.cbr + ' ‰')}</b></div>`;
      html += `<div class="row"><span>🕯️ תמותה</span><b>${ltr(p.cdr + ' ‰')}</b></div>`;
      if (def.hints) html += `<div class="row ni"><span>ריבוי טבעי</span><b>${ltr(`${p.cbr} − ${p.cdr} = ${ni} ‰`)}</b></div>`;
      if (arr || dep || inbound) html += `<div class="row event"><span>🧳 הגירה</span><b>${ltr(`+${arr + inbound} / −${dep}`)}</b></div>`;
      if (arr || dep || inbound) html += `<div class="row muted"><span>מאזן הגירה</span><b>${ltr((arr + inbound - dep >= 0 ? '+' : '') + (arr + inbound - dep))}</b></div>`;
      if (p.stage && !hideStage) html += `<div class="row muted"><span>שלב במעבר הדמוגרפי</span><b>${ltr(p.stage)}</b></div>`;
      html += `<div class="row muted"><span>תושבים</span><b>≈ ${fmtPeople(pop)}</b></div>`;
      if (p.eventHe) html += `<div class="event">${p.eventHe}</div>`;
    });
    html += `<div class="row muted"><span>קובייה</span><b>≈ ${fmtPeople(def.peoplePerBlock)} איש</b></div>`;
    $('board-body').innerHTML = html;
    // objective
    let obj = '';
    if (def.goal === 'exact') obj = `🎯 צלצלו בפעמון כשבמגדל בדיוק ${ltr(def.exactTarget!)} קוביות (עכשיו: ${ltr(r.totalPopulation())})`;
    else obj = `🎯 הגיעו לשנת ${ltr(r.targetYear)}: המגדל עומד וכל הקומות מקבלות מענה`;
    if (r.needsChoice()) obj = `🚩 ${def.choice!.promptHe}`;
    $('objective').innerHTML = obj;
    $('btn-bell').hidden = def.goal !== 'exact';
    this.renderTray();
    const crank = $('btn-crank') as HTMLButtonElement;
    const can = r.canCrank() && !this.animating;
    crank.disabled = !can && r.phase === 'place' ? false : !can;
    crank.classList.toggle('ready', can);
    crank.setAttribute('aria-disabled', String(!can));
    // stability hint
    const st = $('stability');
    st.hidden = !def.hints || r.phase !== 'place';
    if (!st.hidden) {
      const m = Math.min(...r.towers.map((t) => stability(t, def.wind).margin));
      const v = Number.isFinite(m) ? Math.max(0, Math.min(1, (m + 0.2) / 1.6)) : 0;
      ($('stab-bar') as HTMLElement).style.setProperty('--v', `${Math.round(v * 100)}%`);
    }
  }

  private renderTray(): void {
    const r = this.run!;
    const tray = $('tray');
    const cards: string[] = [];
    // group identical pieces by label so bundles stack
    for (const p of r.tray) {
      const icon = p.kind === 'baby' ? '👶' : TRANSPORT_ICON[p.transport ?? 'bus'];
      const ages = r.def.migrantFloors === 'choose' && p.kind === 'migrant' ? '' : `<span class="muted">${p.kind === 'baby' ? '0–9' : BANDS[p.band]}</span>`;
      const sel = this.sel?.type === 'piece' && this.sel.id === p.id;
      cards.push(`<button class="card ${sel ? 'sel' : ''}" data-piece="${p.id}"><span class="ico">${icon}</span><span class="lbl">${p.labelHe}</span>${ages}<span class="count">×${p.count}</span></button>`);
    }
    cards.push(`<div class="card points" title="נקודות בנייה: הבוגרים בונים"><span>🔨 בנייה</span><span class="big">${r.points}</span><span class="lbl">הבוגרים בונים</span></div>`);
    for (const k of ['classroom', 'workplace', 'clinic'] as ServiceType[]) {
      const sel = this.sel?.type === 'service' && this.sel.kind === k;
      cards.push(`<button class="card ${sel ? 'sel' : ''}" data-service="${k}" ${r.points <= 0 ? 'disabled' : ''}><span class="ico">${SERVICE_ICON[k]}</span><span class="lbl">${SERVICE_HE[k]}</span></button>`);
    }
    const bsel = this.sel?.type === 'beam';
    const shaky = r.def.hints && r.towers.some((t) => stability(t, r.def.wind).margin < 0.3 && t.rows.some((row, b) => b > 0 && row.cells.length));
    cards.push(`<button class="card ${bsel ? 'sel' : ''} ${shaky && r.points > 0 ? 'glow' : ''}" data-beam="1" ${r.points <= 0 ? 'disabled' : ''}><span class="ico">🪵</span><span class="lbl">קורה</span></button>`);
    tray.innerHTML = cards.join('');
    tray.querySelectorAll<HTMLButtonElement>('button.card').forEach((b) => {
      b.onpointerdown = (e) => {
        e.preventDefault();
        this.sfx.unlock();
        const s: Sel = b.dataset.piece ? { type: 'piece', id: Number(b.dataset.piece) } : b.dataset.service ? { type: 'service', kind: b.dataset.service as ServiceType } : { type: 'beam' };
        this.select(s);
        this.cardDrag = s;
      };
    });
  }

  select(s: Sel): void {
    const r = this.run;
    if (!r || r.phase !== 'place' || this.animating) return;
    if (s && this.sel && JSON.stringify(s) === JSON.stringify(this.sel)) s = null;
    this.sel = s;
    this.sfx.click();
    const doors: DoorSpec[] = [];
    if (s?.type === 'piece') {
      const p = r.tray.find((q) => q.id === s.id);
      if (p) for (const b of r.allowedBands(p)) for (const side of ['left', 'right'] as Side[]) doors.push({ tower: p.tower, band: b, side });
      if (p) this.kbBand = r.allowedBands(p)[0];
    } else if (s?.type === 'beam') {
      r.towers.forEach((_, ti) => doors.push({ tower: ti, band: 0, side: 'left' }, { tower: ti, band: 0, side: 'right' }));
      this.kbBand = 0;
    }
    this.view.showDoors(doors);
    if (s?.type === 'service') this.toast(`בחרו קומה ל${SERVICE_HE[s.kind]}: לחצו על הקומה במגדל`);
    this.renderHud();
  }

  private toast(msg: string, ms = 2600): void {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => t.classList.remove('on'), ms);
  }

  private pop(text: string, world: THREE.Vector3, color = '#fff'): void {
    const v = world.clone().add(new THREE.Vector3(0, BASE_Y, 0)).project(this.world.camera);
    const el = document.createElement('div');
    el.className = 'pop';
    el.style.left = `${((v.x + 1) / 2) * this.canvas.clientWidth}px`;
    el.style.top = `${((1 - v.y) / 2) * this.canvas.clientHeight}px`;
    el.style.color = color;
    el.textContent = text;
    $('labels').appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }

  private updateLabels(): void {
    const box = $('labels');
    const r = this.run;
    const want = this.mode === 'play' && r ? r.towers.length * BAND_COUNT : 0;
    while (this.labels.length < want) {
      const el = document.createElement('div');
      el.className = 'flabel';
      box.appendChild(el);
      this.labels.push(el);
    }
    this.labels.forEach((el, i) => (el.style.display = i < want ? '' : 'none'));
    if (!r || this.mode !== 'play') return;
    const needs = r.needs();
    const cam = this.world.camera;
    const W = this.canvas.clientWidth;
    const H = this.canvas.clientHeight;
    const selPiece = this.sel?.type === 'piece' ? r.tray.find((p) => p.id === (this.sel as { id: number }).id) : null;
    r.towers.forEach((t, ti) => {
      for (let b = 0; b < BAND_COUNT; b++) {
        const el = this.labels[ti * BAND_COUNT + b];
        const a = this.view.rowAnchor(ti, b, r.towers.length > 1 && ti === 0 ? 'left' : 'right');
        if (!a) continue;
        a.y += BASE_Y;
        a.x += r.towers.length > 1 && ti === 0 ? -0.3 : 0.3;
        const v = a.project(cam);
        const g = groupOf(b);
        const n = needs.find((q) => q.tower === ti && q.group === g)!;
        const ppl = t.rows[b].cells.filter((c) => c.kind === 'person').length;
        const ok = n.have >= n.needed;
        const showCount = r.def.hints;
        const key = `${BANDS[b]}|${ok}|${ppl}|${n.have}/${n.needed}|${showCount}`;
        if (el.dataset.k !== key) {
          el.dataset.k = key;
          el.innerHTML =
            (r.towers.length > 1 && ti === 0 ? '' : '') +
            `<span class="band">${BANDS[b]}</span><span class="need" title="${GROUP_HE[g]}">${NEED_ICON[g]}</span>` +
            (ppl || n.needed ? `<span class="${ok ? 'ok' : 'bad'}">${ok ? '✓' : '✗'}</span>` : '') +
            (showCount && ppl ? `<span class="cnt">${ppl}👤</span>` : '');
        }
        el.classList.toggle('target', !!selPiece && selPiece.tower === ti && r.allowedBands(selPiece).includes(b) && r.def.migrantFloors !== 'choose');
        const x = ((v.x + 1) / 2) * W;
        const y = ((1 - v.y) / 2) * H;
        el.style.left = `${r.towers.length > 1 && ti === 0 ? x - el.offsetWidth : x}px`;
        el.style.top = `${y}px`;
      }
    });
  }

  // ---------- panels ----------
  private panel(html: string, cls = ''): HTMLElement {
    const p = $('panel');
    p.className = `panel ${cls}`;
    p.innerHTML = html;
    p.hidden = false;
    return p;
  }
  private closePanel(): void {
    $('panel').hidden = true;
  }

  private showIntro(): void {
    const def = this.run!.def;
    const lines = def.introHe.map((l) => `<p>${l}</p>`).join('');
    const p = this.panel(`<div class="mayor"><span class="face">🎩</span><div><h2>${this.levelIdx >= 0 ? `שלב ${def.id}` : "מגדל יומי"}: ${def.titleHe}</h2>${lines}</div></div><div class="btns"><button class="btn green" id="go">יאללה! ▶</button></div>`);
    this.chars.mayor('wave');
    p.querySelector<HTMLButtonElement>('#go')!.onclick = () => {
      this.sfx.unlock();
      this.sfx.click();
      this.closePanel();
      if (this.run!.needsChoice()) this.showChoice();
      else this.decadeArrivals();
    };
  }

  private showChoice(): void {
    const c = this.run!.def.choice!;
    const p = this.panel(`<h2>🚩 ${c.promptHe}</h2><div class="choices">${c.options.map((o, i) => `<button data-i="${i}">${o.labelHe}</button>`).join('')}</div>`);
    p.querySelectorAll<HTMLButtonElement>('.choices button').forEach((b) => {
      b.onclick = () => {
        this.run!.makeChoice(Number(b.dataset.i));
        this.sfx.click();
        this.chars.mayor('cheer');
        this.closePanel();
        this.toast(`הדגל של ראש העיר: ${c.options[Number(b.dataset.i)].labelHe}`);
        this.renderHud();
        this.decadeArrivals();
      };
    });
  }

  /** Shula and the vehicles bring the decade's pieces. */
  private decadeArrivals(): void {
    const r = this.run!;
    const babies = r.tray.filter((p) => p.kind === 'baby').length;
    const migrants = r.tray.filter((p) => p.kind === 'migrant');
    if (babies) this.queue({ dur: this.reduced ? 0.2 : 1.6, start: () => { this.chars.shulaDeliver(); this.sfx.flap(); } });
    for (const m of migrants.slice(0, 3)) this.queue({ dur: this.reduced ? 0.1 : 0.9, start: () => this.chars.vehicle(m.transport ?? 'bus', m.tower) });
    this.queue({ dur: 0.01, end: () => this.renderHud() });
    if (r.tray.length === 0 && r.def.hints) this.toast('אין תינוקות או מהגרים בעשור הזה. אפשר לבנות ולמשוך במנוף');
  }

  // ---------- actions ----------
  /** Place the selected piece / beam through a door. */
  door(spec: DoorSpec): void {
    const r = this.run;
    if (!r || !this.sel || this.animating) return;
    if (this.sel.type === 'piece') {
      const p = r.tray.find((q) => q.id === (this.sel as { id: number }).id);
      if (!p) return;
      const res = r.place(p.id, spec.band, spec.side);
      if (res === 'wrong-floor') {
        this.sfx.boing();
        const a = this.view.rowAnchor(spec.tower, spec.band, spec.side);
        if (a) this.pop('?', a, '#ffd23f');
        this.toast(this.wrongFloorLine(p, spec.band), 4200);
        this.lastPlacement = 'wrong-floor';
        return;
      }
      if (res !== 'ok') return;
      this.lastPlacement = 'ok';
      this.sfx.slide();
      setTimeout(() => this.sfx.squeak(1 + Math.random() * 0.4), 180);
      if (spec.band === 0 && this.world.jackLift > 0) this.foldJack();
      this.view.sync(r.towers, { side: spec.side });
      this.sel = null;
      const next = r.tray[0];
      if (next) this.select({ type: 'piece', id: next.id });
      else this.view.showDoors([]);
    } else if (this.sel.type === 'beam') {
      const res = r.build('beam', spec.tower, 0, spec.side);
      if (res !== 'ok') return;
      this.sfx.thunk();
      if (this.world.jackLift > 0) this.foldJack();
      this.view.sync(r.towers, { side: spec.side });
      if (r.points <= 0) {
        this.sel = null;
        this.view.showDoors([]);
      }
    }
    this.afterChange();
  }

  private wrongFloorLine(p: Piece, band: number): string {
    const tg = groupOf(p.band);
    const kind = p.migrant;
    const who =
      kind === 'labor' ? 'מהגרי עבודה מגיעים בעיקר בגיל העבודה' : kind === 'refugee' ? 'פליטים מגיעים כמשפחות שלמות, בכל הגילים' : kind === 'internal' ? 'מי שעובר מהכפר לעיר הם בעיקר צעירים' : `הקבוצה הזאת בגילי ${BANDS[p.band]}`;
    return `"זאת לא הקומה שלנו!" ${who}. הם שייכים לקומות ה${GROUP_HE[tg]}, לא ל־${BANDS[band]}.`;
  }

  /** Dock a service piece on a floor. */
  floor(tower: number, band: number): void {
    const r = this.run;
    if (!r || this.sel?.type !== 'service' || this.animating) return;
    const kind = this.sel.kind;
    const res = r.build(kind, tower, band, 'right');
    if (res === 'invalid') {
      this.sfx.oops();
      this.toast('אין מקום לעוד שירות בקומה הזאת');
      return;
    }
    if (res === 'no-points') return;
    this.sfx.thunk();
    this.view.sync(r.towers, { drop: true });
    if (res === 'wasted') {
      const g = groupOf(band);
      this.toast(`ה${GROUP_HE[g]} בקומה ${BANDS[band]} לא צריכים ${SERVICE_HE[kind]}: הם צריכים ${SERVICE_HE[SERVICE_FOR[g]]}`, 4200);
      const a = this.view.rowAnchor(tower, band);
      if (a) this.pop('🤷', a);
    }
    if (r.points <= 0) this.sel = null;
    this.afterChange();
  }

  private afterChange(): void {
    const r = this.run!;
    this.renderHud();
    if (r.tray.length === 0 && r.def.hints && r.canCrank()) {
      const unmet = r.needs().filter((n) => n.have < n.needed);
      if (unmet.length === 0) this.toast('הכול מוכן? משכו במנוף העשור!');
    }
  }

  private foldJack(): void {
    this.world.jackTarget = 0;
  }

  crank(): void {
    const r = this.run;
    if (!r || this.animating || this.paused) return;
    if (!r.canCrank()) {
      this.sfx.oops();
      if (r.needsChoice()) this.showChoice();
      else if (r.tray.length) this.toast(`קודם מכניסים את כולם למגדל (נשארו ${r.tray.length})`);
      return;
    }
    this.sfx.unlock();
    this.sel = null;
    this.view.showDoors([]);
    const crankBtn = $('btn-crank');
    crankBtn.classList.add('pulled');
    this.sfx.ratchet();
    const res = r.crank(rapierJudge((rec) => (this.recording = rec)));
    const rec = this.recording!;
    const speed = this.reduced ? 3 : 1.25;
    const dur = (rec.frames.length * rec.dt) / speed;
    let crashed = false;
    this.queue(
      { dur: 0.45, tick: (u) => this.world.jackLift > 0 && this.world.setJack(this.world.jackLift * (1 - u)) },
      {
        dur,
        start: () => {
          this.view.startPlayback(rec, rec.result.collapsed);
          this.view.playback!.t = 0;
          if (r.def.wind > 0) {
            this.sfx.wind(true);
            this.windOn = true;
          }
          if (res.needs.some((n) => n.have < n.needed)) this.chars.protest();
        },
        tick: (u) => {
          if (this.view.playback) this.view.playback.t = u * dur * speed - 1e-6;
          if (this.windOn && !this.reduced && Math.random() < 0.3) this.spawnLeaf();
          if (rec.result.collapsed && !crashed && u > 0.35) {
            crashed = true;
            this.sfx.crash();
            this.chars.mayor('faint');
          }
        },
        end: () => {
          this.sfx.wind(false);
          this.windOn = false;
          crankBtn.classList.remove('pulled');
        },
      },
    );
    if (!res.ok) {
      this.queue({ dur: 0.3, end: () => this.showFail() });
      return;
    }
    // stood: deaths fade, everyone ages, the jack lifts, a new nursery floor
    this.queue(
      {
        dur: this.reduced ? 0.1 : 1.3,
        start: () => {
          this.view.endPlayback();
          this.view.markLeaving(r.departedIds.flat(), 'right');
          this.view.sync(r.towers);
          this.world.setJack(1);
          this.sfx.fade();
          this.refreshGhost();
          this.renderHud();
          const died = res.deaths.reduce((n, d) => n + total(d), 0);
          if (died && r.def.hints) this.toast(`עברו עשר שנים: כולם עלו קומה, ${died} קוביות נפרדו בשקט (תמותה)`, 3000);
        },
      },
      {
        dur: 0.2,
        end: () => {
          if (r.phase === 'won') this.showWin();
          else if (r.phase === 'failed') this.showFail();
          else {
            this.sfx.chime();
            this.decadeArrivals();
          }
        },
      },
    );
  }

  ringBell(): void {
    const r = this.run;
    if (!r || this.animating || r.def.goal !== 'exact') return;
    this.sfx.chime();
    if (r.ringBell()) this.showWin();
    else this.showFail();
  }

  private showFail(): void {
    const r = this.run!;
    const why = r.failReason!;
    this.sfx.oops();
    if (why !== 'collapse' && why !== 'empty-base') this.chars.mayor('faint');
    const titles: Record<string, string> = {
      collapse: 'המגדל קרס!',
      'empty-base': 'אין על מה לעמוד!',
      needs: 'אנשים בלי מענה!',
      overshoot: 'עברנו את היעד!',
      'wrong-call': r.def.goal === 'exact' ? 'עוד לא!' : 'הדגל לא מתאים למגדל',
    };
    let line = r.def.failHe?.[why] ?? '';
    if (!line) {
      if (why === 'needs') {
        const n = (r.lastCrank?.needs ?? r.needs()).filter((q) => q.have < q.needed);
        line = n.map((q) => `ל${GROUP_HE[q.group]} חסרים ${q.needed - q.have} ${SERVICE_HE[SERVICE_FOR[q.group]]} (כל ${CAPACITY[q.group]} צריכים אחד).`).join(' ');
      } else if (why === 'collapse') line = 'המגדל כבד מדי למעלה לעומת הבסיס. קורות ברצפת התינוקות מרחיבות את הבסיס, ומי שנכנס בצד הנכון מאזן את המגדל.';
      else if (why === 'empty-base') line = 'רצפת התינוקות ריקה ואין מי שיחזיק את המגדל. קורות יכולות לשמש בסיס.';
      else if (why === 'overshoot') line = `המטרה הייתה ${r.def.exactTarget} קוביות. ריבוי טבעי חיובי מגדיל את האוכלוסייה בכל עשור.`;
      else line = r.def.choice?.explainHe ?? '';
    }
    if (why === 'wrong-call' && r.def.choice && r.def.goal !== 'exact') line = r.def.choice.explainHe;
    const p = this.panel(`<h2>⚠️ ${titles[why] ?? 'אוי!'}</h2><p class="why">${line}</p><div class="btns"><button class="btn" id="retry">↺ נסו שוב מהעשור הקודם</button><button class="btn plain" id="menu">מפת השלבים</button></div>`, 'fail');
    p.querySelector<HTMLButtonElement>('#retry')!.onclick = () => this.retry();
    p.querySelector<HTMLButtonElement>('#menu')!.onclick = () => this.showSelect();
    this.renderHud();
  }

  retry(): void {
    const r = this.run;
    if (!r || r.phase !== 'failed') return;
    this.closePanel();
    this.seq = [];
    r.retry();
    this.view.endPlayback();
    this.view.clear();
    this.view.sync(r.towers, {}, true);
    this.world.setJack(r.towers.some((t) => t.rows[0].cells.length === 0) ? 1 : 0);
    this.chars.mayor('idle');
    this.renderHud();
    if (r.needsChoice()) this.showChoice();
    else this.toast('נסו שוב: אותו עשור, אותם אנשים');
  }

  private showWin(): void {
    const r = this.run!;
    this.sfx.cheer();
    this.chars.mayor('cheer');
    this.chars.cheer();
    const authored = this.levelIdx >= 0;
    if (authored) {
      const id = r.def.id;
      this.save.stars[id] = Math.max(this.save.stars[id] ?? 0, r.stars);
      this.writeSave();
      postToHost({ type: 'level-complete', level: id, stars: r.stars, durationMs: Math.max(1, Math.round(this.clock - this.levelOpenedAt)) });
    } else {
      this.save.endlessBest = Math.max(this.save.endlessBest, r.totalPopulation());
      this.writeSave();
    }
    const stars = [1, 2, 3].map((k) => `<span class="${k <= r.stars ? '' : 'off'}">⭐</span>`).join('');
    const notes = [r.nearCollapse ? 'המגדל התנדנד חזק (כמעט קרס)' : 'בלי התנודדות מסוכנת', r.mistakes || r.retries ? 'היו טעויות או ניסיונות חוזרים' : 'בלי טעויות'].join(' · ');
    const next = authored && this.levelIdx + 1 < this.levels.length;
    const p = this.panel(`<h2>🎉 המגדל הגיע ל־${ltr(r.year)}!</h2><div class="stars">${stars}</div><p>${notes}</p><div class="btns">${next ? '<button class="btn green" id="next">לשלב הבא ▶</button>' : ''}${!authored ? '<button class="btn green" id="again">מגדל חדש ▶</button>' : ''}<button class="btn plain" id="menu">מפת השלבים</button></div>`);
    p.querySelector<HTMLButtonElement>('#next')?.addEventListener('click', () => this.openLevel(this.levelIdx + 1));
    p.querySelector<HTMLButtonElement>('#again')?.addEventListener('click', () => {
      this.endlessSeed++;
      this.begin(this.endless!(this.endlessSeed));
    });
    p.querySelector<HTMLButtonElement>('#menu')!.onclick = () => this.showSelect();
    this.renderHud();
  }

  setPaused(p: boolean): void {
    this.paused = p;
    $('btn-pause').setAttribute('aria-pressed', String(p));
    $('btn-pause').textContent = p ? '▶' : '⏸';
    let veil = document.querySelector('.paused-veil');
    if (p && !veil && this.mode === 'play') {
      veil = document.createElement('div');
      veil.className = 'paused-veil';
      $('app').appendChild(veil);
      (veil as HTMLElement).onclick = () => this.setPaused(false);
      this.sfx.wind(false);
    } else if (!p) veil?.remove();
  }

  toggleMute(): void {
    this.sfx.setMuted(!this.sfx.muted);
    $('btn-mute').textContent = this.sfx.muted ? '🔇' : '🔊';
    try {
      localStorage.setItem('generation-stack:muted', this.sfx.muted ? '1' : '0');
    } catch {
      /* ignore */
    }
  }

  // ---------- leaves in the gust ----------
  private spawnLeaf(): void {
    const m = new THREE.Mesh(this.leafGeo, this.leafMat);
    m.position.set(-14 + Math.random() * 3, 1 + Math.random() * 8, -2 + Math.random() * 6);
    this.world.scene.add(m);
    this.leaves.push({ m, v: new THREE.Vector3(9 + Math.random() * 4, Math.random() - 0.3, 0), life: 3 });
  }
  private updateLeaves(dt: number): void {
    for (let i = this.leaves.length - 1; i >= 0; i--) {
      const l = this.leaves[i];
      l.life -= dt;
      l.m.position.addScaledVector(l.v, dt);
      l.m.rotation.x += dt * 5;
      l.m.rotation.y += dt * 3;
      if (l.life <= 0) {
        this.world.scene.remove(l.m);
        this.leaves.splice(i, 1);
      }
    }
  }

  // ---------- input ----------
  private bindUi(): void {
    $('btn-crank').onclick = () => this.crank();
    $('btn-bell').onclick = () => this.ringBell();
    $('btn-pause').onclick = () => this.setPaused(!this.paused);
    $('btn-mute').onclick = () => this.toggleMute();
    $('btn-menu').onclick = () => this.showSelect();
    $('btn-motion').onclick = () => {
      this.reduced = !this.reduced;
      this.view.reduced = this.reduced;
      $('btn-motion').setAttribute('aria-pressed', String(this.reduced));
      try {
        localStorage.setItem('generation-stack:reduced', this.reduced ? '1' : '0');
      } catch {
        /* ignore */
      }
      this.toast(this.reduced ? 'תנועה מופחתת: פועל' : 'תנועה מופחתת: כבוי');
    };
    $('btn-motion').setAttribute('aria-pressed', String(this.reduced));
    $('btn-mute').textContent = this.sfx.muted ? '🔇' : '🔊';
    const c = this.canvas;
    window.addEventListener('pointerdown', () => (this.interacted = true), { capture: true });
    c.addEventListener('pointerdown', (e) => {
      this.sfx.unlock();
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()];
        this.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: this.world.userZoom };
        this.dragFrom = null;
        return;
      }
      this.dragFrom = { x: e.clientX, y: e.clientY, yaw: this.world.yaw, pitch: this.world.pitch, moved: false, id: e.pointerId };
    });
    window.addEventListener('pointermove', (e) => {
      if (this.pointers.has(e.pointerId)) this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pinch && this.pointers.size === 2) {
        const [a, b] = [...this.pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        this.world.userZoom = Math.max(0.55, Math.min(1.6, (this.pinch.z * this.pinch.d) / Math.max(10, d)));
        return;
      }
      const d = this.dragFrom;
      if (!d || d.id !== e.pointerId) return;
      const dx = e.clientX - d.x;
      const dy = e.clientY - d.y;
      if (Math.hypot(dx, dy) > 8) d.moved = true;
      if (d.moved) {
        this.world.yaw = Math.max(-0.95, Math.min(0.95, d.yaw - dx * 0.005));
        this.world.pitch = Math.max(0.08, Math.min(0.75, d.pitch + dy * 0.004));
      }
    });
    const up = (e: PointerEvent) => {
      this.pointers.delete(e.pointerId);
      if (this.pointers.size < 2) this.pinch = null;
      // drop a dragged card onto the tower
      if (this.cardDrag && e.target === c) {
        this.cardDrag = null;
        this.pickAt(e.clientX, e.clientY);
        return;
      }
      this.cardDrag = null;
      const d = this.dragFrom;
      this.dragFrom = null;
      if (d && d.id === e.pointerId && !d.moved && e.target === c) this.pickAt(e.clientX, e.clientY);
    };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', (e) => {
      this.pointers.delete(e.pointerId);
      this.pinch = null;
      this.dragFrom = null;
    });
    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.world.userZoom = Math.max(0.55, Math.min(1.6, this.world.userZoom * (1 + Math.sign(e.deltaY) * 0.08)));
    }, { passive: false });
    window.addEventListener('keydown', (e) => this.key(e));
  }

  private pickAt(cx: number, cy: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((cx - rect.left) / rect.width) * 2 - 1, -((cy - rect.top) / rect.height) * 2 + 1);
    this.ray.setFromCamera(ndc, this.world.camera);
    const hits = this.ray.intersectObjects(this.view.pickables(), true);
    for (const h of hits) {
      let o: THREE.Object3D | null = h.object;
      while (o && !o.userData.door && !o.userData.row) o = o.parent;
      if (!o) continue;
      if (o.userData.door) {
        this.door(o.userData.door);
        return;
      }
      if (o.userData.row) {
        const row = o.userData.row as { tower: number; band: number; left: number; right: number };
        if (this.sel?.type === 'service') {
          this.floor(row.tower, row.band);
          return;
        }
        // tapping a floor's half with a piece selected = that door
        if (this.sel) {
          const local = this.view.group.worldToLocal(h.point.clone());
          const side: Side = local.x > (row.left + row.right) / 2 ? 'right' : 'left';
          const want = this.sel.type === 'beam' ? 0 : row.band;
          if (this.sel.type === 'beam' && row.band !== 0) continue;
          this.door({ tower: row.tower, band: want, side });
          return;
        }
      }
    }
  }

  private key(e: KeyboardEvent): void {
    if (this.mode !== 'play' || !this.run) return;
    const r = this.run;
    if (e.key === 'Escape' || e.key === 'p') return this.setPaused(!this.paused);
    if (e.key === 'm') return this.toggleMute();
    if (this.paused) return;
    if (r.phase === 'failed' && (e.key === 'r' || e.key === 'Enter')) return this.retry();
    if (!$('panel').hidden) {
      if (e.key === 'Enter') $('panel').querySelector<HTMLButtonElement>('button')?.click();
      return;
    }
    if (e.key === ' ' || e.key === 'c') {
      e.preventDefault();
      return this.crank();
    }
    if (e.key === 'b') return this.ringBell();
    const n = Number(e.key);
    if (n >= 1 && n <= 9) {
      const cards = [...document.querySelectorAll<HTMLButtonElement>('#tray button.card:not(:disabled)')];
      cards[n - 1]?.dispatchEvent(new PointerEvent('pointerdown'));
      return;
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      this.kbBand = Math.max(0, Math.min(BAND_COUNT - 1, this.kbBand + (e.key === 'ArrowUp' ? 1 : -1)));
      this.toast(`קומה ${BANDS[this.kbBand]}`, 900);
      e.preventDefault();
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      this.kbSide = e.key === 'ArrowLeft' ? 'left' : 'right';
      this.toast(this.kbSide === 'left' ? 'צד שמאל' : 'צד ימין', 900);
      e.preventDefault();
    }
    if (e.key === 'Enter') {
      if (this.sel?.type === 'service') this.floor(0, this.kbBand);
      else if (this.sel) this.door({ tower: this.sel.type === 'piece' ? r.tray.find((p) => p.id === (this.sel as { id: number }).id)?.tower ?? 0 : 0, band: this.sel.type === 'beam' ? 0 : this.kbBand, side: this.kbSide });
    }
  }

  postReady(): void {
    if (this.readyPosted) return;
    this.readyPosted = true;
    postToHost({ type: 'ready' });
  }

  // ---------- test hooks ----------
  textState(): string {
    const r = this.run;
    if (!r || this.mode !== 'play') return JSON.stringify({ mode: this.mode, stars: this.save.stars });
    const def = r.def;
    return JSON.stringify({
      mode: this.mode,
      level: { id: def.id, title: def.titleHe, world: def.world, goal: def.goal, endless: this.levelIdx < 0 },
      year: r.year,
      targetYear: r.targetYear,
      decade: r.decade,
      decades: def.decades,
      phase: r.phase,
      failReason: r.failReason,
      animating: this.animating,
      paused: this.paused,
      towers: r.towers.map((t, ti) => {
        const p = r.plan(ti);
        const c = counts(t);
        return {
          name: def.towers[ti].nameHe,
          bands: Object.fromEntries(BANDS.map((b, i) => [b, c[i]])),
          population: total(c),
          people: total(c) * def.peoplePerBlock,
          birthsPer1000: p.cbr,
          deathsPer1000: p.cdr,
          naturalIncrease: naturalIncrease(p.cbr, p.cdr),
          stage: p.stage ?? null,
          beams: t.rows[0].cells.filter((x) => x.kind === 'beam').length,
          rows: t.rows.map((row) => ({ leftX: row.leftX, width: row.cells.length, services: row.services.map((s) => s.service) })),
          stabilityMargin: Math.round(stability(t, def.wind).margin * 100) / 100,
        };
      }),
      needs: r.needs(),
      points: r.points,
      tray: r.tray.map((p) => ({ id: p.id, kind: p.kind, label: p.labelHe, count: p.count, tower: p.tower, band: def.migrantFloors === 'choose' ? '?' : BANDS[p.band] })),
      selected: this.sel,
      choice: def.choice ? { prompt: def.choice.promptHe, options: def.choice.options.map((o) => o.labelHe), made: r.choiceMade } : null,
      exactTarget: def.exactTarget ?? null,
      wind: def.wind,
      lastCrank: r.lastCrank ? { ok: r.lastCrank.ok, reason: r.lastCrank.reason ?? null, maxTiltDeg: Math.round((r.lastCrank.judge?.maxTiltDeg ?? 0) * 10) / 10 } : null,
      stars: r.stars,
      mistakes: r.mistakes,
      retries: r.retries,
      objective: def.goal === 'exact' ? `ring the bell at exactly ${def.exactTarget} blocks` : `reach ${r.targetYear} standing with every need met`,
      coords: 'x = cell columns (left negative), floors from the bottom (0 = 0–9)',
    });
  }

  /** Screen position of a door or floor, for real-input tests. */
  screenOf(tower: number, band: number, side: Side | 'mid'): { x: number; y: number } | null {
    const a = this.view.rowAnchor(tower, band, side === 'mid' ? 'right' : side);
    if (!a) return null;
    if (side === 'mid') {
      const t = this.run!.towers[tower];
      const row = t.rows[band];
      a.x = (t.baseX + row.leftX + (row.cells.length - 1) / 2);
    } else a.x += side === 'right' ? 0.5 : -0.5;
    a.y += BASE_Y;
    a.z += 0.2;
    const v = a.project(this.world.camera);
    const rect = this.canvas.getBoundingClientRect();
    return { x: rect.left + ((v.x + 1) / 2) * rect.width, y: rect.top + ((1 - v.y) / 2) * rect.height };
  }
}
