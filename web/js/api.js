// Talks to the English Buddy Cloudflare Worker.
import { get, timeZone } from './store.js';

export class ApiError extends Error {
  // type: 'rate' | 'daily' | 'auth' | 'locked' | 'network' | 'config' | 'server'
  constructor(type, message, extra = {}) {
    super(message);
    this.type = type;
    Object.assign(this, extra);
  }
}

export function workerUrl() {
  const cfg = window.BUDDY_CONFIG || {};
  return String(cfg.workerUrl || '').trim().replace(/\/+$/, '');
}

async function request(path, { method = 'GET', body, code } = {}) {
  const base = workerUrl();
  if (!base) throw new ApiError('config', 'The app is not connected to its Worker yet (workerUrl is empty in config.js).');
  let res;
  try {
    res = await fetch(`${base}${path}`, {
      method,
      headers: {
        'X-Family-Code': code ?? get().familyCode ?? '',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('network', navigator.onLine === false ? 'You are offline.' : 'Could not reach Buddy. Check your internet connection.');
  }
  let data = {};
  try { data = await res.json(); } catch { /* not JSON */ }
  if (res.ok) return data;

  if (res.status === 401) throw new ApiError('auth', 'The family code is not correct.');
  if (data.error === 'locked') throw new ApiError('locked', 'Too many wrong codes. Please wait a few minutes.', { retryAfter: data.retryAfter });
  if (data.error === 'daily_limit') throw new ApiError('daily', 'That is all the messages for today!', { usage: data.usage });
  if (res.status === 429) throw new ApiError('rate', 'Buddy needs a short break.', { retryAfter: Number(data.retryAfter) || 20 });
  if (res.status === 403) throw new ApiError('config', data.message || 'This app address is not allowed by the Worker.');
  if (data.error === 'server_config') throw new ApiError('config', data.message || 'The Worker is missing a setting.');
  throw new ApiError('server', data.message || `Something went wrong (${res.status}).`);
}

export function chat({ profile, mode, topic, words, messages }) {
  return request('/chat', {
    method: 'POST',
    body: {
      profile: { id: profile.id, name: profile.name, age: profile.age, level: profile.level },
      dailyLimit: profile.dailyLimit,
      mode, topic, words,
      tz: timeZone(),
      messages: messages.slice(-12),
    },
  });
}

export function usage(code) {
  return request(`/usage?tz=${encodeURIComponent(timeZone())}`, { code });
}
