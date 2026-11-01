// Loaded into the game page (dev server). Plays a level to a win through the game's own input:
// tray cards, canvas taps on doors and floors (raycast by the game), the crank and bell buttons.
// The plan comes from the solver; nothing writes the game state directly.
import { solve } from '/src/model/solver.ts';

const g = () => window.__game;
const step = (ms) => window.advanceTime(ms);

function tapCanvas(x, y) {
  const c = g().canvas;
  // tap what a finger would hit, so a HUD element covering the tower fails the run
  const hit = document.elementFromPoint(x, y);
  if (hit !== c) throw new Error(`tap at ${Math.round(x)},${Math.round(y)} blocked by ${hit?.id || hit?.className || hit?.tagName}`);
  const o = { bubbles: true, clientX: x, clientY: y, pointerId: 1, isPrimary: true };
  c.dispatchEvent(new PointerEvent('pointerdown', o));
  c.dispatchEvent(new PointerEvent('pointerup', o));
}
function card(selector) {
  const el = document.querySelector(selector);
  if (!el) throw new Error('no card ' + selector);
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
}
function settle(max = 15000) {
  let t = 0;
  while (g().animating && t < max) {
    step(100);
    t += 100;
  }
  step(100);
}
function clickPanelButton(sel) {
  const b = document.querySelector('#panel:not([hidden]) ' + sel);
  if (b) b.click();
  return !!b;
}

window.autoplayLevel = (levelNumber) => {
  const app = g();
  const idx = app.levels.findIndex((l) => l.id === levelNumber);
  if (app.mode !== 'play' || app.run?.def.id !== levelNumber) app.openLevel(idx);
  clickPanelButton('#go');
  settle();
  const plan = solve(app.levels[idx]);
  const log = [];
  let stackSkips = 0;
  // the mayor's question waits for the first crank, so remember the answer until it opens
  let pending = null;
  const answer = () => {
    if (pending !== null && clickPanelButton(`.choices button[data-i="${pending}"]`)) {
      pending = null;
      settle();
    }
  };
  for (const a of plan.actions) {
    if (a.type === 'choice') {
      pending = a.option;
      answer();
    } else if (a.type === 'place') {
      // identical bundles share one stacked card; tapping it picks its top bundle
      if (!(app.sel && app.sel.type === 'piece' && app.sel.id === a.piece)) card(`#tray [data-pieces~="${a.piece}"]`);
      if (app.sel?.id !== a.piece) {
        stackSkips++;
        app.select({ type: 'piece', id: a.piece });
      }
      const p = app.screenOf(app.run.tray.find((q) => q.id === a.piece).tower, a.band, a.side);
      tapCanvas(p.x, p.y);
      step(50);
    } else if (a.type === 'build') {
      if (a.kind === 'beam') {
        if (app.sel?.type !== 'beam') card('[data-beam]');
        const p = app.screenOf(a.tower, 0, a.side);
        tapCanvas(p.x, p.y);
      } else {
        // one tap on a service card docks it where its age group is missing it
        card(`#tray [data-service="${a.kind}"]`);
      }
      step(50);
    } else if (a.type === 'crank') {
      settle();
      document.getElementById('btn-crank').click();
      settle();
      answer();
    } else if (a.type === 'bell') {
      settle();
      document.getElementById('btn-bell').click();
      settle();
      answer();
    }
    log.push(`${a.type}:${app.run.phase}`);
    if (app.run.phase === 'failed') break;
  }
  return { result: { passed: app.run.phase === 'won', stars: app.run.stars, reason: app.run.failReason }, stackSkips, log, state: JSON.parse(window.render_game_to_text()) };
};
