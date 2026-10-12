// Science / Understanding the World: animals, bodies, senses, weather, day & night, growing, food,
// animal groups and diets, plants and trees, materials, seasons.
import { choice, emojiCard } from './core.js';
import { plant } from './visuals.js';

const word = (w, e = '') => ({ html: `${e ? `<span class="emo">${e}</span>` : ''}<span class="lbl">${w}</span>`, say: w });

/** Drag-and-drop sorting into 2-3 picture bins. */
function sortQ(rng, { key, say, bins, items, hint }) {
  return {
    key, type: 'sort', say, hint,
    bins: bins.map((b, i) => ({ id: `b${i}`, html: b.html, label: b.label, say: b.say || b.label })),
    items: rng.shuffle(items).map((it, i) => ({ id: `i${i}`, html: it.html, say: it.say, bin: `b${bins.findIndex((b) => b.key === it.bin)}` })),
  };
}

/** True / not true with a picture. */
function tf(rng, { key, statement, emoji, truth, hint }) {
  return choice(rng, {
    key, say: `${statement} Is that true?`,
    visual: `${emoji ? `<div class="big-emoji">${emoji}</div>` : ''}<div class="sentence-card" data-say="${statement}">${statement}</div>`,
    right: truth ? { html: '<span class="emo">👍</span><span class="lbl">True</span>', say: 'true' } : { html: '<span class="emo">👎</span><span class="lbl">Not true</span>', say: 'not true' },
    wrong: [truth ? { html: '<span class="emo">👎</span><span class="lbl">Not true</span>', say: 'not true' } : { html: '<span class="emo">👍</span><span class="lbl">True</span>', say: 'true' }],
    size: 'xl', hint,
  });
}

/** "What happens next?" (choose) or put the whole sequence in order. */
function sequenceQ(rng, level, seqs, keyPrefix) {
  const [name, steps] = rng.pick(seqs);
  if (level >= 2 && steps.length >= 3) {
    const tiles = steps.map(([e, w], i) => ({ id: `s${i}`, html: `<span class="emo">${e}</span>`, say: w }));
    return {
      key: `${keyPrefix}-order-${name}`, type: 'order',
      say: `Put the pictures in order: ${name}. What happens first?`,
      tiles: rng.shuffle(tiles), answer: tiles.map((t) => t.id),
      hint: `First ${steps[0][1]}, then ${steps[1][1]}.`,
    };
  }
  const k = rng.int(1, steps.length - 1);
  const next = steps[k];
  const seen = new Set([next[0], ...steps.map((st) => st[0])]);
  const pool = seqs.filter((s) => s[0] !== name).flatMap((s) => s[1]).filter((x) => !seen.has(x[0]) && seen.add(x[0]));
  const other = rng.sample(pool, 2);
  return choice(rng, {
    key: `${keyPrefix}-next-${name}-${k}`,
    say: `What happens next? ${steps.slice(0, k).map((s) => s[1]).join(', then ')}...`,
    visual: `<div class="pattern">${steps.slice(0, k).map(([e]) => `<span>${e}</span>`).join('<b>➜</b>')}<b>➜</b><span class="gap">?</span></div>`,
    right: emojiCard(next[0]), wrong: other.map(([e]) => emojiCard(e)), size: 'xl',
    hint: `Next comes ${next[1]}.`,
  });
}

// ---------------------------------------------------------------- animal homes
const HOME = {
  sea: ['🌊', 'the sea'], tree: ['🌳', 'a tree'], desert: ['🏜️', 'the desert'], ice: ['🧊', 'the icy cold'], house: ['🏠', 'a house with people'],
  nest: ['🪺', 'a nest'], web: ['🕸️', 'a web'], farm: ['🚜', 'a farm'], hive: ['🍯', 'a hive'], pond: ['💧', 'a pond'], burrow: ['🕳️', 'a burrow under the ground'],
};
const HOMES = [
  ['🐟', 'fish', 'sea'], ['🐳', 'whale', 'sea'], ['🐙', 'octopus', 'sea'], ['🦀', 'crab', 'sea'], ['🦈', 'shark', 'sea'], ['🐬', 'dolphin', 'sea'],
  ['🐒', 'monkey', 'tree'], ['🐿️', 'squirrel', 'tree'], ['🐨', 'koala', 'tree'], ['🦥', 'sloth', 'tree'],
  ['🐫', 'camel', 'desert'], ['🦂', 'scorpion', 'desert'], ['🦎', 'lizard', 'desert'],
  ['🐧', 'penguin', 'ice'], ['🐻‍❄️', 'polar bear', 'ice'], ['🦭', 'seal', 'ice'],
  ['🐶', 'dog', 'house'], ['🐱', 'cat', 'house'], ['🐹', 'hamster', 'house'],
  ['🐦', 'bird', 'nest'], ['🦅', 'eagle', 'nest'], ['🕷️', 'spider', 'web'],
  ['🐮', 'cow', 'farm'], ['🐷', 'pig', 'farm'], ['🐴', 'horse', 'farm'], ['🐑', 'sheep', 'farm'], ['🐔', 'hen', 'farm'],
  ['🐝', 'bee', 'hive'], ['🐸', 'frog', 'pond'], ['🦆', 'duck', 'pond'], ['🐰', 'rabbit', 'burrow'], ['🦊', 'fox', 'burrow'],
];
function homes(rng, level) {
  if (level >= 2 && rng.next() < 0.5) {
    const keys = rng.sample([...new Set(HOMES.map((h) => h[2]))].filter((k) => HOMES.filter((h) => h[2] === k).length >= 2), 2);
    const items = keys.flatMap((k) => rng.sample(HOMES.filter((h) => h[2] === k), 2));
    return sortQ(rng, {
      key: `homes-sort-${keys.join('-')}-${items.map((i) => i[1]).join('')}`,
      say: 'Help the animals get home! Drag each animal to its home.',
      bins: keys.map((k) => ({ key: k, html: `<span class="emo">${HOME[k][0]}</span>`, label: HOME[k][1] })),
      items: items.map(([e, n, k]) => ({ html: `<span class="emo">${e}</span>`, say: n, bin: k })),
      hint: 'Think: does it swim, fly, or live with people?',
    });
  }
  const [e, n, k] = rng.pick(HOMES);
  const others = rng.sample(Object.keys(HOME).filter((x) => x !== k), level >= 2 ? 2 : 1);
  return choice(rng, {
    key: `homes-${n}`,
    say: `Where does the ${n} live?`,
    visual: `<div class="big-emoji">${e}</div>`,
    right: { ...emojiCard(HOME[k][0]), say: HOME[k][1] }, wrong: others.map((o) => ({ ...emojiCard(HOME[o][0]), say: HOME[o][1] })), size: 'xl',
    hint: `The ${n} lives in ${HOME[k][1]}.`,
  });
}

// ---------------------------------------------------------------- animal babies
const BABIES = [
  ['🐱', 'cat', 'kitten'], ['🐶', 'dog', 'puppy'], ['🐮', 'cow', 'calf'], ['🐑', 'sheep', 'lamb'], ['🐔', 'hen', 'chick'], ['🦆', 'duck', 'duckling'],
  ['🐸', 'frog', 'tadpole'], ['🦋', 'butterfly', 'caterpillar'], ['🐴', 'horse', 'foal'], ['🐐', 'goat', 'kid'], ['🦘', 'kangaroo', 'joey'],
  ['🐻', 'bear', 'cub'], ['🦁', 'lion', 'cub'], ['🐷', 'pig', 'piglet'], ['🦢', 'swan', 'cygnet'], ['🦉', 'owl', 'owlet'], ['🦌', 'deer', 'fawn'],
  ['🪿', 'goose', 'gosling'], ['🐘', 'elephant', 'calf'], ['🐰', 'rabbit', 'kit'],
];
function babies(rng, level) {
  const [e, adult, baby] = rng.pick(BABIES);
  if (level >= 2 && rng.next() < 0.5) {
    const wrong = rng.sample([...new Set(BABIES.filter((b) => b[2] !== baby).map((b) => b[2]))], 2).map((b) => [null, null, b]);
    return choice(rng, {
      key: `babies-name-${adult}`,
      say: `What do we call a baby ${adult}?`,
      visual: `<div class="big-emoji">${e}</div>`,
      right: word(baby), wrong: wrong.map((w) => word(w[2])),
      hint: `A baby ${adult} is called a ${baby}.`,
    });
  }
  const wrong = rng.sample(BABIES.filter((b) => b[2] !== baby && b[1] !== adult), level >= 2 ? 2 : 1);
  return choice(rng, {
    key: `babies-mum-${adult}`,
    say: `Who is the mummy of the ${baby}?`,
    right: emojiCard(e), wrong: wrong.map((w) => emojiCard(w[0])), size: 'xl',
    hint: `A ${baby} grows up to be a ${adult}.`,
  });
}

// ---------------------------------------------------------------- body
const BODY = [
  ['👁️', 'eye', 'see'], ['👂', 'ear', 'hear'], ['👃', 'nose', 'smell'], ['👄', 'mouth', 'eat and talk'], ['👅', 'tongue', 'taste'],
  ['🦷', 'teeth', 'bite and chew'], ['✋', 'hand', 'wave and hold things'], ['🦶', 'foot', 'walk'], ['🦵', 'leg', 'kick a ball'],
  ['💪', 'arm', 'lift and carry'], ['🧠', 'brain', 'think'], ['🖐️', 'fingers', 'count to five'], ['💇', 'hair', 'brush'],
  ['🦴', 'bones', 'hold your body up'], ['🫀', 'heart', 'pump blood around your body'], ['🫁', 'lungs', 'breathe'],
];
function body(rng, level, pool = BODY.slice(0, level >= 2 ? 16 : 12), prefix = 'body') {
  const [e, part, use] = rng.pick(pool);
  const wrong = rng.sample(pool.filter((b) => b[1] !== part), level >= 2 ? 2 : 1).map((w) => emojiCard(w[0]));
  if (rng.next() < 0.5) {
    return choice(rng, { key: `${prefix}-find-${part}`, say: `Can you find the ${part}?`, right: emojiCard(e), wrong, size: 'xl', hint: `We use our ${part} to ${use}.` });
  }
  return choice(rng, { key: `${prefix}-use-${part}`, say: `What do we use to ${use}?`, right: emojiCard(e), wrong, size: 'xl', hint: `We use our ${part}.` });
}

// ---------------------------------------------------------------- senses
const SENSE = { see: ['👁️', 'see'], hear: ['👂', 'hear'], smell: ['👃', 'smell'], taste: ['👅', 'taste'], touch: ['✋', 'touch'] };
const SENSE_ITEMS = [
  ['🌈', 'a rainbow', 'see'], ['⭐', 'the stars', 'see'], ['📺', 'a cartoon', 'see'], ['📖', 'pictures in a book', 'see'], ['🌅', 'a sunset', 'see'], ['🚥', 'traffic lights', 'see'],
  ['🎵', 'music', 'hear'], ['🔔', 'a bell', 'hear'], ['🥁', 'a drum', 'hear'], ['☎️', 'the phone ringing', 'hear'], ['🎤', 'someone singing', 'hear'], ['🎺', 'a trumpet', 'hear'],
  ['🌸', 'a flower', 'smell'], ['🧄', 'garlic', 'smell'], ['🌹', 'a rose', 'smell'], ['🦨', 'a skunk', 'smell'], ['🗑️', 'a smelly bin', 'smell'], ['🧼', 'soap', 'smell'],
  ['🍦', 'ice cream', 'taste'], ['🍋', 'a sour lemon', 'taste'], ['🍭', 'a lollipop', 'taste'], ['🍯', 'sweet honey', 'taste'], ['🍫', 'chocolate', 'taste'],
  ['🧸', 'a soft teddy', 'touch'], ['🌵', 'a prickly cactus', 'touch'], ['🧊', 'cold ice', 'touch'], ['🪶', 'a tickly feather', 'touch'], ['🧶', 'soft wool', 'touch'],
  ['🎆', 'fireworks in the sky', 'see'], ['🐶', 'a dog barking', 'hear'], ['🍞', 'fresh bread baking', 'smell'], ['🍕', 'pizza in your mouth', 'taste'],
];
function senses(rng, level) {
  if (level >= 2 && rng.next() < 0.45) {
    const keys = rng.sample(Object.keys(SENSE), 2);
    const items = keys.flatMap((k) => rng.sample(SENSE_ITEMS.filter((s) => s[2] === k), 2));
    return sortQ(rng, {
      key: `senses-sort-${keys.join('-')}-${items.map((i) => i[0]).join('')}`,
      say: `Sort the pictures. Which sense do you use? ${keys.join(' or ')}?`,
      bins: keys.map((k) => ({ key: k, html: `<span class="emo">${SENSE[k][0]}</span>`, label: SENSE[k][1] })),
      items: items.map(([e, n, k]) => ({ html: `<span class="emo">${e}</span>`, say: n, bin: k })),
      hint: 'Think: eyes see, ears hear, nose smells, tongue tastes, hands touch.',
    });
  }
  const [e, n, k] = rng.pick(SENSE_ITEMS);
  const others = rng.sample(Object.keys(SENSE).filter((x) => x !== k), level >= 2 ? 3 : 2);
  return choice(rng, {
    key: `senses-${n}`,
    say: `Which sense helps you most with ${n}?`,
    visual: `<div class="big-emoji">${e}</div>`,
    right: { ...emojiCard(SENSE[k][0]), say: SENSE[k][1] }, wrong: others.map((o) => ({ ...emojiCard(SENSE[o][0]), say: SENSE[o][1] })), size: 'xl',
    hint: `We ${k} ${n}.`,
  });
}

// ---------------------------------------------------------------- weather
const WEATHER = { sunny: '☀️', rainy: '🌧️', snowy: '❄️', windy: '💨', cloudy: '☁️', stormy: '⛈️', foggy: '🌫️' };
const WEATHER_NEEDS = [
  ['sunny', '🕶️', 'sunglasses'], ['sunny', '🧴', 'sun cream'], ['sunny', '👒', 'a sun hat'], ['sunny', '🩳', 'shorts'],
  ['rainy', '☂️', 'an umbrella'], ['rainy', '🥾', 'wellies'], ['rainy', '🧥', 'a raincoat'],
  ['snowy', '🧤', 'gloves'], ['snowy', '🧣', 'a scarf'], ['snowy', '⛄', 'a snowman'], ['snowy', '🛷', 'a sledge'],
  ['windy', '🪁', 'a kite'], ['windy', '⛵', 'a sailing boat'],
];
function weather(rng, level) {
  const form = rng.int(1, level >= 2 ? 3 : 2);
  if (form === 1) {
    const w = rng.pick(Object.keys(WEATHER));
    const others = rng.sample(Object.keys(WEATHER).filter((x) => x !== w), level >= 2 ? 2 : 1);
    return choice(rng, { key: `weather-find-${w}`, say: `Which picture shows ${w} weather?`, right: emojiCard(WEATHER[w]), wrong: others.map((o) => emojiCard(WEATHER[o])), size: 'xl', hint: `${w[0].toUpperCase() + w.slice(1)} looks like this.` });
  }
  const [w, e, n] = rng.pick(WEATHER_NEEDS);
  const wrong = rng.sample(WEATHER_NEEDS.filter((x) => x[0] !== w), 2);
  if (form === 2) {
    return choice(rng, {
      key: `weather-need-${n}`,
      say: `It is ${w}. What will you need?`,
      visual: `<div class="big-emoji">${WEATHER[w]}</div>`,
      right: emojiCard(e), wrong: wrong.map((x) => emojiCard(x[1])), size: 'xl',
      hint: `When it is ${w}, you might need ${n}.`,
    });
  }
  const truth = rng.next() < 0.5;
  const FALSE_FOR = { sunny: 'snowy', rainy: 'sunny', snowy: 'sunny', windy: 'foggy' };
  const shown = truth ? w : FALSE_FOR[w];
  return tf(rng, {
    key: `weather-tf-${n}-${shown}`,
    statement: `You need ${n} when it is ${shown}.`, emoji: `${WEATHER[shown]} ${e}`, truth,
    hint: `${n[0].toUpperCase() + n.slice(1)} is for ${w} days.`,
  });
}

// ---------------------------------------------------------------- day & night
const DAYNIGHT = [
  ['☀️', 'the sun', 'day'], ['🏫', 'going to school', 'day'], ['🐓', 'a rooster crowing', 'day'], ['🥣', 'breakfast', 'day'], ['🏖️', 'the beach', 'day'],
  ['🦋', 'a butterfly', 'day'], ['🌻', 'a sunflower opening', 'day'], ['🌈', 'a rainbow', 'day'],
  ['🌙', 'the moon', 'night'], ['⭐', 'the stars', 'night'], ['🦉', 'an owl hooting', 'night'], ['🦇', 'a bat flying', 'night'], ['🛏️', 'going to bed', 'night'],
  ['🌃', 'dark sky', 'night'], ['🦔', 'a hedgehog looking for food', 'night'], ['😴', 'sleeping', 'night'], ['🔦', 'a torch', 'night'],
];
function dayNight(rng, level) {
  const DAY = ['🌞', 'day'];
  const NIGHT = ['🌜', 'night'];
  if (rng.next() < 0.4 || level >= 3) {
    const items = [...rng.sample(DAYNIGHT.filter((x) => x[2] === 'day'), 2), ...rng.sample(DAYNIGHT.filter((x) => x[2] === 'night'), 2)];
    return sortQ(rng, {
      key: `dn-sort-${items.map((i) => i[0]).join('')}`,
      say: 'Is it day or night? Drag each picture to day or night.',
      bins: [{ key: 'day', html: `<span class="emo">${DAY[0]}</span>`, label: 'day' }, { key: 'night', html: `<span class="emo">${NIGHT[0]}</span>`, label: 'night' }],
      items: items.map(([e, n, k]) => ({ html: `<span class="emo">${e}</span>`, say: n, bin: k })),
      hint: 'The sun is out in the day. The moon and stars come out at night.',
    });
  }
  const [e, n, k] = rng.pick(DAYNIGHT);
  return choice(rng, {
    key: `dn-${n}`,
    say: `When do we see ${n}? In the day or at night?`,
    visual: `<div class="big-emoji">${e}</div>`,
    right: word(k === 'day' ? 'day' : 'night', k === 'day' ? DAY[0] : NIGHT[0]), wrong: [word(k === 'day' ? 'night' : 'day', k === 'day' ? NIGHT[0] : DAY[0])], size: 'xl',
    hint: k === 'day' ? 'That happens when it is light.' : 'That happens when it is dark.',
  });
}

// ---------------------------------------------------------------- growing and changing
const SEQS = [
  ['a seed grows', [['🌰', 'a seed'], ['🌱', 'a shoot'], ['🪴', 'a plant'], ['🌻', 'a flower']]],
  ['a chick hatches', [['🥚', 'an egg'], ['🐣', 'a chick hatching'], ['🐥', 'a chick'], ['🐔', 'a hen']]],
  ['a butterfly grows', [['🥚', 'a tiny egg'], ['🐛', 'a caterpillar'], ['🦋', 'a butterfly']]],
  ['people grow', [['👶', 'a baby'], ['🧒', 'a child'], ['🧑', 'a grown-up'], ['🧓', 'an older person']]],
  ['an apple tree', [['🌰', 'a pip'], ['🌱', 'a seedling'], ['🌳', 'a tree'], ['🍎', 'apples']]],
  ['ice melts', [['🧊', 'ice'], ['💧', 'water']]],
  ['rain', [['☁️', 'clouds'], ['🌧️', 'rain'], ['💧', 'puddles']]],
  ['a day', [['🌅', 'sunrise'], ['☀️', 'midday'], ['🌇', 'sunset'], ['🌙', 'night']]],
  ['making a snowman', [['❄️', 'snow falls'], ['⛄', 'build a snowman'], ['💧', 'it melts']]],
  ['a flower opens', [['🌱', 'a shoot'], ['🌷', 'a bud'], ['🌸', 'a flower']]],
  ['baking a cake', [['🥚', 'eggs and flour'], ['🥣', 'mix'], ['🎂', 'a cake']]],
];
const NEEDS = [['💧', 'water'], ['☀️', 'sunlight'], ['🪴', 'soil'], ['💨', 'air']];
const NOT_NEEDS = [['🍫', 'chocolate'], ['📺', 'television'], ['🧸', 'toys'], ['🍬', 'sweets'], ['👟', 'shoes'], ['🎮', 'games']];
function plants(rng, level) {
  if (rng.next() < 0.35) {
    const [e, n] = rng.pick(NEEDS);
    const wrong = rng.sample(NOT_NEEDS, level >= 2 ? 2 : 1);
    return choice(rng, {
      key: `plants-need-${n}-${wrong.map((w) => w[1]).join('')}`,
      say: 'What does a plant need to grow?',
      visual: '<div class="big-emoji">🌱</div>',
      right: { ...emojiCard(e), say: n }, wrong: wrong.map(([we, wn]) => ({ ...emojiCard(we), say: wn })), size: 'xl',
      hint: 'Plants need water, sunlight, soil and air.',
    });
  }
  return sequenceQ(rng, level, SEQS, 'grow');
}

// ---------------------------------------------------------------- healthy food
const HEALTHY = [['🍎', 'an apple'], ['🍌', 'a banana'], ['🥕', 'a carrot'], ['🥦', 'broccoli'], ['🍇', 'grapes'], ['🍓', 'strawberries'], ['🥒', 'cucumber'],
  ['🍅', 'a tomato'], ['🍐', 'a pear'], ['🍊', 'an orange'], ['🥛', 'milk'], ['🐟', 'fish'], ['🥚', 'an egg'], ['🍚', 'rice'], ['🫘', 'beans'],
  ['🥗', 'salad'], ['🫐', 'blueberries'], ['🍉', 'watermelon'], ['🥑', 'avocado'], ['💧', 'water']];
const TREATS = [['🍭', 'a lollipop'], ['🍬', 'sweets'], ['🍫', 'chocolate'], ['🍩', 'a doughnut'], ['🍰', 'cake'], ['🧁', 'a cupcake'], ['🍟', 'chips'],
  ['🥤', 'fizzy drink'], ['🍪', 'a biscuit'], ['🍦', 'ice cream']];
function food(rng, level) {
  if (level >= 2 && rng.next() < 0.5) {
    const items = [...rng.sample(HEALTHY, 2), ...rng.sample(TREATS, 2)];
    return sortQ(rng, {
      key: `food-sort-${items.map((i) => i[0]).join('')}`,
      say: 'Sort the food. Everyday healthy food, or a treat for sometimes?',
      bins: [{ key: 'h', html: '<span class="emo">💪</span>', label: 'healthy every day' }, { key: 't', html: '<span class="emo">🎉</span>', label: 'a treat sometimes' }],
      items: items.map(([e, n]) => ({ html: `<span class="emo">${e}</span>`, say: n, bin: HEALTHY.some((h) => h[0] === e) ? 'h' : 't' })),
      hint: 'Fruit and vegetables are healthy. Sweets and cakes are treats.',
    });
  }
  const healthy = rng.next() < 0.6;
  const right = rng.pick(healthy ? HEALTHY : TREATS);
  const wrong = rng.sample(healthy ? TREATS : HEALTHY, level >= 2 ? 2 : 1);
  return choice(rng, {
    key: `food-${healthy ? 'h' : 't'}-${right[1]}`,
    say: healthy ? 'Which food is healthy, to eat every day?' : 'Which one is a treat, just for sometimes?',
    right: { ...emojiCard(right[0]), say: right[1] }, wrong: wrong.map(([e, n]) => ({ ...emojiCard(e), say: n })), size: 'xl',
    hint: healthy ? `${right[1]} is good for your body.` : `${right[1]} has lots of sugar or fat, so it's a treat.`,
  });
}

// ---------------------------------------------------------------- animal groups (Year 1)
const GROUP = {
  mammal: ['🐾', 'mammal', 'has hair or fur and feeds its babies milk'], bird: ['🪶', 'bird', 'has feathers, wings and a beak'],
  fish: ['🫧', 'fish', 'lives in water and breathes with gills'], reptile: ['🦎', 'reptile', 'has dry, scaly skin'],
  amphibian: ['💧', 'amphibian', 'lives in water and on land and has smooth, wet skin'], insect: ['🐜', 'insect', 'has six legs'],
};
const ANIMALS = [
  ['🐶', 'dog', 'mammal'], ['🐱', 'cat', 'mammal'], ['🐮', 'cow', 'mammal'], ['🐘', 'elephant', 'mammal'], ['🦁', 'lion', 'mammal'], ['🐒', 'monkey', 'mammal'],
  ['🐳', 'whale', 'mammal'], ['🦇', 'bat', 'mammal'], ['🐬', 'dolphin', 'mammal'], ['🐻', 'bear', 'mammal'], ['🦒', 'giraffe', 'mammal'], ['🐫', 'camel', 'mammal'],
  ['🦅', 'eagle', 'bird'], ['🦉', 'owl', 'bird'], ['🐧', 'penguin', 'bird'], ['🦆', 'duck', 'bird'], ['🦜', 'parrot', 'bird'], ['🦩', 'flamingo', 'bird'], ['🐔', 'hen', 'bird'],
  ['🐟', 'goldfish', 'fish'], ['🐠', 'clownfish', 'fish'], ['🦈', 'shark', 'fish'], ['🐡', 'pufferfish', 'fish'],
  ['🐍', 'snake', 'reptile'], ['🐊', 'crocodile', 'reptile'], ['🦎', 'lizard', 'reptile'], ['🐢', 'turtle', 'reptile'],
  ['🐸', 'frog', 'amphibian'],
  ['🐝', 'bee', 'insect'], ['🐞', 'ladybird', 'insect'], ['🦋', 'butterfly', 'insect'], ['🐜', 'ant', 'insect'], ['🦗', 'grasshopper', 'insect'], ['🪲', 'beetle', 'insect'],
];
function groups(rng, level) {
  const form = rng.int(1, 3);
  if (form === 1 && level >= 2) {
    const keys = rng.sample(['mammal', 'bird', 'fish', 'reptile', 'insect'], 2);
    const items = keys.flatMap((k) => rng.sample(ANIMALS.filter((a) => a[2] === k), 2));
    return sortQ(rng, {
      key: `groups-sort-${keys.join('-')}-${items.map((i) => i[1]).join('')}`,
      say: `Sort the animals: ${keys.map((k) => `${k}s`).join(' and ')}.`,
      bins: keys.map((k) => ({ key: k, html: `<span class="emo">${GROUP[k][0]}</span>`, label: `${k}s` })),
      items: items.map(([e, n, k]) => ({ html: `<span class="emo">${e}</span>`, say: n, bin: k })),
      hint: keys.map((k) => `A ${k} ${GROUP[k][2]}.`).join(' '),
    });
  }
  const [e, n, k] = rng.pick(ANIMALS);
  if (form === 2) {
    const others = rng.sample(Object.keys(GROUP).filter((x) => x !== k), 2);
    return choice(rng, {
      key: `groups-which-${n}`,
      say: `Which animal group does the ${n} belong to?`,
      visual: `<div class="big-emoji">${e}</div>`,
      right: word(`${k}`, GROUP[k][0]), wrong: others.map((o) => word(o, GROUP[o][0])),
      hint: `A ${k} ${GROUP[k][2]}.`,
    });
  }
  const wrong = rng.sample(ANIMALS.filter((a) => a[2] !== k), 2);
  return choice(rng, {
    key: `groups-find-${k}-${n}`,
    say: `Which one is a ${k}?`,
    right: emojiCard(e), wrong: wrong.map((w) => emojiCard(w[0])), size: 'xl',
    hint: `A ${k} ${GROUP[k][2]}.`,
  });
}

// ---------------------------------------------------------------- diets (Year 1)
const DIET = { carnivore: ['🥩', 'carnivore', 'eats meat'], herbivore: ['🌿', 'herbivore', 'eats only plants'], omnivore: ['🍽️', 'omnivore', 'eats plants and meat'] };
const DIETS = [
  ['🦁', 'lion', 'carnivore'], ['🐯', 'tiger', 'carnivore'], ['🦈', 'shark', 'carnivore'], ['🦅', 'eagle', 'carnivore'], ['🐺', 'wolf', 'carnivore'],
  ['🐊', 'crocodile', 'carnivore'], ['🦉', 'owl', 'carnivore'], ['🐍', 'snake', 'carnivore'], ['🐆', 'leopard', 'carnivore'], ['🐬', 'dolphin', 'carnivore'],
  ['🐮', 'cow', 'herbivore'], ['🐑', 'sheep', 'herbivore'], ['🐰', 'rabbit', 'herbivore'], ['🐘', 'elephant', 'herbivore'], ['🦒', 'giraffe', 'herbivore'],
  ['🐴', 'horse', 'herbivore'], ['🐐', 'goat', 'herbivore'], ['🐨', 'koala', 'herbivore'], ['🦓', 'zebra', 'herbivore'], ['🦛', 'hippo', 'herbivore'],
  ['🐻', 'bear', 'omnivore'], ['🐷', 'pig', 'omnivore'], ['🦝', 'raccoon', 'omnivore'], ['🐔', 'hen', 'omnivore'], ['🦊', 'fox', 'omnivore'],
  ['🧑', 'person', 'omnivore'], ['🐀', 'rat', 'omnivore'], ['🦔', 'hedgehog', 'omnivore'], ['🐒', 'monkey', 'omnivore'], ['🐦‍⬛', 'crow', 'omnivore'],
];
function diets(rng, level) {
  if (level >= 2 && rng.next() < 0.4) {
    const keys = rng.sample(Object.keys(DIET), 2);
    const items = keys.flatMap((k) => rng.sample(DIETS.filter((a) => a[2] === k), 2));
    return sortQ(rng, {
      key: `diets-sort-${keys.join('-')}-${items.map((i) => i[1]).join('')}`,
      say: `Sort the animals: ${keys.map((k) => `${k}s`).join(' and ')}.`,
      bins: keys.map((k) => ({ key: k, html: `<span class="emo">${DIET[k][0]}</span>`, label: `${k}s` })),
      items: items.map(([e, n, k]) => ({ html: `<span class="emo">${e}</span>`, say: n, bin: k })),
      hint: keys.map((k) => `A ${k} ${DIET[k][2]}.`).join(' '),
    });
  }
  const [e, n, k] = rng.pick(DIETS);
  return choice(rng, {
    key: `diets-${n}`,
    say: `What does the ${n} eat? Is it a carnivore, a herbivore or an omnivore?`,
    visual: `<div class="big-emoji">${e}</div>`,
    right: word(k, DIET[k][0]), wrong: Object.keys(DIET).filter((x) => x !== k).map((o) => word(o, DIET[o][0])),
    hint: `The ${n} ${DIET[k][2]}, so it is a ${k}.`,
  });
}

// ---------------------------------------------------------------- humans (Year 1)
const HUMAN_TF = [
  ['Humans are mammals.', '🧑', true], ['We have two eyes.', '👀', true], ['We breathe with our lungs.', '🫁', true], ['We hear with our nose.', '👃', false],
  ['Our heart pumps blood around our body.', '🫀', true], ['We taste with our tongue.', '👅', true], ['Babies grow into adults.', '👶', true],
  ['We have ten fingers.', '🖐️', true], ['Our bones are soft like jelly.', '🦴', false], ['We see with our ears.', '👂', false],
  ['Exercise helps keep us healthy.', '🏃', true], ['We should wash our hands before we eat.', '🧼', true], ['We need to drink water.', '💧', true],
  ['We have four legs.', '🦵', false], ['Sleep helps our body grow.', '😴', true], ['We think with our brain.', '🧠', true],
];
function humans(rng, level) {
  if (rng.next() < 0.45) {
    const [s, e, t] = rng.pick(HUMAN_TF);
    return tf(rng, { key: `humans-tf-${s}`, statement: s, emoji: e, truth: t, hint: t ? 'Yes, that is right about our bodies.' : 'Think about which part of the body does that.' });
  }
  return body(rng, Math.max(level, 2), BODY, 'humans');
}

// ---------------------------------------------------------------- plants and trees (Year 1)
const PART_INFO = {
  flower: 'makes seeds and attracts bees', leaf: 'uses sunlight to make food', stem: 'holds the plant up and carries water',
  roots: 'take in water from the soil', seed: 'grows into a new plant', fruit: 'holds the seeds',
};
const ON_TREES = [['🍎', 'apples'], ['🍐', 'pears'], ['🍊', 'oranges'], ['🍋', 'lemons'], ['🍒', 'cherries'], ['🥥', 'coconuts'], ['🍑', 'peaches'], ['🥭', 'mangoes'], ['🫒', 'olives'], ['🌰', 'chestnuts']];
const NOT_TREES = [['🥕', 'carrots'], ['🥔', 'potatoes'], ['🧅', 'onions'], ['🥬', 'lettuce'], ['🍓', 'strawberries'], ['🍉', 'watermelons'], ['🌽', 'sweetcorn']];
function plantParts(rng, level) {
  const form = rng.int(1, 5);
  const parts = Object.keys(PART_INFO);
  if (form === 5) {
    const right = rng.pick(NOT_TREES);
    return choice(rng, {
      key: `pp-nottree-${right[1]}`,
      say: 'Which one does NOT grow on a tree?',
      right: { ...emojiCard(right[0]), say: right[1] }, wrong: rng.sample(ON_TREES, 2).map(([e, n]) => ({ ...emojiCard(e), say: n })), size: 'xl',
      hint: `${right[1]} grow in the ground or on small plants, not on trees.`,
    });
  }
  if (form === 1) {
    const p = rng.pick(parts);
    return choice(rng, {
      key: `pp-name-${p}`,
      say: 'What is the part shown in red called?',
      visual: plant(p),
      right: word(p), wrong: rng.sample(parts.filter((x) => x !== p), 2).map((w) => word(w)),
      hint: `This is the ${p}. It ${PART_INFO[p]}.`,
    });
  }
  if (form === 2) {
    const p = rng.pick(parts);
    return choice(rng, {
      key: `pp-job-${p}`,
      say: `Which part of a plant ${PART_INFO[p]}?`,
      visual: plant(''),
      right: word(p), wrong: rng.sample(parts.filter((x) => x !== p), 2).map((w) => word(w)),
      hint: `The ${p} ${PART_INFO[p]}.`,
    });
  }
  if (form === 3) {
    const right = rng.pick(ON_TREES);
    return choice(rng, {
      key: `pp-tree-${right[1]}`,
      say: 'Which of these grow on a tree?',
      right: { ...emojiCard(right[0]), say: right[1] }, wrong: rng.sample(NOT_TREES, 2).map(([e, n]) => ({ ...emojiCard(e), say: n })), size: 'xl',
      hint: `${right[1]} grow on trees.`,
    });
  }
  const ever = rng.next() < 0.5;
  return choice(rng, {
    key: `pp-evergreen-${ever}`,
    say: ever ? 'Which tree is evergreen? It keeps its leaves all year.' : 'Which tree is deciduous? It loses its leaves in autumn.',
    right: emojiCard(ever ? '🌲' : '🌳'), wrong: [emojiCard(ever ? '🌳' : '🌲')], size: 'xl',
    hint: ever ? 'Pine trees with needles stay green all year.' : 'Trees like oak lose their leaves in autumn.',
  });
}

// ---------------------------------------------------------------- materials (Year 1)
const MAT = { wood: '🪵', metal: '🔩', plastic: '🧴', glass: '🪟', fabric: '🧵', paper: '📰', rock: '🪨', rubber: '🛞' };
const OBJECTS = [
  ['🪑', 'chair', 'wood'], ['🚪', 'door', 'wood'], ['✏️', 'pencil', 'wood'], ['🛶', 'canoe', 'wood'], ['🏏', 'cricket bat', 'wood'],
  ['🥄', 'spoon', 'metal'], ['🔑', 'key', 'metal'], ['🪙', 'coin', 'metal'], ['🔔', 'bell', 'metal'], ['⚓', 'anchor', 'metal'],
  ['🧸', 'teddy', 'fabric'], ['👕', 'T-shirt', 'fabric'], ['🧦', 'sock', 'fabric'], ['🧣', 'scarf', 'fabric'],
  ['📖', 'book', 'paper'], ['📦', 'cardboard box', 'paper'], ['✉️', 'envelope', 'paper'],
  ['🥛', 'drinking glass', 'glass'], ['👓', 'glasses', 'glass'], ['🫙', 'jar', 'glass'],
  ['🪣', 'bucket', 'plastic'], ['🪥', 'toothbrush', 'plastic'], ['🥤', 'cup with a straw', 'plastic'], ['🧩', 'toy brick', 'plastic'],
  ['🥾', 'wellies', 'rubber'], ['🎈', 'balloon', 'rubber'], ['🛞', 'tyre', 'rubber'],
  ['🗿', 'statue', 'rock'], ['🧱', 'wall', 'rock'], ['🏔️', 'mountain', 'rock'],
];
const PROPS = [
  ['Glass is see-through.', '🪟', true], ['Metal is hard.', '🔩', true], ['Wool is soft.', '🧶', true], ['Paper is waterproof.', '📰', false],
  ['Rubber is stretchy.', '🎈', true], ['Rock is soft and squashy.', '🪨', false], ['Wood comes from trees.', '🌳', true], ['Glass can break.', '🥛', true],
  ['Metal is see-through.', '🔩', false], ['Fabric can bend.', '🧣', true], ['A chocolate teapot would work well.', '🍫', false], ['Plastic can be waterproof.', '🧴', true],
];
const BEST = [['an umbrella', '☂️', 'plastic', ['paper', 'wood']], ['a window', '🪟', 'glass', ['wood', 'metal']], ['a teddy', '🧸', 'fabric', ['rock', 'metal']],
  ['a key', '🔑', 'metal', ['paper', 'fabric']], ['wellies', '🥾', 'rubber', ['paper', 'glass']], ['a book', '📖', 'paper', ['metal', 'rock']], ['a table', '🪑', 'wood', ['paper', 'fabric']]];
function materials(rng, level) {
  const form = rng.int(1, level >= 2 ? 3 : 2);
  if (form === 1) {
    const [e, n, m] = rng.pick(OBJECTS);
    return choice(rng, {
      key: `mat-${n}`,
      say: `What is the ${n} made of?`,
      visual: `<div class="big-emoji">${e}</div>`,
      right: word(m, MAT[m]), wrong: rng.sample(Object.keys(MAT).filter((x) => x !== m), 2).map((o) => word(o, MAT[o])),
      hint: `A ${n} is usually made of ${m}.`,
    });
  }
  if (form === 2) {
    const [s, e, t] = rng.pick(PROPS);
    return tf(rng, { key: `mat-tf-${s}`, statement: s, emoji: e, truth: t, hint: 'Think about how it feels and what it does.' });
  }
  const [thing, e, m, bad] = rng.pick(BEST);
  return choice(rng, {
    key: `mat-best-${thing}`,
    say: `Which is the best material for ${thing}?`,
    visual: `<div class="big-emoji">${e}</div>`,
    right: word(m, MAT[m]), wrong: bad.map((o) => word(o, MAT[o])),
    hint: `${thing[0].toUpperCase() + thing.slice(1)} works best made of ${m}.`,
  });
}

// ---------------------------------------------------------------- seasons (Year 1)
const SEASON = { spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️' };
const SEASON_ITEMS = [
  ['🌷', 'tulips flowering', 'spring'], ['🐣', 'chicks hatching', 'spring'], ['🐑', 'new lambs', 'spring'], ['🌱', 'new shoots', 'spring'], ['🌦️', 'sunny showers', 'spring'],
  ['🏖️', 'a day at the beach', 'summer'], ['🍦', 'ice cream', 'summer'], ['🕶️', 'sunglasses', 'summer'], ['🍉', 'watermelon', 'summer'], ['🏊', 'swimming outside', 'summer'],
  ['🍂', 'falling leaves', 'autumn'], ['🎃', 'pumpkins', 'autumn'], ['🌰', 'conkers', 'autumn'], ['🍄', 'mushrooms', 'autumn'], ['🍁', 'red leaves', 'autumn'],
  ['⛄', 'a snowman', 'winter'], ['🧤', 'warm gloves', 'winter'], ['🧣', 'a woolly scarf', 'winter'], ['🛷', 'sledging', 'winter'], ['☕', 'a hot drink', 'winter'],
];
const SEASON_TF = [
  ['In summer, the days are long.', '☀️', true], ['In winter, it gets dark early.', '🌙', true], ['Leaves fall off trees in spring.', '🍂', false],
  ['It is often hot in winter.', '❄️', false], ['Flowers start to grow in spring.', '🌷', true], ['Autumn comes after summer.', '🍁', true],
];
function seasons(rng, level) {
  const form = rng.int(1, level >= 2 ? 4 : 2);
  if (form === 1) {
    const [e, n, s] = rng.pick(SEASON_ITEMS);
    return choice(rng, {
      key: `season-${n}`,
      say: `Which season is ${n}?`,
      visual: `<div class="big-emoji">${e}</div>`,
      right: word(s, SEASON[s]), wrong: rng.sample(Object.keys(SEASON).filter((x) => x !== s), 2).map((o) => word(o, SEASON[o])),
      hint: `We see ${n} in ${s}.`,
    });
  }
  if (form === 2) {
    const [st, e, t] = rng.pick(SEASON_TF);
    return tf(rng, { key: `season-tf-${st}`, statement: st, emoji: e, truth: t, hint: 'Spring, summer, autumn, winter.' });
  }
  if (form === 3) {
    const keys = rng.sample(Object.keys(SEASON), 2);
    const items = keys.flatMap((k) => rng.sample(SEASON_ITEMS.filter((x) => x[2] === k), 2));
    return sortQ(rng, {
      key: `season-sort-${keys.join('-')}-${items.map((i) => i[0]).join('')}`,
      say: `Sort the pictures into ${keys.join(' and ')}.`,
      bins: keys.map((k) => ({ key: k, html: `<span class="emo">${SEASON[k]}</span>`, label: k })),
      items: items.map(([e, n, k]) => ({ html: `<span class="emo">${e}</span>`, say: n, bin: k })),
      hint: 'Think about the weather in each season.',
    });
  }
  const order = ['spring', 'summer', 'autumn', 'winter'];
  const start = rng.int(0, 3);
  const seq = order.slice(start).concat(order.slice(0, start));
  const tiles = seq.map((s, i) => ({ id: `s${i}`, html: `<span class="emo">${SEASON[s]}</span><span class="lbl">${s}</span>`, say: s }));
  return {
    key: `season-order-${seq[0]}`, type: 'order',
    say: `Put the seasons in order, starting with ${seq[0]}.`,
    tiles: rng.shuffle(tiles), answer: tiles.map((t) => t.id),
    hint: `${seq[0]} comes first, then ${seq[1]}.`,
  };
}

export const GENERATORS = {
  's-homes': homes,
  's-babies': babies,
  's-body': (rng, level) => body(rng, level),
  's-senses': senses,
  's-weather': weather,
  's-daynight': dayNight,
  's-plants': plants,
  's-food': food,
  's-groups': groups,
  's-diets': diets,
  's-humans': humans,
  's-plantparts': plantParts,
  's-materials': materials,
  's-seasons': seasons,
};
