// The workbook bridge in a real embed: a localhost parent page with the game in an iframe at ?level=N.
// Checks `ready`, `level-start` for the deep-linked level and `level-complete` after a win played through
// the game's own input (tests/autoplay.js), and that a standalone page posts nothing.
// Needs the dev server on :5246.  Usage: node tests/host-embed.mjs [level]
import { chromium } from 'playwright';
import { createServer } from 'node:http';

const GAME = process.env.BASE ?? 'http://localhost:5246/';
const LEVEL = Number(process.argv[2] ?? 1);
const browser = await chromium.launch({ channel: 'chrome', args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
const parent = createServer((_, res) => {
  res.setHeader('content-type', 'text/html');
  res.end(`<body style="margin:0"><script>window.msgs=[];addEventListener('message',e=>msgs.push({origin:e.origin,...e.data}))</script><iframe id="g" src="${GAME}?level=${LEVEL}" style="width:100vw;height:100vh;border:0"></iframe></body>`);
}).listen(4998);
await page.goto('http://localhost:4998/');
const frame = await (await page.waitForSelector('#g')).contentFrame();
await frame.waitForFunction(() => window.__game && window.render_game_to_text, null, { timeout: 30000 });
await page.waitForFunction(() => window.msgs.some((m) => m.type === 'ready'), null, { timeout: 30000 });
const opened = JSON.parse(await frame.evaluate(() => window.render_game_to_text()));
await frame.addScriptTag({ url: GAME + 'tests/autoplay.js', type: 'module' });
await frame.waitForFunction(() => window.autoplayLevel);
const r = await frame.evaluate((n) => window.autoplayLevel(n), LEVEL);
await page.waitForTimeout(200);
const msgs = await page.evaluate(() => window.msgs);
console.log('opened on level', opened.level?.id, '| passed', r.result.passed, 'stars', r.result.stars, r.result.reason ?? '');
console.log(msgs.map((m) => `${m.type}${m.level ? ' L' + m.level : ''}${m.stars ? ' ★' + m.stars : ''}`).join(', '));
const ready = msgs.findIndex((m) => m.type === 'ready');
const start = msgs.findIndex((m) => m.type === 'level-start' && m.level === LEVEL);
const ok =
  msgs.every((m) => m.source === 'workbook-game' && m.slug === 'generation-stack' && m.version === 1) &&
  ready >= 0 && start > ready &&
  msgs.some((m) => m.type === 'level-complete' && m.level === LEVEL && m.stars >= 1 && m.durationMs > 0);
// standalone: no parent, nothing posted (no errors either)
const solo = await (await browser.newContext()).newPage();
const errs = [];
solo.on('pageerror', (e) => errs.push(String(e)));
await solo.addInitScript(() => {
  window.__posted = 0;
  const orig = window.postMessage.bind(window);
  window.parent.postMessage = (...a) => { window.__posted++; return orig(...a); };
});
await solo.goto(GAME + '?level=2');
await solo.waitForFunction(() => window.__game);
const posted = await solo.evaluate(() => window.__posted);
console.log('standalone posted', posted);
console.log(ok && !errs.length && posted === 0 ? 'bridge OK' : 'bridge FAILED', errs);
await browser.close();
parent.close();
process.exit(ok && !errs.length && posted === 0 ? 0 : 1);
