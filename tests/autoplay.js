// Loaded into the game page (dev server). Plays a level to a win through the game's own input:
// tray cards, canvas taps on doors and floors (raycast by the game), the crank and bell buttons.
// The plan comes from the solver; nothing writes the game state directly.
import { solve } from '/src/model/solver.ts';

const g = () => window.__game;
const step = (ms) => window.advanceTime(ms);

function tapCanvas(x, y) {
  const c = g().canvas;
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
  for (const a of plan.actions) {
    if (a.type === 'choice') {
      clickPanelButton(`.choices button[data-i="${a.option}"]`);
      settle();
    } else if (a.type === 'place') {
      if (!(app.sel && app.sel.type === 'piece' && app.sel.id === a.piece)) card(`[data-piece="${a.piece}"]`);
      const p = app.screenOf(app.run.tray.find((q) => q.id === a.piece).tower, a.band, a.side);
      tapCanvas(p.x, p.y);
      step(50);
    } else if (a.type === 'build') {
      if (a.kind === 'beam') {
        if (app.sel?.type !== 'beam') card('[data-beam]');
        const p = app.screenOf(a.tower, 0, a.side);
        tapCanvas(p.x, p.y);
      } else {
        if (!(app.sel?.type === 'service' && app.sel.kind === a.kind)) card(`[data-service="${a.kind}"]`);
        const p = app.screenOf(a.tower, a.band, 'mid');
        tapCanvas(p.x, p.y);
      }
      step(50);
    } else if (a.type === 'crank') {
      settle();
      document.getElementById('btn-crank').click();
      settle();
    } else if (a.type === 'bell') {
      settle();
      document.getElementById('btn-bell').click();
      settle();
    }
    log.push(`${a.type}:${app.run.phase}`);
    if (app.run.phase === 'failed') break;
  }
  return { result: { passed: app.run.phase === 'won', stars: app.run.stars, reason: app.run.failReason }, log, state: JSON.parse(window.render_game_to_text()) };
};
