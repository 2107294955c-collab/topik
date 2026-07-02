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
require('../assets/js/topik-reading-bank.js');
require('../assets/js/topik-listening-bank.js');
require('../assets/js/data.js');
require('../assets/js/storage.js');

const Store = window.TopikStorage;
const fresh = Store.fresh();

assert.equal(Store.VERSION, 8);
assert.equal(Store.CONTENT_VERSION, 7);
assert.deepEqual(fresh.studyProfile, {
  targetLevel: '6', examDate: '', dailyWordTarget: 10,
  dailyGrammarTarget: 2, dailyQuestionTarget: 10,
});
assert.equal(fresh.words.length, 4069);
assert.equal(window.TopikGrammar400.length, 400);
assert.equal(fresh.grammar.length, 415);
assert.equal(new Set(window.TopikGrammar400.map(point => point.pattern)).size, 400);
assert.ok(fresh.words.every(word => word.learningState && word.easeFactor >= 1.3));

assert.equal(window.TopikReadingBank.length, 600);
assert.equal(window.TopikListeningBank.length, 600);
assert.equal(fresh.questionBank.length, 1206);
assert.deepEqual(fresh.questionBookmarks, []);
assert.equal(window.TopikData.papers.length, 40);
assert.equal(new Set(window.TopikReadingBank.map(question => question.id)).size, 600);
assert.ok(window.TopikReadingBank.every(question =>
  question.section === 'reading' &&
  question.questionNumber >= 1 && question.questionNumber <= 50 &&
  question.options.length === 4 &&
  ['A', 'B', 'C', 'D'].includes(question.correctAnswer)
));
for (const exam of ['35', '36', '37', '41', '47', '52', '60', '64', '83', '91', '96', '102']) {
  assert.equal(window.TopikReadingBank.filter(question => question.examNumber === exam).length, 50);
  assert.equal(window.TopikListeningBank.filter(question => question.examNumber === exam).length, 50);
}
assert.equal(window.TopikReadingBank.filter(question => question.sourceStatus === 'official').length, 594);
assert.equal(window.TopikReadingBank.filter(question => question.sourceStatus === 'reconstructed').length, 6);
assert.equal(window.TopikReadingBank.filter(question => question.image).length, 72);
assert.equal(window.TopikReadingBank.find(question => question.id === 'topik_83_reading_30').correctAnswer, 'C');
assert.equal(window.TopikReadingBank.find(question => question.id === 'topik_47_reading_01').correctAnswer, 'C');
assert.equal(window.TopikReadingBank.find(question => question.id === 'topik_102_reading_50').correctAnswer, 'C');
assert.equal(window.TopikListeningBank.filter(question => question.transcript).length, 420);
assert.equal(window.TopikListeningBank.reduce((sum, question) => sum + question.optionImages.length, 0), 144);
assert.equal(window.TopikListeningBank.find(question => question.id === 'topik_47_listening_01').correctAnswer, 'B');

// Preserve learning progress and custom content while bundled content is upgraded.
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
fresh.grammar.push({...duplicatePattern, id: 'custom-grammar-same-pattern', category: 'custom', userEdited: true});
fresh.questionBank = fresh.questionBank.filter(question => !question.id.startsWith('topik_') || ['83', '91', '96'].includes(question.examNumber));
fresh.questionBookmarks = ['topik_83_reading_01'];
fresh.studyProfile = {targetLevel: '5', examDate: '2026-10-18', dailyWordTarget: 15, dailyGrammarTarget: 3, dailyQuestionTarget: 12};
fresh.contentVersion = 3;
values.set(Store.KEY, JSON.stringify(fresh));
values.set(Store.DRAFT_KEY, 'saved draft');

const migrated = Store.load().data;
assert.equal(migrated.words.length, 4069);
assert.equal(migrated.words[0].reviewCount, 12);
assert.equal(migrated.words[0].successStreak, 4);
assert.equal(migrated.writingDraft, 'saved draft');
assert.equal(migrated.grammar.length, 415);
assert.equal(migrated.grammar.find(point => point.id === 'topik_grammar_0001').reviewCount, 7);
assert.equal(migrated.grammar.filter(point => point.pattern === duplicatePattern.pattern).length, 1);
assert.equal(migrated.questionBank.length, 1206);
assert.deepEqual(migrated.questionBookmarks, ['topik_83_reading_01']);
assert.equal(migrated.contentVersion, 7);
assert.deepEqual(migrated.studyProfile, fresh.studyProfile);

const normalizedSession = Store.normalize({
  ...Store.fresh(),
  practiceRecords: [{
    id: 'record-1', examNumber: '96', section: 'reading', mode: 'exam', scope: 'category', category: '中心主旨',
    totalQuestions: 50, correctAnswers: 40, unanswered: 2, score: 80,
    durationSeconds: 3000, questionIds: ['q1', 'q2'],
    answers: [{questionId: 'q1', selected: 'B', correct: true}],
  }],
  activePractice: {
    id: 'active-1', examNumber: '96', section: 'reading', mode: 'exam', scope: 'wrong',
    questionIds: ['q1', 'q2'], index: 1, answers: [], flagged: ['q2'],
    remainingSeconds: 0, startedAt: '2026-07-01T00:00:00.000Z',
  },
});
assert.equal(normalizedSession.practiceRecords[0].wrongAnswers, 8);
assert.equal(normalizedSession.practiceRecords[0].unanswered, 2);
assert.equal(normalizedSession.practiceRecords[0].scope, 'category');
assert.equal(normalizedSession.practiceRecords[0].category, '中心主旨');
assert.equal(normalizedSession.activePractice.remainingSeconds, 0);
assert.equal(normalizedSession.activePractice.scope, 'wrong');
assert.deepEqual(normalizedSession.activePractice.flagged, ['q2']);
assert.deepEqual(Store.normalize({...Store.fresh(), questionBookmarks: ['q1', 'q1', '', 'q2']}).questionBookmarks, ['q1', 'q2']);

const mainBeforeDraft = values.get(Store.KEY);
assert.equal(Store.saveDraft('new draft'), true);
assert.equal(values.get(Store.KEY), mainBeforeDraft);
assert.equal(values.get(Store.DRAFT_KEY), 'new draft');

const oldBackup = Store.parseBackup({app: Store.APP, schemaVersion: 5, data: migrated});
assert.equal(oldBackup.words.length, 4069);
assert.equal(oldBackup.questionBank.length, 1206);
const oldDataWithoutProfile = {...migrated};
delete oldDataWithoutProfile.studyProfile;
assert.deepEqual(Store.merge(migrated, oldDataWithoutProfile).studyProfile, migrated.studyProfile);
assert.deepEqual(Store.merge({...migrated, questionBookmarks: ['q1']}, {...oldDataWithoutProfile, questionBookmarks: ['q2']}).questionBookmarks, ['q1', 'q2']);

console.log('TOPIK web data tests passed.');
