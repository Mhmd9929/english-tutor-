// Run with: npm test   (inside the worker folder)
// Exercises the Worker with fake AI providers - no network or API keys needed.
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import worker, { Limiter, postProcess, prepareMessages } from '../src/index.js';
import { STATIC_PROMPT, buildDynamicPrompt } from '../src/prompt.js';

const ORIGIN = 'https://family.github.io';

function makeEnv(overrides = {}) {
  const store = new Map();
  const storage = {
    get: async (k) => structuredClone(store.get(k)),
    put: async (k, v) => { store.set(k, structuredClone(v)); },
    list: async ({ prefix }) => new Map([...store].filter(([k]) => k.startsWith(prefix))),
    delete: async (keys) => { for (const k of [].concat(keys)) store.delete(k); },
  };
  const instance = new Limiter({ storage }, {});
  return {
    AI_PROVIDER: 'gemini',
    GEMINI_API_KEY: 'test-gemini',
    GEMINI_MODEL: 'gemini-flash-lite-latest',
    FAMILY_CODE: 'sunshine42',
    ALLOWED_ORIGIN: ORIGIN,
    DAILY_LIMIT: '60',
    FAMILY_DAILY_LIMIT: '400',
    LIMITER: {
      idFromName: () => 'family',
      get: () => ({ fetch: (url, init) => instance.fetch(new Request(url, init)) }),
    },
    ...overrides,
  };
}

const realFetch = globalThis.fetch;
let calls;
function mockFetch(handler) {
  calls = [];
  globalThis.fetch = async (url, init) => {
    const u = typeof url === 'string' ? url : url.url;
    const body = init?.body ? JSON.parse(init.body) : undefined;
    calls.push({ url: u, body, headers: init?.headers });
    return handler(u, body, calls.length);
  };
}
const geminiOk = (text) => Response.json({ candidates: [{ content: { parts: [{ text }] }, finishReason: 'STOP' }] });

beforeEach(() => mockFetch(() => geminiOk('Hello Mia! Do you like cats or dogs?')));
afterEach(() => { globalThis.fetch = realFetch; });

function chatRequest(body, { code = 'sunshine42', origin = ORIGIN } = {}) {
  return new Request('https://worker.example/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'X-Family-Code': code, Origin: origin, 'CF-Connecting-IP': '1.2.3.4' },
    body: JSON.stringify({
      profile: { id: 'p_mia', name: 'Mia', age: 7, level: 'Beginner' },
      mode: 'free', topic: 'animals', tz: 'Europe/London', messages: [], ...body,
    }),
  });
}

test('health endpoint works without a code', async () => {
  const res = await worker.fetch(new Request('https://worker.example/health'), makeEnv());
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.provider, 'gemini');
  assert.equal(data.familyCodeSet, true);
});

test('chat: happy path with Gemini, system prompt and history', async () => {
  const env = makeEnv();
  const res = await worker.fetch(chatRequest({}), env);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), ORIGIN);
  const data = await res.json();
  assert.equal(data.reply, 'Hello Mia! Do you like cats or dogs?');
  assert.deepEqual(data.usage, { used: 1, limit: 60 });

  const call = calls[0];
  assert.match(call.url, /gemini-flash-lite-latest:generateContent$/);
  assert.equal(call.headers['x-goog-api-key'], 'test-gemini');
  assert.match(call.body.systemInstruction.parts[0].text, /You are "Buddy"/);
  assert.match(call.body.systemInstruction.parts[0].text, /First name: Mia/);
  assert.equal(call.body.generationConfig.maxOutputTokens, 250);
  assert.equal(call.body.contents[0].role, 'user'); // synthetic session start
});

test('chat: wrong family code is rejected', async () => {
  const res = await worker.fetch(chatRequest({}, { code: 'nope' }), makeEnv());
  assert.equal(res.status, 401);
  assert.equal((await res.json()).error, 'bad_code');
});

test('chat: too many wrong codes locks the IP', async () => {
  const env = makeEnv();
  for (let i = 0; i < 10; i++) await worker.fetch(chatRequest({}, { code: 'x' + i }), env);
  const res = await worker.fetch(chatRequest({}), env);
  assert.equal(res.status, 429);
  assert.equal((await res.json()).error, 'locked');
});

test('chat: other websites are blocked (CORS)', async () => {
  const res = await worker.fetch(chatRequest({}, { origin: 'https://evil.example' }), makeEnv());
  assert.equal(res.status, 403);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), null);
  const pre = await worker.fetch(new Request('https://worker.example/chat', { method: 'OPTIONS', headers: { Origin: ORIGIN } }), makeEnv());
  assert.equal(pre.status, 204);
  assert.equal(pre.headers.get('Access-Control-Allow-Origin'), ORIGIN);
});

test('chat: provider rate limit becomes a friendly 429 and is refunded', async () => {
  const env = makeEnv();
  mockFetch(() => new Response(JSON.stringify({ error: { details: [{ retryDelay: '17s' }] } }).replace('{"retryDelay":"17s"}', '{"retryDelay": "17s"}'), { status: 429 }));
  const res = await worker.fetch(chatRequest({}), env);
  assert.equal(res.status, 429);
  const data = await res.json();
  assert.equal(data.error, 'rate_limited');
  assert.equal(data.retryAfter, 17);

  mockFetch(() => geminiOk('Hi again!'));
  const ok = await (await worker.fetch(chatRequest({}), env)).json();
  assert.equal(ok.usage.used, 1, 'failed attempt should not count');
});

test('chat: daily limit per profile (and lower parent limit)', async () => {
  const env = makeEnv({ DAILY_LIMIT: '3' });
  const statuses = [];
  for (let i = 0; i < 4; i++) {
    // different IP buckets don't matter; profile rate is 8/min so 4 is fine
    statuses.push((await worker.fetch(chatRequest({}), env)).status);
  }
  assert.deepEqual(statuses, [200, 200, 200, 429]);
  const res = await worker.fetch(chatRequest({ profile: { id: 'p_dad', name: 'Sam', age: 40, level: 'Advanced' }, dailyLimit: 1 }), env);
  assert.equal(res.status, 200);
  const res2 = await worker.fetch(chatRequest({ profile: { id: 'p_dad', name: 'Sam', age: 40, level: 'Advanced' }, dailyLimit: 1 }), env);
  assert.equal((await res2.json()).error, 'daily_limit');
});

test('chat: burst rate limiting per profile', async () => {
  const env = makeEnv();
  let last;
  for (let i = 0; i < 9; i++) last = await worker.fetch(chatRequest({}), env);
  assert.equal(last.status, 429);
  assert.equal((await last.json()).error, 'rate_limited');
});

test('usage endpoint reports counts', async () => {
  const env = makeEnv();
  await worker.fetch(chatRequest({}), env);
  const res = await worker.fetch(new Request('https://worker.example/usage?tz=Europe/London', {
    headers: { 'X-Family-Code': 'sunshine42', Origin: ORIGIN },
  }), env);
  const data = await res.json();
  assert.equal(data.profiles.p_mia, 1);
  assert.equal(data.limit, 60);
});

test('Gemini: retries without thinking config when rejected, then falls back model on 404', async () => {
  const env = makeEnv();
  mockFetch((url, body, n) => {
    if (n === 1) return new Response('{"error":{"message":"thinking_budget is not supported"}}', { status: 400 });
    return geminiOk('Works!');
  });
  const data = await (await worker.fetch(chatRequest({}), env)).json();
  assert.equal(data.reply, 'Works!');
  assert.equal(calls[1].body.generationConfig.thinkingConfig, undefined);

  mockFetch((url) => (url.includes('flash-lite') ? new Response('not found', { status: 404 }) : geminiOk('Fallback!')));
  const data2 = await (await worker.fetch(chatRequest({ profile: { id: 'p2', name: 'Bo', age: 9 } }), env)).json();
  assert.equal(data2.reply, 'Fallback!');
  assert.match(calls.at(-1).url, /gemini-flash-latest/);
});

test('Gemini: safety block returns a gentle redirect', async () => {
  mockFetch(() => Response.json({ promptFeedback: { blockReason: 'SAFETY' } }));
  const data = await (await worker.fetch(chatRequest({}), makeEnv())).json();
  assert.match(data.reply, /something else/);
});

test('Claude provider: model, prompt caching, history', async () => {
  const env = makeEnv({ AI_PROVIDER: 'claude', ANTHROPIC_API_KEY: 'sk-test' });
  mockFetch((url, body) => Response.json({
    id: 'msg_1', type: 'message', role: 'assistant', model: body.model, stop_reason: 'end_turn',
    content: [{ type: 'text', text: 'Almost! We say: "I went home." Where did you go next?\n[fix: I goed home => I went home]' }],
    usage: { input_tokens: 10, output_tokens: 10 },
  }));
  const res = await worker.fetch(chatRequest({
    messages: [{ role: 'assistant', content: 'Hi Mia! What did you do today?' }, { role: 'user', content: 'I goed home' }],
  }), env);
  const data = await res.json();
  assert.equal(res.status, 200, JSON.stringify(data));
  assert.equal(data.reply, 'Almost! We say: "I went home." Where did you go next?');
  assert.deepEqual(data.fixes, [{ wrong: 'I goed home', right: 'I went home' }]);

  const call = calls[0];
  assert.match(call.url, /\/v1\/messages$/);
  assert.equal(call.body.model, 'claude-haiku-5-5');
  assert.equal(call.body.max_tokens, 250);
  assert.deepEqual(call.body.system[0].cache_control, { type: 'ephemeral' });
  assert.equal(call.body.system[0].text, STATIC_PROMPT);
  assert.equal(call.body.messages[0].role, 'user');
  assert.equal(call.body.messages.at(-1).content, 'I goed home');
});

test('Claude provider: 429 maps to rate_limited', async () => {
  const env = makeEnv({ AI_PROVIDER: 'claude', ANTHROPIC_API_KEY: 'sk-test' });
  mockFetch(() => new Response(JSON.stringify({ type: 'error', error: { type: 'rate_limit_error', message: 'slow down' } }), {
    status: 429, headers: { 'content-type': 'application/json', 'retry-after': '9' },
  }));
  const res = await worker.fetch(chatRequest({}), env);
  assert.equal(res.status, 429);
  assert.equal((await res.json()).retryAfter, 9);
});

test('history is trimmed to the last 12 messages and starts with the student', () => {
  const msgs = [];
  for (let i = 0; i < 30; i++) msgs.push({ role: i % 2 ? 'user' : 'assistant', content: `m${i}` });
  const out = prepareMessages(msgs, { profile: { name: 'Mia' } });
  assert.equal(out[0].role, 'user');
  assert.ok(out.length <= 13);
  assert.equal(out.at(-1).content, 'm29');
});

test('postProcess strips links, markdown and fix tags', () => {
  const { reply, fixes } = postProcess('**Great!** Visit https://example.com now.\n[fix: "he go" => "he goes"]');
  assert.equal(reply, 'Great! Visit  now.');
  assert.deepEqual(fixes, [{ wrong: 'he go', right: 'he goes' }]);
});

test('dynamic prompt adapts to age, level and mode', () => {
  const kid = buildDynamicPrompt({ profile: { name: 'Mia', age: 6, level: 'Beginner' }, mode: 'words', words: ['brave', 'cloud'] });
  assert.match(kid, /child/);
  assert.match(kid, /brave, cloud/);
  const adult = buildDynamicPrompt({ profile: { name: 'Sam', age: 41, level: 'Advanced' }, mode: 'roleplay', topic: 'airport' });
  assert.match(adult, /adult/);
  assert.match(adult, /check-in agent/);
  assert.ok(STATIC_PROMPT.length > 2500, 'static prompt should be long enough to be cached by Claude (>512 tokens)');
});
