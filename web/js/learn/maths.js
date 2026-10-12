// Maths: counting, shapes, colours, patterns, number, calculation, fractions, time, money (AED), measures.
import { choice, numberWords, emojiCard } from './core.js';
import {
  COLOURS, SHAPES_2D, SHAPES_3D, shape2d, shape3d, blob, group, dots, tenFrame, baseTen, clock, money, moneyRow,
  fraction, unequalSplit, lengthBar, heightBar, balance,
} from './visuals.js';

const THINGS = [['🍎', 'apples'], ['🐟', 'fish'], ['⭐', 'stars'], ['🚗', 'cars'], ['🐤', 'chicks'], ['🌸', 'flowers'], ['🍓', 'strawberries'],
  ['⚽', 'balls'], ['🦋', 'butterflies'], ['🧁', 'cupcakes'], ['🐞', 'ladybirds'], ['🎈', 'balloons'], ['🐢', 'turtles'], ['🍪', 'cookies']];

const num = (n) => ({ html: `<span class="numeral">${n}</span>`, say: numberWords[n] || String(n) });
const near = (rng, n, count, min = 0, max = 20) => {
  const out = new Set();
  let guard = 0;
  while (out.size < count && guard++ < 100) {
    const d = rng.int(-3, 3);
    const v = n + (d === 0 ? 1 : d);
    if (v !== n && v >= min && v <= max) out.add(v);
  }
  return [...out];
};

// ---------------------------------------------------------------- counting
function counting(max5) {
  return (rng, level) => {
    const max = max5 ? (level === 1 ? 3 : 5) : (level === 1 ? 6 : 10);
    const n = rng.int(1, max);
    const [e, label] = rng.pick(THINGS);
    const visual = !max5 && level >= 3 && rng.next() < 0.5 ? tenFrame(n) : group(e, n, { countable: true });
    return choice(rng, {
      key: `count${max5 ? 5 : 10}-${n}-${e}`,
      say: `How many ${visual.includes('ten-frame') ? 'dots' : label}? Tap each one to count.`,
      visual,
      right: num(n), wrong: near(rng, n, level >= 3 ? 3 : 2, 1, max5 ? 6 : 10).map(num),
      hint: `Let's count together: ${Array.from({ length: n }, (_, i) => numberWords[i + 1]).join(', ')}.`,
    });
  };
}

function match(rng, level) {
  const max = level === 1 ? 5 : 10;
  const n = rng.int(1, max);
  const [e] = rng.pick(THINGS);
  const asDots = rng.next() < 0.4;
  const make = (k) => ({ html: asDots ? dots(k) : group(e, k, { size: 'small' }), say: numberWords[k] });
  return choice(rng, {
    key: `match-${n}-${asDots ? 'dots' : e}`,
    say: `Find the group with ${numberWords[n]}.`,
    visual: `<div class="numeral big">${n}</div>`,
    right: make(n), wrong: near(rng, n, level >= 2 ? 2 : 1, 1, max).map(make), cols: 1,
    hint: `Count the groups. We need ${numberWords[n]}.`,
  });
}

// ---------------------------------------------------------------- shapes & colours
const COLOUR_NAMES = ['red', 'blue', 'yellow', 'green', 'orange', 'purple', 'pink', 'brown', 'black', 'white'];
function shapes(rng, level) {
  const pool = level === 1 ? ['circle', 'square', 'triangle', 'star'] : level === 2 ? SHAPES_2D.slice(0, 7) : SHAPES_2D;
  const s = rng.pick(pool);
  const colour = rng.pick(COLOUR_NAMES.slice(0, 7));
  const wrong = rng.sample(pool.filter((x) => x !== s), level >= 3 ? 3 : 2).map((w) => ({ html: shape2d(w, rng.pick(COLOUR_NAMES.slice(0, 7))) }));
  return choice(rng, {
    key: `shape-${s}-${colour}`,
    say: `Find the ${s}.`,
    right: { html: shape2d(s, colour) }, wrong,
    hint: { circle: 'A circle is round like a ball.', square: 'A square has four sides that are the same.', triangle: 'A triangle has three sides.', star: 'A star has five points.', rectangle: 'A rectangle has four sides, two long and two short.', heart: 'A heart is the shape of love.', oval: 'An oval is like a stretched circle, like an egg.', diamond: 'A diamond looks like a kite.', pentagon: 'A pentagon has five sides.', hexagon: 'A hexagon has six sides, like a honeycomb.' }[s],
  });
}

const COLOUR_THINGS = {
  red: ['🍎', '🍓', '🚒', '🌹', '🍒'], yellow: ['🍌', '🌻', '🐤', '🍋', '🌽'], green: ['🥦', '🐸', '🍏', '🥒', '🌲'], orange: ['🍊', '🥕', '🎃', '🦊'],
  purple: ['🍇', '🍆', '🔮', '☂️'], blue: ['🫐', '🐳', '💙', '🧢'], pink: ['🌸', '🐷', '🩷', '🦩'], brown: ['🐻', '🥔', '🪵', '🍫'],
  black: ['🎱', '🐈‍⬛', '🕷️', '🖤'], white: ['🐑', '☁️', '🥚', '🦢', '⚪'],
};
function colours(rng, level) {
  const pool = level === 1 ? COLOUR_NAMES.slice(0, 6) : COLOUR_NAMES;
  const c = rng.pick(pool);
  const others = rng.sample(pool.filter((x) => x !== c), level >= 3 ? 3 : 2);
  const useObjects = level >= 2 && rng.next() < 0.6;
  const card = (col) => (useObjects ? emojiCard(rng.pick(COLOUR_THINGS[col])) : { html: blob(col) });
  return choice(rng, {
    key: `colour-${c}-${useObjects ? 'obj' : 'blob'}-${others.join('')}`,
    say: `Find something ${c}.`,
    right: card(c), wrong: others.map(card), size: useObjects ? 'xl' : '',
    hint: `${c[0].toUpperCase()}${c.slice(1)}, like ${{ red: 'a strawberry', yellow: 'a banana', green: 'grass', orange: 'an orange', purple: 'grapes', blue: 'the sky', pink: 'a pig', brown: 'a teddy bear', black: 'the night sky', white: 'snow' }[c]}.`,
  });
}

// ---------------------------------------------------------------- big & small
const SIZE_THINGS = ['🐘', '🐻', '🍎', '🚗', '🐟', '🌳', '⭐', '🐶', '🏠', '🎈', '🦒', '🍩', '⚽', '🐢', '🌸', '🚀'];
function size(rng, level) {
  const e = rng.pick(SIZE_THINGS);
  const three = level >= 2;
  const sizes = three ? [1.4, 2.6, 4] : [1.5, 4];
  const want = rng.pick(['big', 'small']);
  const word = three ? (want === 'big' ? 'biggest' : 'smallest') : want;
  const target = want === 'big' ? sizes[sizes.length - 1] : sizes[0];
  const card = (s) => ({ html: `<span class="emo sized" style="font-size:${s}rem">${e}</span>` });
  return choice(rng, {
    key: `size-${e}-${word}`,
    say: `Tap the ${word} one.`,
    right: card(target), wrong: sizes.filter((s) => s !== target).map(card), size: 'xl',
    hint: want === 'big' ? 'Look for the one that takes up the most space.' : 'Look for the tiny one.',
  });
}

// ---------------------------------------------------------------- patterns
const PATTERN_TYPES = { 1: ['AB'], 2: ['AB', 'AAB', 'ABB'], 3: ['AAB', 'ABB', 'ABC', 'AABB'] };
const PATTERN_ITEMS = ['🔴', '🔵', '🟡', '🟢', '⭐', '🌙', '🍎', '🍌', '🐶', '🐱', '🔺', '⬛', '❤️', '🌸', '🚗', '⚽'];
function pattern(rng, level) {
  const type = rng.pick(PATTERN_TYPES[level] || PATTERN_TYPES[3]);
  const letters = [...new Set(type.split(''))];
  const items = rng.sample(PATTERN_ITEMS, letters.length);
  const map = Object.fromEntries(letters.map((l, i) => [l, items[i]]));
  const seq = [];
  while (seq.length < Math.max(6, type.length * 2 + 1)) seq.push(map[type[seq.length % type.length]]);
  const answer = seq.pop();
  const extra = rng.pick(PATTERN_ITEMS.filter((x) => !items.includes(x)));
  const wrong = [...new Set(items.filter((x) => x !== answer).concat(level >= 2 ? [extra] : []))].slice(0, 2);
  return choice(rng, {
    key: `pattern-${type}-${items.join('')}`,
    say: 'What comes next in the pattern?',
    visual: `<div class="pattern">${seq.map((x) => `<span>${x}</span>`).join('')}<span class="gap">?</span></div>`,
    right: emojiCard(answer), wrong: (wrong.length ? wrong : [extra]).map((w) => emojiCard(w)), size: 'xl',
    hint: `Say the pattern out loud. What comes after ${seq[seq.length - 1]}?`,
  });
}

// ---------------------------------------------------------------- numbers to 20 / one more one less
function num20(rng, level) {
  const max = level === 1 ? 10 : 20;
  const n = rng.int(level === 1 ? 1 : 6, max);
  if (rng.next() < 0.5) {
    return choice(rng, {
      key: `num20-hear-${n}`,
      say: `Find the number ${numberWords[n]}.`,
      right: num(n), wrong: near(rng, n, level >= 2 ? 3 : 2, 0, 20).map(num),
      hint: n > 10 ? `${numberWords[n]} is ten and ${numberWords[n - 10]} more.` : `Count up to ${numberWords[n]}.`,
    });
  }
  return choice(rng, {
    key: `num20-count-${n}`,
    say: 'How many dots? Each frame holds ten.',
    visual: tenFrame(n),
    right: num(n), wrong: near(rng, n, 2, 1, 20).map(num),
    hint: n > 10 ? `One full frame is ten. Then count on: ${Array.from({ length: n - 10 }, (_, i) => numberWords[11 + i]).join(', ')}.` : 'Count the dots one by one.',
  });
}

function oneMore(rng, level) {
  const max = level === 1 ? 9 : 19;
  const more = rng.next() < 0.5;
  const n = more ? rng.int(1, max) : rng.int(2, max + 1);
  const ans = more ? n + 1 : n - 1;
  const [e] = rng.pick(THINGS);
  return choice(rng, {
    key: `onemore-${more ? 'more' : 'less'}-${n}`,
    say: `What is one ${more ? 'more' : 'less'} than ${numberWords[n]}?`,
    visual: n <= 10 ? `${group(e, n)}<div class="op-line">${more ? '+ 1' : '− 1'}</div>` : `<div class="numeral big">${n} ${more ? '+' : '−'} 1</div>`,
    right: num(ans), wrong: near(rng, ans, 2, 0, 20).filter((x) => x !== n || level >= 2).slice(0, 2).map(num),
    hint: more ? `One more means count on one: ${numberWords[n]}, ${numberWords[ans]}.` : `One less means count back one: ${numberWords[n]}, ${numberWords[ans]}.`,
  });
}

// ---------------------------------------------------------------- adding & taking away
function add(rng, level) {
  const max = level === 1 ? 5 : 10;
  const a = rng.int(1, max - 1);
  const b = rng.int(1, max - a);
  const [e, label] = rng.pick(THINGS);
  return choice(rng, {
    key: `add-${a}-${b}`,
    say: `${numberWords[a]} ${label} add ${numberWords[b]} more. How many altogether?`,
    visual: `<div class="sum-row">${group(e, a, { size: 'small' })}<span class="op">+</span>${group(e, b, { size: 'small' })}</div><div class="op-line">${a} + ${b} = ?</div>`,
    right: num(a + b), wrong: near(rng, a + b, 2, 1, 12).map(num),
    hint: `Count them all: start at ${numberWords[a]} and count on ${numberWords[b]}.`,
  });
}

function sub(rng, level) {
  const max = level === 1 ? 5 : 10;
  const a = rng.int(2, max);
  const b = rng.int(1, a - 1);
  const [e, label] = rng.pick(THINGS);
  const items = Array.from({ length: a }, (_, i) => `<span class="g-item${i >= a - b ? ' gone' : ''}">${e}</span>`).join('');
  return choice(rng, {
    key: `sub-${a}-${b}`,
    say: `There are ${numberWords[a]} ${label}. ${numberWords[b]} go away. How many are left?`,
    visual: `<div class="group">${items}</div><div class="op-line">${a} − ${b} = ?</div>`,
    right: num(a - b), wrong: near(rng, a - b, 2, 0, 10).map(num),
    hint: `Count the ones that are still here.`,
  });
}

// ---------------------------------------------------------------- 2D & 3D
const REAL_3D = [['⚽', 'sphere'], ['🏀', 'sphere'], ['🍊', 'sphere'], ['🌐', 'sphere'], ['🎲', 'cube'], ['🧊', 'cube'], ['🥫', 'cylinder'], ['🥁', 'cylinder'],
  ['🕯️', 'cylinder'], ['🍦', 'cone'], ['🎉', 'cone'], ['📦', 'cuboid'], ['🎁', 'cuboid'], ['🧃', 'cuboid'], ['🧱', 'cuboid'], ['🔺', 'pyramid']];
function shapes3d(rng, level) {
  const form = rng.int(1, level >= 2 ? 3 : 2);
  if (form === 1) {
    const s = rng.pick(SHAPES_3D);
    return choice(rng, {
      key: `3d-find-${s}`,
      say: `Find the ${s}.`,
      right: { html: shape3d(s) }, wrong: rng.sample(SHAPES_3D.filter((x) => x !== s), 2).map((w) => ({ html: shape3d(w, 'blue') })),
      hint: { cube: 'A cube is like a dice: all its faces are squares.', cuboid: 'A cuboid is like a box.', sphere: 'A sphere is round like a ball.', cylinder: 'A cylinder is like a tin can.', cone: 'A cone is like an ice cream cone.', pyramid: 'A pyramid has a point at the top and triangle sides.' }[s],
    });
  }
  if (form === 2) {
    const [e, s] = rng.pick(REAL_3D);
    return choice(rng, {
      key: `3d-real-${e}`,
      say: 'What shape is this?',
      visual: `<div class="big-emoji">${e}</div>`,
      right: { html: shape3d(s), say: s }, wrong: rng.sample(SHAPES_3D.filter((x) => x !== s), 2).map((w) => ({ html: shape3d(w, 'blue'), say: w })),
      hint: `It is a ${s}.`,
    });
  }
  const flat = rng.next() < 0.5;
  const a = rng.pick(SHAPES_2D.slice(0, 6));
  const b = rng.sample(SHAPES_3D, 2);
  const c = rng.sample(SHAPES_2D.filter((x) => x !== a), 2);
  return choice(rng, {
    key: `3d-flat-${flat}-${a}-${b.join('')}`,
    say: flat ? 'Which shape is flat? It is a 2D shape.' : 'Which shape is solid? It is a 3D shape.',
    right: { html: flat ? shape2d(a, 'green') : shape3d(b[0]) },
    wrong: flat ? b.map((x) => ({ html: shape3d(x) })) : c.map((x) => ({ html: shape2d(x, 'green') })),
    hint: flat ? 'A flat shape is like a drawing on paper.' : 'A solid shape is one you could hold, like a ball or a box.',
  });
}

// ---------------------------------------------------------------- comparing
function compare(rng, level) {
  if (level >= 2 && rng.next() < 0.4) {
    const a = rng.int(1, 20);
    let b = rng.int(1, 20);
    if (a === b) b = a === 20 ? 19 : a + 1;
    const bigger = rng.next() < 0.5;
    const ans = bigger ? Math.max(a, b) : Math.min(a, b);
    return choice(rng, {
      key: `cmp-num-${Math.min(a, b)}-${Math.max(a, b)}-${bigger}`,
      say: `Which number is ${bigger ? 'bigger' : 'smaller'}?`,
      right: num(ans), wrong: [num(ans === a ? b : a)],
      hint: 'The bigger number comes later when we count.',
    });
  }
  const [e, label] = rng.pick(THINGS);
  const a = rng.int(1, level === 1 ? 6 : 10);
  let b = rng.int(1, level === 1 ? 6 : 10);
  if (Math.abs(a - b) < (level === 1 ? 2 : 1)) b = a > 3 ? a - 2 : a + 2;
  const more = rng.next() < 0.5;
  const ans = more ? Math.max(a, b) : Math.min(a, b);
  return choice(rng, {
    key: `cmp-${e}-${Math.min(a, b)}-${Math.max(a, b)}-${more}`,
    say: `Which group has ${more ? 'more' : 'fewer'} ${label}?`,
    right: { html: group(e, ans, { size: 'small' }) }, wrong: [{ html: group(e, ans === a ? b : a, { size: 'small' }) }], cols: 1,
    hint: more ? 'More means a bigger amount.' : 'Fewer means a smaller amount.',
  });
}

// ---------------------------------------------------------------- numbers to 100
const tensWords = ['', 'ten', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety', 'one hundred'];
const say100 = (n) => (n <= 20 ? numberWords[n] : n === 100 ? 'one hundred' : `${tensWords[Math.floor(n / 10)]}${n % 10 ? ` ${numberWords[n % 10]}` : ''}`);
const num100 = (n) => ({ html: `<span class="numeral">${n}</span>`, say: say100(n) });
function numbers100(rng, level) {
  const n = rng.int(level === 1 ? 11 : 21, level === 3 ? 100 : 60);
  const form = rng.int(1, 3);
  const swap = (x) => (x % 10 && x < 100 ? (x % 10) * 10 + Math.floor(x / 10) : x + 10);
  const wrongs = [...new Set([swap(n), n + 10 <= 100 ? n + 10 : n - 10, n - 1].filter((x) => x !== n && x > 0 && x <= 100))].slice(0, 2);
  if (form === 1) {
    return choice(rng, {
      key: `n100-blocks-${n}`,
      say: 'What number is this? Each long stick is ten.',
      visual: baseTen(n),
      right: num100(n), wrong: wrongs.map(num100),
      hint: `${Math.floor(n / 10)} tens and ${n % 10} ones.`,
    });
  }
  if (form === 2) {
    return choice(rng, {
      key: `n100-hear-${n}`,
      say: `Find the number ${say100(n)}.`,
      right: num100(n), wrong: wrongs.map(num100),
      hint: `${say100(n)} has ${Math.floor(n / 10)} tens and ${n % 10} ones.`,
    });
  }
  const after = rng.next() < 0.5;
  const m = after ? Math.min(n, 99) : Math.max(n, 2);
  const ans = after ? m + 1 : m - 1;
  return choice(rng, {
    key: `n100-${after ? 'after' : 'before'}-${m}`,
    say: `What number comes just ${after ? 'after' : 'before'} ${say100(m)}?`,
    visual: `<div class="numeral big">${after ? `${m}, ?` : `?, ${m}`}</div>`,
    right: num100(ans), wrong: [ans + (after ? 1 : -1), after ? m - 1 : m + 1].filter((x) => x > 0 && x <= 100 && x !== ans).map(num100),
    hint: after ? `Count on one from ${say100(m)}.` : `Count back one from ${say100(m)}.`,
  });
}

function addSub20(rng, level) {
  const plus = rng.next() < 0.5;
  let a; let b; let ans; let text;
  if (plus) { a = rng.int(1, level === 1 ? 10 : 15); b = rng.int(1, 20 - a); ans = a + b; } else { a = rng.int(level === 1 ? 5 : 8, 20); b = rng.int(1, a); ans = a - b; }
  const missing = level >= 3 && rng.next() < 0.4;
  if (missing) {
    text = plus ? `${a} + ? = ${ans}` : `${a} − ? = ${ans}`;
    const m = b;
    return choice(rng, {
      key: `as20-miss-${plus}-${a}-${b}`,
      say: plus ? `${say100(a)} add what makes ${say100(ans)}?` : `${say100(a)} take away what leaves ${say100(ans)}?`,
      visual: `<div class="numeral big">${text}</div>`,
      right: num(m), wrong: near(rng, m, 2, 0, 20).map(num),
      hint: plus ? `Count on from ${say100(a)} to ${say100(ans)}.` : `Count back from ${say100(a)} to ${say100(ans)}.`,
    });
  }
  text = `${a} ${plus ? '+' : '−'} ${b} = ?`;
  return choice(rng, {
    key: `as20-${plus}-${a}-${b}`,
    say: `What is ${say100(a)} ${plus ? 'add' : 'take away'} ${say100(b)}?`,
    visual: `<div class="numeral big">${text}</div>`,
    right: num(ans), wrong: near(rng, ans, 2, 0, 20).map(num),
    hint: plus ? `Start at ${say100(Math.max(a, b))} and count on ${say100(Math.min(a, b))}.` : `Start at ${say100(a)} and count back ${say100(b)}.`,
  });
}

function countBy(rng, level) {
  const step = level === 1 ? 10 : rng.pick(level === 2 ? [2, 5, 10] : [2, 5, 10]);
  const len = 6;
  const startIdx = rng.int(0, step === 10 ? 4 : 6);
  const seq = Array.from({ length: len }, (_, i) => (startIdx + i) * step);
  const gap = level >= 3 ? rng.int(1, len - 1) : len - 1;
  const ans = seq[gap];
  return choice(rng, {
    key: `countby-${step}-${startIdx}-${gap}`,
    say: `Count in ${step}s. Which number is missing?`,
    visual: `<div class="pattern numbers">${seq.map((x, i) => (i === gap ? '<span class="gap">?</span>' : `<span>${x}</span>`)).join('')}</div>`,
    right: num100(ans), wrong: [ans + step / (step === 2 ? 2 : 5) || ans + 1, ans + step, ans - 1].filter((x) => x !== ans && x >= 0).slice(0, 2).map(num100),
    hint: `Counting in ${step}s: ${seq.slice(0, 3).map(say100).join(', ')}...`,
  });
}

// ---------------------------------------------------------------- fractions
function fractions(rng, level) {
  const form = rng.int(1, level >= 2 ? 3 : 2);
  const colour = rng.pick(['orange', 'blue', 'green', 'pink', 'purple']);
  const kind = rng.pick(['circle', 'square', 'rect']);
  if (form === 1 || form === 2) {
    const want = form === 1 ? 'half' : 'quarter';
    const right = want === 'half' ? fraction(kind, 2, 1, colour) : fraction(kind, 4, 1, colour);
    const wrong = want === 'half' ? [fraction(kind, 4, 1, colour), unequalSplit(colour)] : [fraction(kind, 2, 1, colour), fraction(kind, 4, 3, colour)];
    return choice(rng, {
      key: `frac-${want}-${kind}-${colour}`,
      say: `Which shape shows one ${want} coloured in?`,
      right: { html: right }, wrong: wrong.map((html) => ({ html })),
      hint: want === 'half' ? 'A half is one of two equal parts.' : 'A quarter is one of four equal parts.',
    });
  }
  const quarter = level >= 3 && rng.next() < 0.5;
  const n = quarter ? rng.pick([4, 8, 12, 16, 20]) : rng.pick([2, 4, 6, 8, 10, 12, 14, 16, 18, 20]);
  const ans = quarter ? n / 4 : n / 2;
  const [e, label] = rng.pick(THINGS);
  return choice(rng, {
    key: `frac-of-${quarter ? 'q' : 'h'}-${n}`,
    say: `What is ${quarter ? 'a quarter' : 'half'} of ${numberWords[n]} ${label}?`,
    visual: group(e, n, { size: 'small' }),
    right: num(ans), wrong: near(rng, ans, 2, 1, 20).map(num),
    hint: quarter ? 'Share them into four equal groups.' : 'Share them into two equal groups.',
  });
}

// ---------------------------------------------------------------- time
const timeSay = (h, m) => (m === 0 ? `${numberWords[h]} o'clock` : `half past ${numberWords[h]}`);
function time(rng, level) {
  const h = rng.int(1, 12);
  const m = level === 1 ? 0 : rng.pick([0, 30]);
  if (rng.next() < 0.5) {
    const others = [];
    while (others.length < 2) {
      const oh = rng.int(1, 12);
      const om = level === 1 ? 0 : rng.pick([0, 30]);
      if ((oh !== h || om !== m) && !others.some((o) => o[0] === oh && o[1] === om)) others.push([oh, om]);
    }
    return choice(rng, {
      key: `time-find-${h}-${m}`,
      say: `Find the clock that says ${timeSay(h, m)}.`,
      right: { html: clock(h, m) }, wrong: others.map(([oh, om]) => ({ html: clock(oh, om) })),
      hint: m === 0 ? `At ${timeSay(h, m)}, the long hand points to twelve and the short hand points to ${numberWords[h]}.` : 'At half past, the long hand points down to six.',
    });
  }
  const alts = [[h % 12 + 1, m], [h, m === 0 ? 30 : 0]];
  if (level === 1) alts[1] = [(h + 4) % 12 + 1, 0];
  return choice(rng, {
    key: `time-read-${h}-${m}`,
    say: 'What time is it?',
    visual: clock(h, m),
    right: { html: `<span class="word small">${timeSay(h, m)}</span>`, say: timeSay(h, m) },
    wrong: alts.map(([ah, am]) => ({ html: `<span class="word small">${timeSay(ah, am)}</span>`, say: timeSay(ah, am) })),
    hint: m === 0 ? 'The long hand is on twelve, so it is something o\'clock.' : 'The long hand is on six, so it is half past.',
  });
}

// ---------------------------------------------------------------- money (UAE dirhams)
const aedSay = (aed) => `${numberWords[aed] || aed} dirham${aed === 1 ? '' : 's'}`;
function moneyQ(rng, level) {
  const form = rng.int(1, level >= 2 ? 3 : 2);
  if (form === 1) {
    // count dirham coins and notes
    const notes = level >= 2 ? rng.pick([[], [500], [1000], [500, 500], [1000, 500]]) : [];
    const coins = rng.int(1, level === 1 ? 5 : 6);
    const list = [...notes, ...Array(coins).fill(100)];
    const total = list.reduce((s, x) => s + x, 0) / 100;
    return choice(rng, {
      key: `money-count-${notes.join('+')}-${coins}`,
      say: 'How many dirhams are there altogether?',
      visual: moneyRow(list),
      right: { html: `<span class="word small">${total} AED</span>`, say: aedSay(total) },
      wrong: [total + 1, total - 1 > 0 ? total - 1 : total + 2].map((t) => ({ html: `<span class="word small">${t} AED</span>`, say: aedSay(t) })),
      hint: notes.length ? 'Start with the notes, then count on the one-dirham coins.' : 'Count the one-dirham coins.',
    });
  }
  if (form === 2) {
    const items = rng.sample([25, 50, 100, 500, 1000, 2000], 2);
    const more = rng.next() < 0.5;
    const ans = more ? Math.max(...items) : Math.min(...items);
    return choice(rng, {
      key: `money-worth-${items.sort((a, b) => a - b).join('-')}-${more}`,
      say: `Which is worth ${more ? 'more' : 'less'}?`,
      right: { html: money(ans) }, wrong: [{ html: money(items.find((x) => x !== ans)) }],
      hint: 'Notes are worth more than coins. One dirham is one hundred fils.',
    });
  }
  const target = rng.int(2, 9);
  const make = (aed) => (aed >= 5 ? [500, ...Array(aed - 5).fill(100)] : Array(aed).fill(100));
  return choice(rng, {
    key: `money-make-${target}`,
    say: `Which one makes ${aedSay(target)}?`,
    right: { html: moneyRow(make(target)) }, wrong: [target + 1, target - 1].filter((x) => x > 0).map((x) => ({ html: moneyRow(make(x)) })), cols: 1,
    hint: 'Count the money in each group.',
  });
}

// ---------------------------------------------------------------- measuring
const HEAVY_LIGHT = [['🐘', '🐭'], ['🚗', '🚲'], ['🍉', '🍇'], ['🐻', '🐦'], ['🏠', '⛺'], ['📚', '📄'], ['🎳', '🎈'], ['🐄', '🐔'], ['🛋️', '🪑'], ['🧱', '🪶'],
  ['🐳', '🐟'], ['🎃', '🍓'], ['🦏', '🐇'], ['🚂', '🛴'], ['🪨', '🍃'], ['🦒', '🦆'], ['⚓', '🔑'], ['🍍', '🫐']];
function measure(rng, level) {
  const form = rng.int(1, 3);
  if (form === 1) {
    const lens = rng.sample([3, 5, 7, 9, 11, 13], level >= 2 ? 3 : 2);
    const longer = rng.next() < 0.5;
    const target = longer ? Math.max(...lens) : Math.min(...lens);
    const cols = rng.sample(['green', 'orange', 'purple', 'blue', 'pink'], lens.length);
    return choice(rng, {
      key: `measure-len-${lens.join('-')}-${longer}`,
      say: `Which one is the ${longer ? 'longest' : 'shortest'}?`,
      right: { html: lengthBar(target, cols[0], '🐍') }, wrong: lens.filter((l) => l !== target).map((l, i) => ({ html: lengthBar(l, cols[i + 1], '🐍') })), cols: 1,
      hint: 'Look at where each snake ends.',
    });
  }
  if (form === 2) {
    const hs = rng.sample([2, 4, 6, 8, 10], level >= 2 ? 3 : 2);
    const taller = rng.next() < 0.5;
    const target = taller ? Math.max(...hs) : Math.min(...hs);
    return choice(rng, {
      key: `measure-h-${hs.join('-')}-${taller}`,
      say: `Which tower is the ${taller ? 'tallest' : 'shortest'}?`,
      right: { html: heightBar(target, 'blue') }, wrong: hs.filter((h) => h !== target).map((h) => ({ html: heightBar(h, 'pink') })),
      hint: taller ? 'The tallest reaches highest.' : 'The shortest is the lowest.',
    });
  }
  const [heavy, light] = rng.pick(HEAVY_LIGHT);
  const askHeavy = rng.next() < 0.5;
  const showScale = level >= 2 && rng.next() < 0.5;
  const left = rng.next() < 0.5;
  return choice(rng, {
    key: `measure-w-${heavy}-${askHeavy}-${showScale}`,
    say: `Which is ${askHeavy ? 'heavier' : 'lighter'}?`,
    visual: showScale ? balance(left ? heavy : light, left ? light : heavy, left ? 'left' : 'right') : '',
    right: emojiCard(askHeavy ? heavy : light), wrong: [emojiCard(askHeavy ? light : heavy)], size: 'xl',
    hint: showScale ? 'The heavier side of the scale goes down.' : 'Which one would be harder to lift?',
  });
}

export const GENERATORS = {
  'm-count5': counting(true),
  'm-count10': counting(false),
  'm-match': match,
  'm-shapes': shapes,
  'm-colours': colours,
  'm-size': size,
  'm-pattern': pattern,
  'm-num20': num20,
  'm-onemore': oneMore,
  'm-add': add,
  'm-sub': sub,
  'm-shapes3d': shapes3d,
  'm-compare': compare,
  'm-num100': numbers100,
  'm-addsub20': addSub20,
  'm-countby': countBy,
  'm-fractions': fractions,
  'm-time': time,
  'm-money': moneyQ,
  'm-measure': measure,
};

export const _data = { COLOURS };
