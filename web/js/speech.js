// Voice helpers: speech recognition (listening) and speech synthesis (Buddy's voice).
// Both use the browser's built-in Web Speech API - free, no keys.

const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
export const sttSupported = !!Recognition;
export const ttsSupported = 'speechSynthesis' in window;

// ---------------------------------------------------------------- listening

/**
 * Starts listening. Returns a controller: { stop(), abort(), done: Promise<string> }.
 * onInterim(text) is called with the live transcript while the user speaks.
 */
export function listen({ onInterim, lang = 'en-US' } = {}) {
  const rec = new Recognition();
  rec.lang = lang;
  rec.continuous = true;
  rec.interimResults = true;
  rec.maxAlternatives = 1;

  let finalText = '';
  let interimText = '';
  let error = null;
  let resolveDone;
  let rejectDone;
  const done = new Promise((res, rej) => { resolveDone = res; rejectDone = rej; });

  rec.onresult = (e) => {
    interimText = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finalText += `${r[0].transcript} `;
      else interimText += r[0].transcript;
    }
    onInterim?.(`${finalText}${interimText}`.trim());
  };
  rec.onerror = (e) => { error = e.error || 'error'; };
  rec.onend = () => {
    const text = `${finalText}${interimText}`.replace(/\s+/g, ' ').trim();
    if (text) resolveDone(text);
    else if (error && error !== 'no-speech' && error !== 'aborted') rejectDone(new Error(error));
    else resolveDone('');
  };

  try { rec.start(); } catch (err) { rejectDone(err); }

  return {
    done,
    stop: () => { try { rec.stop(); } catch { /* already stopped */ } },
    abort: () => { try { rec.abort(); } catch { /* already stopped */ } },
  };
}

// ---------------------------------------------------------------- speaking

const NOVELTY = /bad news|bells|boing|bubbles|cellos|wobble|zarvox|trinoids|whisper|organ|superstar|jester|albert|bahh|junior|ralph|good news|hysterical|deranged|grandma|grandpa|rocko|shelley|\bflo\b|eddy|reed|sandy/i;
const FEMALE = /female|woman|samantha|karen|moira|tessa|serena|kate|stephanie|martha|catherine|veena|fiona|allison|\bava\b|susan|zoe|nicky|joelle|lekha|isha|sonia|libby|natasha|neerja|emily|hazel|jenny|aria|michelle|ana\b|clara|emma|olivia|amy|salli|joanna|kimberly|ivy|kendra|raveena|aditi|nicole|olivia|leah|luna|siri.*female|heera|kalpana|zira|linda|heather|susie|maisie|bella|mia|evie|isla|clara|sarah|grace|leah|molly|aoife|emily/i;
const MALE = /\bmale\b|\bman\b|daniel|arthur|oliver|rishi|\bfred\b|\btom\b|\balex\b|aaron|gordon|\blee\b|malcolm|ryan|thomas|guy|davis|tony|jason|brian|russell|william|prabhat|ravi|george|james|eric|christopher|roger|steffan|connor|liam|luke|mitchell|noah|ethan|matthew|joey|justin|kevin|ken|hemant|mark|david|richard|sean|conor/i;

let voices = [];
let allVoices = [];
function loadVoices() {
  if (!ttsSupported) return;
  allVoices = speechSynthesis.getVoices();
  voices = allVoices.filter((v) => /^en([-_]|$)/i.test(v.lang));
}
if (ttsSupported) {
  loadVoices();
  speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
}

const normLang = (l) => String(l || '').replace(/_/g, '-').toLowerCase();

/** 'female' | 'male' | '' (unknown), guessed from the voice name. */
export function voiceGender(v) {
  // only look at the name itself, not "- English (United Kingdom)"
  const n = String(v?.name || '').split(/ - |\(/)[0].replace(/microsoft|google|online|natural/gi, '');
  if (/female/i.test(n)) return 'female';
  if (/\bmale\b/i.test(n)) return 'male';
  if (FEMALE.test(n)) return 'female';
  if (MALE.test(n)) return 'male';
  return '';
}

/** Does this voice speak the given accent (e.g. 'en-GB')? */
export function voiceMatchesAccent(v, lang) {
  const vl = normLang(v.lang);
  const target = normLang(lang);
  if (target.includes('scot')) return vl.includes('scot') || /fiona/i.test(v.name);
  if (target === 'en-gb' && (vl.includes('scot') || /fiona/i.test(v.name))) return false;
  return vl === target || vl.startsWith(`${target}-`);
}

function score(v) {
  let s = 0;
  if (/natural|neural|premium|online/i.test(v.name)) s += 6;
  if (/enhanced|siri/i.test(v.name)) s += 4;
  if (/google/i.test(v.name)) s += 3;
  if (/samantha|ava|allison|daniel|karen|moira|serena|kate|rishi|tessa|sonia|libby|ryan|natasha|neerja/i.test(v.name)) s += 2;
  if (v.localService === false) s += 1; // cloud voices tend to sound more natural
  if (NOVELTY.test(v.name)) s -= 30;
  return s;
}

export function englishVoices() {
  loadVoices();
  return [...voices].filter((v) => !NOVELTY.test(v.name)).sort((a, b) => score(b) - score(a));
}

/** Arabic voices, best first: UAE, then Saudi, then any other Arabic. */
export function arabicVoices() {
  loadVoices();
  const rank = (v) => {
    const l = normLang(v.lang);
    return (l === 'ar-ae' ? 20 : l === 'ar-sa' ? 15 : 0) + score(v);
  };
  return allVoices.filter((v) => /^ar([-_]|$)/i.test(v.lang)).sort((a, b) => rank(b) - rank(a));
}

export const hasArabicVoice = () => arabicVoices().length > 0;

/**
 * Picks the best voice for a tutor.
 * opts: { voiceURI (explicit choice), lang (accent, e.g. 'en-GB'), gender ('female'|'male'|'any') }
 * Returns a voice, or null (then the browser picks one for `lang`).
 */
export function pickVoice({ voiceURI = '', lang = 'en-US', gender = 'any' } = {}) {
  if (/^ar/i.test(lang)) return arabicVoices()[0] || null;
  const list = englishVoices();
  if (voiceURI) {
    const chosen = list.find((v) => v.voiceURI === voiceURI);
    if (chosen) return chosen;
  }
  const accent = list.filter((v) => voiceMatchesAccent(v, lang));
  const pool = accent.length ? accent : [];
  if (!pool.length) return null;
  if (gender === 'female' || gender === 'male') {
    const g = pool.find((v) => voiceGender(v) === gender);
    if (g) return g;
    const unknown = pool.find((v) => !voiceGender(v));
    if (unknown) return unknown;
  }
  return pool[0];
}

/** True if the device has at least one voice for this accent. */
export const hasAccent = (lang) => englishVoices().some((v) => voiceMatchesAccent(v, lang));

/** iOS only allows speech after a tap: call this from the first tap. */
let unlocked = false;
export function unlockAudio() {
  if (unlocked || !ttsSupported) return;
  unlocked = true;
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    speechSynthesis.speak(u);
  } catch { /* ignore */ }
}

export function stopSpeaking() {
  if (ttsSupported) speechSynthesis.cancel();
}

export const isSpeaking = () => ttsSupported && speechSynthesis.speaking;

const stripForSpeech = (text) => String(text)
  .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '')
  .replace(/[*_#~`]/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const SENTENCES = /[^.!?؟]+[.!?؟]*["')]*\s*/g;

/**
 * Speaks text; resolves when finished (or stopped). rate: 0.5 (slow) .. 1.3 (fast). opts: see pickVoice().
 * `text` can also be a list of parts with their own language, e.g.
 *   [{ text: 'أين الباء؟', lang: 'ar-SA' }, { text: 'Where is baa?' }]
 */
export function speak(text, rate = 0.9, opts = {}) {
  if (!ttsSupported) return Promise.resolve();
  stopSpeaking();
  const parts = (Array.isArray(text) ? text : [{ text }])
    .map((p) => ({ ...p, text: stripForSpeech(p.text) }))
    .filter((p) => p.text);
  if (!parts.length) return Promise.resolve();
  // Speak sentence by sentence: long utterances get cut off in some browsers.
  const queue = [];
  for (const p of parts) {
    const o = p.lang ? { ...opts, lang: p.lang, voiceURI: /^ar/i.test(p.lang) === /^ar/i.test(opts.lang || 'en') ? opts.voiceURI : '' } : opts;
    const voice = pickVoice(o);
    const lang = voice?.lang || o.lang || 'en-US';
    for (const sentence of p.text.match(SENTENCES) || [p.text]) {
      if (sentence.trim()) queue.push({ text: sentence.trim(), voice, lang, rate: p.rate || rate });
    }
  }
  const totalChars = queue.reduce((n, q) => n + q.text.length, 0);
  return new Promise((resolve) => {
    let remaining = queue.length;
    let finished = false;
    const finish = () => { if (!finished) { finished = true; clearTimeout(guard); resolve(); } };
    // safety net in case the browser never fires "end"
    const guard = setTimeout(finish, 2500 + totalChars * 120 / rate);
    for (const q of queue) {
      const u = new SpeechSynthesisUtterance(q.text);
      if (q.voice) u.voice = q.voice;
      // Without a matching voice, the language code still asks the phone for that accent.
      u.lang = q.lang.includes('SCOT') ? 'en-GB' : q.lang;
      u.rate = q.rate;
      u.pitch = 1.05;
      u.onend = () => { if (--remaining <= 0) finish(); };
      u.onerror = () => { if (--remaining <= 0) finish(); };
      speechSynthesis.speak(u);
    }
  });
}
