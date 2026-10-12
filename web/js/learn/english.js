// English: listening, rhymes, phonics (Letters and Sounds Phases 2-5), reading, sentences.
import { choice, distractors, emojiCard, textCard } from './core.js';

// How to say a sound (text-to-speech can't say pure phonemes, so we use a sound + a keyword).
export const SOUND_SAY = {
  s: 'sss, as in snake', a: 'a, as in apple', t: 't, as in tiger', p: 'p, as in pig', i: 'i, as in insect', n: 'nnn, as in nest',
  m: 'mmm, as in moon', d: 'd, as in dog', g: 'g, as in goat', o: 'o, as in octopus', c: 'c, as in cat', k: 'k, as in kite',
  ck: 'ck, as in duck', e: 'e, as in egg', u: 'u, as in umbrella', r: 'rrr, as in rabbit', h: 'h, as in hat', b: 'b, as in ball',
  f: 'fff, as in fish', ff: 'fff, as in puff', l: 'lll, as in lion', ll: 'lll, as in bell', ss: 'sss, as in kiss',
  j: 'j, as in jellyfish', v: 'vvv, as in van', w: 'w, as in web', x: 'ks, as in box', y: 'y, as in yo-yo', z: 'zzz, as in zebra',
  zz: 'zzz, as in fizz', qu: 'qu, as in queen', ch: 'ch, as in chick', sh: 'shh, as in ship', th: 'th, as in thumb', ng: 'ng, as in ring',
  ai: 'ai, as in rain', ee: 'ee, as in bee', igh: 'igh, as in night', oa: 'oa, as in boat', oo: 'oo, as in moon', ar: 'ar, as in car',
  or: 'or, as in fork', ur: 'ur, as in church', ow: 'ow, as in cow', oi: 'oi, as in coin', ear: 'ear, as in ear', air: 'air, as in chair',
  ure: 'ure, as in pure', er: 'er, as in hammer',
};

// Short "sound" for blending (letters spoken one by one).
const BLEND_SAY = {
  a: 'a', b: 'buh', c: 'kuh', ck: 'kuh', d: 'duh', e: 'eh', f: 'fff', g: 'guh', h: 'huh', i: 'ih', j: 'juh', k: 'kuh', l: 'lll', m: 'mmm',
  n: 'nnn', o: 'o', p: 'puh', r: 'rrr', s: 'sss', t: 'tuh', u: 'uh', v: 'vvv', w: 'wuh', x: 'ks', y: 'yuh', z: 'zzz', sh: 'shh', ch: 'ch',
  th: 'th', ng: 'ng', ow: 'ow', or: 'or', ar: 'ar', ai: 'ai', ee: 'ee', oo: 'oo',
};

// ---------------------------------------------------------------- picture words
// [word, emoji, first sound]
const PICS = [
  ['sun', '☀️', 's'], ['sock', '🧦', 's'], ['snake', '🐍', 's'], ['spoon', '🥄', 's'], ['seal', '🦭', 's'], ['sandwich', '🥪', 's'], ['saw', '🪚', 's'],
  ['apple', '🍎', 'a'], ['ant', '🐜', 'a'], ['axe', '🪓', 'a'], ['alligator', '🐊', 'a'],
  ['tiger', '🐯', 't'], ['tent', '⛺', 't'], ['tomato', '🍅', 't'], ['tooth', '🦷', 't'], ['turtle', '🐢', 't'], ['teddy', '🧸', 't'],
  ['pig', '🐷', 'p'], ['penguin', '🐧', 'p'], ['pizza', '🍕', 'p'], ['pear', '🍐', 'p'], ['panda', '🐼', 'p'], ['pumpkin', '🎃', 'p'], ['parrot', '🦜', 'p'],
  ['nose', '👃', 'n'], ['nest', '🪺', 'n'], ['nut', '🥜', 'n'], ['net', '🥅', 'n'], ['noodles', '🍜', 'n'],
  ['moon', '🌙', 'm'], ['monkey', '🐒', 'm'], ['mouse', '🐭', 'm'], ['milk', '🥛', 'm'], ['mushroom', '🍄', 'm'], ['mango', '🥭', 'm'], ['magnet', '🧲', 'm'],
  ['dog', '🐶', 'd'], ['duck', '🦆', 'd'], ['drum', '🥁', 'd'], ['door', '🚪', 'd'], ['dolphin', '🐬', 'd'], ['dinosaur', '🦕', 'd'], ['deer', '🦌', 'd'],
  ['goat', '🐐', 'g'], ['guitar', '🎸', 'g'], ['gorilla', '🦍', 'g'], ['grapes', '🍇', 'g'], ['gift', '🎁', 'g'],
  ['cat', '🐱', 'c'], ['cake', '🎂', 'c'], ['car', '🚗', 'c'], ['cow', '🐮', 'c'], ['kite', '🪁', 'c'], ['key', '🔑', 'c'], ['kangaroo', '🦘', 'c'], ['carrot', '🥕', 'c'], ['camel', '🐫', 'c'], ['koala', '🐨', 'c'],
  ['octopus', '🐙', 'o'], ['orange', '🍊', 'o'], ['otter', '🦦', 'o'],
  ['egg', '🥚', 'e'], ['elephant', '🐘', 'e'], ['envelope', '✉️', 'e'], ['elf', '🧝', 'e'],
  ['umbrella', '☂️', 'u'], ['up', '⬆️', 'u'],
  ['rabbit', '🐰', 'r'], ['rainbow', '🌈', 'r'], ['robot', '🤖', 'r'], ['rocket', '🚀', 'r'], ['ring', '💍', 'r'], ['rose', '🌹', 'r'], ['rhino', '🦏', 'r'],
  ['hat', '🎩', 'h'], ['horse', '🐴', 'h'], ['house', '🏠', 'h'], ['hen', '🐔', 'h'], ['hedgehog', '🦔', 'h'], ['heart', '❤️', 'h'], ['helicopter', '🚁', 'h'], ['hippo', '🦛', 'h'],
  ['ball', '⚽', 'b'], ['bus', '🚌', 'b'], ['bee', '🐝', 'b'], ['banana', '🍌', 'b'], ['bear', '🐻', 'b'], ['bed', '🛏️', 'b'], ['book', '📖', 'b'], ['bird', '🐦', 'b'], ['butterfly', '🦋', 'b'], ['boat', '⛵', 'b'],
  ['fish', '🐟', 'f'], ['fox', '🦊', 'f'], ['frog', '🐸', 'f'], ['flower', '🌸', 'f'], ['fire', '🔥', 'f'], ['fork', '🍴', 'f'], ['feather', '🪶', 'f'], ['foot', '🦶', 'f'],
  ['lion', '🦁', 'l'], ['leaf', '🍃', 'l'], ['lemon', '🍋', 'l'], ['ladybird', '🐞', 'l'], ['llama', '🦙', 'l'], ['lollipop', '🍭', 'l'], ['leg', '🦵', 'l'],
  ['jellyfish', '🪼', 'j'], ['juice', '🧃', 'j'], ['jeans', '👖', 'j'],
  ['van', '🚐', 'v'], ['violin', '🎻', 'v'], ['volcano', '🌋', 'v'],
  ['watch', '⌚', 'w'], ['whale', '🐳', 'w'], ['worm', '🪱', 'w'], ['window', '🪟', 'w'], ['wolf', '🐺', 'w'], ['web', '🕸️', 'w'],
  ['yo-yo', '🪀', 'y'], ['zebra', '🦓', 'z'],
  ['shoe', '👟', 'sh'], ['sheep', '🐑', 'sh'], ['shell', '🐚', 'sh'], ['ship', '🚢', 'sh'], ['shark', '🦈', 'sh'],
  ['chick', '🐥', 'ch'], ['cheese', '🧀', 'ch'], ['chair', '🪑', 'ch'], ['cherry', '🍒', 'ch'],
  ['thumb', '👍', 'th'],
];
const picByWord = Object.fromEntries(PICS.map((p) => [p[0], p]));
const FS1_SOUNDS = ['s', 'a', 't', 'p', 'n', 'm', 'd', 'g', 'c', 'r', 'h', 'b', 'f', 'l', 'w', 'sh', 'ch'];

// ---------------------------------------------------------------- listening (FS1)
const LISTEN = [
  ['moo', '🐮', 'cow'], ['baa', '🐑', 'sheep'], ['oink oink', '🐷', 'pig'], ['woof woof', '🐶', 'dog'], ['meow', '🐱', 'cat'],
  ['quack quack', '🦆', 'duck'], ['neigh', '🐴', 'horse'], ['roar', '🦁', 'lion'], ['hiss', '🐍', 'snake'], ['buzz buzz', '🐝', 'bee'],
  ['tweet tweet', '🐦', 'bird'], ['cock-a-doodle-doo', '🐓', 'rooster'], ['ribbit', '🐸', 'frog'], ['squeak squeak', '🐭', 'mouse'],
  ['twit twoo', '🦉', 'owl'], ['gobble gobble', '🦃', 'turkey'], ['cluck cluck', '🐔', 'hen'], ['hee-haw', '🫏', 'donkey'],
  ['ring ring', '☎️', 'telephone'], ['tick tock', '⏰', 'clock'], ['choo choo', '🚂', 'train'], ['beep beep', '🚗', 'car'],
  ['nee-naw nee-naw', '🚒', 'fire engine'], ['ding dong', '🔔', 'bell'], ['splish splash', '💦', 'water'], ['pop', '🎈', 'balloon'],
  ['boom boom', '🥁', 'drum'], ['whoosh', '🚀', 'rocket'], ['plink plonk', '🎹', 'piano'], ['strum strum', '🎸', 'guitar'],
  ['toot toot', '🎺', 'trumpet'], ['chirp chirp', '🐥', 'chick'], ['honk honk', '🚚', 'lorry'], ['crunch crunch', '🍎', 'apple'],
];

function listen(rng, level) {
  const [sound, emoji, name] = rng.pick(LISTEN);
  const n = level >= 3 ? 3 : 2;
  const wrong = distractors(rng, LISTEN, null, 20).filter((x) => x[1] !== emoji).slice(0, n).map((x) => emojiCard(x[1]));
  return choice(rng, {
    key: `listen-${name}`,
    say: `Listen! ${sound}. Who makes that sound?`,
    right: emojiCard(emoji), wrong, size: 'xl',
    hint: `${sound}! It's the ${name}.`,
  });
}

// ---------------------------------------------------------------- rhymes
const RHYMES = [
  ['cat', 'hat', 'bat', 'rat'], ['dog', 'frog', 'log'], ['bee', 'tree', 'key'], ['cake', 'snake'], ['star', 'car', 'jar'],
  ['moon', 'spoon', 'balloon'], ['boat', 'goat', 'coat'], ['bear', 'pear', 'chair'], ['mouse', 'house'], ['king', 'ring'],
  ['sock', 'rock', 'lock', 'clock'], ['pan', 'van', 'fan'], ['hen', 'pen', 'ten'], ['bug', 'mug'], ['bed', 'bread'],
  ['pie', 'tie', 'fly'], ['snail', 'whale'], ['shell', 'bell'], ['duck', 'truck'], ['nose', 'rose'], ['leg', 'egg'],
  ['kite', 'light'], ['four', 'door'], ['train', 'rain'], ['fox', 'box'], ['sun', 'bun'], ['dish', 'fish'],
];
const RHYME_EMOJI = {
  cat: '🐱', hat: '🎩', bat: '🦇', rat: '🐀', dog: '🐶', frog: '🐸', log: '🪵', bee: '🐝', tree: '🌳', key: '🔑', cake: '🎂', snake: '🐍',
  star: '⭐', car: '🚗', jar: '🫙', moon: '🌙', spoon: '🥄', balloon: '🎈', boat: '⛵', goat: '🐐', coat: '🧥', bear: '🐻', pear: '🍐',
  chair: '🪑', mouse: '🐭', house: '🏠', king: '🤴', ring: '💍', sock: '🧦', rock: '🪨', lock: '🔒', clock: '⏰', pan: '🍳', van: '🚐',
  fan: '🪭', hen: '🐔', pen: '🖊️', ten: '🔟', bug: '🐛', mug: '☕', bed: '🛏️', bread: '🍞', pie: '🥧', tie: '👔', fly: '🪰', snail: '🐌',
  whale: '🐳', shell: '🐚', bell: '🔔', duck: '🦆', truck: '🚚', nose: '👃', rose: '🌹', leg: '🦵', egg: '🥚', kite: '🪁', light: '💡',
  four: '4️⃣', door: '🚪', train: '🚂', rain: '🌧️', fox: '🦊', box: '📦', sun: '☀️', bun: '🧁', dish: '🍽️', fish: '🐟',
};

function rhyme(rng, level) {
  const g = rng.pick(RHYMES);
  const [target, match] = rng.sample(g, 2);
  const others = RHYMES.filter((x) => x !== g).flat();
  const wrong = rng.sample(others, level >= 2 ? 2 : 1).map((w) => ({ ...emojiCard(RHYME_EMOJI[w]), say: w }));
  return choice(rng, {
    key: `rhyme-${target}-${match}`,
    say: `Which one rhymes with ${target}?`,
    visual: `<div class="big-emoji">${RHYME_EMOJI[target]}</div>`,
    right: { ...emojiCard(RHYME_EMOJI[match]), say: match }, wrong, size: 'xl',
    hint: `${target}... ${match}! They sound the same at the end.`,
  });
}

// ---------------------------------------------------------------- first sounds
function initial(rng, level) {
  const sounds = level >= 3 ? Object.keys(SOUND_SAY).filter((s) => PICS.some((p) => p[2] === s)) : FS1_SOUNDS;
  const s = rng.pick(sounds);
  const right = rng.pick(PICS.filter((p) => p[2] === s));
  const wrong = rng.sample(PICS.filter((p) => p[2] !== s && p[0][0] !== s[0]), level >= 2 ? 2 : 1);
  return choice(rng, {
    key: `initial-${s}-${right[0]}`,
    say: `Which one starts with ${SOUND_SAY[s].split(',')[0]}?`,
    right: { ...emojiCard(right[1]), say: right[0] },
    wrong: wrong.map((w) => ({ ...emojiCard(w[1]), say: w[0] })), size: 'xl',
    hint: `Listen: ${right[0]}. ${SOUND_SAY[s].split(',')[0]}, ${right[0]}!`,
  });
}

// ---------------------------------------------------------------- names (FS1)
function names(rng, level) {
  const pool = PICS.filter((p) => !['up', 'yo-yo', 'thumb', 'saw', 'axe'].includes(p[0]));
  const right = rng.pick(pool);
  const wrong = rng.sample(pool.filter((p) => p[1] !== right[1]), level >= 3 ? 3 : level >= 2 ? 2 : 1);
  return choice(rng, {
    key: `name-${right[0]}`,
    say: `Can you find the ${right[0]}?`,
    right: emojiCard(right[1]), wrong: wrong.map((w) => emojiCard(w[1])), size: 'xl',
    hint: `The ${right[0]} is here. Look carefully!`,
  });
}

// ---------------------------------------------------------------- phonics phases
const PHASE2 = ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd', 'g', 'o', 'c', 'k', 'ck', 'e', 'u', 'r', 'h', 'b', 'f', 'ff', 'l', 'll', 'ss'];
const PHASE3 = ['j', 'v', 'w', 'x', 'y', 'z', 'zz', 'qu', 'ch', 'sh', 'th', 'ng', 'ai', 'ee', 'igh', 'oa', 'oo', 'ar', 'or', 'ur', 'ow', 'oi', 'ear', 'air', 'ure', 'er'];
const KEYWORD_PIC = {
  s: '🐍', a: '🍎', t: '🐯', p: '🐷', i: '🐛', n: '🪺', m: '🌙', d: '🐶', g: '🐐', o: '🐙', c: '🐱', k: '🪁', ck: '🦆', e: '🥚', u: '☂️',
  r: '🐰', h: '🎩', b: '⚽', f: '🐟', ff: '💨', l: '🦁', ll: '🔔', ss: '😘', j: '🪼', v: '🚐', w: '🕸️', x: '📦', y: '🪀', z: '🦓',
  zz: '🫧', qu: '👸', ch: '🐥', sh: '🚢', th: '👍', ng: '💍', ai: '🌧️', ee: '🐝', igh: '🌃', oa: '⛵', oo: '🌙', ar: '🚗', or: '🍴',
  ur: '⛪', ow: '🐮', oi: '🪙', ear: '👂', air: '🪑', ure: '✨', er: '🔨',
};

function phase(list, label) {
  return (rng, level) => {
    const pool = level === 1 ? list.slice(0, Math.ceil(list.length / 2)) : list;
    const g = rng.pick(pool);
    const form = rng.next() < 0.5 || level === 1 ? 'hear' : 'see';
    const n = level >= 3 ? 3 : 2;
    const wrong = distractors(rng, list, g, n);
    if (form === 'hear') {
      return choice(rng, {
        key: `${label}-hear-${g}`,
        say: `Find the sound: ${SOUND_SAY[g]}.`,
        visual: `<div class="big-emoji">${KEYWORD_PIC[g]}</div>`,
        right: textCard(g, 'grapheme'), wrong: wrong.map((w) => textCard(w, 'grapheme')),
        hint: `Listen again: ${SOUND_SAY[g]}.`,
      });
    }
    return choice(rng, {
      key: `${label}-see-${g}`,
      say: 'What sound does this make? Tap the picture that has this sound.',
      visual: `<div class="grapheme big">${g}</div>`,
      right: emojiCard(KEYWORD_PIC[g]), wrong: wrong.map((w) => emojiCard(KEYWORD_PIC[w])), size: 'xl',
      hint: `This says ${SOUND_SAY[g]}.`,
    });
  };
}

// ---------------------------------------------------------------- blending CVC
// [word, emoji, sounds]
const CVC = [
  ['cat', '🐱', 'c a t'], ['dog', '🐶', 'd o g'], ['pig', '🐷', 'p i g'], ['sun', '☀️', 's u n'], ['hat', '🎩', 'h a t'], ['bed', '🛏️', 'b e d'],
  ['bus', '🚌', 'b u s'], ['cup', '🥤', 'c u p'], ['fox', '🦊', 'f o x'], ['hen', '🐔', 'h e n'], ['map', '🗺️', 'm a p'], ['pen', '🖊️', 'p e n'],
  ['box', '📦', 'b o x'], ['bag', '👜', 'b a g'], ['net', '🥅', 'n e t'], ['web', '🕸️', 'w e b'], ['log', '🪵', 'l o g'], ['mug', '☕', 'm u g'],
  ['rat', '🐀', 'r a t'], ['van', '🚐', 'v a n'], ['fan', '🪭', 'f a n'], ['bat', '🦇', 'b a t'], ['bug', '🐛', 'b u g'], ['nut', '🥜', 'n u t'],
  ['leg', '🦵', 'l e g'], ['ten', '🔟', 't e n'], ['jet', '✈️', 'j e t'], ['pin', '📌', 'p i n'], ['hug', '🤗', 'h u g'], ['red', '🟥', 'r e d'],
  ['hut', '🛖', 'h u t'], ['pan', '🍳', 'p a n'], ['cap', '🧢', 'c a p'], ['bin', '🗑️', 'b i n'], ['dad', '👨', 'd a d'], ['mum', '👩', 'm u m'],
  ['sad', '😢', 's a d'], ['six', '6️⃣', 's i x'], ['zip', '🤐', 'z i p'], ['lips', '👄', 'l i p s'],
];

function blend(rng, level) {
  const [word, emoji, sounds] = rng.pick(CVC);
  const parts = sounds.split(' ');
  const wrong = rng.sample(CVC.filter((w) => w[0] !== word), level >= 2 ? 2 : 1);
  return choice(rng, {
    key: `blend-${word}`,
    say: `Let's blend: ${parts.map((p) => BLEND_SAY[p] || p).join('... ')}. What word is it?`,
    visual: `<div class="sound-buttons">${parts.map((p) => `<span class="sb">${p}</span>`).join('')}</div>`,
    right: emojiCard(emoji), wrong: wrong.map((w) => emojiCard(w[1])), size: 'xl',
    hint: `${parts.map((p) => BLEND_SAY[p] || p).join(', ')}... ${word}!`,
  });
}

// ---------------------------------------------------------------- Phase 4 (CCVC / CVCC) - blend or build
const PHASE4 = [
  ['frog', '🐸', 'f r o g'], ['drum', '🥁', 'd r u m'], ['tent', '⛺', 't e n t'], ['milk', '🥛', 'm i l k'], ['flag', '🚩', 'f l a g'],
  ['crab', '🦀', 'c r a b'], ['swim', '🏊', 's w i m'], ['lamp', '🪔', 'l a m p'], ['hand', '✋', 'h a n d'], ['nest', '🪺', 'n e s t'],
  ['clap', '👏', 'c l a p'], ['gift', '🎁', 'g i f t'], ['vest', '🦺', 'v e s t'], ['mask', '🎭', 'm a s k'], ['plant', '🪴', 'p l a n t'],
  ['skunk', '🦨', 's k u n k'], ['sled', '🛷', 's l e d'], ['swan', '🦢', 's w a n'], ['truck', '🚚', 't r u ck'], ['brick', '🧱', 'b r i ck'],
  ['drip', '💧', 'd r i p'], ['wind', '🌬️', 'w i n d'], ['chest', '🧰', 'ch e s t'], ['shrimp', '🦐', 'sh r i m p'], ['belt', '🥋', 'b e l t'],
  ['plug', '🔌', 'p l u g'], ['clock', '⏰', 'c l o ck'], ['black', '⬛', 'b l a ck'], ['crown', '👑', 'c r ow n'], ['storm', '⛈️', 's t or m'],
  ['star', '⭐', 's t ar'], ['spoon', '🥄', 's p oo n'], ['train', '🚂', 't r ai n'], ['sweet', '🍬', 's w ee t'],
];

function phase4(rng, level) {
  const [word, emoji, sounds] = rng.pick(PHASE4);
  const parts = sounds.split(' ');
  if (level >= 2 && rng.next() < 0.6) {
    // build the word from sound tiles
    const tiles = parts.map((p, i) => ({ id: `t${i}`, html: `<span class="grapheme">${p}</span>`, say: BLEND_SAY[p] || p }));
    return {
      key: `p4-build-${word}`, type: 'order',
      say: `Build the word ${word}. Tap the sounds in order.`,
      visual: `<div class="big-emoji">${emoji}</div>`,
      tiles: rng.shuffle(tiles), answer: tiles.map((t) => t.id), answerText: parts.join(''),
      hint: `${word}: ${parts.map((p) => BLEND_SAY[p] || p).join(', ')}.`,
    };
  }
  const wrong = rng.sample(PHASE4.filter((w) => w[0] !== word), 2);
  return choice(rng, {
    key: `p4-blend-${word}`,
    say: `Blend the sounds: ${parts.map((p) => BLEND_SAY[p] || p).join('... ')}. What is it?`,
    visual: `<div class="sound-buttons">${parts.map((p) => `<span class="sb">${p}</span>`).join('')}</div>`,
    right: emojiCard(emoji), wrong: wrong.map((w) => emojiCard(w[1])), size: 'xl',
    hint: `${parts.map((p) => BLEND_SAY[p] || p).join(', ')}... ${word}!`,
  });
}

// ---------------------------------------------------------------- tricky words
const TRICKY = [
  'the', 'to', 'I', 'no', 'go', 'into', 'he', 'she', 'we', 'me', 'be', 'was', 'you', 'they', 'all', 'are', 'my', 'her',
  'said', 'have', 'like', 'so', 'do', 'some', 'come', 'were', 'there', 'little', 'one', 'when', 'out', 'what', 'oh', 'their',
  'people', 'Mr', 'Mrs', 'looked', 'called', 'asked', 'could',
];

function tricky(rng, level) {
  const pool = level === 1 ? TRICKY.slice(0, 18) : level === 2 ? TRICKY.slice(0, 32) : TRICKY;
  const w = rng.pick(pool);
  const wrong = distractors(rng, pool, w, level >= 2 ? 3 : 2);
  return choice(rng, {
    key: `tricky-${w}`,
    say: `Find the word: ${w}.`,
    right: textCard(w), wrong: wrong.map((x) => textCard(x)),
    hint: `Look for ${w}. Say it with me: ${w}.`,
  });
}

// ---------------------------------------------------------------- tracing
const LOWER = 'satpinmdgockeurhbflvwxyzjq'.split('');
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
function trace(rng, level) {
  const pool = level === 1 ? LOWER.slice(0, 12) : level === 2 ? LOWER : [...LOWER, ...UPPER];
  const g = rng.pick(pool);
  const lower = g === g.toLowerCase();
  return {
    key: `trace-${g}`, type: 'trace', glyph: g, lang: 'en',
    say: `Trace the letter ${lower ? '' : 'capital '}${g.toLowerCase()} with your finger. ${lower ? SOUND_SAY[g] || '' : ''}`,
    hint: 'Follow the grey letter with your finger.',
  };
}

// ---------------------------------------------------------------- Phase 5 (Year 1)
// [word, emoji, grapheme, shown with gap]
const PHASE5 = [
  ['crayon', '🖍️', 'ay', 'cr__on'], ['cloud', '☁️', 'ou', 'cl__d'], ['house', '🏠', 'ou', 'h__se'], ['mouse', '🐭', 'ou', 'm__se'],
  ['pie', '🥧', 'ie', 'p__'], ['tie', '👔', 'ie', 't__'], ['leaf', '🍃', 'ea', 'l__f'], ['tea', '🍵', 'ea', 't__'], ['peach', '🍑', 'ea', 'p__ch'],
  ['boy', '👦', 'oy', 'b__'], ['toy', '🧸', 'oy', 't__'], ['bird', '🐦', 'ir', 'b__d'], ['girl', '👧', 'ir', 'g__l'], ['shirt', '👕', 'ir', 'sh__t'],
  ['blue', '🔵', 'ue', 'bl__'], ['glue', '🧴', 'ue', 'gl__'], ['saw', '🪚', 'aw', 's__'], ['paw', '🐾', 'aw', 'p__'], ['straw', '🥤', 'aw', 'str__'],
  ['whale', '🐳', 'wh', '__ale'], ['wheel', '🛞', 'wh', '__eel'], ['phone', '📱', 'ph', '__one'], ['dolphin', '🐬', 'ph', 'dol__in'],
  ['screw', '🔩', 'ew', 'scr__'], ['toe', '🦶', 'oe', 't__'], ['astronaut', '🧑‍🚀', 'au', 'astron__t'], ['key', '🔑', 'ey', 'k__'],
  ['monkey', '🐒', 'ey', 'monk__'], ['donkey', '🫏', 'ey', 'donk__'],
];
// split digraphs: [word, emoji, wrong spellings]
const SPLIT = [
  ['cake', '🎂', ['caik', 'kake']], ['snake', '🐍', ['snaik', 'snayk']], ['plane', '✈️', ['plain', 'playn']], ['kite', '🪁', ['kight', 'kyte']],
  ['bike', '🚲', ['bighk', 'biek']], ['bone', '🦴', ['boan', 'bown']], ['rose', '🌹', ['roze', 'roas']], ['nose', '👃', ['noas', 'nowz']],
  ['cube', '🧊', ['cuub', 'kewb']], ['flute', '🪈', ['floot', 'flewt']], ['slide', '🛝', ['slyd', 'slighd']], ['five', '5️⃣', ['fyve', 'fiev']],
  ['smile', '😊', ['smyle', 'smighl']], ['gate', '🚧', ['gait', 'gayt']], ['grapes', '🍇', ['graips', 'graypes']],
];
const P5_GRAPHEMES = ['ay', 'ou', 'ie', 'ea', 'oy', 'ir', 'ue', 'aw', 'wh', 'ph', 'ew', 'oe', 'au', 'ey'];
const SAME_SOUND = [['ay', 'ai', 'ey'], ['ie', 'igh'], ['ea', 'ee', 'ey'], ['oy', 'oi'], ['ir', 'ur', 'er'], ['ue', 'ew', 'oo'], ['aw', 'or', 'au'], ['oe', 'oa'], ['ou', 'ow'], ['ph', 'f'], ['wh', 'w']];
const sameSound = (a, b) => a === b || SAME_SOUND.some((g) => g.includes(a) && g.includes(b));

function phase5(rng, level) {
  if (level >= 2 && rng.next() < 0.35) {
    const [word, emoji, bad] = rng.pick(SPLIT);
    return choice(rng, {
      key: `p5-split-${word}`,
      say: `Which is the right way to spell ${word}?`,
      visual: `<div class="big-emoji">${emoji}</div>`,
      right: textCard(word), wrong: bad.map((b) => textCard(b)),
      hint: `${word} has a split digraph: the e at the end makes the vowel say its name.`,
    });
  }
  const [word, emoji, g, gap] = rng.pick(PHASE5);
  const wrong = rng.sample(P5_GRAPHEMES.filter((x) => !sameSound(x, g)), 2);
  return choice(rng, {
    key: `p5-gap-${word}`,
    say: `This is a ${word}. Which sound is missing?`,
    visual: `<div class="big-emoji">${emoji}</div><div class="gap-word">${gap.replace('__', '<span class="gap">?</span>')}</div>`,
    right: textCard(g, 'grapheme'), wrong: wrong.map((w) => textCard(w, 'grapheme')),
    hint: `${word}. The missing sound is spelled ${g.split('').join(' ')}.`,
  });
}

// ---------------------------------------------------------------- reading sentences (Year 1)
const SENTENCES = [
  ['The cat is on the mat.', '🐱'], ['A dog can run fast.', '🐶'], ['The sun is hot.', '☀️'], ['I can see a red bus.', '🚌'],
  ['The fish is in the pond.', '🐟'], ['A frog can jump.', '🐸'], ['The bird is in the nest.', '🐦'], ['I like to eat cake.', '🎂'],
  ['The moon is out at night.', '🌙'], ['The duck can swim.', '🦆'], ['Look at the big ship.', '🚢'], ['My hat is black.', '🎩'],
  ['The pig is in the mud.', '🐷'], ['I can kick the ball.', '⚽'], ['The bee is on the flower.', '🐝'], ['A cow says moo.', '🐮'],
  ['The car is fast.', '🚗'], ['I brush my teeth.', '🪥'], ['It is raining today.', '🌧️'], ['The rocket goes up.', '🚀'],
  ['A snail is slow.', '🐌'], ['I read a book in bed.', '📖'], ['The train is long.', '🚂'], ['We play in the snow.', '⛄'],
  ['Dad has a cup of tea.', '🍵'], ['The fox is in the wood.', '🦊'], ['I can ride my bike.', '🚲'], ['The baby is asleep.', '👶'],
  ['A shark has sharp teeth.', '🦈'], ['The kite is up in the sky.', '🪁'], ['The owl can see at night.', '🦉'], ['A monkey can climb a tree.', '🐒'],
];

function read(rng, level) {
  const [s, emoji] = rng.pick(SENTENCES);
  const wrong = rng.sample(SENTENCES.filter((x) => x[1] !== emoji), level >= 2 ? 2 : 1);
  return choice(rng, {
    key: `read-${emoji}`,
    say: 'Read the sentence. Which picture matches?',
    visual: `<div class="sentence-card" data-say="${s}">${s}</div>`,
    right: emojiCard(emoji), wrong: wrong.map((w) => emojiCard(w[1])), size: 'xl',
    hint: `Let's read it together: ${s}`,
  });
}

// ---------------------------------------------------------------- comprehension (Year 1)
// [story, question, [emoji, answer], [[emoji, wrong], ...]]
const STORIES = [
  ['Sam has a red ball. He kicks it to his dog.', 'What does Sam kick?', ['⚽', 'a ball'], [['🪁', 'a kite'], ['📦', 'a box']]],
  ['Pip the cat sat in the sun. Then she had a nap.', 'Who had a nap?', ['🐱', 'the cat'], [['🐶', 'the dog'], ['🐭', 'the mouse']]],
  ['Mum got a big cake. It had six candles.', 'What did Mum get?', ['🎂', 'a cake'], [['🍕', 'a pizza'], ['🍎', 'an apple']]],
  ['The frog sat on a log. He jumped into the pond.', 'Where did the frog jump?', ['🌊', 'into the pond'], [['🌳', 'up a tree'], ['🏠', 'into a house']]],
  ['Ben put on his coat and hat. It was cold and windy.', 'What was the weather like?', ['💨', 'cold and windy'], [['☀️', 'hot and sunny'], ['❄️', 'snowy']]],
  ['A little duck swam to the bank. It saw a fish.', 'What did the duck see?', ['🐟', 'a fish'], [['🐸', 'a frog'], ['🐝', 'a bee']]],
  ['Lily has a pet rabbit. It likes to eat carrots.', 'What does the rabbit eat?', ['🥕', 'carrots'], [['🍌', 'bananas'], ['🧀', 'cheese']]],
  ['The bus was full. Tom had to stand up.', 'How did Tom travel?', ['🚌', 'by bus'], [['🚲', 'by bike'], ['🚂', 'by train']]],
  ['Gran went to the shop. She got milk and bread.', 'Who went to the shop?', ['👵', 'Gran'], [['👦', 'a boy'], ['👮', 'a police officer']]],
  ['The bee buzzed to a red flower. It wanted some nectar.', 'Where did the bee go?', ['🌺', 'to a flower'], [['🏠', 'to a house'], ['🌳', 'to a tree']]],
  ['It was night. The owl woke up and hooted.', 'When did the owl wake up?', ['🌙', 'at night'], [['☀️', 'in the morning'], ['🌅', 'at lunch']]],
  ['Jack got a new red bike. He rode it to the park.', 'Where did Jack ride?', ['🏞️', 'to the park'], [['🏫', 'to school'], ['🏖️', 'to the beach']]],
  ['The snowman had a carrot nose. Then the sun came out.', 'What was the nose made of?', ['🥕', 'a carrot'], [['🍌', 'a banana'], ['🪨', 'a stone']]],
  ['Meg lost her sock. She found it under the bed.', 'What did Meg lose?', ['🧦', 'her sock'], [['👟', 'her shoe'], ['🧢', 'her cap']]],
  ['A big ship sailed on the sea. It had three flags.', 'Where did the ship sail?', ['🌊', 'on the sea'], [['🏜️', 'in the desert'], ['🌳', 'in a forest']]],
  ['The baby bird was hungry. Mum brought a worm.', 'What did Mum bring?', ['🪱', 'a worm'], [['🍰', 'cake'], ['🥛', 'milk']]],
  ['Dan and Kim made a sandcastle. A wave knocked it down.', 'What did they make?', ['🏰', 'a sandcastle'], [['⛄', 'a snowman'], ['🪁', 'a kite']]],
  ['The fox was red with a bushy tail. It ran into the wood.', 'What colour was the fox?', ['🟧', 'red'], [['🟦', 'blue'], ['🟩', 'green']]],
  ['Sid the snail was very slow. He got to the party last.', 'Who was slow?', ['🐌', 'the snail'], [['🐇', 'the rabbit'], ['🐆', 'the cheetah']]],
  ['Anna planted a seed. She gave it water every day.', 'What did Anna plant?', ['🌱', 'a seed'], [['🍎', 'an apple'], ['🪨', 'a rock']]],
  ['The rocket went up into space. It landed on the moon.', 'Where did the rocket land?', ['🌙', 'on the moon'], [['🌊', 'in the sea'], ['🏠', 'on a house']]],
  ['Max had a sore tooth. He went to the dentist.', 'Where did Max go?', ['🦷', 'to the dentist'], [['🏊', 'swimming'], ['🛒', 'to the shop']]],
  ['The kitten played with a ball of wool. Then it fell asleep.', 'What did the kitten play with?', ['🧶', 'wool'], [['⚽', 'a football'], ['🧸', 'a teddy']]],
  ['Dad cooked eggs for breakfast. Ella had toast too.', 'What did Dad cook?', ['🍳', 'eggs'], [['🍝', 'pasta'], ['🍕', 'pizza']]],
  ['The monkey climbed the tree. It picked a banana.', 'What did the monkey pick?', ['🍌', 'a banana'], [['🍓', 'a strawberry'], ['🥕', 'a carrot']]],
  ['It rained all day. Zara jumped in the puddles.', 'What did Zara jump in?', ['💧', 'puddles'], [['🍂', 'leaves'], ['❄️', 'snow']]],
  ['The farmer has ten cows. He milks them every morning.', 'What animals does the farmer have?', ['🐄', 'cows'], [['🐖', 'pigs'], ['🐑', 'sheep']]],
  ['Ali got a letter. It was from his grandad.', 'Who sent the letter?', ['👴', 'his grandad'], [['👩', 'his mum'], ['🧑‍🚒', 'a firefighter']]],
  ['The clock said three. It was time to go home.', 'What time was it?', ['🕒', 'three o\'clock'], [['🕖', 'seven o\'clock'], ['🕛', 'twelve o\'clock']]],
  ['Rosa painted a rainbow. She used lots of colours.', 'What did Rosa paint?', ['🌈', 'a rainbow'], [['🏠', 'a house'], ['🐶', 'a dog']]],
  ['The whale swam deep in the sea. It sang a song.', 'What did the whale do?', ['🎶', 'it sang'], [['💤', 'it slept'], ['🍽️', 'it ate']]],
];

function comp(rng) {
  const [story, q, a, d] = rng.pick(STORIES);
  return choice(rng, {
    key: `comp-${q}-${a[1]}`,
    say: `${story} ... ${q}`,
    visual: `<div class="sentence-card story" data-say="${story}">${story}</div><div class="question-line">${q}</div>`,
    right: { ...emojiCard(a[0], a[1]), say: a[1] }, wrong: d.map(([e, l]) => ({ ...emojiCard(e, l), say: l })),
    hint: `Listen again: ${story}`,
  });
}

// ---------------------------------------------------------------- building sentences (Year 1)
const BUILD = [
  'The cat sat on the mat.', 'I can see a big dog.', 'We like to play football.', 'The sun is very hot.', 'My mum has a red car.',
  'The fish swims in the sea.', 'I go to school every day.', 'The bird can fly high.', 'Dad reads me a story.', 'The frog jumps in the pond.',
  'I have two little sisters.', 'The baby is fast asleep.', 'We had cake at the party.', 'The duck is in the water.', 'Can you see the moon?',
  'The bus stops at the shop.', 'I like apples and pears.', 'The cow lives on a farm.', 'It is cold in winter.', 'The bee is on a flower.',
  'My friend has a new bike.', 'The owl hoots at night.', 'I brush my teeth at night.', 'The train goes very fast.', 'We plant seeds in spring.',
  'The rabbit eats a carrot.', 'Look at the big rainbow.', 'I can write my name.', 'The monkey has a banana.', 'Grandad drinks a cup of tea.',
  'The snail is very slow.', 'I put on my warm coat.',
];

function build(rng, level) {
  const pool = level === 1 ? BUILD.filter((s) => s.split(' ').length <= 5) : BUILD;
  const s = rng.pick(pool.length ? pool : BUILD);
  const words = s.split(' ');
  const tiles = words.map((w, i) => ({ id: `w${i}`, html: `<span class="word">${w}</span>`, say: w.replace(/[.?]/g, '') }));
  return {
    key: `build-${s}`, type: 'order',
    say: `Build this sentence: ${s}`,
    tiles: rng.shuffle(tiles), answer: tiles.map((t) => t.id), answerText: words.join(' '),
    sameWords: true,
    hint: `Start with the word that has a capital letter: ${words[0]}.`,
  };
}

export const GENERATORS = {
  'e-listen': listen,
  'e-rhyme': rhyme,
  'e-initial': initial,
  'e-names': names,
  'e-phase2': phase(PHASE2, 'p2'),
  'e-phase3': phase(PHASE3, 'p3'),
  'e-blend': blend,
  'e-phase4': phase4,
  'e-tricky': tricky,
  'e-trace': trace,
  'e-phase5': phase5,
  'e-read': read,
  'e-comp': comp,
  'e-build': build,
};

export const _data = { PICS, LISTEN, RHYMES, CVC, PHASE4, TRICKY, PHASE5, SPLIT, SENTENCES, STORIES, BUILD, picByWord };
