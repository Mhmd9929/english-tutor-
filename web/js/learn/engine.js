// Runs one activity (3-8 questions) inside a container element.
// Audio-first: every question is spoken, with a big "hear again" button.
// Never says "wrong": a miss gets "Let's try again!" and a hint; after two misses the answer glows.
import { buddy } from './visuals.js';

const PRAISE_EN = ['Well done!', 'Brilliant!', 'Super!', 'Fantastic!', 'You did it!', 'Great job!', 'Amazing!', "Yes! That's right!"];
const PRAISE_AR = ['مُمْتَاز!', 'رَائِع!', 'أَحْسَنْت!', 'جَمِيلٌ جِدًّا!', 'بَطَل!'];
const AGAIN_EN = ["Let's try again!", 'Nearly! Try again.', 'Have another go!'];
const AGAIN_AR = ['لِنُحَاوِلْ مَرَّةً أُخْرَى!', 'حَاوِلْ مَرَّةً ثَانِيَة!'];
const AR_COUNT = ['وَاحِد', 'اِثْنَان', 'ثَلَاثَة', 'أَرْبَعَة', 'خَمْسَة', 'سِتَّة', 'سَبْعَة', 'ثَمَانِيَة', 'تِسْعَة', 'عَشَرَة', 'أَحَدَ عَشَرَ', 'اِثْنَا عَشَرَ', 'ثَلَاثَةَ عَشَرَ', 'أَرْبَعَةَ عَشَرَ', 'خَمْسَةَ عَشَرَ'];
const EN_COUNT = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const plainText = (html) => String(html).replace(/<[^>]+>/g, '').trim();

/** Builds the question list for one activity, with no repeated items. */
export function buildActivity(gen, rng, level, count) {
  const out = [];
  const keys = new Set();
  for (let tries = 0; out.length < count && tries < count * 25; tries++) {
    const q = gen(rng, level);
    if (keys.has(q.key)) continue;
    // avoid more than two drag/sort/trace questions in a row (they take longer)
    keys.add(q.key);
    out.push(q);
  }
  return out;
}

// ---------------------------------------------------------------- little sounds (no audio files needed)
let audioCtx = null;
function chime(kind = 'yes') {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = kind === 'yes' ? [660, 880, 1175] : kind === 'done' ? [523, 659, 784, 1046] : [330];
    notes.forEach((f, i) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      const t = audioCtx.currentTime + i * 0.11;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g).connect(audioCtx.destination);
      o.start(t);
      o.stop(t + 0.32);
    });
  } catch { /* audio not available */ }
}

/**
 * env: {
 *   speak(say, { lang }) -> Promise   say = string or [{text, lang, helper}]
 *   stop()
 *   onDone({ firstTry, total, results })
 *   onExit()
 *   title, rtl, lang ('en' | 'ar')
 * }
 */
export function runActivity(root, questions, env) {
  let index = 0;
  let firstTry = 0;
  const results = [];
  let q = null;
  let misses = 0;
  let locked = false;
  const lang = env.lang || 'en';
  const say = (s) => env.speak(s, { lang });
  const praise = () => (lang === 'ar' ? [{ text: pick(PRAISE_AR), lang: 'ar' }] : pick(PRAISE_EN));
  const again = () => (lang === 'ar' ? [{ text: pick(AGAIN_AR), lang: 'ar' }] : pick(AGAIN_EN));
  const asParts = (x) => [].concat(x).map((p) => (typeof p === 'string' ? { text: p } : p));
  const withHint = (first) => asParts(first).concat(q.hint ? asParts(q.hint) : []);

  function frame(inner) {
    const dots = questions.map((_, i) => `<span class="${i < index ? 'done' : i === index ? 'now' : ''}"></span>`).join('');
    return `
    <section class="activity ${env.rtl ? 'rtl' : ''}" ${env.rtl ? 'dir="rtl" lang="ar"' : ''}>
      <div class="act-top" dir="ltr">
        <button class="act-exit" data-act="exit" aria-label="Stop">✕</button>
        <div class="progress-dots" aria-label="Question ${index + 1} of ${questions.length}">${dots}</div>
        <span class="act-stars">⭐ ${firstTry}</span>
      </div>
      ${inner}
      <div class="celebrate" aria-hidden="true"></div>
    </section>`;
  }

  function head() {
    return `
      <div class="act-head">
        <div class="act-buddy">${buddy('happy')}</div>
        <button class="hear-again" data-act="hear" aria-label="Hear again">🔊</button>
        ${q.text ? `<div class="act-text">${q.text}</div>` : ''}
      </div>`;
  }

  function optionHtml(o) {
    const speaker = o.say ? `<span class="opt-say" data-say-opt="${o.id}" aria-label="Hear">🔈</span>` : '';
    return `<button class="opt" data-opt="${o.id}">${o.html}${speaker}</button>`;
  }

  function show() {
    q = questions[index];
    misses = 0;
    locked = false;
    let body = '';
    if (q.type === 'choice') {
      const cols = q.cols || (q.options.length === 4 ? 2 : q.options.length);
      body = `
        ${q.visual ? `<div class="act-visual">${q.visual}</div>` : ''}
        <div class="act-options cols-${cols} ${q.size || ''}">${q.options.map(optionHtml).join('')}</div>`;
    } else if (q.type === 'sort') {
      body = `
        <div class="bins cols-${q.bins.length}">${q.bins.map((b) => `<div class="bin" data-bin="${b.id}"><div class="bin-label">${b.html}<span class="lbl">${esc(b.label)}</span></div><div class="bin-items"></div></div>`).join('')}</div>
        <div class="sort-pool">${q.items.map((it) => `<button class="sort-item" data-item="${it.id}">${it.html}</button>`).join('')}</div>`;
    } else if (q.type === 'order') {
      body = `
        ${q.visual ? `<div class="act-visual">${q.visual}</div>` : ''}
        <div class="order-slots" dir="${q.rtl ? 'rtl' : 'ltr'}">${q.tiles.map((_, i) => `<div class="slot" data-slot="${i}"></div>`).join('')}</div>
        <div class="order-pool">${q.tiles.map((t) => `<button class="tile" data-tile="${t.id}">${t.html}</button>`).join('')}</div>`;
    } else if (q.type === 'trace') {
      body = `
        <div class="trace-wrap"><canvas class="trace-canvas" aria-label="Tracing area"></canvas></div>
        <div class="row center gap"><button class="btn big ghost" data-act="clear">🔄 Start again</button></div>`;
    }
    root.innerHTML = frame(head() + body);
    bind();
    if (q.type === 'trace') setupTrace();
    say(q.say);
  }

  // ---------------------------------------------------------------- events
  function bind() {
    root.querySelector('[data-act="exit"]').onclick = () => { env.stop(); env.onExit(); };
    root.querySelector('[data-act="hear"]').onclick = () => say(q.say);
    root.querySelectorAll('[data-say]').forEach((el) => {
      el.onclick = (e) => { e.stopPropagation(); env.speak([{ text: el.dataset.say, lang: el.dataset.lang || lang }], { lang }); };
    });
    root.querySelectorAll('.countable').forEach((el) => {
      el.onclick = () => {
        if (el.classList.contains('counted')) return;
        const n = root.querySelectorAll('.countable.counted').length;
        el.classList.add('counted');
        el.dataset.n = n + 1;
        const ar = q.countLang === 'ar';
        env.speak([{ text: ar ? AR_COUNT[n] : EN_COUNT[n], lang: ar ? 'ar' : 'en' }], { lang });
      };
    });
    if (q.type === 'choice') {
      root.querySelectorAll('[data-say-opt]').forEach((el) => {
        el.onclick = (e) => {
          e.stopPropagation();
          const o = q.options.find((x) => x.id === el.dataset.sayOpt);
          env.speak([{ text: o.say, lang: /[؀-ۿ]/.test(o.say) ? 'ar' : 'en' }], { lang });
        };
      });
      root.querySelectorAll('.opt').forEach((btn) => { btn.onclick = () => choose(btn); });
    }
    if (q.type === 'sort') setupSort();
    if (q.type === 'order') setupOrder();
    if (q.type === 'trace') root.querySelector('[data-act="clear"]').onclick = () => clearTrace();
  }

  function choose(btn) {
    if (locked) return;
    const id = btn.dataset.opt;
    if (id === q.answer) {
      success(btn);
    } else {
      btn.classList.remove('wiggle');
      void btn.offsetWidth;
      btn.classList.add('wiggle', 'tried');
      miss();
    }
  }

  function miss() {
    misses += 1;
    chime('again');
    if (misses >= 2 && q.type === 'choice') {
      root.querySelector(`[data-opt="${q.answer}"]`)?.classList.add('glow');
    }
    say(withHint(again()));
  }

  function celebrateFx() {
    const box = root.querySelector('.celebrate');
    if (!box) return;
    const bits = ['⭐', '🌟', '✨', '🎉', '💫', '🎈'];
    box.innerHTML = Array.from({ length: 18 }, (_, i) => `<span style="left:${Math.random() * 100}%;animation-delay:${(i % 6) * 0.05}s">${pick(bits)}</span>`).join('')
      + `<div class="cheer-buddy">${buddy('cheer')}</div>`;
    box.classList.add('on');
  }

  function success(el) {
    if (locked) return;
    locked = true;
    const clean = misses === 0;
    if (clean) firstTry += 1;
    results.push({ key: q.key, firstTry: clean });
    el?.classList.add('right');
    chime('yes');
    celebrateFx();
    const p = say(praise());
    const next = () => {
      index += 1;
      if (index >= questions.length) finish();
      else show();
    };
    // move on after the praise (or after a short time if speech is slow/unavailable)
    let moved = false;
    const go = () => { if (!moved) { moved = true; next(); } };
    const wait = window.__buddyFast ? 30 : 2200;
    Promise.race([p, new Promise((r) => setTimeout(r, wait))]).then(() => setTimeout(go, window.__buddyFast ? 10 : 250));
  }

  function finish() {
    chime('done');
    env.onDone({ firstTry, total: questions.length, results });
  }

  // ---------------------------------------------------------------- sorting (drag and drop, or tap then tap)
  function setupSort() {
    let selected = null;
    let mistakes = 0;
    const items = [...root.querySelectorAll('.sort-item')];
    const drop = (itemEl, binEl) => {
      if (!binEl) return;
      const it = q.items.find((x) => x.id === itemEl.dataset.item);
      if (it.bin === binEl.dataset.bin) {
        binEl.querySelector('.bin-items').appendChild(itemEl);
        itemEl.classList.add('placed');
        itemEl.classList.remove('selected');
        itemEl.disabled = true;
        chime('yes');
        if (it.say) env.speak([{ text: it.say, lang: /[؀-ۿ]/.test(it.say) ? 'ar' : 'en' }], { lang });
        if (!root.querySelector('.sort-pool .sort-item')) { misses = mistakes; success(null); }
      } else {
        mistakes += 1;
        itemEl.classList.remove('wiggle');
        void itemEl.offsetWidth;
        itemEl.classList.add('wiggle');
        misses = 0;
        say(withHint(again()));
        chime('again');
      }
    };
    for (const el of items) {
      let start = null;
      let ghost = null;
      el.addEventListener('pointerdown', (e) => {
        if (el.disabled) return;
        start = { x: e.clientX, y: e.clientY };
        el.setPointerCapture?.(e.pointerId);
      });
      el.addEventListener('pointermove', (e) => {
        if (!start) return;
        if (!ghost && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) {
          ghost = el.cloneNode(true);
          ghost.classList.add('ghost');
          document.body.appendChild(ghost);
          el.classList.add('dragging');
        }
        if (ghost) {
          ghost.style.left = `${e.clientX}px`;
          ghost.style.top = `${e.clientY}px`;
          root.querySelectorAll('.bin').forEach((b) => b.classList.remove('over'));
          const under = document.elementFromPoint(e.clientX, e.clientY)?.closest('.bin');
          under?.classList.add('over');
        }
      });
      const end = (e) => {
        if (!start) return;
        const wasDrag = !!ghost;
        if (ghost) { ghost.remove(); ghost = null; }
        el.classList.remove('dragging');
        root.querySelectorAll('.bin').forEach((b) => b.classList.remove('over'));
        start = null;
        if (wasDrag) {
          const bin = document.elementFromPoint(e.clientX, e.clientY)?.closest('.bin');
          drop(el, bin);
        } else {
          // tap to pick up, then tap a home
          items.forEach((x) => x.classList.remove('selected'));
          selected = el;
          el.classList.add('selected');
          const it = q.items.find((x) => x.id === el.dataset.item);
          if (it.say) env.speak([{ text: it.say, lang: /[؀-ۿ]/.test(it.say) ? 'ar' : 'en' }], { lang });
        }
      };
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', () => { if (ghost) ghost.remove(); ghost = null; start = null; el.classList.remove('dragging'); });
    }
    root.querySelectorAll('.bin').forEach((bin) => {
      bin.addEventListener('click', () => { if (selected && !selected.disabled) { drop(selected, bin); selected = null; } });
    });
  }

  // ---------------------------------------------------------------- ordering
  function setupOrder() {
    const slots = [...root.querySelectorAll('.slot')];
    const pool = root.querySelector('.order-pool');
    let tries = 0;
    const textOf = (id) => plainText(q.tiles.find((t) => t.id === id).html);
    const check = () => {
      const placed = slots.map((s) => s.firstElementChild?.dataset.tile);
      if (placed.some((x) => !x)) return;
      const ok = placed.map(textOf).join(' ') === q.answer.map(textOf).join(' ');
      if (ok) { misses = tries; success(root.querySelector('.order-slots')); return; }
      tries += 1;
      misses = tries;
      chime('again');
      root.querySelector('.order-slots').classList.add('wiggle');
      setTimeout(() => {
        root.querySelector('.order-slots')?.classList.remove('wiggle');
        slots.forEach((s) => { if (s.firstElementChild) pool.appendChild(s.firstElementChild); });
        if (tries >= 2) {
          // show the first piece in place to help
          const first = pool.querySelector(`[data-tile="${q.answer[0]}"]`) || [...pool.children].find((t) => textOf(t.dataset.tile) === textOf(q.answer[0]));
          if (first) { slots[0].appendChild(first); first.classList.add('glow'); }
        }
      }, 600);
      say(withHint(again()));
    };
    root.querySelectorAll('.tile').forEach((tile) => {
      tile.onclick = () => {
        if (locked) return;
        const t = q.tiles.find((x) => x.id === tile.dataset.tile);
        if (tile.parentElement.classList.contains('slot')) { pool.appendChild(tile); return; }
        const empty = slots.find((s) => !s.firstElementChild);
        if (!empty) return;
        empty.appendChild(tile);
        if (t.say) env.speak([{ text: t.say, lang: /[؀-ۿ]/.test(t.say) ? 'ar' : 'en' }], { lang });
        check();
      };
    });
  }

  // ---------------------------------------------------------------- tracing with a finger
  let trace = null;
  function setupTrace() {
    const canvas = root.querySelector('.trace-canvas');
    const wrap = root.querySelector('.trace-wrap');
    const size = Math.min(wrap.clientWidth || 300, 340);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const font = q.lang === 'ar' ? '"Noto Naskh Arabic", "Geeza Pro", "Arial", sans-serif' : '"Andika", "Comic Sans MS", "Century Gothic", "Nunito", sans-serif';
    const fontSize = Math.round(size * (q.glyph.length > 1 ? 0.5 : 0.68));
    const drawGlyph = (c, style, lineWidth = 0) => {
      c.save();
      c.font = `700 ${fontSize}px ${font}`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.direction = q.lang === 'ar' ? 'rtl' : 'ltr';
      if (lineWidth) { c.lineWidth = lineWidth; c.lineJoin = 'round'; c.strokeStyle = style; c.strokeText(q.glyph, size / 2, size / 2 + (q.lang === 'ar' ? -size * 0.04 : size * 0.02)); }
      c.fillStyle = style;
      c.fillText(q.glyph, size / 2, size / 2 + (q.lang === 'ar' ? -size * 0.04 : size * 0.02));
      c.restore();
    };
    const mk = () => { const c = document.createElement('canvas'); c.width = size; c.height = size; return c.getContext('2d', { willReadFrequently: true }); };
    const thin = mk(); drawGlyph(thin, '#000');
    const wide = mk(); drawGlyph(wide, '#000', size * 0.09);
    const ink = mk();
    const step = 3;
    const thinData = thin.getImageData(0, 0, size, size).data;
    const wideData = wide.getImageData(0, 0, size, size).data;
    let thinCount = 0;
    for (let y = 0; y < size; y += step) for (let x = 0; x < size; x += step) if (thinData[(y * size + x) * 4 + 3] > 100) thinCount++;
    const lineW = Math.max(16, size * 0.075);
    const redraw = () => {
      ctx.clearRect(0, 0, size, size);
      drawGlyph(ctx, 'rgba(124, 92, 255, .18)', 0);
      ctx.save();
      ctx.setLineDash([10, 10]);
      ctx.font = `700 ${fontSize}px ${font}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(124, 92, 255, .6)';
      ctx.strokeText(q.glyph, size / 2, size / 2 + (q.lang === 'ar' ? -size * 0.04 : size * 0.02));
      ctx.restore();
      ctx.drawImage(ink.canvas, 0, 0, size, size);
    };
    trace = { ink, redraw, strokes: 0, done: false };
    redraw();
    let last = null;
    const pos = (e) => { const r = canvas.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    canvas.addEventListener('pointerdown', (e) => {
      if (trace.done) return;
      e.preventDefault();
      canvas.setPointerCapture?.(e.pointerId);
      last = pos(e);
      ink.fillStyle = '#ff6fb5';
      ink.beginPath(); ink.arc(last.x, last.y, lineW / 2, 0, Math.PI * 2); ink.fill();
      redraw();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!last || trace.done) return;
      e.preventDefault();
      const p = pos(e);
      ink.strokeStyle = '#ff6fb5';
      ink.lineWidth = lineW;
      ink.lineCap = 'round';
      ink.beginPath(); ink.moveTo(last.x, last.y); ink.lineTo(p.x, p.y); ink.stroke();
      last = p;
      redraw();
    });
    const up = () => {
      if (!last) return;
      last = null;
      trace.strokes += 1;
      const inkData = ink.getImageData(0, 0, size, size).data;
      let covered = 0; let inkCount = 0; let outside = 0;
      for (let y = 0; y < size; y += step) {
        for (let x = 0; x < size; x += step) {
          const i = (y * size + x) * 4 + 3;
          const inked = inkData[i] > 50;
          if (inked) { inkCount++; if (wideData[i] < 50) outside++; }
          if (inked && thinData[i] > 100) covered++;
        }
      }
      const coverage = thinCount ? covered / thinCount : 0;
      const out = inkCount ? outside / inkCount : 1;
      trace.last = { coverage, out };
      const good = (coverage >= 0.6 && out <= 0.35) || (trace.strokes >= 5 && coverage >= 0.42 && out <= 0.5);
      if (good) { trace.done = true; success(canvas); }
      else if (trace.strokes === 4 && coverage < 0.3) say(withHint(lang === 'ar' ? [{ text: 'اِسْتَمِرّ!', lang: 'ar' }] : 'Keep going!'));
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
  }
  function clearTrace() {
    if (!trace || trace.done) return;
    trace.ink.clearRect(0, 0, trace.ink.canvas.width, trace.ink.canvas.height);
    trace.strokes = 0;
    trace.redraw();
  }

  show();
  return {
    // for tests: the current question
    get question() { return q; },
    get index() { return index; },
    answerNow() { // test helper: solve the current question
      if (q.type === 'choice') choose(root.querySelector(`[data-opt="${q.answer}"]`));
      else if (q.type === 'sort') { misses = 0; root.querySelectorAll('.sort-item').forEach((el) => { const it = q.items.find((x) => x.id === el.dataset.item); root.querySelector(`[data-bin="${it.bin}"] .bin-items`).appendChild(el); }); success(null); }
      else if (q.type === 'order') { success(null); }
      else if (q.type === 'trace') { success(null); }
    },
  };
}
