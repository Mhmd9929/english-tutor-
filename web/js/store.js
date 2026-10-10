// Everything is stored locally on this device (localStorage). Nothing is uploaded
// except the conversation messages sent to Buddy.
import { BADGES, WORDS } from './content.js';

const KEY = 'englishBuddy.v1';
const MAX_SESSIONS = 20;
const MAX_SESSION_MESSAGES = 80;

const blank = () => ({
  familyCode: '',
  theme: 'auto',
  parentPinHash: '',
  activeProfileId: '',
  profiles: [],
  progress: {},
  transcripts: {},
});

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...blank(), ...JSON.parse(raw) };
  } catch { /* storage blocked or corrupt */ }
  return blank();
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* full or blocked */ }
}

export const get = () => state;

export function set(patch) {
  Object.assign(state, patch);
  save();
}

export function resetAll() {
  state = blank();
  save();
}

export const uid = (p = 'p') => `${p}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;

export function today(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const timeZone = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch { return 'UTC'; }
};

// ---------------------------------------------------------------- profiles

export function defaultRate(age) {
  const a = Number(age) || 10;
  if (a <= 7) return 0.75;
  if (a <= 12) return 0.85;
  return 0.95;
}

export function addProfile({ name, avatar, age, level, tutorId = 'buddy', interests = '' }) {
  const p = {
    id: uid('p'), name: name.trim().slice(0, 20), avatar, age: Number(age) || 8, level,
    rate: defaultRate(age), dailyLimit: 60, createdAt: Date.now(),
    tutorId, voiceURI: '', interests: String(interests).slice(0, 160),
  };
  state.profiles.push(p);
  state.activeProfileId = p.id;
  save();
  return p;
}

export function updateProfile(id, patch) {
  const p = state.profiles.find((x) => x.id === id);
  if (p) Object.assign(p, patch);
  save();
  return p;
}

export function deleteProfile(id) {
  state.profiles = state.profiles.filter((x) => x.id !== id);
  delete state.progress[id];
  delete state.transcripts[id];
  if (state.activeProfileId === id) state.activeProfileId = state.profiles[0]?.id || '';
  save();
}

export const activeProfile = () => state.profiles.find((p) => p.id === state.activeProfileId) || null;

// ---------------------------------------------------------------- progress

export function progress(id) {
  if (!state.progress[id]) {
    state.progress[id] = { days: {}, seconds: 0, messages: 0, stars: 0, words: [], mistakes: {}, badges: [], pronBest: 0, modes: {} };
  }
  return state.progress[id];
}

function dayEntry(pr, date = today()) {
  if (!pr.days[date]) pr.days[date] = { msgs: 0, secs: 0 };
  return pr.days[date];
}

export function streak(id) {
  const pr = progress(id);
  let n = 0;
  const d = new Date();
  // today counts if practised; otherwise start from yesterday so the streak isn't "lost" until tonight
  if (!pr.days[today(d)]?.msgs) d.setDate(d.getDate() - 1);
  while (pr.days[today(d)]?.msgs) { n++; d.setDate(d.getDate() - 1); }
  return n;
}

function bestStreak(pr) {
  const dates = Object.keys(pr.days).filter((k) => pr.days[k].msgs > 0).sort();
  let best = 0; let run = 0; let prev = null;
  for (const k of dates) {
    const t = new Date(`${k}T12:00:00`).getTime();
    run = prev && Math.round((t - prev) / 86400000) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  }
  return best;
}

export function summary(id) {
  const pr = progress(id);
  return {
    messages: pr.messages,
    minutes: Math.floor(pr.seconds / 60),
    words: pr.words.length,
    stars: pr.stars,
    streak: streak(id),
    bestStreak: bestStreak(pr),
    pronBest: pr.pronBest,
    modes: pr.modes,
    todayMsgs: pr.days[today()]?.msgs || 0,
    todayMinutes: Math.floor((pr.days[today()]?.secs || 0) / 60),
  };
}

/** Checks for newly earned badges; returns the list of new ones. */
export function checkBadges(id) {
  const pr = progress(id);
  const s = summary(id);
  const fresh = BADGES.filter((b) => !pr.badges.includes(b.id) && b.test(s));
  if (fresh.length) { pr.badges.push(...fresh.map((b) => b.id)); save(); }
  return fresh;
}

export function addStars(id, n) { progress(id).stars += n; save(); }

export function recordMessage(id) {
  const pr = progress(id);
  pr.messages += 1;
  dayEntry(pr).msgs += 1;
  // a star per message, up to 30 per day
  if (dayEntry(pr).msgs <= 30) pr.stars += 1;
  save();
}

export function addSeconds(id, secs) {
  const pr = progress(id);
  pr.seconds += secs;
  dayEntry(pr).secs += secs;
  save();
}

export function recordMode(id, mode) {
  const pr = progress(id);
  pr.modes[mode] = (pr.modes[mode] || 0) + 1;
  save();
}

export function recordMistakes(id, fixes) {
  const pr = progress(id);
  for (const f of fixes || []) {
    const key = `${f.wrong} → ${f.right}`;
    pr.mistakes[key] = (pr.mistakes[key] || 0) + 1;
  }
  // keep the 60 most frequent
  const entries = Object.entries(pr.mistakes).sort((a, b) => b[1] - a[1]).slice(0, 60);
  pr.mistakes = Object.fromEntries(entries);
  save();
}

export function topMistakes(id, n = 8) {
  return Object.entries(progress(id).mistakes).sort((a, b) => b[1] - a[1]).slice(0, n);
}

export function learnWord(id, word) {
  const pr = progress(id);
  if (pr.words.includes(word)) return false;
  pr.words.push(word);
  pr.stars += 3;
  save();
  return true;
}

export function recordPron(id, score) {
  const pr = progress(id);
  pr.pronBest = Math.max(pr.pronBest, score);
  if (score >= 90) pr.stars += 3;
  else if (score >= 70) pr.stars += 2;
  else if (score >= 40) pr.stars += 1;
  save();
}

/** Five words for today: stable for the whole day, preferring words not yet learned. */
export function wordsOfTheDay(profile) {
  const list = WORDS[profile.level] || WORDS.Beginner;
  const learned = new Set(progress(profile.id).words);
  const fresh = list.filter(([w]) => !learned.has(w));
  const pool = fresh.length >= 5 ? fresh : list;
  let seed = 0;
  for (const ch of `${today()}|${profile.id}`) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
  const out = [];
  const used = new Set();
  while (out.length < Math.min(5, pool.length)) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const i = seed % pool.length;
    if (!used.has(i)) { used.add(i); out.push(pool[i]); }
  }
  return out;
}

// ---------------------------------------------------------------- transcripts

export function startSession(id, mode, topic) {
  if (!state.transcripts[id]) state.transcripts[id] = [];
  const s = { id: uid('s'), mode, topic, startedAt: Date.now(), messages: [] };
  state.transcripts[id].unshift(s);
  state.transcripts[id] = state.transcripts[id].slice(0, MAX_SESSIONS);
  save();
  return s;
}

export function appendToSession(profileId, sessionId, msg) {
  const s = (state.transcripts[profileId] || []).find((x) => x.id === sessionId);
  if (!s) return;
  s.messages.push({ ...msg, t: Date.now() });
  if (s.messages.length > MAX_SESSION_MESSAGES) s.messages = s.messages.slice(-MAX_SESSION_MESSAGES);
  save();
}

export const sessions = (id) => (state.transcripts[id] || []).filter((s) => s.messages.length);

// ---------------------------------------------------------------- parent PIN

export async function hashPin(pin) {
  const data = new TextEncoder().encode(`english-buddy:${pin}`);
  if (crypto?.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', data);
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // very old browsers / non-secure context: simple fallback
  let h = 0;
  for (const b of data) h = (h * 31 + b) >>> 0;
  return `x${h.toString(16)}`;
}
