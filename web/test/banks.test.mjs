// Checks every topic's question bank: valid questions, the right answer is present, options are distinct,
// and each topic can produce at least 30 different items for every level.
// Run: node --test web/test/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TOPICS, SUBJECTS, makeRng, loadSubject, YEARS, topicsFor } from '../js/learn/core.js';

const gens = {};
for (const s of SUBJECTS) gens[s.id] = await loadSubject(s.id);

const plain = (h) => String(h).replace(/\s+/g, ' ');

function validate(q, topic) {
  assert.ok(q && q.key, `${topic.id}: question has a key`);
  assert.ok(q.say && (typeof q.say === 'string' || Array.isArray(q.say)), `${topic.id}: has spoken instruction`);
  assert.ok(q.hint, `${topic.id}: has a hint (${q.key})`);
  if (q.type === 'choice') {
    assert.ok(q.options.length >= 2 && q.options.length <= 5, `${q.key}: 2-5 options (${q.options.length})`);
    assert.ok(q.options.some((o) => o.id === q.answer), `${q.key}: answer present`);
    const htmls = q.options.map((o) => plain(o.html));
    assert.equal(new Set(htmls).size, htmls.length, `${q.key}: options are all different: ${htmls.join(' | ')}`);
  } else if (q.type === 'sort') {
    assert.ok(q.bins.length >= 2, `${q.key}: bins`);
    assert.ok(q.items.length >= 3, `${q.key}: items`);
    for (const it of q.items) assert.ok(q.bins.some((b) => b.id === it.bin), `${q.key}: item bin exists`);
  } else if (q.type === 'order') {
    assert.ok(q.tiles.length >= 2, `${q.key}: tiles`);
    assert.deepEqual([...q.answer].sort(), q.tiles.map((t) => t.id).sort(), `${q.key}: answer uses all tiles`);
  } else if (q.type === 'trace') {
    assert.ok(q.glyph, `${q.key}: glyph`);
  } else {
    assert.fail(`${q.key}: unknown type ${q.type}`);
  }
  if (topic.subject === 'arabic') assert.ok(q.rtl || q.type === 'trace', `${q.key}: Arabic questions are right-to-left`);
}

for (const topic of TOPICS) {
  test(`${topic.id} (${topic.title})`, () => {
    const gen = gens[topic.subject][topic.id];
    assert.ok(gen, `generator exists for ${topic.id}`);
    const keys = new Set();
    for (const level of [1, 2, 3]) {
      const rng = makeRng(1234 + level);
      for (let i = 0; i < 400; i++) {
        const q = gen(rng, level);
        validate(q, topic);
        keys.add(q.key);
      }
    }
    assert.ok(keys.size >= 30, `${topic.id}: at least 30 different items (got ${keys.size})`);
  });
}

test('every subject has topics for every year group', () => {
  for (const y of YEARS) for (const s of SUBJECTS) assert.ok(topicsFor(s.id, y).length >= 3, `${s.id} ${y}`);
});
