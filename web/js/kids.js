// Buddy Learning screens for young children (FS1, FS2, Year 1) and the parent views for them.
import { YEARS, YEAR_INFO, SUBJECTS, TOPICS, topicsFor, topicById, loadSubject, makeRng } from './learn/core.js';
import { runActivity, buildActivity } from './learn/engine.js';
import { buddy } from './learn/visuals.js';

const subjectById = (id) => SUBJECTS.find((s) => s.id === id);

export function createKids(ctx) {
  const { store, api, speech, esc } = ctx;
  let current = null; // running activity: { topic, runner }
  let lastResult = null;
  let greeted = false;

  // ---------------------------------------------------------------- speech for little ones
  /** Speaks a string or a list of parts ({ text, lang: 'en'|'ar', helper }). */
  function kidSay(s, { lang = 'en' } = {}) {
    const p = store.activeProfile();
    const parts = (Array.isArray(s) ? s : [{ text: s, lang }])
      .filter((x) => x && x.text && !(x.helper && p?.arHelper === false))
      .map((x) => ({ text: x.text, lang: (x.lang || lang) === 'ar' ? 'ar-SA' : ctx.enLang(p) }));
    return speech.speak(parts, p?.rate || 0.8, ctx.voiceOpts(p));
  }

  const enabledSubjects = (p) => SUBJECTS.filter((s) => store.kidDefaults(p).subjects[s.id] !== false);
  const timeLeft = (p) => Math.max(0, store.limitSeconds(p) - store.todaySeconds(p.id));
  const overLimit = (p) => store.isKid(p) && timeLeft(p) <= 0;

  // ---------------------------------------------------------------- home
  function home() {
    const p = store.activeProfile();
    store.kidDefaults(p);
    const l = store.learn(p.id);
    const left = Math.ceil(timeLeft(p) / 60);
    const pct = Math.max(0, Math.min(100, (timeLeft(p) / store.limitSeconds(p)) * 100));
    return `
    <section class="kid-home">
      <div class="kid-hello">
        <button class="kid-buddy" data-action="kid-greet" aria-label="Hear Buddy">${buddy('happy')}</button>
        <div class="bubble">Hi ${esc(p.name)}! What shall we learn today?</div>
      </div>
      <div class="kid-strip">
        <span class="chip">⭐ ${store.progress(p.id).stars}</span>
        <span class="chip">🏅 ${l.stickers.length}</span>
        <span class="time-left" title="${left} minutes left today" aria-label="${left} minutes left today"><span style="width:${pct}%"></span></span>
      </div>
      <div class="subject-grid">
        ${enabledSubjects(p).map((s) => `
          <button class="subject-tile ${s.colour}" data-action="kid-subject" data-id="${s.id}" aria-label="${s.say}">
            <span class="emo">${s.emoji}</span><b ${s.rtl ? 'lang="ar"' : ''}>${s.title}</b>
          </button>`).join('')}
      </div>
      ${p.subjects.talk !== false ? `<button class="talk-tile" data-action="kid-talk"><span class="talk-buddy">${buddy('happy')}</span><b>Talk to Buddy</b><span class="emo">🎤</span></button>` : ''}
      ${ctx.installCard()}
    </section>`;
  }

  function greet() {
    const p = store.activeProfile();
    kidSay(`Hi ${p.name}! What shall we learn today? Tap a picture.`);
  }

  function afterHome() {
    if (!greeted) { greeted = true; setTimeout(greet, 500); }
  }

  // ---------------------------------------------------------------- subject: choose a game
  function subject(id) {
    const p = store.activeProfile();
    const s = subjectById(id);
    const topics = topicsFor(id, p.year);
    return `
    <section class="subject ${s.rtl ? 'rtl' : ''}">
      <div class="row between">
        <button class="back" data-action="go" data-to="home" aria-label="Back">← </button>
        <button class="hear-again small" data-action="kid-subject-hear" data-id="${id}" aria-label="Hear again">🔊</button>
      </div>
      <h1 class="subject-title ${s.colour}-text"><span>${s.emoji}</span> <span ${s.rtl ? 'lang="ar"' : ''}>${s.title}</span></h1>
      <div class="topic-grid">
        ${topics.map((t) => {
          const st = store.topicStats(p.id, t.id);
          const stars = [1, 2, 3].map((i) => (i <= st.best ? '★' : '☆')).join('');
          return `
          <button class="topic-tile" data-action="kid-topic" data-id="${t.id}">
            <span class="t-emoji ${/^[؀-ۿ]/.test(t.emoji) ? 'ar-text' : ''}">${t.emoji}</span>
            <b ${s.rtl ? 'lang="ar"' : ''}>${esc(t.title)}</b>
            ${t.en ? `<small>${esc(t.en)}</small>` : ''}
            <span class="t-stars" aria-label="${st.best} stars">${stars}</span>
            <span class="t-level" aria-label="Level ${st.level}">${'●'.repeat(st.level)}${'○'.repeat(3 - st.level)}</span>
          </button>`;
        }).join('')}
      </div>
    </section>`;
  }
  function subjectIntro(id) {
    const s = subjectById(id);
    if (id === 'arabic') kidSay([{ text: 'الْعَرَبِيَّة! اِخْتَرْ لُعْبَة.', lang: 'ar' }, { text: 'Arabic! Choose a game.', helper: true }]);
    else kidSay(`${s.say}! Choose a game.`);
  }

  // ---------------------------------------------------------------- activity
  function activityShell() {
    return '<section class="activity-loading"><div class="kid-buddy spin">' + buddy('think') + '</div></section>';
  }

  async function startActivity(root, topicId) {
    const p = store.activeProfile();
    const topic = topicById(topicId);
    const gens = await loadSubject(topic.subject);
    if (ctx.ui.screen !== 'activity') return;
    const st = store.topicStats(p.id, topic.id);
    const count = YEAR_INFO[p.year]?.questions || 5;
    const questions = buildActivity(gens[topic.id], makeRng(Date.now() ^ topicId.length * 7919), st.level, count);
    const rtl = topic.subject === 'arabic';
    current = {
      topic,
      runner: runActivity(root, questions, {
        lang: rtl ? 'ar' : 'en', rtl,
        speak: (s, o) => kidSay(s, o),
        stop: () => speech.stopSpeaking(),
        onExit: () => { current = null; ctx.go('subject', { id: topic.subject }); },
        onDone: (res) => {
          const rec = store.recordActivity(p.id, topic, res);
          lastResult = { topic, ...res, ...rec };
          current = null;
          ctx.go('result');
        },
      }),
    };
    window.__buddy.activity = current.runner;
  }

  // ---------------------------------------------------------------- result
  function result() {
    const r = lastResult;
    if (!r) return home();
    const p = store.activeProfile();
    const s = subjectById(r.topic.subject);
    return `
    <section class="result">
      <div class="result-buddy">${buddy('cheer')}</div>
      <div class="result-stars">${[1, 2, 3].map((i) => `<span class="${i <= r.stars ? 'on' : ''}" style="animation-delay:${i * 0.25}s">★</span>`).join('')}</div>
      <div class="sticker-reveal"><span class="sticker">${r.sticker}</span><small>New sticker!</small></div>
      <div class="bubble" id="cheer-line">${r.firstTry} / ${r.total} ✨</div>
      <div class="result-actions">
        <button class="big-icon c3" data-action="kid-topic" data-id="${r.topic.id}" aria-label="Play again">🔁</button>
        <button class="big-icon ${s.colour}" data-action="kid-subject" data-id="${s.id}" aria-label="More games">🎮</button>
        <button class="big-icon c1" data-action="go" data-to="home" aria-label="Home">🏠</button>
      </div>
      ${p ? '' : ''}
    </section>`;
  }

  async function afterResult() {
    const r = lastResult;
    const p = store.activeProfile();
    if (!r || !p) return;
    const ar = r.topic.subject === 'arabic';
    const words = r.stars === 3 ? 'Fantastic! Three stars!' : r.stars === 2 ? 'Great work! Two stars!' : 'Well done for trying! One star!';
    const extra = r.levelUp ? ' Next time it will be a little harder!' : '';
    await kidSay(ar ? [{ text: 'أَحْسَنْت!', lang: 'ar' }, { text: `${words} You got a new sticker!${extra}` }] : `${words} You got a new sticker!${extra}`);
    // Optional short AI encouragement (activities never depend on it).
    if (p.aiCheer === false || !api.workerUrl() || navigator.onLine === false) return;
    try {
      const data = await Promise.race([
        api.cheer({ profile: p, topic: r.topic.en || r.topic.title, stars: r.stars, firstTry: r.firstTry, total: r.total, lang: ar ? 'ar' : 'en' }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 6000)),
      ]);
      if (ctx.ui.screen !== 'result' || lastResult !== r || !data?.reply) return;
      const el = document.getElementById('cheer-line');
      if (el) el.textContent = data.reply;
      kidSay([{ text: data.reply, lang: /[؀-ۿ]/.test(data.reply) ? 'ar' : 'en' }]);
    } catch { /* offline or busy: the local praise is enough */ }
  }

  // ---------------------------------------------------------------- stickers (the "Progress" tab for kids)
  function stickers() {
    const p = store.activeProfile();
    const l = store.learn(p.id);
    const owned = new Set(l.stickers);
    return `
    <section class="stickers-page">
      <h1 class="center">🏅 My stickers</h1>
      <div class="kid-strip center"><span class="chip">⭐ ${store.progress(p.id).stars} stars</span><span class="chip">🏅 ${owned.size} stickers</span></div>
      <div class="sticker-book">
        ${store.STICKERS.map((s) => `<button class="sticker-slot ${owned.has(s) ? 'got' : ''}" ${owned.has(s) ? `data-action="kid-sticker" data-s="${s}"` : 'disabled'} aria-label="${owned.has(s) ? 'sticker' : 'empty'}">${owned.has(s) ? s : '❔'}</button>`).join('')}
      </div>
      <p class="hint center">Finish a game to win a sticker!</p>
    </section>`;
  }

  // ---------------------------------------------------------------- time to rest
  function rest() {
    const s = store.get();
    return `
    <section class="rest center">
      <div class="rest-buddy">${buddy('sleep')}</div>
      <h1>Time to rest! 😴</h1>
      <p class="lead">Great learning today. See you tomorrow!</p>
      <details class="grown-up">
        <summary>Grown-ups</summary>
        ${s.parentPinHash ? `
        <form class="card form" data-form="rest-pin">
          <label class="field"><span>Parent PIN to add 10 more minutes today</span>
            <input name="pin" type="password" inputmode="numeric" maxlength="8" required autocomplete="current-password"></label>
          <button class="btn primary big" type="submit">Add 10 minutes</button>
        </form>` : '<p class="hint">Set a parent PIN in the Parents tab to allow extra time.</p>'}
      </details>
    </section>`;
  }
  function restIntro() { kidSay('Time to rest! Great learning today. See you tomorrow!'); }

  // ---------------------------------------------------------------- parents: per-child card
  function topicAccuracy(t) { return t.total ? Math.round((t.correct / t.total) * 100) : null; }

  function strengths(p) {
    const l = store.learn(p.id);
    const rows = Object.entries(l.topics).filter(([id, t]) => t.plays > 0 && topicById(id)).map(([id, t]) => ({ topic: topicById(id), acc: topicAccuracy(t), plays: t.plays, level: t.level }));
    return {
      strong: rows.filter((r) => r.acc >= 80).sort((a, b) => b.acc - a.acc).slice(0, 4),
      practise: rows.filter((r) => r.acc < 60).sort((a, b) => a.acc - b.acc).slice(0, 4),
      rows,
    };
  }

  function subjectBars(p) {
    const l = store.learn(p.id);
    return SUBJECTS.map((s) => {
      const ts = topicsFor(s.id, p.year);
      const played = ts.filter((t) => l.topics[t.id]?.plays);
      const correct = played.reduce((n, t) => n + l.topics[t.id].correct, 0);
      const total = played.reduce((n, t) => n + l.topics[t.id].total, 0);
      const acc = total ? Math.round((correct / total) * 100) : 0;
      return `
      <div class="sbar">
        <span class="sbar-name">${s.emoji} ${s.id === 'arabic' ? 'Arabic' : s.title}</span>
        <span class="sbar-track" title="${played.length} of ${ts.length} topics tried"><span style="width:${(played.length / Math.max(1, ts.length)) * 100}%"></span></span>
        <span class="sbar-val">${played.length}/${ts.length}${total ? ` · ${acc}%` : ''}</span>
      </div>`;
    }).join('');
  }

  function parentCard(p) {
    store.kidDefaults(p);
    const sum = store.summary(p.id);
    const l = store.learn(p.id);
    const { strong, practise } = strengths(p);
    const todayMins = Math.round(store.todaySeconds(p.id) / 60);
    const todayStars = store.progress(p.id).days[store.today()]?.stars || 0;
    return `
    <div class="card profile-card kid-card">
      <div class="row gap"><span class="avatar lg">${esc(p.avatar)}</span><div><b>${esc(p.name)}</b><br><small>${esc(YEAR_INFO[p.year].long)} · ages ${YEAR_INFO[p.year].ages}</small></div></div>
      <div class="mini-stats">
        <span>Today: <b>${todayMins}</b> / ${Math.round(store.limitSeconds(p) / 60)} min · ⭐ <b>${todayStars}</b></span>
        <span>Total: <b>${sum.minutes}</b> min · ⭐ <b>${sum.stars}</b> stars · 🏅 <b>${l.stickers.length}</b> stickers · 🔥 <b>${sum.streak}</b> day streak</span>
      </div>
      <div class="sbars">${subjectBars(p)}</div>
      ${strong.length ? `<p class="tag-line">💪 <b>Strengths:</b> ${strong.map((r) => `<span class="tag good">${esc(r.topic.en || r.topic.title)} ${r.acc}%</span>`).join(' ')}</p>` : ''}
      ${practise.length ? `<p class="tag-line">🌱 <b>Needs practice:</b> ${practise.map((r) => `<span class="tag soft">${esc(r.topic.en || r.topic.title)} ${r.acc}%</span>`).join(' ')}</p>` : ''}
      ${!strong.length && !practise.length ? '<p class="hint">Strengths and topics to practise appear after a few games.</p>' : ''}
      <div class="row gap">
        <button class="btn small c1" data-action="go" data-to="weekly" data-id="${p.id}">📊 Weekly summary</button>
        <button class="btn small ghost" data-action="go" data-to="transcripts" data-id="${p.id}">💬 Buddy chats</button>
        <button class="btn small ghost" data-action="go" data-to="edit-profile" data-id="${p.id}">⚙️ Settings</button>
      </div>
    </div>`;
  }

  // ---------------------------------------------------------------- parents: weekly summary
  function barChart(values, { labels, unit, refLine, refLabel, max }) {
    const W = 320; const H = 170; const padL = 28; const padB = 26; const padT = 14;
    const top = Math.max(max || 0, refLine || 0, ...values, 1);
    const plotH = H - padB - padT;
    const bw = (W - padL - 8) / values.length;
    const y = (v) => padT + plotH - (v / top) * plotH;
    const bars = values.map((v, i) => {
      const x = padL + i * bw + 2;
      const h = Math.max(v ? 3 : 0, (v / top) * plotH);
      const w = bw - 6;
      const r = Math.min(4, w / 2, h);
      // rounded top, square base
      const path = h ? `M${x},${padT + plotH} v${-(h - r)} q0,${-r} ${r},${-r} h${w - 2 * r} q${r},0 ${r},${r} v${h - r} z` : '';
      return `<g class="bar-g"><rect x="${padL + i * bw}" y="${padT}" width="${bw}" height="${plotH}" fill="transparent"><title>${labels[i]}: ${v} ${unit}</title></rect>${path ? `<path d="${path}" class="bar"><title>${labels[i]}: ${v} ${unit}</title></path>` : ''}
        ${v ? `<text x="${x + w / 2}" y="${y(v) - 4}" class="val" text-anchor="middle">${v}</text>` : ''}
        <text x="${x + w / 2}" y="${H - 8}" class="axis-label" text-anchor="middle">${labels[i]}</text></g>`;
    }).join('');
    const ref = refLine ? `<line x1="${padL}" x2="${W - 4}" y1="${y(refLine)}" y2="${y(refLine)}" class="ref"/><text x="${W - 6}" y="${y(refLine) - 4}" text-anchor="end" class="axis-label">${refLabel}</text>` : '';
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${unit} per day">
      <line x1="${padL}" x2="${W - 4}" y1="${padT + plotH}" y2="${padT + plotH}" class="axis"/>
      <text x="${padL - 6}" y="${padT + 4}" text-anchor="end" class="axis-label">${top}</text>
      <text x="${padL - 6}" y="${padT + plotH}" text-anchor="end" class="axis-label">0</text>
      ${ref}${bars}</svg>`;
  }

  function weekly(id) {
    const p = store.get().profiles.find((x) => x.id === id);
    if (!p) return '';
    const w = store.week(p.id);
    const labels = w.map((d) => d.d.toLocaleDateString(undefined, { weekday: 'short' }));
    const limit = Number(p.minutes) || 20;
    const subjMins = SUBJECTS.concat([{ id: 'talk', title: 'Talk to Buddy', emoji: '💬' }]).map((s) => ({
      s, mins: Math.round(w.reduce((n, d) => n + (d.subjects[s.id] || 0), 0) / 60),
    }));
    const maxS = Math.max(1, ...subjMins.map((x) => x.mins));
    const totalMins = w.reduce((n, d) => n + d.mins, 0);
    const totalStars = w.reduce((n, d) => n + d.stars, 0);
    const totalActs = w.reduce((n, d) => n + d.acts, 0);
    const { rows } = strengths(p);
    const recent = rows.filter((r) => Date.now() - store.topicStats(p.id, r.topic.id).last < 7 * 86400000).sort((a, b) => b.plays - a.plays);
    return `
    <section class="weekly">
      <button class="back" data-action="go" data-to="parents">← Back</button>
      <h1>📊 ${esc(p.name)}'s week</h1>
      <div class="stat-grid">
        <div class="stat c1"><b>${totalMins}</b><small>minutes</small></div>
        <div class="stat c3"><b>${totalStars}</b><small>stars</small></div>
        <div class="stat c5"><b>${totalActs}</b><small>games played</small></div>
        <div class="stat c4"><b>${store.summary(p.id).streak}</b><small>day streak</small></div>
      </div>
      <div class="card"><h2>Minutes each day</h2>${barChart(w.map((d) => d.mins), { labels, unit: 'minutes', refLine: limit, refLabel: `limit ${limit}` })}</div>
      <div class="card"><h2>Stars each day</h2>${barChart(w.map((d) => d.stars), { labels, unit: 'stars' })}</div>
      <div class="card"><h2>Time per subject</h2>
        <div class="sbars">${subjMins.map(({ s, mins }) => `
          <div class="sbar"><span class="sbar-name">${s.emoji} ${s.id === 'arabic' ? 'Arabic' : s.title}</span>
          <span class="sbar-track" title="${mins} minutes"><span style="width:${(mins / maxS) * 100}%"></span></span><span class="sbar-val">${mins} min</span></div>`).join('')}
        </div>
      </div>
      <div class="card"><h2>Topics this week</h2>
        ${recent.length ? `<table class="table"><thead><tr><th>Topic</th><th>Games</th><th>Correct first try</th><th>Level</th></tr></thead><tbody>
          ${recent.map((r) => `<tr><td>${r.topic.emoji} ${esc(r.topic.en || r.topic.title)}</td><td>${r.plays}</td><td>${r.acc}%</td><td>${r.level} / 3</td></tr>`).join('')}
        </tbody></table>` : '<p class="hint">No games played this week yet.</p>'}
      </div>
      <details class="card"><summary>Show daily numbers as a table</summary>
        <table class="table"><thead><tr><th>Day</th><th>Minutes</th><th>Stars</th><th>Games</th></tr></thead><tbody>
          ${w.map((d, i) => `<tr><td>${labels[i]}</td><td>${d.mins}</td><td>${d.stars}</td><td>${d.acts}</td></tr>`).join('')}
        </tbody></table>
      </details>
    </section>`;
  }

  // ---------------------------------------------------------------- parents: child settings (inside the profile form)
  function settingsFields(p) {
    store.kidDefaults(p);
    const subjectLabel = { english: '🔤 English', maths: '🔢 Maths', science: '🔬 Science', arabic: '🌙 Arabic', talk: '💬 Talk to Buddy' };
    return `
      <label class="field"><span>Daily screen time (minutes)</span>
        <input name="minutes" type="number" inputmode="numeric" min="5" max="180" value="${esc(p.minutes)}">
        <small class="hint">When time is up, your child sees a friendly “Time to rest!” screen.</small></label>
      <div class="field"><span>Subjects</span>
        <div class="toggles">${store.KID_SUBJECTS.map((s) => `<label class="toggle"><input type="checkbox" name="subj-${s}" ${p.subjects[s] !== false ? 'checked' : ''}><span>${subjectLabel[s]}</span></label>`).join('')}</div>
      </div>
      <label class="toggle"><input type="checkbox" name="arHelper" ${p.arHelper !== false ? 'checked' : ''}><span>Say Arabic instructions in English too</span></label>
      <label class="toggle"><input type="checkbox" name="aiCheer" ${p.aiCheer !== false ? 'checked' : ''}><span>Buddy AI cheers after games (uses the internet)</span></label>`;
  }

  return {
    kidSay, home, afterHome, greet, subject, subjectIntro, activityShell, startActivity, result, afterResult, stickers, rest, restIntro,
    parentCard, weekly, settingsFields, overLimit, timeLeft, get current() { return current; },
    stop() { current = null; },
  };
}

export { YEARS, YEAR_INFO, TOPICS };
