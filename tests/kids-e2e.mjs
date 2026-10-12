// End-to-end test of Buddy Learning (FS1, FS2, Year 1) in a headless Chromium phone.
// The AI Worker, microphone and voices are simulated. Activities are played with real taps,
// drags and finger tracing.
// Usage: node tests/kids-e2e.mjs   (needs the "playwright" package + Chromium)
import { chromium, devices } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import assert from 'node:assert/strict';

const ROOT = new URL('../web/', import.meta.url).pathname;
const SHOTS = process.env.SHOTS_DIR || '';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^\/+/, '') || 'index.html';
  try { const body = await readFile(join(ROOT, path)); res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' }); res.end(body); } catch { res.writeHead(404); res.end(); }
}).listen(0);
const BASE = `http://localhost:${server.address().port}/`;

// ------------------------------------------------------------ fake worker
const WORKER = 'https://worker.test';
const chatRequests = [];
let workerDown = false;
async function workerRoute(route) {
  const req = route.request();
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' };
  if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
  if (workerDown) return route.abort();
  if (req.headers()['x-family-code'] !== 'sunshine') return route.fulfill({ status: 401, headers: cors, body: '{"error":"bad_code"}' });
  const url = new URL(req.url());
  if (url.pathname === '/usage') return route.fulfill({ status: 200, headers: cors, body: '{"provider":"gemini","limit":60,"familyLimit":400,"total":0,"profiles":{}}' });
  const body = JSON.parse(req.postData());
  chatRequests.push(body);
  const reply = body.mode === 'cheer' ? 'Wow, you are a counting superstar!'
    : body.lang === 'ar' ? 'مَرْحَبًا! هَلْ تُحِبُّ الْقِطَط؟' : 'Hello! Do you like cats or dogs?';
  return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ reply, fixes: [] }) });
}

const fakeSpeech = () => {
  window.__buddyFast = true;
  window.__spoken = [];
  window.__sttLangs = [];
  window.__nextSpeech = 'I like cats';
  class FakeRecognition {
    start() { window.__sttLangs.push(this.lang); this._t = setTimeout(() => { const r = [{ transcript: window.__nextSpeech }]; r.isFinal = true; this.onresult?.({ resultIndex: 0, results: [r] }); }, 60); }
    stop() { setTimeout(() => this.onend?.(), 80); }
    abort() { clearTimeout(this._t); this.onend?.(); }
  }
  window.SpeechRecognition = FakeRecognition;
  window.webkitSpeechRecognition = FakeRecognition;
  const voices = [
    { name: 'Google US English', lang: 'en-US', voiceURI: 'g-us' },
    { name: 'Daniel', lang: 'en-GB', voiceURI: 'daniel' },
    { name: 'Maged', lang: 'ar-SA', voiceURI: 'maged' },
    { name: 'Laila', lang: 'ar-AE', voiceURI: 'laila' },
  ];
  Object.defineProperty(window, 'speechSynthesis', {
    configurable: true,
    value: {
      speaking: false, getVoices: () => voices, cancel() {}, addEventListener() {},
      speak(u) { if (u.text.trim()) window.__spoken.push({ text: u.text, lang: u.lang, voice: u.voice?.name, rate: u.rate }); setTimeout(() => u.onend?.(), 5); },
    },
  });
  window.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
};

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const errors = [];
const ctx = await browser.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' });
await ctx.route(`${WORKER}/**`, workerRoute);
await ctx.route('**/config.js', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: `window.BUDDY_CONFIG = { workerUrl: "${WORKER}" };` }));
await ctx.addInitScript(fakeSpeech);
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });

const shot = async (name) => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png` }); };
const spokenSince = (n) => page.evaluate((k) => window.__spoken.slice(k), n);
const spokenCount = () => page.evaluate(() => window.__spoken.length);
const q = () => page.evaluate(() => window.__buddy.activity?.question);
const screen = () => page.evaluate(() => window.__buddy.ui.screen);
const setLevel = (topic, level) => page.evaluate(([t, l]) => { const s = window.__buddy.store; s.topicStats(s.get().activeProfileId, t).level = l; s.save(); }, [topic, level]);
const startTopic = async (id) => { await page.evaluate((t) => window.__buddy.go('activity', { id: t }), id); await page.waitForSelector('.act-top'); };

async function finishActivity() {
  for (let i = 0; i < 12 && (await screen()) === 'activity'; i++) {
    const cur = await q();
    if (cur?.type === 'choice') await page.click(`.opt[data-opt="${cur.answer}"]`);
    else await page.evaluate(() => window.__buddy.activity.answerNow());
    await page.waitForTimeout(120);
  }
  await page.waitForSelector('.result');
}

let passed = 0;
async function step(name, fn) { process.stdout.write(`• ${name} … `); await fn(); passed++; console.log('ok'); }

// ============================================================ tests
await page.goto(BASE);

await step('first run: create an FS1 child (no age needed)', async () => {
  await page.click("text=Let's start!");
  await page.fill('input[name=code]', 'sunshine');
  await page.click('text=Check code');
  await page.waitForSelector('text=Who is learning?');
  await page.click('.seg.years label:has-text("FS1")');
  assert.equal(await page.locator('input[name=age]').isVisible(), false, 'age hidden for young children');
  await page.fill('input[name=name]', 'Layla');
  await page.click('text=Create profile');
  await page.waitForSelector('.subject-grid');
  assert.equal(await page.locator('.subject-tile').count(), 4);
  assert.equal(await page.locator('.talk-tile').count(), 1);
  await page.waitForTimeout(800);
  const said = (await spokenSince(0)).map((s) => s.text).join(' ');
  assert.match(said, /Hi Layla/, 'home greeting is spoken');
  const p = await page.evaluate(() => window.__buddy.store.activeProfile());
  assert.equal(p.year, 'FS1');
  assert.equal(p.minutes, 20, 'default screen time 20 minutes');
  await page.waitForTimeout(900);
  await shot('k01-home');
});

await step('maths FS1: spoken question, tap-to-count, "Let\'s try again" + hint, glow, celebrate', async () => {
  await page.click('[data-action="kid-subject"][data-id="maths"]');
  await page.waitForSelector('.topic-tile');
  assert.match((await spokenSince(0)).map((s) => s.text).join(' '), /Maths! Choose a game/);
  const before = await spokenCount();
  await page.click('.topic-tile:has-text("Count to 5")');
  await page.waitForSelector('.act-options');
  const cur = await q();
  assert.match((await spokenSince(before)).map((s) => s.text).join(' '), /How many/, 'question spoken automatically');
  // hear again
  const n0 = await spokenCount();
  await page.click('.hear-again');
  assert.ok((await spokenCount()) > n0, 'hear again speaks');
  // tap to count
  const n1 = await spokenCount();
  await page.locator('.g-item.countable').first().click();
  assert.equal((await spokenSince(n1))[0].text, 'one');
  // wrong answer twice
  const wrongIds = cur.options.map((o) => o.id).filter((id) => id !== cur.answer);
  const n2 = await spokenCount();
  await page.click(`.opt[data-opt="${wrongIds[0]}"]`);
  const again = (await spokenSince(n2)).map((s) => s.text).join(' ');
  assert.match(again, /try again|Nearly|another go/i);
  assert.match(again, /count together/i, 'hint is given');
  assert.equal(await page.locator('text=/wrong/i').count(), 0, 'never says wrong');
  await page.click(`.opt[data-opt="${wrongIds[1] || wrongIds[0]}"]`);
  await page.waitForSelector(`.opt.glow[data-opt="${cur.answer}"]`);
  await shot('k02-try-again');
  await page.click(`.opt[data-opt="${cur.answer}"]`);
  await page.waitForFunction(() => window.__buddy.activity.index === 1);
  await finishActivity();
  await page.waitForTimeout(400);
  await shot('k03-result');
  const res = await page.evaluate(() => { const s = window.__buddy.store; return s.topicStats(s.get().activeProfileId, 'm-count5'); });
  assert.equal(res.plays, 1);
  assert.equal(res.correct, 3, 'first question was not first-try');
  assert.equal(await page.locator('.result-stars span.on').count(), 2, '3 of 4 first try = 2 stars');
  assert.equal(await page.locator('.sticker-reveal .sticker').count(), 1);
});

await step('AI cheer after a game (optional) uses the cheer mode', async () => {
  await page.waitForSelector('#cheer-line:has-text("superstar")', { timeout: 4000 });
  const req = chatRequests.find((r) => r.mode === 'cheer');
  assert.equal(req.activity.topic, 'Count to 5');
  assert.equal(req.profile.year, 'FS1');
});

await step('adaptive level: a perfect game moves the topic up a level', async () => {
  await page.click('[data-action="kid-topic"]');
  await page.waitForSelector('.act-options');
  await finishActivity();
  const res = await page.evaluate(() => { const s = window.__buddy.store; return s.topicStats(s.get().activeProfileId, 'm-count5'); });
  assert.equal(res.level, 2);
  assert.equal(await page.locator('.result-stars span.on').count(), 3);
});

await step('science: drag-and-drop sorting (real pointer drags)', async () => {
  await setLevel('s-daynight', 3);
  await startTopic('s-daynight');
  const cur = await q();
  assert.equal(cur.type, 'sort');
  const dragTo = async (itemId, binId) => {
    const a = await page.locator(`.sort-item[data-item="${itemId}"]`).boundingBox();
    const b = await page.locator(`.bin[data-bin="${binId}"]`).boundingBox();
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(a.x + a.width / 2 + 20, a.y + a.height / 2 - 20, { steps: 3 });
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
    await page.mouse.up();
  };
  const first = cur.items[0];
  const wrongBin = cur.bins.find((b) => b.id !== first.bin).id;
  const n = await spokenCount();
  await dragTo(first.id, wrongBin);
  assert.match((await spokenSince(n)).map((s) => s.text).join(' '), /try again|Nearly|another go/i);
  assert.equal(await page.locator('.sort-pool .sort-item').count(), cur.items.length, 'item went back');
  await shot('k04-sort');
  for (const it of cur.items) await dragTo(it.id, it.bin);
  await page.waitForFunction(() => window.__buddy.activity.index === 1);
  // tap-then-tap also works
  const cur2 = await q();
  if (cur2.type === 'sort') {
    for (const it of cur2.items) { await page.click(`.sort-item[data-item="${it.id}"]`); await page.click(`.bin[data-bin="${it.bin}"]`); }
    await page.waitForFunction(() => window.__buddy.activity.index === 2);
  }
  await page.click('.act-exit');
  await page.waitForSelector('.topic-tile');
});

await step('Arabic: right-to-left, Arabic voice, English helper (and turning the helper off)', async () => {
  await page.evaluate(() => window.__buddy.go('subject', { id: 'arabic', intro: true }));
  await page.waitForSelector('.subject.rtl');
  const n = await spokenCount();
  await startTopic('a-family');
  assert.equal(await page.locator('section.activity').getAttribute('dir'), 'rtl');
  await page.waitForTimeout(100);
  const said = await spokenSince(n);
  const arPart = said.find((s) => /[؀-ۿ]/.test(s.text));
  assert.ok(arPart, 'Arabic is spoken');
  assert.equal(arPart.voice, 'Laila', 'prefers the UAE Arabic voice');
  assert.ok(said.some((s) => /Where is the/.test(s.text) && s.lang.startsWith('en')), 'English helper spoken');
  await shot('k05-arabic');
  await page.evaluate(() => { const s = window.__buddy.store; s.updateProfile(s.get().activeProfileId, { arHelper: false }); });
  const n2 = await spokenCount();
  await page.click('.hear-again');
  const said2 = await spokenSince(n2);
  assert.ok(said2.length && said2.every((s) => /[؀-ۿ]/.test(s.text)), 'only Arabic when the helper is off');
  await page.evaluate(() => { const s = window.__buddy.store; s.updateProfile(s.get().activeProfileId, { arHelper: true }); });
  await page.click('.act-exit');
});

await step('Talk to Buddy: kids mode in English and Arabic (mic language switches too)', async () => {
  await page.click('.tabbar [data-tab=talk]');
  await page.waitForSelector('text=Do you like cats or dogs?');
  let req = chatRequests.at(-1);
  assert.equal(req.mode, 'kids');
  assert.equal(req.lang, 'en');
  assert.equal(req.profile.year, 'FS1');
  await page.click('[data-action="chat-lang"][data-lang="ar"]');
  await page.waitForSelector('text=مَرْحَبًا');
  req = chatRequests.at(-1);
  assert.equal(req.lang, 'ar');
  assert.equal((await page.evaluate(() => window.__spoken.at(-1))).voice, 'Laila');
  const box = await page.locator('#mic-btn').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down(); await page.waitForTimeout(450); await page.mouse.up();
  await page.waitForFunction(() => window.__sttLangs.length > 0);
  assert.equal(await page.evaluate(() => window.__sttLangs.at(-1)), 'ar-AE');
  await shot('k06-talk');
  await page.click('.tabbar [data-tab=home]');
});

await step('stickers page shows earned stickers', async () => {
  await page.click('.tabbar [data-tab=progress]');
  await page.waitForSelector('.sticker-book');
  assert.equal(await page.locator('.sticker-slot.got').count(), 2);
});

await step('parent area: PIN, child progress, weekly summary chart, settings (subjects, year group, time)', async () => {
  await page.click('.tabbar [data-tab=parents]');
  await page.fill('input[name=pin]', '2468');
  await page.fill('input[name=pin2]', '2468');
  await page.click('text=Save PIN');
  await page.waitForSelector('.kid-card');
  assert.match(await page.textContent('.kid-card'), /Foundation Stage 1/);
  assert.match(await page.textContent('.kid-card'), /Strengths:.*Count to 5/s);
  await page.click('text=📊 Weekly summary');
  await page.waitForSelector('.weekly .chart');
  assert.equal(await page.locator('.weekly .chart').first().locator('.bar-g').count(), 7);
  assert.ok(await page.locator('.weekly table').count() >= 1);
  await shot('k07-weekly');
  await page.click('text=← Back');
  await page.click('.kid-card >> text=⚙️ Settings');
  await page.uncheck('input[name="subj-science"]');
  await page.fill('input[name=minutes]', '5');
  await page.click('.seg.years label:has-text("Year 1")');
  await shot('k08-settings');
  await page.click('text=Save changes');
  const p = await page.evaluate(() => window.__buddy.store.activeProfile());
  assert.equal(p.year, 'Y1');
  assert.equal(p.minutes, 5);
  assert.equal(p.subjects.science, false);
  await page.click('.tabbar [data-tab=home]');
  await page.waitForSelector('.subject-grid');
  assert.equal(await page.locator('.subject-tile').count(), 3, 'science hidden');
});

await step('Year 1: build a sentence by tapping words (wrong order first)', async () => {
  await startTopic('e-build');
  const cur = await q();
  assert.equal(cur.type, 'order');
  const rev = [...cur.answer].reverse();
  for (const id of rev) await page.click(`.order-pool .tile[data-tile="${id}"]`);
  await page.waitForTimeout(800);
  assert.equal(await page.locator('.order-slots .tile').count() <= 1, true, 'tiles came back');
  // clear the helper tile if it was placed, then tap in the right order
  for (const t of await page.locator('.order-slots .tile').all()) await t.click();
  const textOf = (id) => cur.tiles.find((t) => t.id === id).html.replace(/<[^>]+>/g, '');
  for (const id of cur.answer) {
    const want = textOf(id);
    await page.locator('.order-pool .tile', { hasText: new RegExp(`^${want.replace(/[.?]/g, '\\$&')}$`) }).first().click();
  }
  await page.waitForFunction(() => window.__buddy.activity.index === 1);
  await page.click('.act-exit');
});

async function traceGlyph() {
  const cur = await q();
  assert.equal(cur.type, 'trace');
  // find the letter's pixels the same way the app does, then colour them in row by row
  const runs = await page.evaluate(() => {
    const canvas = document.querySelector('.trace-canvas');
    const size = parseFloat(canvas.style.width);
    const qq = window.__buddy.activity.question;
    const c = document.createElement('canvas'); c.width = size; c.height = size;
    const x = c.getContext('2d');
    const font = qq.lang === 'ar' ? '"Noto Naskh Arabic", "Geeza Pro", "Arial", sans-serif' : '"Andika", "Comic Sans MS", "Century Gothic", "Nunito", sans-serif';
    x.font = `700 ${Math.round(size * (qq.glyph.length > 1 ? 0.5 : 0.68))}px ${font}`;
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.direction = qq.lang === 'ar' ? 'rtl' : 'ltr';
    x.fillText(qq.glyph, size / 2, size / 2 + (qq.lang === 'ar' ? -size * 0.04 : size * 0.02));
    const d = x.getImageData(0, 0, size, size).data;
    const out = [];
    for (let y = 0; y < size; y += 8) {
      let start = -1;
      for (let i = 0; i <= size; i++) {
        const on = i < size && d[(y * size + i) * 4 + 3] > 100;
        if (on && start < 0) start = i;
        if (!on && start >= 0) { out.push([start, i - 1, y]); start = -1; }
      }
    }
    return out;
  });
  const box = await page.locator('.trace-canvas').boundingBox();
  for (const [x1, x2, y] of runs) {
    if (await screen() !== 'activity' || (await page.evaluate(() => window.__buddy.activity.index)) > 0) break;
    await page.mouse.move(box.x + x1, box.y + y);
    await page.mouse.down();
    await page.mouse.move(box.x + Math.max(x1 + 1, x2), box.y + y, { steps: 2 });
    await page.mouse.up();
  }
  await page.waitForFunction(() => window.__buddy.activity.index === 1, null, { timeout: 5000 });
}

await step('letter tracing with a finger (English and Arabic)', async () => {
  await startTopic('e-trace');
  await page.waitForTimeout(100);
  await shot('k09-trace');
  await traceGlyph();
  await page.click('.act-exit');
  await startTopic('a-trace');
  await traceGlyph();
  await page.click('.act-exit');
});

await step('activities work offline (no Worker needed)', async () => {
  workerDown = true;
  await startTopic('m-time');
  await finishActivity();
  workerDown = false;
});

await step('screen-time limit: "Time to rest!", parent PIN adds 10 minutes', async () => {
  await page.evaluate(() => { const s = window.__buddy.store; s.addSeconds(s.get().activeProfileId, 5 * 60); });
  await page.evaluate(() => window.__buddy.go('home'));
  await page.waitForSelector('text=Time to rest!');
  assert.equal(await page.locator('.tabbar').isVisible(), false);
  await shot('k10-rest');
  await page.evaluate(() => window.__buddy.go('subject', { id: 'english' }));
  assert.equal(await screen(), 'rest', 'games blocked');
  await page.click('summary:has-text("Grown-ups")');
  await page.fill('form[data-form=rest-pin] input[name=pin]', '1111');
  await page.click('text=Add 10 minutes');
  await page.waitForSelector('text=Wrong PIN');
  await page.fill('form[data-form=rest-pin] input[name=pin]', '2468');
  await page.click('text=Add 10 minutes');
  await page.waitForSelector('.subject-grid');
});

await step('every subject and year group: play one full game per topic', async () => {
  for (const year of ['FS1', 'FS2', 'Y1']) {
    await page.evaluate((y) => { const s = window.__buddy.store; s.updateProfile(s.get().activeProfileId, { year: y, minutes: 600, subjects: { english: true, maths: true, science: true, arabic: true, talk: true } }); }, year);
    const topics = await page.evaluate(async (y) => {
      const core = await import('./js/learn/core.js');
      return core.TOPICS.filter((t) => t.years.includes(y)).map((t) => t.id);
    }, year);
    for (const id of topics) {
      await startTopic(id);
      await finishActivity();
    }
  }
  const played = await page.evaluate(() => Object.keys(window.__buddy.store.learn(window.__buddy.store.get().activeProfileId).topics).length);
  assert.ok(played >= 60, `played ${played} topics`);
});

const relevant = errors.filter((e) => !/Failed to load resource|net::ERR_FAILED/.test(e));
assert.deepEqual(relevant, [], `browser errors:\n${relevant.join('\n')}`);
console.log(`\nAll ${passed} Buddy Learning checks passed.`);
await browser.close();
server.close();
