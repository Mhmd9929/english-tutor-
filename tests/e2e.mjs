// End-to-end test of the app in a real (headless) Chromium phone viewport.
// The AI Worker, the microphone and the speech voice are simulated.
// Usage: node tests/e2e.mjs   (needs the "playwright" package + Chromium)
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
  try {
    const body = await readFile(join(ROOT, path));
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end('not found'); }
}).listen(0);
const BASE = `http://localhost:${server.address().port}/`;

// ------------------------------------------------------------ fake worker
const WORKER = 'https://worker.test';
const usage = {};
let chatQueue = [];
const chatRequests = [];

async function workerRoute(route) {
  const req = route.request();
  const url = new URL(req.url());
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' };
  if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
  if (req.headers()['x-family-code'] !== 'sunshine') return route.fulfill({ status: 401, headers: cors, body: '{"error":"bad_code"}' });
  if (url.pathname === '/usage') {
    return route.fulfill({ status: 200, headers: cors, body: JSON.stringify({ date: '2026-10-10', provider: 'gemini', limit: 60, familyLimit: 400, total: 3, profiles: usage }) });
  }
  const body = JSON.parse(req.postData());
  chatRequests.push(body);
  usage[body.profile.id] = (usage[body.profile.id] || 0) + 1;
  const next = chatQueue.shift() || { status: 200, body: { reply: 'That is great! What else do you like?', fixes: [] } };
  return route.fulfill({ status: next.status, headers: cors, body: JSON.stringify(next.body) });
}

// ------------------------------------------------------------ fake voice APIs
const fakeSpeech = () => {
  window.__spoken = [];
  window.__nextSpeech = 'I like dogs';
  if (!window.__noStt) {
    class FakeRecognition {
      start() {
        this._t = setTimeout(() => {
          const result = [{ transcript: window.__nextSpeech }];
          result.isFinal = true;
          this.onresult?.({ resultIndex: 0, results: [result] });
        }, 80);
      }
      stop() { setTimeout(() => this.onend?.(), 120); }
      abort() { clearTimeout(this._t); this.onend?.(); }
    }
    window.SpeechRecognition = FakeRecognition;
    window.webkitSpeechRecognition = FakeRecognition;
  } else {
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;
  }
  const synth = {
    speaking: false,
    getVoices: () => [
      { name: 'Google US English', lang: 'en-US', voiceURI: 'g-us' },
      { name: 'Daniel', lang: 'en-GB', voiceURI: 'daniel' },
      { name: 'Google UK English Female', lang: 'en-GB', voiceURI: 'g-uk-f' },
      { name: 'Karen', lang: 'en-AU', voiceURI: 'karen' },
      { name: 'Zarvox', lang: 'en-US', voiceURI: 'z' },
    ],
    speak(u) { if (u.text.trim()) window.__spoken.push({ text: u.text, rate: u.rate, voice: u.voice?.name, lang: u.lang }); setTimeout(() => u.onend?.(), 10); },
    cancel() {},
    addEventListener() {},
  };
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
  window.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
};

// ------------------------------------------------------------ helpers
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const errors = [];

async function newPage({ noStt = false, colorScheme = 'light' } = {}) {
  const ctx = await browser.newContext({ ...devices['iPhone 13'], colorScheme, serviceWorkers: 'block' });
  await ctx.route(`${WORKER}/**`, workerRoute);
  await ctx.route('**/config.js', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: `window.BUDDY_CONFIG = { workerUrl: "${WORKER}" };` }));
  if (noStt) await ctx.addInitScript(() => { window.__noStt = true; });
  await ctx.addInitScript(fakeSpeech);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  return page;
}

const shot = async (page, name) => { if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false }); };
async function holdMic(page, selector, text) {
  await page.evaluate((t) => { window.__nextSpeech = t; }, text);
  const box = await page.locator(selector).boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(500);
  await page.mouse.up();
}
const spoken = (page) => page.evaluate(() => window.__spoken.map((s) => s.text).join(' | '));

let passed = 0;
async function step(name, fn) {
  process.stdout.write(`• ${name} … `);
  await fn();
  passed++;
  console.log('ok');
}

// ============================================================ tests
const page = await newPage();
await page.goto(BASE);

await step('first run: welcome, family code, create profile', async () => {
  await page.waitForSelector('text=Hi! I\'m Buddy');
  await shot(page, '01-welcome');
  await page.click('text=Let\'s start!');
  await page.fill('input[name=code]', 'wrong');
  await page.click('text=Check code');
  await page.waitForSelector('text=The family code is not correct');
  await page.fill('input[name=code]', 'sunshine');
  await page.click('text=Check code');
  await page.waitForSelector('text=Who is learning?');
  await page.fill('input[name=name]', 'Mia');
  await page.click('.avatar-opt:nth-child(5)');
  await page.fill('input[name=age]', '7');
  await page.click('.seg label:has-text("Beginner")');
  await shot(page, '02-profile');
  await page.click('text=Create profile');
  await page.waitForSelector('text=What shall we practise today?');
  await page.waitForTimeout(1700); // splash fades
  await shot(page, '03-home');
  const st = await page.evaluate(() => window.__buddy.store.get());
  assert.equal(st.familyCode, 'sunshine');
  assert.equal(st.profiles[0].rate, 0.75, 'young child gets slow speech');
});

await step('free talk: greeting is shown and spoken, push-to-talk, correction', async () => {
  chatQueue.push({ status: 200, body: { reply: 'Hi Mia! 🐶 Do you like cats or dogs?', fixes: [] } });
  await page.click('.mode-card:has-text("Free Talk")');
  await page.click('.pick:has-text("Animals")');
  await page.waitForSelector('.msg.buddy >> text=Do you like cats or dogs?');
  assert.match(await spoken(page), /Do you like cats or dogs/);
  assert.equal(chatRequests.at(-1).mode, 'free');
  assert.equal(chatRequests.at(-1).topic, 'animals');
  assert.equal(chatRequests.at(-1).messages.length, 0);

  chatQueue.push({ status: 200, body: { reply: 'Almost! We say: "I like dogs." Why do you like dogs?', fixes: [{ wrong: 'I likes dogs', right: 'I like dogs' }] } });
  await holdMic(page, '#mic-btn', 'I likes dogs');
  await page.waitForSelector('.msg.user >> text=I likes dogs');
  await page.waitForSelector('.fix >> text=I like dogs');
  await page.waitForSelector('text=Why do you like dogs?');
  const last = chatRequests.at(-1);
  assert.deepEqual(last.messages.map((m) => m.role), ['assistant', 'user']);
  assert.equal(last.profile.name, 'Mia');
  assert.equal(Number(await page.textContent('#star-count')) >= 1, true);
  await shot(page, '04-chat');

  // replay button speaks again
  const before = (await page.evaluate(() => window.__spoken.length));
  await page.click('.msg.buddy .replay >> nth=0');
  assert.ok((await page.evaluate(() => window.__spoken.length)) > before);
});

await step('rate limit: friendly message, then one automatic retry', async () => {
  chatQueue.push({ status: 429, body: { error: 'rate_limited', retryAfter: 5 } });
  chatQueue.push({ status: 200, body: { reply: 'Sorry for the wait! Tell me about your pet.', fixes: [] } });
  await page.click('[data-action=input-text]');
  await page.fill('.composer input', 'Because they are fun');
  await page.press('.composer input', 'Enter');
  await page.waitForSelector('text=Buddy needs a short break, try again in a minute');
  await shot(page, '05-rate-limit');
  await page.waitForSelector('text=Tell me about your pet.', { timeout: 9000 });
  assert.equal(await page.locator('.notice').count(), 0);
});

await step('rate limit twice: shows Try again button', async () => {
  chatQueue.push({ status: 429, body: { error: 'rate_limited', retryAfter: 5 } });
  chatQueue.push({ status: 429, body: { error: 'rate_limited', retryAfter: 5 } });
  await page.fill('.composer input', 'I have a cat');
  await page.press('.composer input', 'Enter');
  await page.waitForSelector('.notice [data-action=retry]', { timeout: 12000 });
  chatQueue.push({ status: 200, body: { reply: 'A cat! What is its name?', fixes: [] } });
  await page.click('.notice [data-action=retry]');
  await page.waitForSelector('text=What is its name?');
});

await step('word of the day: words shown, using a word is counted', async () => {
  await page.click('.tabbar [data-tab=home]');
  await page.click('.mode-card:has-text("Word of the Day")');
  await page.waitForSelector('.word-card');
  assert.equal(await page.locator('.word-card').count(), 5);
  const word = (await page.textContent('.word-card b')).trim();
  await shot(page, '06-words');
  chatQueue.push({ status: 200, body: { reply: `Today's first word is ${word}. Can you make a sentence?`, fixes: [] } });
  await page.click('text=Practise with Buddy');
  await page.waitForSelector(`.words-bar`);
  assert.equal(chatRequests.at(-1).mode, 'words');
  assert.equal(chatRequests.at(-1).words.length, 5);
  await page.waitForSelector('text=Can you make a sentence?');
  await page.click('[data-action=input-text]').catch(() => {});
  await page.fill('.composer input', `My ${word} is very nice`);
  await page.press('.composer input', 'Enter');
  await page.waitForSelector(`.words-bar .chip.done`);
  const learned = await page.evaluate(() => { const s = window.__buddy.store; return s.progress(s.get().activeProfileId).words; });
  assert.deepEqual(learned, [word]);
});

await step('story time starts with a story request', async () => {
  chatQueue.push({ status: 200, body: { reply: 'Once upon a time, a little dog named Max found a red ball. Who found the ball?', fixes: [] } });
  await page.click('.tabbar [data-tab=home]');
  await page.click('.mode-card:has-text("Story Time")');
  await page.waitForSelector('text=Who found the ball?');
  assert.equal(chatRequests.at(-1).mode, 'story');
  assert.ok(chatRequests.at(-1).topic);
});

await step('pronunciation: compares speech and highlights differences', async () => {
  await page.click('.tabbar [data-tab=home]');
  await page.click('.mode-card:has-text("Pronunciation")');
  await page.waitForSelector('.sentence .target');
  await page.click('text=🔊 Listen');
  const target = await page.evaluate(() => window.__buddy.pron.sentence);
  assert.match(await spoken(page), new RegExp(target.replace(/[.?]/g, '')));
  const words = target.replace(/[.,!?]/g, '').split(' ');
  await holdMic(page, '#pron-mic', words.slice(0, -1).join(' ')); // miss the last word
  await page.waitForSelector('.result .score');
  assert.ok(await page.locator('.w.miss').count() >= 1);
  assert.ok(await page.locator('.w.ok').count() >= 1);
  await shot(page, '07-pron');
  await holdMic(page, '#pron-mic', target);
  await page.waitForSelector('.result .score >> text=100%');
});

await step('progress screen shows stats, badges, words and mistakes', async () => {
  await page.click('.tabbar [data-tab=progress]');
  await page.waitForSelector('text=Mia\'s progress');
  assert.ok(await page.locator('.badge.earned').count() >= 2);
  await page.waitForSelector('.mistakes >> text=I likes dogs → I like dogs');
  await shot(page, '08-progress');
});

await step('parents: create PIN, dashboard, transcripts, edit profile, lock', async () => {
  await page.click('.tabbar [data-tab=parents]');
  await page.fill('input[name=pin]', '1234');
  await page.fill('input[name=pin2]', '1234');
  await page.click('text=Save PIN');
  await page.waitForSelector('text=Connected');
  await page.waitForSelector('.profile-card >> text=Mia');
  const used = await page.textContent('.profile-card [data-usage]');
  assert.ok(Number(used) >= 5, `usage shown (${used})`);
  await shot(page, '09-parents');

  await page.click('text=📝 Conversations');
  await page.waitForSelector('.list-item');
  assert.ok(await page.locator('.list-item').count() >= 3);
  await page.click('.list-item >> text=Free Talk');
  await page.waitForSelector('.msg.user >> text=I likes dogs');
  await page.waitForSelector('.fix >> text=I like dogs');
  await page.click('text=← Back');
  await page.click('text=← Back');

  await page.click('.profile-card >> text=Edit');
  await page.fill('input[name=dailyLimit]', '20');
  await page.click('text=Save changes');
  await page.waitForSelector('text=used');
  assert.equal(await page.evaluate(() => window.__buddy.store.activeProfile().dailyLimit), 20);

  await page.click('text=Add family member');
  await page.fill('input[name=name]', 'Dad');
  await page.fill('input[name=age]', '41');
  await page.click('.seg label:has-text("Advanced")');
  await page.click('text=Create profile');
  await page.waitForSelector('.profile-card >> text=Dad');

  await page.click('text=🔒 Lock');
  await page.fill('input[name=pin]', '9999');
  await page.click('text=Unlock');
  await page.waitForSelector('text=Wrong PIN');
  await page.fill('input[name=pin]', '1234');
  await page.click('text=Unlock');
  await page.waitForSelector('text=Connected');

  // leaving the tab locks it again
  await page.click('.tabbar [data-tab=home]');
  await page.click('.tabbar [data-tab=parents]');
  await page.waitForSelector('text=Parents only');
});

await step('switch profile: Dad gets adult settings', async () => {
  await page.click('#profile-btn');
  await page.click('.profile-tile:has-text("Dad")');
  await page.waitForSelector('text=Dad!');
  chatQueue.push({ status: 200, body: { reply: 'Good evening! Welcome to the restaurant.', fixes: [] } });
  await page.click('.mode-card:has-text("Role Play")');
  await page.click('.pick:has-text("airport")');
  await page.waitForSelector('text=Welcome to the restaurant');
  const req = chatRequests.at(-1);
  assert.equal(req.profile.name, 'Dad');
  assert.equal(req.profile.level, 'Advanced');
  assert.equal(req.topic, 'airport');
  const rate = await page.evaluate(() => window.__spoken.at(-1).rate);
  assert.equal(rate, 0.95);
});

await step('daily limit message', async () => {
  chatQueue.push({ status: 429, body: { error: 'daily_limit', usage: { used: 60, limit: 60 } } });
  await page.click('[data-action=input-text]').catch(() => {});
  await page.fill('.composer input', 'A window seat please');
  await page.press('.composer input', 'Enter');
  await page.waitForSelector("text=That's all the talking for today");
});

await step('dark mode toggle', async () => {
  await page.click('#theme-btn');
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'dark');
  await page.click('.tabbar [data-tab=home]');
  await shot(page, '10-home-dark');
  await page.click('#theme-btn');
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), 'light');
});

await step('tutor & accent: pick Emma (British), choose a voice, prompt gets the tutor', async () => {
  await page.click('.tabbar [data-tab=home]');
  await page.click('.tutor-card');
  await page.waitForSelector('text=Choose your tutor');
  await page.click('.tutor-opt:has-text("Chloe") .preview');
  let last = await page.evaluate(() => window.__spoken.at(-1));
  assert.equal(last.voice, 'Karen', 'Australian preview uses an Australian voice');
  await page.click('.tutor-pick:has-text("Emma")');
  last = await page.evaluate(() => window.__spoken.at(-1));
  assert.equal(last.voice, 'Google UK English Female', 'Emma = British female voice');
  assert.equal(last.lang, 'en-GB');
  assert.equal(await page.locator('.tutor-opt.active >> text=Emma').count(), 1);
  // explicit voice choice wins
  await page.selectOption('select[data-input=voice]', 'daniel');
  last = await page.evaluate(() => window.__spoken.at(-1));
  assert.equal(last.voice, 'Daniel');
  assert.ok(await page.locator('optgroup[label*="British"]').count() === 1);
  assert.equal(await page.locator('option', { hasText: 'Zarvox' }).count(), 0, 'novelty voices hidden');
  await shot(page, '11-tutors');

  chatQueue.push({ status: 200, body: { reply: 'Hello Dad, lovely to meet you! Fancy a chat about holidays?', fixes: [] } });
  await page.click('text=← Back');
  await page.waitForSelector('.tutor-card >> text=Emma');
  await page.click('.mode-card:has-text("Free Talk")');
  await page.click('.pick:has-text("Travel")');
  await page.waitForSelector('text=Fancy a chat about holidays?');
  const req = chatRequests.at(-1);
  assert.equal(req.tutor.name, 'Emma');
  assert.equal(req.tutor.accent, 'gb');
  assert.equal(await page.evaluate(() => window.__spoken.at(-1).voice), 'Daniel');
  assert.equal(await page.locator('.msg.buddy .avatar >> text=👩‍🏫').count(), 1);
});

await step('no speech recognition: falls back to typing', async () => {
  const p2 = await newPage({ noStt: true });
  await p2.goto(BASE);
  await p2.evaluate(() => {
    localStorage.setItem('englishBuddy.v1', JSON.stringify({
      familyCode: 'sunshine', profiles: [{ id: 'p_x', name: 'Leo', avatar: '🦁', age: 30, level: 'Intermediate', rate: 0.95, dailyLimit: 60 }], activeProfileId: 'p_x',
    }));
  });
  await p2.reload();
  chatQueue.push({ status: 200, body: { reply: 'Hello Leo!', fixes: [] } });
  await p2.click('.mode-card:has-text("Free Talk")');
  await p2.click('.pick:has-text("Travel")');
  await p2.waitForSelector('text=Hello Leo!');
  assert.equal(await p2.locator('#mic-btn').count(), 0);
  await p2.waitForSelector('.composer input');
  await p2.waitForSelector('text=Voice input is not available');
  await p2.close();
});

await step('manifest, icons and service worker files exist', async () => {
  for (const f of ['manifest.webmanifest', 'sw.js', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'icons/splash-1179x2556.png']) {
    const r = await page.request.get(BASE + f);
    assert.equal(r.status(), 200, f);
  }
  const m = await (await page.request.get(`${BASE}manifest.webmanifest`)).json();
  assert.equal(m.display, 'standalone');
});

const relevant = errors.filter((e) => !/Failed to load resource.*(401|429)/.test(e));
assert.deepEqual(relevant, [], `browser errors:\n${relevant.join('\n')}`);
console.log(`\nAll ${passed} end-to-end checks passed.`);
await browser.close();
server.close();
