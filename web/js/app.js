// Buddy Learning (formerly English Buddy) - main app: screens, navigation, conversations.
// Young children (FS1, FS2, Year 1) get the Buddy Learning screens from kids.js;
// older learners and adults keep the English tutor screens below.
import * as store from './store.js';
import * as api from './api.js';
import * as speech from './speech.js';
import { compareSpeech } from './diff.js';
import { createKids, YEAR_INFO } from './kids.js';
import { AVATARS, LEVELS, TOPICS, ROLEPLAYS, STORY_THEMES, MODES, SENTENCES, BADGES, WORDS, TUTORS, ACCENTS, tutorById, accentById } from './content.js';

const $ = (sel, root = document) => root.querySelector(sel);
const view = $('#view');
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The learner's tutor character and how it should sound.
const tutorOf = (p) => tutorById(p?.tutorId);
// Young children hear Buddy with a British voice (EYFS / National Curriculum) unless a tutor was chosen.
const enLang = (p) => (store.isKid(p) && tutorOf(p).id === 'buddy' ? 'en-GB' : accentById(tutorOf(p).accent).lang);
function voiceOpts(p, override = {}) {
  const t = tutorOf(p);
  return { voiceURI: p?.voiceURI || '', lang: enLang(p), gender: t.gender, ...override };
}
const say = (text, rate, p = store.activeProfile(), override = {}) => speech.speak(text, rate ?? (p?.rate || 0.9), voiceOpts(p, override));

const ui = {
  screen: 'home',
  tab: 'home',
  parentUnlocked: false,
  setupStep: 0,
  inputMode: speech.sttSupported ? 'voice' : 'text',
  lastActivity: Date.now(),
};

let chat = null; // current conversation
let pron = null; // current pronunciation exercise
let rec = null; // active speech recognition
let deferredInstall = null;

const kids = createKids({ store, api, speech, esc, ui, go: (...a) => go(...a), voiceOpts, enLang, installCard: () => installCard() });
const PARENT_SCREENS = ['parents', 'edit-profile', 'transcripts', 'transcript', 'weekly'];
const KID_COUNTED = ['home', 'subject', 'activity', 'result', 'chat', 'stickers'];

// ================================================================ boot

function applyTheme() {
  const t = store.get().theme;
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
  const dark = t === 'dark' || (t !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches);
  $('#theme-btn').textContent = dark ? '☀️' : '🌙';
  $('#theme-btn').setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
}

function boot() {
  applyTheme();
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);
  document.addEventListener('click', onClick);
  document.addEventListener('submit', onSubmit);
  document.addEventListener('input', onInput);
  document.addEventListener('pointerdown', () => { ui.lastActivity = Date.now(); speech.unlockAudio(); }, { capture: true });
  document.addEventListener('keydown', () => { ui.lastActivity = Date.now(); }, { capture: true });
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; if (ui.screen === 'home') render(); });


  setInterval(tick, 5000);
  const s = store.get();
  if (!s.familyCode || !s.profiles.length) go('setup');
  else if (!store.activeProfile()) go('profiles');
  else go('home');

  setTimeout(() => $('#splash')?.classList.add('hide'), 900);
  setTimeout(() => $('#splash')?.remove(), 1600);

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

// counts practice time while a practice screen is open and the user is active
function tick() {
  const p = store.activeProfile();
  if (!p || document.hidden) return;
  if (store.isKid(p)) {
    // screen time for young children: everything except the parent area
    if (!KID_COUNTED.includes(ui.screen)) return;
    if (Date.now() - ui.lastActivity > 120_000 && !speech.isSpeaking()) return;
    store.addSeconds(p.id, 5);
    if (ui.screen === 'activity' && kids.current) store.addSubjectSeconds(p.id, kids.current.topic.subject, 5);
    if (ui.screen === 'chat') store.addSubjectSeconds(p.id, 'talk', 5);
    if (kids.overLimit(p) && ui.screen !== 'activity') go('rest');
    else if (kids.overLimit(p) && ui.screen === 'activity') ui.restAfterActivity = true;
    return;
  }
  if (!['chat', 'pron'].includes(ui.screen)) return;
  if (Date.now() - ui.lastActivity > 90_000 && !speech.isSpeaking()) return;
  store.addSeconds(p.id, 5);
  celebrate(store.checkBadges(p.id));
}

// ================================================================ navigation

const TAB_OF = { home: 'home', pick: 'home', chat: 'talk', talk: 'talk', pron: 'home', progress: 'progress', parents: 'parents', 'edit-profile': 'parents', transcripts: 'parents', transcript: 'parents', profiles: 'home', tutors: 'home', subject: 'home', activity: 'home', result: 'home', stickers: 'progress', rest: 'home', weekly: 'parents' };

function go(screen, params = {}) {
  if (rec) { rec.abort(); rec = null; }
  if (screen !== 'chat' && screen !== 'pron' && screen !== 'result') speech.stopSpeaking();
  if (ui.screen === 'activity' && screen !== 'activity') kids.stop();
  if (!PARENT_SCREENS.includes(screen)) ui.parentUnlocked = false;
  const kid = store.activeProfile();
  if (store.isKid(kid) && kids.overLimit(kid) && KID_COUNTED.includes(screen) && screen !== 'result') screen = 'rest';
  if (screen === 'result' && ui.restAfterActivity) { ui.restAfterActivity = false; }
  ui.screen = screen;
  ui.params = params;
  ui.tab = TAB_OF[screen] || 'home';
  render();
  window.scrollTo(0, 0);
}

function render() {
  const s = store.get();
  const p = store.activeProfile();
  const setup = ui.screen === 'setup';
  document.body.classList.toggle('no-chrome', setup);
  $('#profile-btn').innerHTML = p ? `<span class="avatar sm">${esc(p.avatar)}</span><span class="pname">${esc(p.name)}</span>` : '<span class="pname">Buddy Learning</span>';
  $('#star-count').textContent = p ? store.progress(p.id).stars : 0;
  const kid = store.isKid(p);
  document.body.classList.toggle('kid-mode', kid);
  document.body.classList.toggle('in-activity', ui.screen === 'activity' || ui.screen === 'rest');
  const tabLabels = kid ? { home: ['🏠', 'Home'], talk: ['💬', 'Buddy'], progress: ['🏅', 'Stickers'], parents: ['👨‍👩‍👧', 'Parents'] }
    : { home: ['🏠', 'Home'], talk: ['💬', 'Talk'], progress: ['⭐', 'Progress'], parents: ['👨‍👩‍👧', 'Parents'] };
  document.querySelectorAll('.tabbar button').forEach((b) => {
    b.classList.toggle('active', b.dataset.tab === ui.tab);
    const [icon, label] = tabLabels[b.dataset.tab];
    b.innerHTML = `<span aria-hidden="true">${icon}</span>${label}`;
  });

  const screens = {
    setup: renderSetup, profiles: renderProfiles, home: renderHome, pick: renderPick, chat: renderChat,
    pron: renderPron, tutors: renderTutors, progress: renderProgress, parents: renderParents, 'edit-profile': renderEditProfile,
    transcripts: renderTranscripts, transcript: renderTranscript,
    subject: () => kids.subject(ui.params.id), activity: kids.activityShell, result: kids.result, stickers: kids.stickers,
    rest: kids.rest, weekly: () => kids.weekly(ui.params.id),
  };
  if (!p && !['setup', 'profiles', 'parents', 'edit-profile'].includes(ui.screen)) { ui.screen = s.profiles.length ? 'profiles' : 'setup'; }
  view.innerHTML = (screens[ui.screen] || renderHome)();
  view.dataset.screen = ui.screen;
  afterRender();
}

function afterRender() {
  const kid = store.isKid(store.activeProfile());
  if (kid && ui.screen === 'home') kids.afterHome();
  if (ui.screen === 'activity') kids.startActivity(view, ui.params.id);
  if (ui.screen === 'result') kids.afterResult();
  if (ui.screen === 'rest' && !ui.restSpoken) { ui.restSpoken = true; kids.restIntro(); }
  if (ui.screen === 'subject' && ui.params.intro) { ui.params.intro = false; kids.subjectIntro(ui.params.id); }
  if (ui.screen === 'chat') {
    scrollChat();
    bindMic($('#mic-btn'), onChatSpeech, () => (chat?.lang === 'ar' ? 'ar-AE' : 'en-GB'));
  }
  if (ui.screen === 'pron') bindMic($('#pron-mic'), onPronSpeech);
  if (ui.screen === 'parents' && ui.parentUnlocked) loadServerUsage();
  const auto = $('[autofocus]', view);
  if (auto && !matchMedia('(pointer: coarse)').matches) auto.focus();
}

// ================================================================ small UI helpers

function toast(msg, ms = 2600) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), ms);
}

function celebrate(badges) {
  for (const b of badges || []) toast(`${b.emoji} New badge: ${b.name}!`, 3500);
  const p = store.activeProfile();
  if (p) $('#star-count').textContent = store.progress(p.id).stars;
}

function popStar(n = 1) {
  const el = $('#star-count');
  const p = store.activeProfile();
  if (p) el.textContent = store.progress(p.id).stars;
  el.parentElement.classList.remove('pop');
  void el.offsetWidth;
  el.parentElement.classList.add('pop');
  if (n > 1) toast(`⭐ +${n} stars!`);
}

const avatarPicker = (selected) => `
  <div class="avatar-grid" role="radiogroup" aria-label="Choose an avatar">
    ${AVATARS.map((a) => `<label class="avatar-opt"><input type="radio" name="avatar" value="${a}" ${a === selected ? 'checked' : ''}><span>${a}</span></label>`).join('')}
  </div>`;

const levelPicker = (selected) => `
  <div class="seg" role="radiogroup" aria-label="English level">
    ${LEVELS.map((l) => `<label><input type="radio" name="level" value="${l}" ${l === selected ? 'checked' : ''}><span>${l}</span></label>`).join('')}
  </div>`;

const YEAR_CHOICES = [['FS1', 'FS1', 'ages 3–4'], ['FS2', 'FS2', 'ages 4–5'], ['Y1', 'Year 1', 'ages 5–6'], ['older', 'Older', '6+ & grown-ups']];

function profileForm(p, { submitLabel, setup = false } = {}) {
  const year = p?.year || (p ? 'older' : 'FS2');
  const kid = year !== 'older';
  return `
  <form class="card form ${kid ? 'is-kid' : 'is-older'}" data-form="profile" data-id="${p?.id || ''}" data-setup="${setup ? 1 : ''}">
    <label class="field"><span>Name (first name or nickname)</span>
      <input name="name" required maxlength="20" autocomplete="off" value="${esc(p?.name || '')}" placeholder="e.g. Mia" ${p ? '' : 'autofocus'}></label>
    <div class="field"><span>Year group</span>
      <div class="seg years" role="radiogroup" aria-label="Year group">
        ${YEAR_CHOICES.map(([v, l, a]) => `<label><input type="radio" name="year" value="${v}" data-input="year" ${v === year ? 'checked' : ''}><span>${l}<small>${a}</small></span></label>`).join('')}
      </div>
      <small class="hint kid-only">Buddy Learning: English, Maths, Science and Arabic games for FS1 to Year 1.</small>
      <small class="hint older-only">English Buddy: conversation practice with an AI tutor.</small>
    </div>
    <div class="field"><span>Pick an avatar</span>${avatarPicker(p?.avatar || AVATARS[0])}</div>
    <label class="field older-only"><span>Age</span>
      <input name="age" type="number" inputmode="numeric" min="3" max="120" value="${esc(p?.age || '')}" placeholder="e.g. 8"></label>
    <div class="field older-only"><span>English level</span>${levelPicker(p?.level || 'Beginner')}</div>
    <label class="field older-only"><span>Likes &amp; interests (optional)</span>
      <input name="interests" maxlength="160" autocomplete="off" value="${esc(p?.interests || '')}" placeholder="e.g. football, cats, drawing, Minecraft">
      <small class="hint">The tutor uses these to chat about things you enjoy. No personal details, please.</small></label>
    ${p ? `
      <label class="field"><span>${kid ? 'Voice speed' : "Tutor's speaking speed"}: <b id="rate-val">${Number(p.rate).toFixed(2)}×</b></span>
        <div class="row"><input name="rate" type="range" min="0.5" max="1.2" step="0.05" value="${p.rate}" data-input="rate">
        <button type="button" class="btn small ghost" data-action="test-rate">🔊 Test</button></div></label>
      ${kid ? `<div class="kid-only">${kids.settingsFields(p)}</div>` : ''}
      <label class="field"><span>Daily AI message limit (max set by the Worker)</span>
        <input name="dailyLimit" type="number" inputmode="numeric" min="1" max="500" value="${esc(p.dailyLimit || 60)}"></label>` : ''}
    <button class="btn primary big" type="submit">${submitLabel || 'Save'}</button>
  </form>`;
}

// ================================================================ setup (first run)

function renderSetup() {
  const s = store.get();
  if (ui.setupStep === 0) {
    return `
    <section class="setup center">
      <div class="buddy-hero" aria-hidden="true"><img src="icons/icon-192.png" alt="" width="140" height="140"></div>
      <h1>Hi! I'm Buddy 👋</h1>
      <p class="lead">Welcome to Buddy Learning! Let's play, talk and learn together.</p>
      <button class="btn primary big" data-action="setup-next">Let's start!</button>
    </section>`;
  }
  if (ui.setupStep === 1) {
    return `
    <section class="setup">
      <h1>🔑 Family code</h1>
      <p class="lead">Ask the grown-up who set up the app for the family code.</p>
      <form class="card form" data-form="family-code">
        <label class="field"><span>Family code</span>
          <input name="code" required autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(s.familyCode)}" autofocus></label>
        <p class="hint" id="code-msg"></p>
        <button class="btn primary big" type="submit">Check code</button>
      </form>
    </section>`;
  }
  return `
  <section class="setup">
    <h1>👤 Who is learning?</h1>
    <p class="lead">Create a profile. You can add more family members later.</p>
    ${profileForm(null, { submitLabel: 'Create profile', setup: true })}
  </section>`;
}

// ================================================================ profile picker

function renderProfiles() {
  const s = store.get();
  return `
  <section>
    <h1 class="center">Who's learning today?</h1>
    <div class="profile-grid">
      ${s.profiles.map((p) => `
        <button class="profile-tile ${p.id === s.activeProfileId ? 'active' : ''}" data-action="choose-profile" data-id="${p.id}">
          <span class="avatar xl">${esc(p.avatar)}</span><b>${esc(p.name)}</b><small>${esc(store.isKid(p) ? YEAR_INFO[p.year].label : p.level)}</small>
        </button>`).join('')}
      <button class="profile-tile add" data-action="add-profile"><span class="avatar xl">➕</span><b>Add</b><small>new learner</small></button>
    </div>
    ${ui.params?.adding ? `<h2>New learner</h2>${profileForm(null, { submitLabel: 'Create profile' })}` : ''}
  </section>`;
}

// ================================================================ home

function isStandalone() {
  return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}

function installCard() {
  if (isStandalone() || localStorage.getItem('englishBuddy.hideInstall')) return '';
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  return `
  <div class="card install">
    <button class="x" data-action="hide-install" aria-label="Hide">✕</button>
    <b>📲 Put Buddy Learning on your home screen</b>
    ${deferredInstall ? '<button class="btn primary small" data-action="install">Install app</button>'
      : ios ? '<p>In Safari, tap <b>Share</b> <span aria-hidden="true">⬆️</span> then <b>Add to Home Screen</b>.</p>'
        : '<p>Open the browser menu <b>⋮</b> and tap <b>Install app</b> or <b>Add to Home screen</b>.</p>'}
  </div>`;
}

function renderHome() {
  const p = store.activeProfile();
  if (store.isKid(p)) return kids.home();
  const sum = store.summary(p.id);
  const hour = new Date().getHours();
  const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return `
  <section>
    <div class="greet">
      <span class="avatar lg">${esc(p.avatar)}</span>
      <div><h1>${hello}, ${esc(p.name)}!</h1><p>What shall we practise today?</p></div>
    </div>
    ${tutorCard(p)}
    <div class="chips stats-mini">
      <span class="chip">🔥 ${sum.streak} day${sum.streak === 1 ? '' : 's'}</span>
      <span class="chip">⭐ ${sum.stars} star${sum.stars === 1 ? '' : 's'}</span>
      <span class="chip">⏱️ ${sum.todayMinutes} min today</span>
    </div>
    <div class="mode-grid">
      ${MODES.map((m) => `
        <button class="mode-card ${m.color}" data-action="mode" data-mode="${m.id}">
          <span class="emoji" aria-hidden="true">${m.emoji}</span>
          <b>${m.title}</b><small>${m.desc}</small>
        </button>`).join('')}
    </div>
    ${installCard()}
  </section>`;
}

function tutorCard(p) {
  const t = tutorOf(p);
  const a = accentById(t.accent);
  return `
  <button class="card tutor-card" data-action="go" data-to="tutors">
    <span class="avatar lg">${t.emoji}</span>
    <span class="tc-text"><small>Your tutor</small><b>${esc(t.name)} ${a.flag}</b><small>${esc(a.label)} English</small></span>
    <span class="tc-change">Change ›</span>
  </button>`;
}

// ================================================================ tutor, accent & voice

function voiceSelect(p) {
  const voices = speech.englishVoices();
  if (!voices.length) return '<p class="hint">This device did not share its voice list, so the tutor uses the default voice.</p>';
  const groups = ACCENTS.map((a) => ({ a, list: voices.filter((v) => speech.voiceMatchesAccent(v, a.lang)) })).filter((g) => g.list.length);
  const known = new Set(groups.flatMap((g) => g.list));
  const other = voices.filter((v) => !known.has(v));
  const opt = (v) => {
    const g = speech.voiceGender(v);
    return `<option value="${esc(v.voiceURI)}" ${p.voiceURI === v.voiceURI ? 'selected' : ''}>${esc(v.name.replace(/\s*\(.*\)$/, '').replace(/^Microsoft\s+/, ''))}${g ? ` (${g})` : ''}</option>`;
  };
  return `
  <select data-input="voice" aria-label="Voice">
    <option value="" ${p.voiceURI ? '' : 'selected'}>✨ Automatic: best voice for ${esc(tutorOf(p).name)}</option>
    ${groups.map((g) => `<optgroup label="${g.a.flag} ${esc(g.a.label)}">${g.list.map(opt).join('')}</optgroup>`).join('')}
    ${other.length ? `<optgroup label="🌍 Other English">${other.map(opt).join('')}</optgroup>` : ''}
  </select>`;
}

function renderTutors() {
  const p = store.activeProfile();
  const current = tutorOf(p);
  const accent = accentById(current.accent);
  const missing = speech.englishVoices().length && !speech.hasAccent(accent.lang);
  const ios = /iphone|ipad|ipod|macintosh/i.test(navigator.userAgent);
  return `
  <section>
    <button class="back" data-action="go" data-to="home">← Back</button>
    <h1>🗣️ Choose your tutor</h1>
    <p class="lead">Each tutor has their own accent and personality. Tap 🔊 to hear them.</p>
    <div class="tutor-grid">
      ${TUTORS.map((t) => {
        const a = accentById(t.accent);
        return `
        <div class="tutor-opt ${t.id === current.id ? 'active' : ''}">
          <button class="tutor-pick" data-action="pick-tutor" data-id="${t.id}" aria-pressed="${t.id === current.id}">
            <span class="avatar lg">${t.emoji}</span>
            <b>${esc(t.name)}</b>
            <small>${a.flag} ${esc(a.label)}</small>
            <small class="bio">${esc(t.bio)}</small>
          </button>
          <button class="preview" data-action="preview-tutor" data-id="${t.id}" aria-label="Hear ${esc(t.name)}">🔊</button>
        </div>`;
      }).join('')}
    </div>

    <div class="card form">
      <h2>Voice</h2>
      <div class="field">
        <div class="row">${voiceSelect(p)}<button type="button" class="btn small ghost" data-action="preview-voice" aria-label="Test voice">🔊</button></div>
        ${missing ? `<p class="hint">⚠️ This device has no ${esc(accent.label)} voice yet, so you may hear a different accent.
          ${ios ? 'On iPhone/iPad: <b>Settings → Accessibility → Spoken Content → Voices → English</b>, then download a voice (choose “Enhanced” or “Premium” for the most natural sound).'
            : 'On Android: <b>Settings → Accessibility → Text-to-speech → Preferred engine (Speech Services by Google) → ⚙️ → Install voice data → English</b>, then pick the accent you want.'}</p>` : ''}
        <p class="hint">💡 Tip: voices called <b>Natural</b>, <b>Neural</b>, <b>Enhanced</b> or <b>Premium</b> sound the most human. Microsoft Edge and newer iPhones have the best ones.</p>
      </div>
      <label class="field"><span>Speaking speed: <b id="tutor-rate-val">${Number(p.rate).toFixed(2)}×</b></span>
        <input type="range" min="0.5" max="1.2" step="0.05" value="${p.rate}" data-input="tutor-rate"></label>
    </div>
  </section>`;
}

// ================================================================ choose topic / scenario

function renderPick() {
  const p = store.activeProfile();
  const mode = ui.params.mode;
  if (mode === 'free') {
    return `
    <section>
      <button class="back" data-action="go" data-to="home">← Back</button>
      <h1>💬 Free Talk</h1><p class="lead">Pick a topic to talk about:</p>
      <div class="pick-grid">
        ${TOPICS.map((t) => `<button class="pick" data-action="start" data-mode="free" data-topic="${t.id}"><span>${t.emoji}</span>${t.label}</button>`).join('')}
      </div>
    </section>`;
  }
  if (mode === 'roleplay') {
    return `
    <section>
      <button class="back" data-action="go" data-to="home">← Back</button>
      <h1>🎭 Role Play</h1><p class="lead">Where are we today?</p>
      <div class="pick-grid">
        ${ROLEPLAYS.map((t) => `<button class="pick" data-action="start" data-mode="roleplay" data-topic="${t.id}"><span>${t.emoji}</span>${t.label}</button>`).join('')}
      </div>
    </section>`;
  }
  if (mode === 'words') {
    const words = store.wordsOfTheDay(p);
    const learned = new Set(store.progress(p.id).words);
    return `
    <section>
      <button class="back" data-action="go" data-to="home">← Back</button>
      <h1>📚 Word of the Day</h1><p class="lead">Your 5 words for today. Tap a word to hear it!</p>
      <div class="word-cards">
        ${words.map(([w, meaning, emoji]) => `
          <button class="word-card ${learned.has(w) ? 'done' : ''}" data-action="say" data-text="${esc(w)}. ${esc(meaning)}.">
            <span class="emoji">${emoji}</span><b>${esc(w)}</b><small>${esc(meaning)}</small>${learned.has(w) ? '<i>✅</i>' : ''}
          </button>`).join('')}
      </div>
      <button class="btn primary big" data-action="start" data-mode="words">Practise with ${esc(tutorOf(p).name)} 🎤</button>
    </section>`;
  }
  return '';
}

// ================================================================ conversation

function startChat(mode, topic) {
  const p = store.activeProfile();
  let words;
  if (mode === 'words') words = store.wordsOfTheDay(p).map(([w]) => w);
  if (mode === 'story') topic = STORY_THEMES[Math.floor(Math.random() * STORY_THEMES.length)];
  const session = store.startSession(p.id, mode, topic);
  session.tutorId = tutorOf(p).id;
  store.save();
  chat = { mode, topic, words, messages: [], sessionId: session.id, busy: false, notice: null, interim: '', profileId: p.id, lang: mode === 'kids' && topic === 'ar' ? 'ar' : 'en' };
  store.recordMode(p.id, mode);
  go('chat');
  askBuddy();
}

function modeTitle(mode, topic) {
  if (mode === 'kids') return `💬 Talk to Buddy${topic === 'ar' ? ' · العربية' : ''}`;
  const m = MODES.find((x) => x.id === mode);
  const extra = mode === 'free' ? TOPICS.find((t) => t.id === topic)?.label
    : mode === 'roleplay' ? ROLEPLAYS.find((t) => t.id === topic)?.label : '';
  return `${m?.emoji || '💬'} ${m?.title || 'Talk'}${extra ? ` · ${extra}` : ''}`;
}

function renderChat() {
  if (!chat || chat.profileId !== store.activeProfile()?.id) {
    return `
    <section class="center empty">
      <div class="big-emoji">💬</div>
      <h1>Ready to talk?</h1>
      <p class="lead">Start a conversation with ${esc(tutorOf(store.activeProfile()).name)}.</p>
      <button class="btn primary big" data-action="start" data-mode="free" data-topic="hobbies">Start Free Talk</button>
      <button class="btn ghost big" data-action="go" data-to="home">Choose an activity</button>
    </section>`;
  }
  const wordsBar = chat.mode === 'words' ? `
    <div class="words-bar">${chat.words.map((w) => `<span class="chip ${store.progress(chat.profileId).words.includes(w) ? 'done' : ''}">${esc(w)}</span>`).join('')}</div>` : '';
  return `
  <section class="chat">
    <div class="chat-head">
      <button class="back" data-action="go" data-to="home" aria-label="Back">←</button>
      <b>${esc(modeTitle(chat.mode, chat.topic))}</b>
      <button class="btn small ghost" data-action="restart-chat" aria-label="Start again">↻</button>
    </div>
    ${chat.mode === 'kids' ? `<div class="lang-toggle" role="group" aria-label="Language">
      <button class="${chat.lang === 'en' ? 'on' : ''}" data-action="chat-lang" data-lang="en">English</button>
      <button class="${chat.lang === 'ar' ? 'on' : ''}" data-action="chat-lang" data-lang="ar" lang="ar">العربية</button></div>` : ''}
    ${wordsBar}
    <div class="messages" id="messages" aria-live="polite">
      ${chat.messages.map(messageHtml).join('')}
      ${chat.interim ? `<div class="msg user interim"><p>${esc(chat.interim)}…</p></div>` : ''}
      ${chat.busy ? '<div class="msg buddy typing" aria-label="Your tutor is thinking"><span></span><span></span><span></span></div>' : ''}
      ${chat.notice ? noticeHtml(chat.notice) : ''}
    </div>
    ${composerHtml()}
  </section>`;
}

function messageHtml(m, i) {
  if (m.role === 'assistant') {
    return `
    <div class="msg buddy">
      <span class="avatar sm" aria-hidden="true">${tutorOf(store.activeProfile()).emoji}</span>
      <p ${/[\u0600-\u06FF]/.test(m.content) ? 'dir="rtl" lang="ar"' : ''}>${esc(m.content)}</p>
      <button class="replay" data-action="replay" data-index="${i}" aria-label="Replay">🔊</button>
    </div>`;
  }
  const fixes = (m.fixes || []).map((f) => `<div class="fix">✏️ Better: <b>${esc(f.right)}</b></div>`).join('');
  return `<div class="msg user"><p>${esc(m.content)}</p>${fixes}</div>`;
}

function noticeHtml(n) {
  return `
  <div class="notice ${n.kind}">
    <p>${esc(n.text)}</p>
    ${n.countdown ? `<small>Trying again in <b id="countdown">${n.countdown}</b> s…</small>` : ''}
    ${n.retry ? '<button class="btn small primary" data-action="retry">Try again</button>' : ''}
    ${n.parents ? '<button class="btn small ghost" data-action="go" data-to="parents">Ask a parent</button>' : ''}
  </div>`;
}

function composerHtml() {
  const disabled = chat.busy || chat.notice?.kind === 'daily' ? 'disabled' : '';
  if (ui.inputMode === 'text' || !speech.sttSupported) {
    return `
    <form class="composer" data-form="chat-text">
      ${speech.sttSupported ? '<button type="button" class="icon-btn" data-action="input-voice" aria-label="Use microphone">🎤</button>' : ''}
      <input name="text" autocomplete="off" maxlength="400" placeholder="Type your answer…" ${disabled} enterkeyhint="send" aria-label="Your message">
      <button class="icon-btn send" type="submit" ${disabled} aria-label="Send">➤</button>
    </form>
    ${speech.sttSupported ? '' : '<p class="hint center">Voice input is not available in this browser, so type instead. (Try Chrome on Android or Safari on iPhone.)</p>'}`;
  }
  return `
  <div class="composer voice">
    <button type="button" class="icon-btn" data-action="input-text" aria-label="Type instead">⌨️</button>
    <button type="button" class="mic" id="mic-btn" ${disabled} aria-label="Hold to talk">
      <span class="mic-icon" aria-hidden="true">🎤</span><span class="mic-label">${rec ? 'Listening…' : 'Hold to talk'}</span>
    </button>
    <button type="button" class="icon-btn" data-action="stop-voice" aria-label="Stop the tutor talking">🤫</button>
  </div>`;
}

function scrollChat() {
  const m = $('#messages');
  if (m) m.scrollTop = m.scrollHeight;
  requestAnimationFrame(() => window.scrollTo(0, document.body.scrollHeight));
}

function rerenderChat() {
  if (ui.screen === 'chat') render();
}

function sendUserText(text) {
  text = String(text || '').trim().slice(0, 400);
  if (!text || !chat || chat.busy) return;
  const p = store.activeProfile();
  chat.notice = null;
  chat.messages.push({ role: 'user', content: text });
  store.appendToSession(p.id, chat.sessionId, { role: 'user', text });
  store.recordMessage(p.id);
  popStar();

  if (chat.mode === 'words') {
    const said = text.toLowerCase();
    for (const w of chat.words) {
      const re = new RegExp(`\\b${w}(s|es|ed|d|ing|er|est|ly)?\\b`, 'i');
      if (re.test(said) && store.learnWord(p.id, w)) {
        toast(`⭐ +3 You used "${w}"!`);
      }
    }
  }
  celebrate(store.checkBadges(p.id));
  askBuddy();
}

async function askBuddy(isRetry = false) {
  const c = chat;
  const p = store.activeProfile();
  if (!c || !p) return;
  c.busy = true;
  c.notice = null;
  rerenderChat();
  try {
    const data = await api.chat({
      profile: p, mode: c.mode, topic: c.topic, words: c.words,
      messages: c.messages.map((m) => ({ role: m.role, content: m.content })),
    });
    if (chat !== c) return;
    c.busy = false;
    const lastUser = [...c.messages].reverse().find((m) => m.role === 'user');
    if (lastUser && data.fixes?.length) {
      lastUser.fixes = data.fixes;
      store.recordMistakes(p.id, data.fixes);
    }
    c.messages.push({ role: 'assistant', content: data.reply });
    store.appendToSession(p.id, c.sessionId, { role: 'assistant', text: data.reply, fixes: data.fixes });
    rerenderChat();
    ui.lastActivity = Date.now();
    speakReply(data.reply, p);
  } catch (err) {
    if (chat !== c) return;
    c.busy = false;
    const type = err.type || 'server';
    if (type === 'rate' && !isRetry) {
      // Friendly message, then one automatic retry.
      let wait = Math.min(30, Math.max(5, err.retryAfter || 20));
      c.notice = { kind: 'rate', text: `☕ ${tutorOf(p).name} needs a short break, try again in a minute.`, countdown: wait };
      rerenderChat();
      say('I need a short break. I will try again in a moment.', p.rate || 0.9, p);
      while (wait > 0) {
        await sleep(1000);
        if (chat !== c) return;
        wait -= 1;
        c.notice.countdown = wait;
        const el = $('#countdown');
        if (el) el.textContent = wait;
      }
      askBuddy(true);
      return;
    }
    if (type === 'rate') c.notice = { kind: 'rate', text: `☕ ${tutorOf(p).name} needs a short break, try again in a minute.`, retry: true };
    else if (type === 'daily') c.notice = { kind: 'daily', text: "🌙 That's all the talking for today! Great job. Come back tomorrow for more.", parents: true };
    else if (type === 'auth') c.notice = { kind: 'error', text: '🔑 The family code is wrong. Ask a parent to fix it in the Parents tab.', parents: true };
    else if (type === 'config') c.notice = { kind: 'error', text: `⚙️ ${err.message}`, parents: true };
    else c.notice = { kind: 'error', text: `😕 ${err.message}`, retry: true };
    rerenderChat();
  }
}

function speakReply(text, p) {
  if (store.isKid(p)) kids.kidSay([{ text, lang: /[\u0600-\u06FF]/.test(text) ? 'ar' : 'en' }]);
  else say(text, p.rate || 0.9, p);
}

// ---------------------------------------------------------------- push-to-talk

function bindMic(btn, onText, langFn = () => 'en-US') {
  if (!btn || !speech.sttSupported) return;
  let pressStart = 0;
  let toggled = false;

  const start = (e) => {
    e.preventDefault();
    if (btn.disabled) return;
    if (rec) { finish(); return; } // second tap in tap-to-talk mode
    speech.stopSpeaking();
    try { btn.setPointerCapture(e.pointerId); } catch { /* not supported */ }
    pressStart = Date.now();
    toggled = false;
    try {
      rec = speech.listen({ onInterim: (t) => onInterim(t), lang: langFn() });
    } catch {
      toast('Could not start the microphone.');
      return;
    }
    btn.classList.add('listening');
    btn.querySelector('.mic-label').textContent = 'Listening…';
    const current = rec;
    current.done.then((text) => {
      if (rec === current) rec = null;
      btn.classList.remove('listening');
      onInterim('');
      if (text) onText(text);
      else { toast("I didn't hear anything. Hold the button and speak."); restoreLabel(); }
    }).catch((err) => {
      if (rec === current) rec = null;
      btn.classList.remove('listening');
      onInterim('');
      restoreLabel();
      if (/not-allowed|service-not-allowed/.test(err.message)) {
        toast('🎤 Microphone is blocked. Allow it in settings, or type instead.', 4000);
        if (ui.screen === 'chat') { ui.inputMode = 'text'; render(); }
      } else if (/network/.test(err.message)) {
        toast('Voice needs an internet connection. You can type instead.');
      } else {
        toast('Sorry, I could not hear you. Please try again.');
      }
    });
  };
  const restoreLabel = () => { const l = btn.querySelector('.mic-label'); if (l) l.textContent = ui.screen === 'pron' ? 'Hold and say it' : 'Hold to talk'; };
  const finish = () => { if (rec) rec.stop(); };
  const end = (e) => {
    if (!rec) return;
    e.preventDefault();
    if (Date.now() - pressStart < 350 && !toggled) {
      // quick tap: keep listening until the next tap
      toggled = true;
      btn.querySelector('.mic-label').textContent = 'Tap to stop';
      return;
    }
    if (!toggled) finish();
  };
  btn.addEventListener('pointerdown', start);
  btn.addEventListener('pointerup', end);
  btn.addEventListener('pointercancel', end);
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
}

function onInterim(text) {
  if (ui.screen === 'chat' && chat) {
    chat.interim = text;
    const box = $('#messages');
    let el = box && $('.msg.interim', box);
    if (text && box) {
      if (!el) { el = document.createElement('div'); el.className = 'msg user interim'; box.appendChild(el); }
      el.innerHTML = `<p>${esc(text)}…</p>`;
      scrollChat();
    } else if (el) el.remove();
  }
  if (ui.screen === 'pron') {
    const el = $('#pron-heard');
    if (el) el.textContent = text ? `${text}…` : '';
  }
}

function onChatSpeech(text) {
  chat.interim = '';
  sendUserText(text);
}

// ================================================================ pronunciation

function newPronSentence() {
  const p = store.activeProfile();
  const list = SENTENCES[p.level] || SENTENCES.Beginner;
  let s;
  do { s = list[Math.floor(Math.random() * list.length)]; } while (list.length > 1 && s === pron?.sentence);
  pron = { sentence: s, result: null, heard: '' };
}

function renderPron() {
  const p = store.activeProfile();
  if (!pron) newPronSentence();
  const r = pron.result;
  let resultHtml = '';
  if (r) {
    const stars = r.score >= 90 ? '⭐⭐⭐' : r.score >= 70 ? '⭐⭐' : r.score >= 40 ? '⭐' : '';
    const msg = r.score >= 90 ? 'Amazing! Perfect!' : r.score >= 70 ? 'Great job!' : r.score >= 40 ? 'Good try! Practise the red words.' : "Let's try again together.";
    resultHtml = `
    <div class="card result">
      <div class="score">${r.score}%</div><div class="stars">${stars}</div><p><b>${msg}</b></p>
      <p class="heard">I heard: “${esc(pron.heard)}”</p>
      ${r.extra.length ? `<p class="hint">Extra words: ${r.extra.map(esc).join(', ')}</p>` : ''}
    </div>`;
  }
  const target = r
    ? r.words.map((w) => `<span class="w ${w.ok ? 'ok' : 'miss'}">${esc(w.text)}</span>`).join(' ')
    : esc(pron.sentence);
  return `
  <section class="pron">
    <button class="back" data-action="go" data-to="home">← Back</button>
    <h1>🎤 Pronunciation</h1>
    <p class="lead">Listen to ${esc(tutorOf(p).name)}, then hold the button and say the sentence.</p>
    <div class="card sentence"><p class="target">${target}</p></div>
    <div class="row center gap">
      <button class="btn big c1" data-action="pron-listen">🔊 Listen</button>
      <button class="btn big c3" data-action="pron-slow">🐢 Slowly</button>
    </div>
    ${speech.sttSupported ? `
      <button type="button" class="mic big-mic" id="pron-mic" aria-label="Hold and say it">
        <span class="mic-icon" aria-hidden="true">🎤</span><span class="mic-label">Hold and say it</span>
      </button>
      <p class="heard live" id="pron-heard"></p>`
    : '<p class="notice error">Pronunciation practice needs voice input. Please try Chrome on Android or Safari on iPhone/iPad.</p>'}
    ${resultHtml}
    <button class="btn ghost big" data-action="pron-next">Next sentence ➜</button>
    <p class="hint center">Best score: ${store.progress(p.id).pronBest}%</p>
  </section>`;
}

function onPronSpeech(text) {
  const p = store.activeProfile();
  pron.heard = text;
  pron.result = compareSpeech(pron.sentence, text);
  store.recordPron(p.id, pron.result.score);
  store.recordMessage(p.id);
  render();
  const s = pron.result.score;
  say(s >= 90 ? 'Amazing! Perfect!' : s >= 70 ? 'Great job!' : s >= 40 ? 'Good try! Let\'s practise the red words.' : 'Let\'s try again together.', p.rate, p);
  popStar(s >= 90 ? 3 : s >= 70 ? 2 : 1);
  celebrate(store.checkBadges(p.id));
}

// ================================================================ progress

function renderProgress() {
  const p = store.activeProfile();
  if (store.isKid(p)) return kids.stickers();
  const sum = store.summary(p.id);
  const pr = store.progress(p.id);
  const mistakes = store.topMistakes(p.id);
  const week = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = store.today(d);
    week.push({ label: d.toLocaleDateString(undefined, { weekday: 'narrow' }), mins: Math.round((pr.days[k]?.secs || 0) / 60), active: (pr.days[k]?.msgs || 0) > 0 });
  }
  const max = Math.max(5, ...week.map((w) => w.mins));
  return `
  <section>
    <div class="greet"><span class="avatar lg">${esc(p.avatar)}</span><div><h1>${esc(p.name)}'s progress</h1><p>${esc(p.level)} · age ${esc(p.age)}</p></div></div>
    <div class="stat-grid">
      <div class="stat c4"><b>🔥 ${sum.streak}</b><small>day streak</small></div>
      <div class="stat c3"><b>⭐ ${sum.stars}</b><small>stars</small></div>
      <div class="stat c1"><b>⏱️ ${sum.minutes}</b><small>minutes</small></div>
      <div class="stat c2"><b>📚 ${sum.words}</b><small>words learned</small></div>
    </div>
    <div class="card">
      <h2>This week</h2>
      <div class="week" role="img" aria-label="Minutes practised each day this week">
        ${week.map((w) => `<div class="day"><div class="bar ${w.active ? 'on' : ''}" style="height:${Math.max(4, (w.mins / max) * 80)}px"></div><small>${w.label}</small><small>${w.mins}m</small></div>`).join('')}
      </div>
    </div>
    <div class="card">
      <h2>Badges</h2>
      <div class="badge-grid">
        ${BADGES.map((b) => `<div class="badge ${pr.badges.includes(b.id) ? 'earned' : ''}" title="${esc(b.desc)}"><span>${b.emoji}</span><small>${esc(b.name)}</small></div>`).join('')}
      </div>
    </div>
    <div class="card">
      <h2>Words learned</h2>
      ${pr.words.length ? `<div class="chips">${pr.words.map((w) => `<button class="chip" data-action="say" data-text="${esc(w)}">${esc(w)}</button>`).join('')}</div>`
        : '<p class="hint">Try <b>Word of the Day</b> to collect words!</p>'}
    </div>
    <div class="card">
      <h2>Things to practise</h2>
      ${mistakes.length ? `<ul class="mistakes">${mistakes.map(([k, n]) => `<li><span>${esc(k)}</span><small>×${n}</small></li>`).join('')}</ul>`
        : '<p class="hint">No mistakes yet. Keep talking with your tutor!</p>'}
    </div>
  </section>`;
}

// ================================================================ parents

function renderParents() {
  const s = store.get();
  if (!s.parentPinHash) {
    return `
    <section>
      <h1>👨‍👩‍👧 Parents</h1>
      <p class="lead">Create a 4-digit parent PIN to protect this area.</p>
      <form class="card form" data-form="pin-create">
        <label class="field"><span>New PIN</span><input name="pin" type="password" inputmode="numeric" pattern="[0-9]{4,8}" minlength="4" maxlength="8" required autocomplete="new-password" autofocus></label>
        <label class="field"><span>Repeat PIN</span><input name="pin2" type="password" inputmode="numeric" pattern="[0-9]{4,8}" minlength="4" maxlength="8" required autocomplete="new-password"></label>
        <button class="btn primary big" type="submit">Save PIN</button>
      </form>
    </section>`;
  }
  if (!ui.parentUnlocked) {
    return `
    <section>
      <h1>🔒 Parents only</h1>
      <p class="lead">Enter the parent PIN.</p>
      <form class="card form" data-form="pin-enter">
        <label class="field"><span>PIN</span><input name="pin" type="password" inputmode="numeric" maxlength="8" required autocomplete="current-password" autofocus></label>
        <button class="btn primary big" type="submit">Unlock</button>
      </form>
      <p class="hint center">Forgot the PIN? Clear this website's data in the browser settings to start again.</p>
    </section>`;
  }
  return `
  <section>
    <div class="row between"><h1>👨‍👩‍👧 Parents</h1><button class="btn small ghost" data-action="lock">🔒 Lock</button></div>
    <div class="card" id="server-card"><h2>Today on the server</h2><p class="hint">Checking connection…</p></div>
    ${s.profiles.map((p) => {
      if (store.isKid(p)) return kids.parentCard(p);
      const sum = store.summary(p.id);
      const top = store.topMistakes(p.id, 3);
      return `
      <div class="card profile-card">
        <div class="row between">
          <div class="row gap"><span class="avatar lg">${esc(p.avatar)}</span><div><b>${esc(p.name)}</b><br><small>${esc(p.level)} · age ${esc(p.age)}</small></div></div>
        </div>
        <div class="mini-stats">
          <span>Today: <b>${sum.todayMsgs}</b> msgs · <b>${sum.todayMinutes}</b> min · used <b data-usage="${p.id}">–</b>/${esc(p.dailyLimit)}</span>
          <span>Total: <b>${sum.minutes}</b> min · 🔥 <b>${sum.streak}</b> days · 📚 <b>${sum.words}</b> words · ⭐ <b>${sum.stars}</b></span>
          ${top.length ? `<span>Common mistakes: ${top.map(([k]) => `<i>${esc(k)}</i>`).join(', ')}</span>` : ''}
        </div>
        <div class="row gap">
          <button class="btn small c1" data-action="go" data-to="transcripts" data-id="${p.id}">📝 Conversations</button>
          <button class="btn small ghost" data-action="go" data-to="edit-profile" data-id="${p.id}">✏️ Edit</button>
        </div>
      </div>`;
    }).join('')}
    <button class="btn ghost big" data-action="go" data-to="edit-profile" data-id="">➕ Add family member</button>

    <div class="card form">
      <h2>Settings</h2>
      <form data-form="family-code-change" class="field">
        <span>Family code</span>
        <div class="row"><input name="code" required autocomplete="off" autocapitalize="off" value="${esc(s.familyCode)}"><button class="btn small primary" type="submit">Save</button></div>
        <p class="hint" id="code-msg"></p>
      </form>
      <p class="hint">🗣️ Each person chooses their own tutor, accent and voice on the Home screen ("Your tutor → Change").</p>
      <div class="field"><span>Theme</span>
        <div class="seg">
          ${['auto', 'light', 'dark'].map((t) => `<label><input type="radio" name="theme" value="${t}" data-input="theme" ${s.theme === t ? 'checked' : ''}><span>${t === 'auto' ? '🌓 Auto' : t === 'light' ? '☀️ Light' : '🌙 Dark'}</span></label>`).join('')}
        </div>
      </div>
      <form data-form="pin-change" class="field">
        <span>Change parent PIN</span>
        <div class="row"><input name="pin" type="password" inputmode="numeric" pattern="[0-9]{4,8}" minlength="4" maxlength="8" required placeholder="New PIN" autocomplete="new-password"><button class="btn small primary" type="submit">Change</button></div>
      </form>
      <p class="hint">Server: <code>${esc(api.workerUrl() || 'not configured')}</code></p>
      <button class="btn small danger" data-action="reset-app">Reset app on this device</button>
    </div>
  </section>`;
}

async function loadServerUsage() {
  const card = $('#server-card');
  if (!card) return;
  try {
    const u = await api.usage();
    if (!$('#server-card')) return;
    const s = store.get();
    card.innerHTML = `
      <h2>Today on the server</h2>
      <p>✅ Connected · AI: <b>${esc(u.provider)}</b> · family total <b>${u.total}</b>/${u.familyLimit} messages</p>
      <p class="hint">Server limit per person: ${u.limit} messages a day. You can set a lower limit per person with ✏️ Edit.</p>`;
    for (const p of s.profiles) {
      const el = $(`[data-usage="${p.id}"]`);
      if (el) el.textContent = u.profiles?.[p.id] || 0;
    }
  } catch (err) {
    if (!$('#server-card')) return;
    card.innerHTML = `<h2>Today on the server</h2><p class="notice error">⚠️ ${esc(err.message)}</p>`;
  }
}

function renderEditProfile() {
  const id = ui.params.id;
  const p = id ? store.get().profiles.find((x) => x.id === id) : null;
  return `
  <section>
    <button class="back" data-action="go" data-to="parents">← Back</button>
    <h1>${p ? `Edit ${esc(p.name)}` : 'Add family member'}</h1>
    ${profileForm(p, { submitLabel: p ? 'Save changes' : 'Create profile' })}
    ${p ? `<button class="btn danger big" data-action="delete-profile" data-id="${p.id}">🗑️ Delete ${esc(p.name)}</button>` : ''}
  </section>`;
}

function renderTranscripts() {
  const p = store.get().profiles.find((x) => x.id === ui.params.id);
  if (!p) return renderParents();
  const list = store.sessions(p.id);
  return `
  <section>
    <button class="back" data-action="go" data-to="parents">← Back</button>
    <h1>📝 ${esc(p.name)}'s conversations</h1>
    ${list.length ? list.map((s) => `
      <button class="card list-item" data-action="go" data-to="transcript" data-id="${p.id}" data-session="${s.id}">
        <b>${esc(modeTitle(s.mode, s.topic))}</b>
        <small>${new Date(s.startedAt).toLocaleString()} · ${s.messages.length} messages</small>
      </button>`).join('') : '<p class="hint">No conversations yet.</p>'}
  </section>`;
}

function renderTranscript() {
  const s = (store.get().transcripts[ui.params.id] || []).find((x) => x.id === ui.params.session);
  if (!s) return renderTranscripts();
  return `
  <section class="chat transcript">
    <button class="back" data-action="go" data-to="transcripts" data-id="${ui.params.id}">← Back</button>
    <h1>${esc(modeTitle(s.mode, s.topic))}</h1>
    <p class="hint">${new Date(s.startedAt).toLocaleString()}</p>
    <div class="messages">
      ${s.messages.map((m) => (m.role === 'assistant'
        ? `<div class="msg buddy"><span class="avatar sm">${tutorById(s.tutorId).emoji}</span><p>${esc(m.text)}</p></div>${(m.fixes || []).map((f) => `<div class="fix">✏️ ${esc(f.wrong)} → <b>${esc(f.right)}</b></div>`).join('')}`
        : `<div class="msg user"><p>${esc(m.text)}</p></div>`)).join('')}
    </div>
  </section>`;
}

// ================================================================ events

async function onClick(e) {
  const tabBtn = e.target.closest('.tabbar button');
  if (tabBtn) {
    const tab = tabBtn.dataset.tab;
    const p = store.activeProfile();
    if (tab === 'talk' && store.isKid(p) && (!chat || chat.profileId !== p.id || chat.mode !== 'kids')) startChat('kids', 'en');
    else if (tab === 'talk') go('chat');
    else go(tab);
    return;
  }
  if (e.target.closest('#profile-btn')) { if (store.get().profiles.length) go('profiles'); return; }
  if (e.target.closest('#theme-btn')) {
    const dark = document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
    store.set({ theme: dark ? 'light' : 'dark' });
    applyTheme();
    return;
  }
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;
  const p = store.activeProfile();

  switch (a) {
    case 'go': go(el.dataset.to, { id: el.dataset.id, session: el.dataset.session }); break;
    case 'setup-next': ui.setupStep += 1; render(); break;
    case 'choose-profile': store.set({ activeProfileId: el.dataset.id }); chat = null; pron = null; go('home'); break;
    case 'add-profile': go('profiles', { adding: true }); break;
    case 'mode': {
      const m = el.dataset.mode;
      if (m === 'story') startChat('story');
      else if (m === 'pron') { pron = null; store.recordMode(p.id, 'pron'); go('pron'); }
      else go('pick', { mode: m });
      break;
    }
    case 'start': startChat(el.dataset.mode, el.dataset.topic); break;
    case 'kid-greet': kids.greet(); break;
    case 'kid-subject': go('subject', { id: el.dataset.id, intro: true }); break;
    case 'kid-subject-hear': kids.subjectIntro(el.dataset.id); break;
    case 'kid-topic': go('activity', { id: el.dataset.id }); break;
    case 'kid-talk': startChat('kids', chat?.mode === 'kids' ? chat.lang : 'en'); break;
    case 'kid-sticker': kids.kidSay('Wow! What a great sticker!'); break;
    case 'chat-lang': if (chat) startChat('kids', el.dataset.lang); break;
    case 'restart-chat': if (chat) startChat(chat.mode, chat.mode === 'story' ? undefined : chat.topic); break;
    case 'replay': {
      const m = chat?.messages[Number(el.dataset.index)];
      if (m) speakReply(m.content, p);
      break;
    }
    case 'say': say(el.dataset.text, (p?.rate || 0.9) * 0.9, p); break;
    case 'retry': askBuddy(); break;
    case 'input-text': ui.inputMode = 'text'; render(); $('.composer input')?.focus(); break;
    case 'input-voice': ui.inputMode = 'voice'; render(); break;
    case 'stop-voice': speech.stopSpeaking(); break;
    case 'pron-listen': say(pron.sentence, p.rate, p); break;
    case 'pron-slow': say(pron.sentence, Math.max(0.5, p.rate - 0.25), p); break;
    case 'pron-next': newPronSentence(); render(); say(pron.sentence, p.rate, p); break;
    case 'hide-install': localStorage.setItem('englishBuddy.hideInstall', '1'); render(); break;
    case 'install':
      if (deferredInstall) { deferredInstall.prompt(); await deferredInstall.userChoice.catch(() => {}); deferredInstall = null; render(); }
      break;
    case 'lock': ui.parentUnlocked = false; render(); break;
    case 'pick-tutor': {
      const t = tutorById(el.dataset.id);
      store.updateProfile(p.id, { tutorId: t.id, voiceURI: '' });
      render();
      say(`Hi ${p.name}! I'm ${t.name}. Let's practise English together!`, p.rate, store.activeProfile());
      break;
    }
    case 'preview-tutor': {
      const t = tutorById(el.dataset.id);
      say(`Hi! I'm ${t.name}. ${t.bio}`, p.rate, { ...p, tutorId: t.id, voiceURI: '' });
      break;
    }
    case 'preview-voice': say(`Hi ${p.name}! This is how I sound.`, p.rate, p); break;
    case 'test-rate': {
      const rate = Number($('input[name="rate"]')?.value || 0.9);
      const target = store.get().profiles.find((x) => x.id === ui.params?.id) || p;
      say('Hello! Let us learn English together.', rate, target);
      break;
    }
    case 'delete-profile': {
      const target = store.get().profiles.find((x) => x.id === el.dataset.id);
      if (target && confirm(`Delete ${target.name} and all of their progress on this device?`)) {
        store.deleteProfile(target.id);
        if (chat?.profileId === target.id) chat = null;
        go('parents');
      }
      break;
    }
    case 'reset-app':
      if (confirm('Delete ALL profiles, progress and settings on this device?')) {
        store.resetAll(); chat = null; pron = null; ui.setupStep = 0; applyTheme(); go('setup');
      }
      break;
    default: break;
  }
}

async function onSubmit(e) {
  const form = e.target.closest('form[data-form]');
  if (!form) return;
  e.preventDefault();
  const f = new FormData(form);
  const kind = form.dataset.form;

  if (kind === 'chat-text') {
    sendUserText(f.get('text'));
    return;
  }

  if (kind === 'family-code' || kind === 'family-code-change') {
    const code = String(f.get('code') || '').trim();
    const msg = $('#code-msg');
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    msg.textContent = 'Checking…';
    try {
      await api.usage(code);
      store.set({ familyCode: code });
      msg.textContent = '✅ Code is correct!';
      if (kind === 'family-code') { ui.setupStep = 2; await sleep(400); render(); }
    } catch (err) {
      if (err.type === 'auth' || err.type === 'locked') {
        msg.textContent = `❌ ${err.message}`;
      } else {
        // The server could not be reached: save the code anyway so setup can continue.
        store.set({ familyCode: code });
        msg.innerHTML = `⚠️ Could not check the code right now (${esc(err.message)}). It has been saved.`;
        if (kind === 'family-code') {
          msg.innerHTML += ' <button type="button" class="btn small ghost" data-action="setup-next">Continue</button>';
        }
      }
    } finally {
      btn.disabled = false;
    }
    return;
  }

  if (kind === 'profile') {
    const year = ['FS1', 'FS2', 'Y1'].includes(f.get('year')) ? f.get('year') : 'older';
    const kidYear = year !== 'older';
    const data = {
      name: String(f.get('name') || '').trim(),
      avatar: f.get('avatar') || AVATARS[0],
      age: Math.max(3, Math.min(120, parseInt(f.get('age'), 10) || (kidYear ? { FS1: 3, FS2: 4, Y1: 5 }[year] : 8))),
      level: LEVELS.includes(f.get('level')) ? f.get('level') : 'Beginner',
      interests: String(f.get('interests') || '').trim().slice(0, 160),
      year,
    };
    if (kidYear && form.dataset.id) {
      data.minutes = Math.max(5, Math.min(180, parseInt(f.get('minutes'), 10) || 20));
      data.subjects = Object.fromEntries(store.KID_SUBJECTS.map((x) => [x, f.get(`subj-${x}`) === 'on']));
      data.arHelper = f.get('arHelper') === 'on';
      data.aiCheer = f.get('aiCheer') === 'on';
    }
    if (!data.name) { toast('Please enter a name.'); return; }
    const id = form.dataset.id;
    if (id) {
      const existing = store.get().profiles.find((x) => x.id === id);
      store.updateProfile(id, {
        ...data,
        rate: Number(f.get('rate') || existing.rate),
        dailyLimit: Math.max(1, Math.min(500, parseInt(f.get('dailyLimit'), 10) || 60)),
      });
      if (kidYear) store.kidDefaults(store.get().profiles.find((x) => x.id === id));
      toast('Saved ✅');
      go('parents');
    } else {
      store.addProfile(data);
      chat = null; pron = null;
      toast(`Welcome, ${data.name}! 🎉`);
      if (form.dataset.setup) ui.setupStep = 0;
      go(ui.screen === 'edit-profile' ? 'parents' : 'home');
    }
    return;
  }

  if (kind === 'rest-pin') {
    const p = store.activeProfile();
    if ((await store.hashPin(String(f.get('pin')))) === store.get().parentPinHash) {
      store.addBonusMinutes(p.id, 10);
      ui.restSpoken = false;
      toast('⏱️ 10 more minutes added');
      go('home');
    } else { toast('Wrong PIN'); form.reset(); }
    return;
  }

  if (kind === 'pin-create') {
    const pin = String(f.get('pin'));
    if (!/^\d{4,8}$/.test(pin)) { toast('Use 4 to 8 digits.'); return; }
    if (pin !== String(f.get('pin2'))) { toast('The PINs are different. Try again.'); return; }
    store.set({ parentPinHash: await store.hashPin(pin) });
    ui.parentUnlocked = true;
    toast('PIN saved 🔒');
    render();
    return;
  }
  if (kind === 'pin-enter') {
    if ((await store.hashPin(String(f.get('pin')))) === store.get().parentPinHash) {
      ui.parentUnlocked = true; render();
    } else {
      toast('Wrong PIN'); form.reset();
    }
    return;
  }
  if (kind === 'pin-change') {
    const pin = String(f.get('pin'));
    if (!/^\d{4,8}$/.test(pin)) { toast('Use 4 to 8 digits.'); return; }
    store.set({ parentPinHash: await store.hashPin(pin) });
    form.reset();
    toast('PIN changed 🔒');
  }
}

function onInput(e) {
  const kind = e.target.dataset.input;
  if (kind === 'rate') { const v = $('#rate-val'); if (v) v.textContent = `${Number(e.target.value).toFixed(2)}×`; }
  if (kind === 'year') {
    const form = e.target.closest('form');
    form.classList.toggle('is-kid', e.target.value !== 'older');
    form.classList.toggle('is-older', e.target.value === 'older');
  }
  if (kind === 'theme') { store.set({ theme: e.target.value }); applyTheme(); }
  if (kind === 'voice') {
    const p = store.activeProfile();
    store.updateProfile(p.id, { voiceURI: e.target.value });
    say('Hi! This is my new voice.', p.rate, store.activeProfile());
  }
  if (kind === 'tutor-rate') {
    const p = store.activeProfile();
    store.updateProfile(p.id, { rate: Number(e.target.value) });
    const v = $('#tutor-rate-val');
    if (v) v.textContent = `${Number(e.target.value).toFixed(2)}×`;
  }
}

// expose a few things for automated tests
window.__buddy = { store, ui, go, kids, get chat() { return chat; }, get pron() { return pron; }, onChatSpeech: (t) => onChatSpeech(t), onPronSpeech: (t) => onPronSpeech(t), WORDS };

boot();
