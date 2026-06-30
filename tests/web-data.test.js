const assert = require('node:assert/strict');

global.window = {};
const values = new Map();
global.localStorage = {
  getItem: key => values.has(key) ? values.get(key) : null,
  setItem: (key, value) => values.set(key, value),
};

require('../assets/js/vocab-batch1.js');
require('../assets/js/vocab-4000.js');
require('../assets/js/grammar-400.js');
require('../assets/js/data.js');
require('../assets/js/storage.js');

const Store = window.TopikStorage;
const fresh = Store.fresh();

assert.equal(Store.VERSION, 6);
assert.equal(Store.CONTENT_VERSION, 4);
assert.equal(fresh.words.length, 4069);
assert.equal(window.TopikGrammar400.length, 400);
assert.equal(fresh.grammar.length, 415);
assert.equal(new Set(window.TopikGrammar400.map(point => point.pattern)).size, 400);
assert.equal(new Set(window.TopikGrammar400.map(point => point.pattern.normalize('NFKC').replace(/[\s()\/.,?\-]/g, '').replace(/으/g, ''))).size, 400);
assert.ok(window.TopikGrammar400.every(point => point.explanation && point.examples && ['中级', '高级'].includes(point.level) && point.category));
assert.equal(fresh.grammar.filter(point => point.level === '中级').length, 199);
assert.equal(fresh.grammar.filter(point => point.level === '高级').length, 201);
assert.equal(fresh.words.filter(word => word.chinese === '释义待补充').length, 205);
assert.ok(fresh.words.every(word => word.learningState && word.easeFactor >= 1.3));

const learned = fresh.words[0];
learned.mastered = true;
learned.successStreak = 4;
learned.reviewCount = 12;
const reviewedGrammar = fresh.grammar.find(point => point.id === 'topik_grammar_0001');
reviewedGrammar.reviewed = true;
reviewedGrammar.reviewCount = 7;
reviewedGrammar.lastReviewedAt = '2026-06-29T12:00:00.000Z';
const duplicatePattern = fresh.grammar.find(point => point.id === 'topik_grammar_0002');
fresh.grammar = fresh.grammar.filter(point => !point.id.startsWith('topik_grammar_') || point.id === reviewedGrammar.id);
fresh.grammar.push({...duplicatePattern, id: 'custom-grammar-same-pattern', category: '自定义', userEdited: true});
fresh.contentVersion = 3;
values.set(Store.KEY, JSON.stringify(fresh));
values.set(Store.DRAFT_KEY, '独立草稿');

const migrated = Store.load().data;
assert.equal(migrated.words.length, 4069);
assert.equal(migrated.words[0].reviewCount, 12);
assert.equal(migrated.words[0].successStreak, 4);
assert.equal(migrated.writingDraft, '独立草稿');
assert.equal(migrated.grammar.length, 415);
assert.equal(migrated.grammar.find(point => point.id === 'topik_grammar_0001').reviewCount, 7);
assert.equal(migrated.grammar.filter(point => point.pattern === duplicatePattern.pattern).length, 1);
assert.ok(migrated.grammar.every(point => Object.hasOwn(point, 'level') && Object.hasOwn(point, 'category')));

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
