// English Buddy - Cloudflare Worker
// A tiny proxy between the app and the AI provider. It keeps the API keys secret,
// checks the family access code, enforces daily limits and rate limits, and
// builds the tutor prompt so every provider behaves the same.
//
// Endpoints:
//   GET  /health  -> { ok, provider }                        (no code needed)
//   GET  /usage   -> today's message counts per profile       (needs X-Family-Code)
//   POST /chat    -> { reply, fixes, usage }                   (needs X-Family-Code)

import { Limiter } from './limiter.js';
import { STATIC_PROMPT, buildDynamicPrompt, startMessage } from './prompt.js';
import { generateReply, providerName, ProviderError } from './providers.js';

export { Limiter };

const MAX_HISTORY = 12;
const MAX_TOKENS = 250;
const MAX_TOKENS_STORY = 350; // the opening story needs a little more room
const MAX_MESSAGE_CHARS = 600;
const MODES = ['free', 'roleplay', 'words', 'story'];

// ---------------------------------------------------------------- helpers

function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGIN || '')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, '').toLowerCase())
    .filter(Boolean);
}

function corsHeaders(request, env) {
  const origin = (request.headers.get('Origin') || '').toLowerCase();
  const headers = { Vary: 'Origin' };
  if (origin && allowedOrigins(env).includes(origin)) {
    headers['Access-Control-Allow-Origin'] = request.headers.get('Origin');
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, X-Family-Code';
    headers['Access-Control-Max-Age'] = '86400';
  }
  return headers;
}

function json(data, status, request, env, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...corsHeaders(request, env), ...extra },
  });
}

function originAllowed(request, env) {
  const origin = (request.headers.get('Origin') || '').toLowerCase();
  return !!origin && allowedOrigins(env).includes(origin);
}

function timingSafeEqual(a, b) {
  const enc = new TextEncoder();
  const x = enc.encode(String(a));
  const y = enc.encode(String(b));
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

export function localDate(tz) {
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: tz || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function limiterStub(env) {
  return env.LIMITER.get(env.LIMITER.idFromName('family'));
}

async function limiter(env, body) {
  const res = await limiterStub(env).fetch('https://limiter/op', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

function intVar(v, fallback) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Keep the last MAX_HISTORY messages, merge same-role neighbours, start with a user turn. */
export function prepareMessages(raw, ctx) {
  const list = (Array.isArray(raw) ? raw : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS).trim() }))
    .filter((m) => m.content)
    .slice(-MAX_HISTORY);

  const merged = [];
  for (const m of list) {
    const last = merged[merged.length - 1];
    if (last && last.role === m.role) last.content += `\n${m.content}`;
    else merged.push({ ...m });
  }
  if (!merged.length || merged[0].role !== 'user') merged.unshift({ role: 'user', content: startMessage(ctx) });
  if (merged[merged.length - 1].role !== 'user') return null; // nothing for Buddy to answer
  return merged;
}

/** Pull out the hidden [fix: wrong => right] tags and tidy the text for speaking. */
export function postProcess(text) {
  const fixes = [];
  let reply = String(text).replace(/\[\s*fix\s*:\s*([^\]]*?)\s*=>\s*([^\]]*?)\s*\]/gi, (_, wrong, right) => {
    const w = wrong.replace(/^["'“‘]|["'”’]$/g, '').trim();
    const r = right.replace(/^["'“‘]|["'”’]$/g, '').trim();
    if (w && r && w.toLowerCase() !== r.toLowerCase() && fixes.length < 3) fixes.push({ wrong: w.slice(0, 120), right: r.slice(0, 120) });
    return '';
  });
  reply = reply
    .replace(/\[\s*fix\s*:[^\]]*\]?/gi, '') // half-written tags
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\bwww\.\S+/gi, '')
    .replace(/[*_#`>]+/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return { reply, fixes };
}

const SAFE_REDIRECT = "Hmm, let's talk about something else! Would you like to tell me about your favourite animal?";

// ---------------------------------------------------------------- handlers

async function handleChat(request, env, ip) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'bad_request' }, 400, request, env); }

  const profile = body.profile || {};
  const profileId = String(profile.id || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40);
  if (!profileId) return json({ error: 'bad_request', message: 'Missing profile' }, 400, request, env);

  const ctx = {
    profile,
    mode: MODES.includes(body.mode) ? body.mode : 'free',
    topic: body.topic,
    words: body.words,
  };
  const messages = prepareMessages(body.messages, ctx);
  if (!messages) return json({ error: 'bad_request', message: 'Last message must be from the student' }, 400, request, env);

  const serverLimit = intVar(env.DAILY_LIMIT, 60);
  const limit = Math.min(serverLimit, intVar(body.dailyLimit, serverLimit));
  const date = localDate(body.tz);
  const slot = await limiter(env, {
    op: 'reserve', ip, profileId, date, limit, familyLimit: intVar(env.FAMILY_DAILY_LIMIT, 400),
  });
  if (!slot.ok) {
    if (slot.reason === 'too_fast') {
      return json({ error: 'rate_limited', retryAfter: slot.retryAfter, message: 'Too many messages too quickly' }, 429, request, env, { 'Retry-After': String(slot.retryAfter) });
    }
    return json({ error: 'daily_limit', usage: { used: slot.used, limit: slot.limit }, message: 'Daily message limit reached' }, 429, request, env);
  }

  const isStoryStart = ctx.mode === 'story' && messages.length <= 2;
  try {
    const raw = await generateReply(env, {
      staticPrompt: STATIC_PROMPT,
      dynamicPrompt: buildDynamicPrompt(ctx),
      messages,
      maxTokens: isStoryStart ? MAX_TOKENS_STORY : MAX_TOKENS,
    });
    const { reply, fixes } = postProcess(raw);
    return json({ reply: reply || SAFE_REDIRECT, fixes, usage: { used: slot.used, limit: slot.limit } }, 200, request, env);
  } catch (err) {
    const e = err instanceof ProviderError ? err : new ProviderError('server', String(err?.message || err));
    if (e.kind === 'blocked') {
      // Content filters kicked in: answer with a gentle redirect (counts as a message).
      return json({ reply: SAFE_REDIRECT, fixes: [], usage: { used: slot.used, limit: slot.limit } }, 200, request, env);
    }
    await limiter(env, { op: 'refund', profileId, date });
    console.error(`[${providerName(env)}] ${e.kind}: ${e.message}`);
    if (e.kind === 'rate_limit') {
      const retryAfter = Math.min(60, Math.max(5, e.retryAfter || 20));
      return json({ error: 'rate_limited', retryAfter, message: 'The AI provider is busy' }, 429, request, env, { 'Retry-After': String(retryAfter) });
    }
    if (e.kind === 'auth' || e.kind === 'config') {
      return json({ error: 'server_config', message: e.message }, 500, request, env);
    }
    return json({ error: 'provider_error', message: 'The AI service had a problem. Please try again.' }, 502, request, env);
  }
}

async function handleUsage(request, env) {
  const url = new URL(request.url);
  const date = localDate(url.searchParams.get('tz'));
  const day = await limiter(env, { op: 'usage', date });
  return json({
    date,
    provider: providerName(env),
    limit: intVar(env.DAILY_LIMIT, 60),
    familyLimit: intVar(env.FAMILY_DAILY_LIMIT, 400),
    total: day.total || 0,
    profiles: day.p || {},
  }, 200, request, env);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: originAllowed(request, env) ? 204 : 403, headers: corsHeaders(request, env) });
    }

    if (path === '/' || path === '/health') {
      return json({
        ok: true,
        app: 'English Buddy',
        provider: providerName(env),
        familyCodeSet: !!env.FAMILY_CODE,
        allowedOrigin: allowedOrigins(env).join(', ') || '(not set)',
      }, 200, request, env);
    }

    if (path !== '/chat' && path !== '/usage') return json({ error: 'not_found' }, 404, request, env);

    if (!originAllowed(request, env)) {
      return json({ error: 'forbidden_origin', message: 'This app address is not allowed (check ALLOWED_ORIGIN).' }, 403, request, env);
    }
    if (!env.FAMILY_CODE) {
      return json({ error: 'server_config', message: 'FAMILY_CODE is not set on the Worker' }, 500, request, env);
    }

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const locked = await limiter(env, { op: 'authLocked', ip });
    if (!locked.ok) {
      return json({ error: 'locked', retryAfter: locked.retryAfter, message: 'Too many wrong codes. Wait a few minutes.' }, 429, request, env);
    }
    if (!timingSafeEqual((request.headers.get('X-Family-Code') || '').trim(), String(env.FAMILY_CODE).trim())) {
      await limiter(env, { op: 'authFail', ip });
      return json({ error: 'bad_code', message: 'Wrong family code' }, 401, request, env);
    }

    try {
      if (path === '/usage' && request.method === 'GET') return await handleUsage(request, env);
      if (path === '/chat' && request.method === 'POST') return await handleChat(request, env, ip);
      return json({ error: 'method_not_allowed' }, 405, request, env);
    } catch (err) {
      console.error('Unexpected error', err);
      return json({ error: 'server_error', message: 'Something went wrong' }, 500, request, env);
    }
  },
};
