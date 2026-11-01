import '@fontsource/rubik/hebrew-400.css';
import '@fontsource/rubik/hebrew-500.css';
import '@fontsource/rubik/hebrew-700.css';
import '@fontsource/rubik/latin-400.css';
import '@fontsource/rubik/latin-500.css';
import '@fontsource/rubik/latin-700.css';
import './style.css';
import { App } from './game/app.ts';
import { initPhysics } from './physics/judge.ts';
import { initHost, parseLevelParam } from './host.ts';
import { LEVELS, endlessLevel } from './game/levelSource.ts';

declare global {
  interface Window {
    __game: App;
    render_game_to_text: () => string;
    advanceTime: (ms: number) => void;
  }
}

initHost('generation-stack');

async function boot(): Promise<void> {
  const canvas = document.getElementById('view') as HTMLCanvasElement;
  await initPhysics();
  const app = new App(canvas, LEVELS, endlessLevel);
  window.__game = app;
  window.render_game_to_text = () => app.textState();
  window.advanceTime = (ms: number) => app.advanceTime(ms);
  await app.world.loadModels('./models/');
  app.chars.rebuild();
  document.getElementById('loading')!.remove();
  const deep = parseLevelParam(location.search, LEVELS.length);
  app.start();
  if (deep !== null) app.openLevel(deep);
  else app.showTitle();
  // the first playable scene is drawn (models loaded) before `ready`; level-start was posted before ready
  // only if a deep link opened, so post ready first and re-announce the level after it
  app.drawOnce();
  app.postReady();
  if (deep !== null) app.announceLevel();
}

boot().catch((e) => {
  console.error(e);
  const el = document.getElementById('loading');
  if (el) el.textContent = 'משהו השתבש בטעינה. רעננו את הדף.';
});
