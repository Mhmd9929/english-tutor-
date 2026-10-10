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
export function listen({ onInterim } = {}) {
  const rec = new Recognition();
  rec.lang = 'en-US';
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

const NOVELTY = /bad news|bells|boing|bubbles|cellos|wobble|zarvox|trinoids|whisper|organ|superstar|jester|albert|bahh|junior|ralph|fred|kathy|good news|hysterical|deranged|grandma|grandpa|rocko|shelley|flo|eddy|reed|sandy/i;
let voices = [];
let preferredUri = '';

function loadVoices() {
  if (!ttsSupported) return;
  voices = speechSynthesis.getVoices().filter((v) => /^en([-_]|$)/i.test(v.lang));
}
if (ttsSupported) {
  loadVoices();
  speechSynthesis.addEventListener?.('voiceschanged', loadVoices);
}

function score(v) {
  let s = 0;
  const lang = v.lang.replace('_', '-').toLowerCase();
  if (lang === 'en-us') s += 3; else if (lang === 'en-gb') s += 2.5; else s += 1;
  if (/natural|neural|premium/i.test(v.name)) s += 5;
  if (/enhanced|siri/i.test(v.name)) s += 4;
  if (/google/i.test(v.name)) s += 3;
  if (/samantha|ava|allison|susan|serena|karen|daniel|moira/i.test(v.name)) s += 2;
  if (NOVELTY.test(v.name)) s -= 20;
  return s;
}

export function englishVoices() {
  loadVoices();
  return [...voices].sort((a, b) => score(b) - score(a));
}

export function setPreferredVoice(uri) { preferredUri = uri || ''; }

export function bestVoice() {
  const list = englishVoices();
  return list.find((v) => v.voiceURI === preferredUri) || list[0] || null;
}

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

/** Speaks text; resolves when finished (or stopped). rate: 0.5 (slow) .. 1.3 (fast). */
export function speak(text, rate = 0.9) {
  if (!ttsSupported) return Promise.resolve();
  stopSpeaking();
  const clean = stripForSpeech(text);
  if (!clean) return Promise.resolve();
  // Speak sentence by sentence: long utterances get cut off in some browsers.
  const parts = clean.match(/[^.!?]+[.!?]*["')]*\s*/g) || [clean];
  const voice = bestVoice();
  return new Promise((resolve) => {
    let remaining = parts.length;
    let finished = false;
    const finish = () => { if (!finished) { finished = true; clearTimeout(guard); resolve(); } };
    // safety net in case the browser never fires "end"
    const guard = setTimeout(finish, 2500 + clean.length * 120 / rate);
    parts.forEach((p) => {
      const u = new SpeechSynthesisUtterance(p.trim());
      if (voice) { u.voice = voice; u.lang = voice.lang; } else { u.lang = 'en-US'; }
      u.rate = rate;
      u.pitch = 1.05;
      u.onend = () => { if (--remaining <= 0) finish(); };
      u.onerror = () => { if (--remaining <= 0) finish(); };
      speechSynthesis.speak(u);
    });
  });
}
