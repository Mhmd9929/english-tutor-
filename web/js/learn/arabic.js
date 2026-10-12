// Arabic (Modern Standard Arabic): letters and sounds, short and long vowels, letter forms,
// numbers, colours, family and animal words, reading words and short sentences.
// Questions are spoken in Arabic; an English helper line can follow (parents can turn it off).
import { choice, emojiCard } from './core.js';
import { blob, group } from './visuals.js';

const ar = (text) => ({ text, lang: 'ar' });
const en = (text) => ({ text, lang: 'en', helper: true });
const arCard = (t, cls = '') => ({ html: `<span class="ar-text ${cls}" lang="ar" dir="rtl">${t}</span>` });
const Q = (rng, o) => choice(rng, { ...o, rtl: true });

// [letter, name, transliteration of the sound with fatha, example word, emoji, English meaning, connects to the next letter]
const LETTERS = [
  ['ا', 'أَلِف', 'a', 'أَسَد', '🦁', 'lion', false], ['ب', 'بَاء', 'ba', 'بَطَّة', '🦆', 'duck', true], ['ت', 'تَاء', 'ta', 'تُفَّاحَة', '🍎', 'apple', true],
  ['ث', 'ثَاء', 'tha', 'ثَعْلَب', '🦊', 'fox', true], ['ج', 'جِيم', 'ja', 'جَمَل', '🐫', 'camel', true], ['ح', 'حَاء', 'ha', 'حِصَان', '🐴', 'horse', true],
  ['خ', 'خَاء', 'kha', 'خَرُوف', '🐑', 'sheep', true], ['د', 'دَال', 'da', 'دُبّ', '🐻', 'bear', false], ['ذ', 'ذَال', 'dha', 'ذُرَة', '🌽', 'corn', false],
  ['ر', 'رَاء', 'ra', 'رِيشَة', '🪶', 'feather', false], ['ز', 'زَاي', 'za', 'زَرَافَة', '🦒', 'giraffe', false], ['س', 'سِين', 'sa', 'سَمَكَة', '🐟', 'fish', true],
  ['ش', 'شِين', 'sha', 'شَمْس', '☀️', 'sun', true], ['ص', 'صَاد', 'sa', 'صَقْر', '🦅', 'falcon', true], ['ض', 'ضَاد', 'da', 'ضِفْدَع', '🐸', 'frog', true],
  ['ط', 'طَاء', 'ta', 'طَائِرَة', '✈️', 'aeroplane', true], ['ظ', 'ظَاء', 'dha', 'ظَرْف', '✉️', 'envelope', true], ['ع', 'عَيْن', 'a', 'عَيْن', '👁️', 'eye', true],
  ['غ', 'غَيْن', 'gha', 'غَيْمَة', '☁️', 'cloud', true], ['ف', 'فَاء', 'fa', 'فِيل', '🐘', 'elephant', true], ['ق', 'قَاف', 'qa', 'قَمَر', '🌙', 'moon', true],
  ['ك', 'كَاف', 'ka', 'كَلْب', '🐶', 'dog', true], ['ل', 'لَام', 'la', 'لَيْمُون', '🍋', 'lemon', true], ['م', 'مِيم', 'ma', 'مَوْز', '🍌', 'banana', true],
  ['ن', 'نُون', 'na', 'نَحْلَة', '🐝', 'bee', true], ['ه', 'هَاء', 'ha', 'هَدِيَّة', '🎁', 'present', true], ['و', 'وَاو', 'wa', 'وَرْدَة', '🌹', 'rose', false],
  ['ي', 'يَاء', 'ya', 'يَد', '✋', 'hand', true],
];
// Letters that look alike (only mixed together at the harder level).
const LOOKALIKE = [['ب', 'ت', 'ث', 'ن', 'ي'], ['ج', 'ح', 'خ'], ['د', 'ذ'], ['ر', 'ز'], ['س', 'ش'], ['ص', 'ض'], ['ط', 'ظ'], ['ع', 'غ'], ['ف', 'ق']];
const looksLike = (a, b) => LOOKALIKE.some((g) => g.includes(a) && g.includes(b));
const FATHA = 'َ';
const KASRA = 'ِ';
const DAMMA = 'ُ';
const withHamza = (l) => (l === 'ا' ? 'أ' : l);

function letterDistractors(rng, letter, level, n) {
  const pool = LETTERS.map((l) => l[0]).filter((x) => x !== letter);
  if (level >= 3) {
    const similar = pool.filter((x) => looksLike(x, letter));
    return rng.shuffle([...rng.sample(similar, Math.min(similar.length, n)), ...rng.sample(pool.filter((x) => !looksLike(x, letter)), n)]).slice(0, n);
  }
  return rng.sample(pool.filter((x) => !looksLike(x, letter)), n);
}

// ---------------------------------------------------------------- FS1: letter sounds
function sounds(rng, level) {
  const pool = level === 1 ? LETTERS.slice(0, 14) : LETTERS;
  const [l, name, tr, word, emoji, meaning] = rng.pick(pool);
  const sound = withHamza(l) + FATHA;
  if (rng.next() < 0.5) {
    return Q(rng, {
      key: `asound-hear-${l}`,
      say: [ar(`اِسْمَعْ: ${sound}، ${word}. أَيْنَ الْحَرْف؟`), en(`Listen: ${tr}, as in ${meaning}. Which letter makes this sound?`)],
      visual: `<div class="big-emoji">${emoji}</div>`,
      right: arCard(l, 'letter'), wrong: letterDistractors(rng, l, level, level >= 2 ? 2 : 1).map((x) => arCard(x, 'letter')),
      hint: [ar(`هٰذَا حَرْفُ ${name}`), en(`This is the letter ${name}. It says ${tr}.`)],
    });
  }
  const wrong = rng.sample(LETTERS.filter((x) => x[0] !== l && !looksLike(x[0], l)), level >= 2 ? 2 : 1);
  return Q(rng, {
    key: `asound-pic-${l}`,
    say: [ar(`${sound}. أَيُّ صُورَةٍ تَبْدَأُ بِحَرْفِ ${name}؟`), en(`${tr}. Which picture starts with this sound?`)],
    visual: `<div class="ar-text letter big">${l}</div>`,
    right: { ...emojiCard(emoji), say: word }, wrong: wrong.map((w) => ({ ...emojiCard(w[4]), say: w[3] })), size: 'xl',
    hint: [ar(`${word} تَبْدَأُ بِـ${sound}`), en(`${meaning} in Arabic is ${word}. It starts with ${tr}.`)],
  });
}

// ---------------------------------------------------------------- colours
const COLOURS_AR = [
  ['red', 'أَحْمَر', 'الأَحْمَر', ['🍎', '🍓', '🌹']], ['blue', 'أَزْرَق', 'الأَزْرَق', ['🫐', '🐳', '💙']], ['yellow', 'أَصْفَر', 'الأَصْفَر', ['🍌', '🌻', '🍋']],
  ['green', 'أَخْضَر', 'الأَخْضَر', ['🥦', '🐸', '🍏']], ['orange', 'بُرْتُقَالِيّ', 'البُرْتُقَالِيّ', ['🍊', '🥕', '🎃']], ['purple', 'بَنَفْسَجِيّ', 'البَنَفْسَجِيّ', ['🍇', '🍆', '🔮']],
  ['pink', 'وَرْدِيّ', 'الوَرْدِيّ', ['🌸', '🐷', '🩷']], ['brown', 'بُنِّيّ', 'البُنِّيّ', ['🐻', '🥔', '🪵']], ['black', 'أَسْوَد', 'الأَسْوَد', ['🎱', '🐈‍⬛', '🖤']],
  ['white', 'أَبْيَض', 'الأَبْيَض', ['🐑', '☁️', '🥚']], ['grey', 'رَمَادِيّ', 'الرَّمَادِيّ', ['🐘', '🐭', '🩶']],
];
function colours(rng, level) {
  const pool = level === 1 ? COLOURS_AR.slice(0, 6) : COLOURS_AR;
  const [c, word, defn, things] = rng.pick(pool);
  const others = rng.sample(pool.filter((x) => x[0] !== c), level >= 3 ? 3 : 2);
  if (level >= 2 && rng.next() < 0.3) {
    return Q(rng, {
      key: `acolour-name-${c}`,
      say: [ar('مَا هٰذَا اللَّوْن؟'), en('What colour is this? Choose the Arabic word.')],
      visual: blob(c),
      right: { ...arCard(word), say: word }, wrong: others.map((x) => ({ ...arCard(x[1]), say: x[1] })),
      hint: [ar(word), en(`This colour is ${c}: ${word}.`)],
    });
  }
  const objects = level >= 2 && rng.next() < 0.5;
  const card = (x) => (objects ? emojiCard(rng.pick(x[3])) : { html: blob(x[0]) });
  return Q(rng, {
    key: `acolour-${c}-${objects ? 'o' : 'b'}`,
    say: [ar(`أَيْنَ اللَّوْنُ ${defn}؟`), en(`Where is ${word}? That means ${c}.`)],
    text: `<span class="ar-text">${word}</span>`,
    right: card([c, word, defn, things]), wrong: others.map(card), size: objects ? 'xl' : '',
    hint: [ar(`هٰذَا ${word}`), en(`${word} is ${c}.`)],
  });
}

// ---------------------------------------------------------------- numbers
const AR_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const toArabicDigits = (n) => String(n).split('').map((d) => AR_DIGITS[+d]).join('');
const NUM_AR = ['صِفْر', 'وَاحِد', 'اِثْنَان', 'ثَلَاثَة', 'أَرْبَعَة', 'خَمْسَة', 'سِتَّة', 'سَبْعَة', 'ثَمَانِيَة', 'تِسْعَة', 'عَشَرَة',
  'أَحَدَ عَشَرَ', 'اِثْنَا عَشَرَ', 'ثَلَاثَةَ عَشَرَ', 'أَرْبَعَةَ عَشَرَ', 'خَمْسَةَ عَشَرَ', 'سِتَّةَ عَشَرَ', 'سَبْعَةَ عَشَرَ', 'ثَمَانِيَةَ عَشَرَ', 'تِسْعَةَ عَشَرَ', 'عِشْرُون'];
const NUM_EN = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const THINGS = ['🍎', '⭐', '🐟', '🌸', '🚗', '🐤', '🎈', '🍪'];
const nearNums = (rng, n, k, min, max) => rng.sample([...Array(max - min + 1).keys()].map((i) => i + min).filter((x) => x !== n && Math.abs(x - n) <= 3), k);

function numbers(rng, level) {
  const max = level === 1 ? 5 : 10;
  const n = rng.int(1, max);
  const e = rng.pick(THINGS);
  if (level <= 1 || rng.next() < 0.5) {
    return Q(rng, {
      key: `anum-group-${n}-${e}`,
      say: [ar(`أَيْنَ ${NUM_AR[n]}؟`), en(`Find ${NUM_EN[n]}. In Arabic: ${NUM_AR[n]}.`)],
      text: `<span class="ar-text">${NUM_AR[n]}</span>`,
      right: { html: group(e, n, { size: 'small' }), say: NUM_AR[n] }, wrong: nearNums(rng, n, 2, 1, max).map((x) => ({ html: group(e, x, { size: 'small' }) })), cols: 1,
      hint: [ar(`عُدَّ مَعِي`), en(`Count with me: ${Array.from({ length: n }, (_, i) => NUM_AR[i + 1]).join('، ')}.`)],
    });
  }
  return Q(rng, {
    key: `anum-count-${n}-${e}`,
    say: [ar('كَمْ عَدَدُهَا؟'), en('How many are there? Tap each one to count.')],
    visual: group(e, n, { countable: true }),
    right: { ...arCard(toArabicDigits(n), 'numeral'), say: NUM_AR[n] }, wrong: nearNums(rng, n, 2, 1, 10).map((x) => arCard(toArabicDigits(x), 'numeral')),
    hint: [ar(NUM_AR[n]), en(`It is ${NUM_EN[n]}: ${toArabicDigits(n)}.`)],
    countLang: 'ar',
  });
}

function digits(rng, level) {
  const max = level === 1 ? 10 : 20;
  const n = rng.int(0, max);
  const form = rng.int(1, 3);
  const wrong = nearNums(rng, n, 2, 0, max);
  if (form === 1) {
    return Q(rng, {
      key: `adigit-hear-${n}`,
      say: [ar(`أَيْنَ الرَّقْمُ ${NUM_AR[n]}؟`), en(`Find the Arabic number ${NUM_EN[n]}.`)],
      right: arCard(toArabicDigits(n), 'numeral'), wrong: wrong.map((x) => arCard(toArabicDigits(x), 'numeral')),
      hint: [ar(NUM_AR[n]), en(`${NUM_EN[n]} is written ${toArabicDigits(n)}.`)],
    });
  }
  if (form === 2) {
    return Q(rng, {
      key: `adigit-match-${n}`,
      say: [ar('أَيُّ رَقْمٍ عَرَبِيٍّ هٰذَا؟'), en(`Which Arabic number is the same as ${n}?`)],
      visual: `<div class="numeral big">${n}</div>`,
      right: arCard(toArabicDigits(n), 'numeral'), wrong: wrong.map((x) => arCard(toArabicDigits(x), 'numeral')),
      hint: [ar(NUM_AR[n]), en(`${n} in Arabic numbers is ${toArabicDigits(n)}.`)],
    });
  }
  const m = Math.max(1, Math.min(n, 12));
  const e = rng.pick(THINGS);
  return Q(rng, {
    key: `adigit-count-${m}-${e}`,
    say: [ar('عُدَّ ثُمَّ اخْتَرِ الرَّقْمَ'), en('Count, then choose the Arabic number.')],
    visual: group(e, m, { countable: true }),
    right: { ...arCard(toArabicDigits(m), 'numeral'), say: NUM_AR[m] }, wrong: nearNums(rng, m, 2, 1, 15).map((x) => arCard(toArabicDigits(x), 'numeral')),
    hint: [ar(NUM_AR[m]), en(`There are ${NUM_EN[m]}.`)],
    countLang: 'ar',
  });
}

// ---------------------------------------------------------------- family & animals
const FAMILY = [
  ['👨', 'الأَب', 'father'], ['👩', 'الأُمّ', 'mother'], ['👦', 'الأَخ', 'brother'], ['👧', 'الأُخْت', 'sister'], ['👴', 'الجَدّ', 'grandfather'],
  ['👵', 'الجَدَّة', 'grandmother'], ['👶', 'الطِّفْل', 'baby'],
  ['🐱', 'القِطَّة', 'cat'], ['🐶', 'الكَلْب', 'dog'], ['🦁', 'الأَسَد', 'lion'], ['🐘', 'الفِيل', 'elephant'], ['🐫', 'الجَمَل', 'camel'],
  ['🐴', 'الحِصَان', 'horse'], ['🐄', 'البَقَرَة', 'cow'], ['🐑', 'الخَرُوف', 'sheep'], ['🐔', 'الدَّجَاجَة', 'hen'], ['🐟', 'السَّمَكَة', 'fish'],
  ['🐦', 'العُصْفُور', 'bird'], ['🐰', 'الأَرْنَب', 'rabbit'], ['🦆', 'البَطَّة', 'duck'], ['🐒', 'القِرْد', 'monkey'], ['🦒', 'الزَّرَافَة', 'giraffe'],
  ['🐯', 'النَّمِر', 'tiger'], ['🐻', 'الدُّبّ', 'bear'], ['🐭', 'الفَأْر', 'mouse'], ['🐸', 'الضِّفْدَع', 'frog'], ['🦋', 'الفَرَاشَة', 'butterfly'],
  ['🐝', 'النَّحْلَة', 'bee'], ['🐢', 'السُّلَحْفَاة', 'turtle'], ['🫏', 'الحِمَار', 'donkey'], ['🐐', 'العَنْزَة', 'goat'],
];
function family(rng, level) {
  const pool = level === 1 ? FAMILY.slice(0, 18) : FAMILY;
  const [e, word, meaning] = rng.pick(pool);
  const wrong = rng.sample(pool.filter((x) => x[0] !== e), level >= 2 ? 2 : 1);
  return Q(rng, {
    key: `afam-${meaning}`,
    say: [ar(`أَيْنَ ${word}؟`), en(`Where is the ${meaning}?`)],
    text: `<span class="ar-text">${word}</span>`,
    right: emojiCard(e), wrong: wrong.map((w) => emojiCard(w[0])), size: 'xl',
    hint: [ar(`هٰذَا ${word}`), en(`${word} means ${meaning}.`)],
  });
}

// ---------------------------------------------------------------- FS2: the 28 letters
function letters(rng, level) {
  const [l, name, tr, word, emoji, meaning] = rng.pick(LETTERS);
  if (rng.next() < 0.5) {
    const wrong = rng.sample(LETTERS.filter((x) => x[0] !== l && !looksLike(x[0], l)), 2);
    return Q(rng, {
      key: `aletter-pic-${l}`,
      say: [ar(`هٰذَا حَرْفُ ${name}. أَيُّ صُورَةٍ تَبْدَأُ بِهِ؟`), en(`This is ${name}. Which picture starts with it?`)],
      visual: `<div class="ar-text letter big">${l}</div>`,
      right: { ...emojiCard(emoji), say: word }, wrong: wrong.map((w) => ({ ...emojiCard(w[4]), say: w[3] })), size: 'xl',
      hint: [ar(`${word}`), en(`${word} means ${meaning}. It starts with ${name}.`)],
    });
  }
  return Q(rng, {
    key: `aletter-name-${l}`,
    say: [ar(`أَيْنَ حَرْفُ ${name}؟`), en(`Find the letter ${name}.`)],
    right: arCard(l, 'letter'), wrong: letterDistractors(rng, l, level, level >= 2 ? 3 : 2).map((x) => arCard(x, 'letter')),
    hint: [ar(`${name}: ${withHamza(l)}${FATHA}، ${word}`), en(`${name} says ${tr}, as in ${word}.`)],
  });
}

// ---------------------------------------------------------------- tracing
const INITIAL_FORMS = ['ب', 'ت', 'ث', 'ن', 'ي', 'ج', 'ح', 'خ'];
function trace(rng, level) {
  const useForm = level >= 3 && rng.next() < 0.4;
  if (useForm) {
    const l = rng.pick(INITIAL_FORMS);
    const info = LETTERS.find((x) => x[0] === l);
    return { key: `atrace-init-${l}`, type: 'trace', glyph: `${l}ـ`, lang: 'ar', rtl: true, say: [ar(`اُكْتُبْ ${info[1]} فِي أَوَّلِ الْكَلِمَة`), en(`Trace ${info[1]} as it looks at the start of a word.`)], hint: [en('Follow the grey letter with your finger.')] };
  }
  const pool = level === 1 ? LETTERS.slice(0, 10) : LETTERS;
  const [l, name, tr] = rng.pick(pool);
  return { key: `atrace-${l}`, type: 'trace', glyph: l, lang: 'ar', rtl: true, say: [ar(`اُكْتُبْ حَرْفَ ${name}`), en(`Trace the letter ${name}. It says ${tr}.`)], hint: [en('Follow the grey letter with your finger.')] };
}

// ---------------------------------------------------------------- short vowels
const VOWEL = { fatha: [FATHA, 'فَتْحَة', 'a'], kasra: [KASRA, 'كَسْرَة', 'i'], damma: [DAMMA, 'ضَمَّة', 'u'] };
function vowels(rng, level) {
  const pool = level === 1 ? LETTERS.slice(1, 14) : LETTERS.slice(1);
  const [l, name] = rng.pick(pool);
  const v = rng.pick(Object.keys(VOWEL));
  const syl = (k) => l + VOWEL[k][0];
  return Q(rng, {
    key: `avowel-${l}-${v}`,
    say: [ar(`اِسْمَعْ: ${syl(v)}`), en(`Listen. Which one says this? ${v} makes the sound ${VOWEL[v][2]}.`)],
    right: arCard(syl(v), 'letter'), wrong: Object.keys(VOWEL).filter((k) => k !== v).map((k) => arCard(syl(k), 'letter')),
    hint: [ar(`${name} مَعَ ${VOWEL[v][1]}: ${syl(v)}`), en(`Look for the ${v}. ${v === 'fatha' ? 'It is a small line above.' : v === 'kasra' ? 'It is a small line below.' : 'It is a little curl above.'}`)],
  });
}

// ---------------------------------------------------------------- Year 1: letter forms
const POS = { start: ['بِدَايَة', 'beginning'], middle: ['وَسَط', 'middle'], end: ['نِهَايَة', 'end'] };
const form = (l, pos) => (pos === 'start' ? `${l}ـ` : pos === 'middle' ? `ـ${l}ـ` : `ـ${l}`);
function forms(rng) {
  const [l, name] = rng.pick(LETTERS.filter((x) => x[6]));
  const pos = rng.pick(Object.keys(POS));
  if (rng.next() < 0.5) {
    return Q(rng, {
      key: `aform-where-${l}-${pos}`,
      say: [ar(`أَيْنَ يَكُونُ هٰذَا الشَّكْلُ مِنْ حَرْفِ ${name}؟`), en(`Is this shape of ${name} at the beginning, the middle or the end of a word?`)],
      visual: `<div class="ar-text letter big">${form(l, pos)}</div>`,
      right: { html: `<span class="ar-text">${POS[pos][0]}</span><span class="lbl">${POS[pos][1]}</span>`, say: POS[pos][0] },
      wrong: Object.keys(POS).filter((p) => p !== pos).map((p) => ({ html: `<span class="ar-text">${POS[p][0]}</span><span class="lbl">${POS[p][1]}</span>`, say: POS[p][0] })),
      hint: [en(pos === 'start' ? 'It joins only on the left, so it starts the word.' : pos === 'middle' ? 'It joins on both sides, so it is in the middle.' : 'It joins only on the right, so it ends the word.')],
    });
  }
  return Q(rng, {
    key: `aform-find-${l}-${pos}`,
    say: [ar(`أَيْنَ ${name} فِي ${pos === 'start' ? 'بِدَايَةِ' : pos === 'middle' ? 'وَسَطِ' : 'نِهَايَةِ'} الْكَلِمَة؟`), en(`Find ${name} as it looks at the ${POS[pos][1]} of a word.`)],
    right: arCard(form(l, pos), 'letter'), wrong: Object.keys(POS).filter((p) => p !== pos).map((p) => arCard(form(l, p), 'letter')),
    hint: [en(pos === 'start' ? 'At the beginning, the letter joins to the next letter on its left.' : pos === 'middle' ? 'In the middle, it joins on both sides.' : 'At the end, it joins only on its right side.')],
  });
}

// ---------------------------------------------------------------- Year 1: long vowels
const LONG = { a: [`${FATHA}ا`, 'أَلِف', 'aa'], u: [`${DAMMA}و`, 'وَاو', 'oo'], i: [`${KASRA}ي`, 'يَاء', 'ee'] };
function long(rng) {
  const [l, name] = rng.pick(LETTERS.slice(1));
  const v = rng.pick(Object.keys(LONG));
  const syl = (k) => l + LONG[k][0];
  return Q(rng, {
    key: `along-${l}-${v}`,
    say: [ar(`اِسْمَعْ: ${syl(v)}`), en(`Listen. Which one makes the long sound ${LONG[v][2]}?`)],
    right: arCard(syl(v), 'letter'), wrong: Object.keys(LONG).filter((k) => k !== v).map((k) => arCard(syl(k), 'letter')),
    hint: [ar(`${name} وَ${LONG[v][1]}: ${syl(v)}`), en(`${LONG[v][1]} makes the vowel long: ${LONG[v][2]}.`)],
  });
}

// ---------------------------------------------------------------- Year 1: reading words
const WORDS = [
  ['قِطَّة', '🐱', 'cat'], ['كَلْب', '🐶', 'dog'], ['بَيْت', '🏠', 'house'], ['شَمْس', '☀️', 'sun'], ['قَمَر', '🌙', 'moon'], ['تُفَّاحَة', '🍎', 'apple'],
  ['مَوْز', '🍌', 'banana'], ['سَمَكَة', '🐟', 'fish'], ['وَرْدَة', '🌹', 'rose'], ['كِتَاب', '📖', 'book'], ['قَلَم', '✏️', 'pencil'], ['بَاب', '🚪', 'door'],
  ['وَلَد', '👦', 'boy'], ['بِنْت', '👧', 'girl'], ['جَمَل', '🐫', 'camel'], ['فِيل', '🐘', 'elephant'], ['أَسَد', '🦁', 'lion'], ['دُبّ', '🐻', 'bear'],
  ['يَد', '✋', 'hand'], ['عَيْن', '👁️', 'eye'], ['أَرْنَب', '🐰', 'rabbit'], ['بَطَّة', '🦆', 'duck'], ['حِصَان', '🐴', 'horse'], ['سَيَّارَة', '🚗', 'car'],
  ['طَائِرَة', '✈️', 'aeroplane'], ['شَجَرَة', '🌳', 'tree'], ['نَجْمَة', '⭐', 'star'], ['كُرَة', '⚽', 'ball'], ['حَلِيب', '🥛', 'milk'], ['خُبْز', '🍞', 'bread'],
  ['مَاء', '💧', 'water'], ['بَيْضَة', '🥚', 'egg'], ['سَاعَة', '⏰', 'clock'], ['سَرِير', '🛏️', 'bed'], ['كُرْسِيّ', '🪑', 'chair'],
];
function words(rng, level) {
  const [w, e, meaning] = rng.pick(WORDS);
  const wrong = rng.sample(WORDS.filter((x) => x[1] !== e), level >= 2 ? 2 : 1);
  return Q(rng, {
    key: `aword-${meaning}`,
    say: [ar('اِقْرَأِ الْكَلِمَةَ. أَيُّ صُورَةٍ تُنَاسِبُهَا؟'), en('Read the word. Which picture matches?')],
    visual: `<div class="ar-text word-big" data-say="${w}" data-lang="ar">${w}</div>`,
    right: emojiCard(e), wrong: wrong.map((x) => emojiCard(x[1])), size: 'xl',
    hint: [ar(w), en(`${w} means ${meaning}.`)],
  });
}

// ---------------------------------------------------------------- Year 1: short sentences
const SENTENCES = [
  ['هٰذَا قِطٌّ.', '🐱', 'This is a cat.'], ['هٰذِهِ شَمْسٌ.', '☀️', 'This is a sun.'], ['الْوَلَدُ يَلْعَبُ بِالْكُرَةِ.', '⚽', 'The boy plays with the ball.'],
  ['الْبِنْتُ تَقْرَأُ كِتَابًا.', '📖', 'The girl reads a book.'], ['السَّمَكَةُ فِي الْمَاءِ.', '🐟', 'The fish is in the water.'], ['الْقَمَرُ فِي السَّمَاءِ.', '🌙', 'The moon is in the sky.'],
  ['أَنَا أُحِبُّ الْمَوْزَ.', '🍌', 'I love bananas.'], ['الْجَمَلُ فِي الصَّحْرَاءِ.', '🐫', 'The camel is in the desert.'], ['الطَّائِرَةُ تَطِيرُ عَالِيًا.', '✈️', 'The plane flies high.'],
  ['الطِّفْلُ نَائِمٌ.', '👶', 'The baby is asleep.'], ['الْوَرْدَةُ حَمْرَاءُ.', '🌹', 'The rose is red.'], ['الْفِيلُ كَبِيرٌ.', '🐘', 'The elephant is big.'],
  ['أَشْرَبُ الْحَلِيبَ.', '🥛', 'I drink milk.'], ['السَّيَّارَةُ سَرِيعَةٌ.', '🚗', 'The car is fast.'], ['الْأَسَدُ مَلِكُ الْغَابَةِ.', '🦁', 'The lion is the king of the jungle.'],
  ['النَّحْلَةُ تَصْنَعُ الْعَسَلَ.', '🐝', 'The bee makes honey.'], ['الْبَطَّةُ تَسْبَحُ.', '🦆', 'The duck swims.'], ['الشَّجَرَةُ طَوِيلَةٌ.', '🌳', 'The tree is tall.'],
  ['أُمِّي تَطْبُخُ الطَّعَامَ.', '🍳', 'My mum cooks food.'], ['الْأَرْنَبُ يَأْكُلُ الْجَزَرَ.', '🐰', 'The rabbit eats carrots.'], ['الْحِصَانُ يَجْرِي.', '🐴', 'The horse runs.'],
  ['النُّجُومُ تَلْمَعُ فِي اللَّيْلِ.', '⭐', 'The stars shine at night.'], ['الْكَلْبُ يَنْبَحُ.', '🐶', 'The dog barks.'], ['أَغْسِلُ يَدَيَّ بِالصَّابُونِ.', '🧼', 'I wash my hands with soap.'],
  ['الْمَطَرُ يَنْزِلُ.', '🌧️', 'The rain is falling.'], ['السَّاعَةُ عَلَى الْحَائِطِ.', '⏰', 'The clock is on the wall.'], ['أَذْهَبُ إِلَى الْمَدْرَسَةِ.', '🏫', 'I go to school.'],
  ['الْفَرَاشَةُ جَمِيلَةٌ.', '🦋', 'The butterfly is beautiful.'], ['التُّفَّاحَةُ لَذِيذَةٌ.', '🍎', 'The apple is tasty.'], ['الضِّفْدَعُ يَقْفِزُ.', '🐸', 'The frog jumps.'],
  ['الْقَارِبُ فِي الْبَحْرِ.', '⛵', 'The boat is on the sea.'], ['أَبِي يَقْرَأُ الْجَرِيدَةَ.', '📰', 'My dad reads the newspaper.'],
];
function sentences(rng, level) {
  const [s, e, meaning] = rng.pick(SENTENCES);
  const wrong = rng.sample(SENTENCES.filter((x) => x[1] !== e), level >= 2 ? 2 : 1);
  return Q(rng, {
    key: `asent-${e}`,
    say: [ar('اِقْرَأِ الْجُمْلَةَ. أَيُّ صُورَةٍ تُنَاسِبُهَا؟'), en('Read the sentence. Which picture matches?')],
    visual: `<div class="ar-text sentence-card" dir="rtl" data-say="${s}" data-lang="ar">${s}</div>`,
    right: emojiCard(e), wrong: wrong.map((x) => emojiCard(x[1])), size: 'xl',
    hint: [ar(s), en(meaning)],
  });
}

// ---------------------------------------------------------------- Year 1: everyday words
const VOCAB = [
  ['مَدْرَسَة', '🏫', 'school'], ['مُعَلِّم', '🧑‍🏫', 'teacher'], ['حَقِيبَة', '🎒', 'school bag'], ['قَلَم', '✏️', 'pencil'], ['كِتَاب', '📖', 'book'],
  ['مِقَصّ', '✂️', 'scissors'], ['كُرْسِيّ', '🪑', 'chair'], ['بَاب', '🚪', 'door'], ['نَافِذَة', '🪟', 'window'], ['سَرِير', '🛏️', 'bed'],
  ['هَاتِف', '📱', 'phone'], ['سَاعَة', '⏰', 'clock'], ['مِفْتَاح', '🔑', 'key'], ['مِظَلَّة', '☂️', 'umbrella'], ['قَمِيص', '👕', 'shirt'],
  ['حِذَاء', '👟', 'shoe'], ['قُبَّعَة', '🧢', 'cap'], ['نَظَّارَة', '👓', 'glasses'], ['جَوَارِب', '🧦', 'socks'], ['مَاء', '💧', 'water'],
  ['خُبْز', '🍞', 'bread'], ['جُبْن', '🧀', 'cheese'], ['بَيْض', '🥚', 'eggs'], ['أَرُزّ', '🍚', 'rice'], ['عَصِير', '🧃', 'juice'],
  ['حَلِيب', '🥛', 'milk'], ['سَيَّارَة', '🚗', 'car'], ['حَافِلَة', '🚌', 'bus'], ['دَرَّاجَة', '🚲', 'bicycle'], ['قِطَار', '🚂', 'train'],
  ['سَفِينَة', '🚢', 'ship'], ['مُسْتَشْفَى', '🏥', 'hospital'], ['مَسْجِد', '🕌', 'mosque'], ['شَاطِئ', '🏖️', 'beach'],
];
function vocab(rng, level) {
  const [w, e, meaning] = rng.pick(VOCAB);
  const wrong = rng.sample(VOCAB.filter((x) => x[1] !== e), level >= 2 ? 3 : 2);
  return Q(rng, {
    key: `avocab-${meaning}`,
    say: [ar(`أَيْنَ ال${w}؟`), en(`Where is the ${meaning}? ${w}.`)],
    text: `<span class="ar-text">${w}</span>`,
    right: emojiCard(e), wrong: wrong.map((x) => emojiCard(x[1])), size: 'xl',
    hint: [ar(w), en(`${w} means ${meaning}.`)],
  });
}

export const GENERATORS = {
  'a-sounds': sounds,
  'a-colours': colours,
  'a-numbers': numbers,
  'a-family': family,
  'a-letters': letters,
  'a-trace': trace,
  'a-vowels': vowels,
  'a-digits': digits,
  'a-forms': forms,
  'a-long': long,
  'a-words': words,
  'a-sentences': sentences,
  'a-vocab': vocab,
};

export const _data = { LETTERS, WORDS, SENTENCES, VOCAB, FAMILY, toArabicDigits };
