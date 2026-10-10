// Compares what the student said with the target sentence, word by word.

const CONTRACTIONS = {
  "i'm": 'i am', "you're": 'you are', "we're": 'we are', "they're": 'they are', "he's": 'he is', "she's": 'she is',
  "it's": 'it is', "that's": 'that is', "there's": 'there is', "what's": 'what is', "let's": 'let us',
  "don't": 'do not', "doesn't": 'does not', "didn't": 'did not', "can't": 'can not', "cannot": 'can not',
  "won't": 'will not', "isn't": 'is not', "aren't": 'are not', "wasn't": 'was not', "i'll": 'i will',
  "you'll": 'you will', "we'll": 'we will', "i've": 'i have', "i'd": 'i would', "o'clock": 'o clock',
};
const NUMBERS = { 0: 'zero', 1: 'one', 2: 'two', 3: 'three', 4: 'four', 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine', 10: 'ten', 11: 'eleven', 12: 'twelve' };
const SAME = { favorite: 'favourite', color: 'colour', neighbor: 'neighbour', okay: 'ok', grey: 'gray', mom: 'mum', mommy: 'mummy' };

export function normalizeWords(text) {
  return String(text)
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[^a-z0-9'\s-]/g, ' ')
    .replace(/-/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((w) => (CONTRACTIONS[w] || NUMBERS[w] || SAME[w] || w.replace(/'/g, '')).split(' '));
}

/**
 * Returns { score (0-100), words: [{ text, ok }], extra: [string] }
 * `words` are the target sentence's words (original spelling) marked ok/missed.
 */
export function compareSpeech(target, heard) {
  const display = String(target).split(/\s+/).filter(Boolean);
  // map each display word to its normalized pieces
  const pieces = display.map((w) => normalizeWords(w));
  const t = pieces.flat();
  const h = normalizeWords(heard);

  // LCS table
  const dp = Array.from({ length: t.length + 1 }, () => new Array(h.length + 1).fill(0));
  for (let i = t.length - 1; i >= 0; i--) {
    for (let j = h.length - 1; j >= 0; j--) {
      dp[i][j] = t[i] === h[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const matchedT = new Array(t.length).fill(false);
  const matchedH = new Array(h.length).fill(false);
  let i = 0; let j = 0;
  while (i < t.length && j < h.length) {
    if (t[i] === h[j]) { matchedT[i] = true; matchedH[j] = true; i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }

  let k = 0;
  const words = display.map((text, idx) => {
    const n = pieces[idx].length;
    const ok = n === 0 || matchedT.slice(k, k + n).every(Boolean);
    k += n;
    return { text, ok };
  });
  const extra = h.filter((_, idx) => !matchedH[idx]);
  const correct = matchedT.filter(Boolean).length;
  const penalty = Math.min(extra.length, t.length) * 0.5;
  const score = t.length ? Math.max(0, Math.round(((correct - penalty) / t.length) * 100)) : 0;
  return { score, words, extra };
}
