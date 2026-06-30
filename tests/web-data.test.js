const assert = require('node:assert/strict');

global.window = {};
const values = new Map();
global.localStorage = {
  getItem: key => values.has(key) ? values.get(key) : null,
  setItem: (key, value) => values.set(key, value),
};

require('../assets/js/vocab-batch1.js');
require('../assets/js/vocab-4000.js');
require('../assets/js/data.js');
require('../assets/js/storage.js');

const Store = window.TopikStorage;
const fresh = Store.fresh();

assert.equal(Store.VERSION, 6);
assert.equal(fresh.words.length, 4069);
assert.equal(fresh.words.filter(word => word.chinese === '释义待补充').length, 205);
assert.ok(fresh.words.every(word => word.learningState && word.easeFactor >= 1.3));

const learned = fresh.words[0];
learned.mastered = true;
learned.successStreak = 4;
learned.reviewCount = 12;
fresh.contentVersion = 2;
values.set(Store.KEY, JSON.stringify(fresh));
values.set(Store.DRAFT_KEY, '独立草稿');

const migrated = Store.load().data;
assert.equal(migrated.words.length, 4069);
assert.equal(migrated.words[0].reviewCount, 12);
assert.equal(migrated.words[0].successStreak, 4);
assert.equal(migrated.writingDraft, '独立草稿');

const mainBeforeDraft = values.get(Store.KEY);
assert.equal(Store.saveDraft('新的草稿'), true);
assert.equal(values.get(Store.KEY), mainBeforeDraft);
assert.equal(values.get(Store.DRAFT_KEY), '新的草稿');

const oldBackup = Store.parseBackup({app: Store.APP, schemaVersion: 5, data: migrated});
assert.equal(oldBackup.words.length, 4069);

const questionImport = Store.normalize({...Store.fresh(), questionBank: [{
  id: 'import-test-1',
  examNumber: '模拟 9',
  section: 'reading',
  text: '다음 중 맞는 것을 고르십시오.',
  options: ['A', 'B', 'C', 'D'],
  correctAnswer: 'A',
  explanationZh: '测试解析',
  difficulty: 'medium',
}]}).questionBank;
assert.equal(questionImport.length, 1);
assert.equal(questionImport[0].id, 'import-test-1');

console.log('TOPIK web data tests passed.');
