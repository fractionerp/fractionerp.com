const {test} = require('node:test');
const assert = require('node:assert/strict');
const model = require('../assets/js/spreadsheet-assessment-model.js');
const data = require('../_data/spreadsheet_assessment.json');
const ids = Array.from({length: 12}, (_, i) => `q${i + 1}`);

test('all 4096 combinations have correct totals, bands and ties', () => {
  for (let mask = 0; mask < 4096; mask++) {
    const selected = ids.filter((_, i) => mask & (1 << i));
    const expected = [0, 0, 0, 0];
    for (let i = 0; i < 12; i++) if (mask & (1 << i)) expected[Math.floor(i / 3)]++;
    const result = model.assess(selected, data);
    assert.equal(result.totalScore, selected.length);
    assert.deepEqual(result.categoryScores.map(item => item.score), expected);
    assert.equal(result.band, selected.length <= 3 ? 'working' : selected.length <= 7 ? 'outgrowing' : 'friction');
    assert.deepEqual(result.highestCategories, ['quoting', 'production', 'inventory', 'information'].filter((_, i) => expected[i] > 0 && expected[i] === Math.max(...expected)));
  }
});
test('invalid and duplicate saved answers cannot add points', () => {
  assert.deepEqual(model.sanitise(['q2', 'q1', 'q2', 'q13', '<script>', 1, null], data), ['q1', 'q2']);
  for (const value of [null, undefined, {}, 'q1', 5]) assert.equal(model.assess(value, data).totalScore, 0);
});
test('removing an answer recalculates the band and highest areas', () => {
  const selected = ['q1', 'q2', 'q4', 'q5'];
  const original = [...selected];
  assert.deepEqual(model.assess(selected, data).highestCategories, ['quoting', 'production']);
  const revised = model.assess(selected.filter(id => id !== 'q5'), data);
  assert.equal(revised.band, 'working');
  assert.deepEqual(revised.highestCategories, ['quoting']);
  assert.deepEqual(selected, original);
});
test('future submission snapshot is versioned with bounded allowlisted attribution', () => {
  const snapshot = model.snapshot(['q7'], data, {utm_source: 'document', utm_campaign: 'a'.repeat(300), email: 'exclude@example.com', arbitrary: true});
  assert.equal(snapshot.version, data.version);
  assert.equal(snapshot.source, 'spreadsheet-assessment');
  assert(Number.isFinite(Date.parse(snapshot.completedAt)));
  assert.deepEqual(snapshot.utm, {utm_source: 'document', utm_campaign: 'a'.repeat(200)});
  assert(!JSON.stringify(snapshot).includes('exclude@example.com'));
});
