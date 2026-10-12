// Buddy Learning: subjects, year groups, topic catalogue and question-building helpers.
// The question banks live in one file per subject and are loaded only when needed.

export const YEARS = ['FS1', 'FS2', 'Y1'];
export const YEAR_INFO = {
  FS1: { label: 'FS1', long: 'Foundation Stage 1', ages: '3–4', questions: 4 },
  FS2: { label: 'FS2', long: 'Foundation Stage 2 (Reception)', ages: '4–5', questions: 5 },
  Y1: { label: 'Year 1', long: 'Year 1', ages: '5–6', questions: 6 },
};
export const isKidYear = (y) => YEARS.includes(y);

export const SUBJECTS = [
  { id: 'english', title: 'English', say: 'English', emoji: '🔤', colour: 'c1' },
  { id: 'maths', title: 'Maths', say: 'Maths', emoji: '🔢', colour: 'c3' },
  { id: 'science', title: 'Science', say: 'Science', emoji: '🔬', colour: 'c5' },
  { id: 'arabic', title: 'العربية', say: 'Arabic', emoji: '🌙', colour: 'c2', rtl: true },
];

// Topics: which subject, which year groups, title (spoken), emoji.
export const TOPICS = [
  // ---------------- English
  { id: 'e-listen', subject: 'english', years: ['FS1'], title: 'Listening games', emoji: '👂' },
  { id: 'e-rhyme', subject: 'english', years: ['FS1', 'FS2'], title: 'Rhyming words', emoji: '🎵' },
  { id: 'e-initial', subject: 'english', years: ['FS1', 'FS2'], title: 'First sounds', emoji: '🐍' },
  { id: 'e-names', subject: 'english', years: ['FS1'], title: 'Animals and things', emoji: '🐘' },
  { id: 'e-phase2', subject: 'english', years: ['FS2'], title: 'Phase 2 sounds', emoji: '🅰️' },
  { id: 'e-phase3', subject: 'english', years: ['FS2'], title: 'Phase 3 sounds', emoji: '🔠' },
  { id: 'e-blend', subject: 'english', years: ['FS2', 'Y1'], title: 'Blending words', emoji: '🧩' },
  { id: 'e-phase4', subject: 'english', years: ['FS2', 'Y1'], title: 'Phase 4 words', emoji: '🐸' },
  { id: 'e-tricky', subject: 'english', years: ['FS2', 'Y1'], title: 'Tricky words', emoji: '⭐' },
  { id: 'e-trace', subject: 'english', years: ['FS2', 'Y1'], title: 'Letter tracing', emoji: '✍️' },
  { id: 'e-phase5', subject: 'english', years: ['Y1'], title: 'Phase 5 sounds', emoji: '🌈' },
  { id: 'e-read', subject: 'english', years: ['Y1'], title: 'Read a sentence', emoji: '📖' },
  { id: 'e-comp', subject: 'english', years: ['Y1'], title: 'Story questions', emoji: '🤔' },
  { id: 'e-build', subject: 'english', years: ['Y1'], title: 'Build a sentence', emoji: '🧱' },
  // ---------------- Maths
  { id: 'm-count5', subject: 'maths', years: ['FS1'], title: 'Count to 5', emoji: '🖐️' },
  { id: 'm-count10', subject: 'maths', years: ['FS1', 'FS2'], title: 'Count to 10', emoji: '🔟' },
  { id: 'm-match', subject: 'maths', years: ['FS1'], title: 'Match the number', emoji: '🎯' },
  { id: 'm-shapes', subject: 'maths', years: ['FS1'], title: 'Shapes', emoji: '🔺' },
  { id: 'm-colours', subject: 'maths', years: ['FS1'], title: 'Colours', emoji: '🎨' },
  { id: 'm-size', subject: 'maths', years: ['FS1'], title: 'Big and small', emoji: '🐘' },
  { id: 'm-pattern', subject: 'maths', years: ['FS1', 'FS2'], title: 'Patterns', emoji: '🔁' },
  { id: 'm-num20', subject: 'maths', years: ['FS2'], title: 'Numbers to 20', emoji: '2️⃣' },
  { id: 'm-onemore', subject: 'maths', years: ['FS2'], title: 'One more, one less', emoji: '➕' },
  { id: 'm-add', subject: 'maths', years: ['FS2'], title: 'Adding', emoji: '🍎' },
  { id: 'm-sub', subject: 'maths', years: ['FS2'], title: 'Taking away', emoji: '🐦' },
  { id: 'm-shapes3d', subject: 'maths', years: ['FS2'], title: '2D and 3D shapes', emoji: '🧊' },
  { id: 'm-compare', subject: 'maths', years: ['FS2'], title: 'More or fewer', emoji: '⚖️' },
  { id: 'm-num100', subject: 'maths', years: ['Y1'], title: 'Numbers to 100', emoji: '💯' },
  { id: 'm-addsub20', subject: 'maths', years: ['Y1'], title: 'Add and subtract', emoji: '🧮' },
  { id: 'm-countby', subject: 'maths', years: ['Y1'], title: 'Count in 2s, 5s, 10s', emoji: '🦘' },
  { id: 'm-fractions', subject: 'maths', years: ['Y1'], title: 'Halves and quarters', emoji: '🍕' },
  { id: 'm-time', subject: 'maths', years: ['Y1'], title: 'Telling the time', emoji: '🕒' },
  { id: 'm-money', subject: 'maths', years: ['Y1'], title: 'Money (dirhams)', emoji: '🪙' },
  { id: 'm-measure', subject: 'maths', years: ['Y1'], title: 'Measuring', emoji: '📏' },
  // ---------------- Science (Understanding the World)
  { id: 's-homes', subject: 'science', years: ['FS1', 'FS2'], title: 'Animal homes', emoji: '🏡' },
  { id: 's-babies', subject: 'science', years: ['FS1', 'FS2'], title: 'Animal babies', emoji: '🐣' },
  { id: 's-body', subject: 'science', years: ['FS1', 'FS2'], title: 'My body', emoji: '🧍' },
  { id: 's-senses', subject: 'science', years: ['FS1', 'FS2'], title: 'Five senses', emoji: '👃' },
  { id: 's-weather', subject: 'science', years: ['FS1', 'FS2'], title: 'Weather', emoji: '🌦️' },
  { id: 's-daynight', subject: 'science', years: ['FS1', 'FS2'], title: 'Day and night', emoji: '🌙' },
  { id: 's-plants', subject: 'science', years: ['FS1', 'FS2'], title: 'Growing and changing', emoji: '🌱' },
  { id: 's-food', subject: 'science', years: ['FS1', 'FS2'], title: 'Healthy food', emoji: '🥦' },
  { id: 's-groups', subject: 'science', years: ['Y1'], title: 'Animal groups', emoji: '🦎' },
  { id: 's-diets', subject: 'science', years: ['Y1'], title: 'What animals eat', emoji: '🥩' },
  { id: 's-humans', subject: 'science', years: ['Y1'], title: 'Our bodies', emoji: '🫀' },
  { id: 's-plantparts', subject: 'science', years: ['Y1'], title: 'Plants and trees', emoji: '🌳' },
  { id: 's-materials', subject: 'science', years: ['Y1'], title: 'Materials', emoji: '🪵' },
  { id: 's-seasons', subject: 'science', years: ['Y1'], title: 'Seasons', emoji: '🍂' },
  // ---------------- Arabic
  { id: 'a-sounds', subject: 'arabic', years: ['FS1'], title: 'أصوات الحروف', en: 'Letter sounds', emoji: 'ب' },
  { id: 'a-colours', subject: 'arabic', years: ['FS1', 'FS2'], title: 'الألوان', en: 'Colours', emoji: '🎨' },
  { id: 'a-numbers', subject: 'arabic', years: ['FS1', 'FS2'], title: 'الأرقام ١–١٠', en: 'Numbers 1–10', emoji: '٣' },
  { id: 'a-family', subject: 'arabic', years: ['FS1', 'FS2'], title: 'العائلة والحيوانات', en: 'Family and animals', emoji: '👨‍👩‍👧' },
  { id: 'a-letters', subject: 'arabic', years: ['FS2', 'Y1'], title: 'الحروف الهجائية', en: 'The 28 letters', emoji: 'أ' },
  { id: 'a-trace', subject: 'arabic', years: ['FS2', 'Y1'], title: 'كتابة الحروف', en: 'Letter tracing', emoji: '✍️' },
  { id: 'a-vowels', subject: 'arabic', years: ['FS2', 'Y1'], title: 'الحركات', en: 'Short vowels', emoji: 'بَ' },
  { id: 'a-digits', subject: 'arabic', years: ['FS2'], title: 'الأرقام العربية', en: 'Arabic numbers', emoji: '٧' },
  { id: 'a-forms', subject: 'arabic', years: ['Y1'], title: 'أشكال الحروف', en: 'Letter shapes', emoji: 'ـبـ' },
  { id: 'a-long', subject: 'arabic', years: ['Y1'], title: 'المدود', en: 'Long vowels', emoji: 'بَا' },
  { id: 'a-words', subject: 'arabic', years: ['Y1'], title: 'قراءة الكلمات', en: 'Reading words', emoji: '📗' },
  { id: 'a-sentences', subject: 'arabic', years: ['Y1'], title: 'جمل قصيرة', en: 'Short sentences', emoji: '📝' },
  { id: 'a-vocab', subject: 'arabic', years: ['Y1'], title: 'كلمات كل يوم', en: 'Everyday words', emoji: '🎒' },
];

export const topicById = (id) => TOPICS.find((t) => t.id === id);
export const topicsFor = (subject, year) => TOPICS.filter((t) => t.subject === subject && t.years.includes(year));

const loaders = {
  english: () => import('./english.js'),
  maths: () => import('./maths.js'),
  science: () => import('./science.js'),
  arabic: () => import('./arabic.js'),
};
/** Loads a subject's question generators (lazy, cached by the browser). */
export async function loadSubject(subject) {
  const mod = await loaders[subject]();
  return mod.GENERATORS;
}

// ---------------------------------------------------------------- random helpers
/** Small seeded random generator so tests can be repeatable. */
export function makeRng(seed = Date.now()) {
  let s = seed >>> 0 || 1;
  const next = () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  return {
    next,
    int: (a, b) => a + Math.floor(next() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    shuffle: (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(next() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    sample(arr, n) { return this.shuffle(arr).slice(0, n); },
  };
}

/**
 * Builds a multiple-choice question. `right` and each of `wrong` are { html, say?, label? }.
 * Options are shuffled; the answer id is returned in `answer`.
 */
export function choice(rng, { key, say, text, visual, right, wrong, hint, size = '', cols = 0, rtl = false }) {
  const opts = rng.shuffle([{ ...right, ok: true }, ...wrong]).map((o, i) => ({ ...o, id: `o${i}` }));
  return {
    key, type: 'choice', say, text, visual, hint, size, cols, rtl,
    options: opts.map(({ ok, ...o }) => o),
    answer: opts.find((o) => o.ok).id,
  };
}

/** Picks `n` distractors from `pool` that differ from `answer` by `same(a, b)` (default ===). */
export function distractors(rng, pool, answer, n, same = (a, b) => a === b) {
  return rng.shuffle(pool.filter((x) => !same(x, answer))).slice(0, n);
}

export const emojiCard = (e, label = '') => ({ html: `<span class="emo">${e}</span>${label ? `<span class="lbl">${label}</span>` : ''}` });
export const textCard = (t, cls = '') => ({ html: `<span class="word ${cls}">${t}</span>` });
export const numberWords = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
