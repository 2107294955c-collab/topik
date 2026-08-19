const assert = require('node:assert/strict');
const fs = require('node:fs');

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
const indexHtml = fs.readFileSync('index.html', 'utf8');
const manifest = JSON.parse(fs.readFileSync('manifest.webmanifest', 'utf8'));
const version = JSON.parse(fs.readFileSync('version.json', 'utf8'));

assert.equal(Store.VERSION, 12);
assert.equal(Store.CONTENT_VERSION, 7);
assert.deepEqual(fresh.studyProfile, {
  targetLevel: '6', examDate: '', dailyWordTarget: 10,
  dailyGrammarTarget: 2, dailyQuestionTarget: 10,
});
assert.equal(fresh.words.length, 4069);
assert.equal(window.TopikGrammar400.length, 400);
assert.equal(fresh.grammar.length, 415);
assert.deepEqual(fresh.grammarAttempts, []);
assert.deepEqual(fresh.fullMockHistory, []);
assert.deepEqual(fresh.writingDrafts, {});
assert.equal(fresh.lastBackupAt, null);
assert.equal(new Set(window.TopikGrammar400.map(point => point.pattern)).size, 400);
assert.ok(fresh.words.every(word => word.learningState && word.easeFactor >= 1.3));

assert.equal(window.TopikReadingBank.length, 600);
assert.equal(window.TopikListeningBank.length, 600);
assert.equal(window.TopikData.writingPrompts.length, 21);
assert.deepEqual([...new Set(window.TopikData.writingPrompts.map(prompt => prompt.type))], ['51', '52', '53', '54']);
assert.equal(window.TopikData.writingPrompts.filter(prompt => prompt.type === '54').length, 12);
assert.ok(window.TopikData.writingPrompts.filter(prompt => prompt.type === '54').every(prompt => /[가-힣]/.test(prompt.title) && /[가-힣]/.test(prompt.prompt) && (prompt.prompt.match(/[①②③]/g)||[]).length === 3));
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
assert.ok(indexHtml.includes('id="dailySprint"'));
assert.ok(indexHtml.includes('id="readinessPanel"'));
assert.ok(indexHtml.includes('id="learningCoach"'));
assert.ok(indexHtml.includes('id="practiceCoverageGrid"'));
assert.ok(indexHtml.includes('id="essayGuidePanel"'));
assert.ok(indexHtml.includes('20260819-5'));
assert.ok(indexHtml.includes('topik-version'));
assert.ok(indexHtml.includes('updateBanner'));
assert.ok(indexHtml.includes('checkUpdateButton'));
assert.ok(indexHtml.includes('appVersionMeta'));
assert.ok(indexHtml.includes('storageEstimateMeta'));
assert.ok(indexHtml.includes('preserveStorageButton'));
assert.equal(version.version, '20260819-5');
assert.equal(manifest.description, '本地优先的个人 TOPIK 5–6 级学习工具');
assert.equal(manifest.shortcuts[0].name, '今日学习');
assert.ok(indexHtml.includes('practiceInlineWrongMeta'));
assert.ok(indexHtml.includes('wrongReasonFilter'));
assert.ok(indexHtml.includes('activityHeatmap'));
assert.ok(indexHtml.includes('wordCategoryFilter'));
assert.ok(indexHtml.includes('wordLevelFilter'));
assert.ok(indexHtml.includes('resetWordFilters'));
assert.ok(indexHtml.includes('resetGrammarFilters'));
assert.ok(indexHtml.includes('practiceResultInsight'));
assert.ok(indexHtml.includes('retryWrongFromResult'));

// Persist only mutable progress while bundled content is reconstructed on load.
assert.equal(Store.save(fresh).ok, true);
const compactFresh = JSON.parse(values.get(Store.KEY));
assert.equal(compactFresh.storageFormat, 2);
assert.equal(compactFresh.words.length, 0);
assert.equal(compactFresh.grammar.length, 0);
assert.equal(compactFresh.questionBank.length, 0);
assert.ok(values.get(Store.KEY).length < 10000);
assert.equal(Store.load().data.words.length, 4069);
assert.equal(Store.load().data.questionBank.length, 1206);

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
assert.equal(JSON.parse(values.get(Store.KEY)).storageFormat, 2);
assert.ok(values.get(Store.KEY).length < 20000);

const normalizedSession = Store.normalize({
  ...Store.fresh(),
  practiceRecords: [{
    id: 'record-1', examNumber: '96', section: 'reading', mode: 'exam', scope: 'category', category: '中心主旨',
    totalQuestions: 50, correctAnswers: 40, unanswered: 2, score: 80,
    durationSeconds: 3000, questionIds: ['q1', 'q2'],
    answers: [{questionId: 'q1', selected: 'B', correct: true, timeSeconds: 47}], questionTimes: {q1: 47},
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
assert.equal(normalizedSession.practiceRecords[0].answers[0].timeSeconds, 47);
assert.equal(normalizedSession.practiceRecords[0].questionTimes.q1, 47);
assert.deepEqual(Store.normalize({...Store.fresh(), questionBookmarks: ['q1', 'q1', '', 'q2']}).questionBookmarks, ['q1', 'q2']);
const normalizedWrong = Store.normalize({...Store.fresh(), wrongAnswers: [{questionId: 'q1', wrongCount: 3, correctStreak: 1, reason: 'grammar', note: '连接关系判断错误', nextReviewAt: '2026-07-04T00:00:00.000Z', lastReviewedAt: '2026-07-03T00:00:00.000Z'}]}).wrongAnswers[0];
assert.equal(normalizedWrong.correctStreak, 1);
assert.equal(normalizedWrong.reason, 'grammar');
assert.equal(normalizedWrong.note, '连接关系判断错误');
assert.equal(normalizedWrong.nextReviewAt, '2026-07-04T00:00:00.000Z');
assert.equal(Store.normalize({...Store.fresh(), lastBackupAt: '2026-07-03T01:02:03.000Z'}).lastBackupAt, '2026-07-03T01:02:03.000Z');
const normalizedWriting = Store.normalize({...Store.fresh(), writings: [{
  id: 'writing-scored', taskType: '54', promptId: 'q54-ai', promptTitle: 'AI', prompt: 'prompt', text: '한국어 글',
  score: 81, maxScore: 50, rubric: {content: 20, structure: 19, language: 21, style: 21},
  revisedText: '수정한 글', summary: '좋습니다.', nextFocus: '문체',
  errors: [{category: '文体', original: '해요', correction: '합니다', explanation: '正式文体'}],
  fullMockId: 'mock-1',
  date: '2026-07-03T00:00:00.000Z',
}], writingDrafts: {'q54-ai': '별도 초안'}});
const normalizedWritingRecord = normalizedWriting.writings[0];
assert.equal(normalizedWritingRecord.taskType, '54');
assert.equal(normalizedWritingRecord.score, 81);
assert.equal(normalizedWritingRecord.rubric.style, 21);
assert.equal(normalizedWritingRecord.errors[0].category, '文体');
assert.equal(normalizedWritingRecord.fullMockId, 'mock-1');
assert.equal(normalizedWriting.writingDrafts['q54-ai'], '별도 초안');
const normalizedMock = Store.normalize({...Store.fresh(), fullMockHistory: [{
  id: 'mock-1', examNumber: '102', listeningScore: 78, writingScore: 65, readingScore: 82,
  startedAt: '2026-07-03T00:00:00.000Z', completedAt: '2026-07-03T03:00:00.000Z',
}]}).fullMockHistory[0];
assert.equal(normalizedMock.totalScore, 225);
assert.equal(normalizedMock.phase, 'completed');
assert.equal(normalizedMock.writingRemainingSeconds, 3000);
assert.equal(Store.counts({...Store.fresh(), fullMockHistory: [normalizedMock]}).fullMocks, 1);

const mainBeforeDraft = values.get(Store.KEY);
assert.equal(Store.saveDraft('new draft'), true);
assert.equal(values.get(Store.KEY), mainBeforeDraft);
assert.equal(values.get(Store.DRAFT_KEY), 'new draft');

// If the browser rejects the first write, storage retries with slimmed history.
const originalSetItem = global.localStorage.setItem;
let failNextMainWrite = true;
global.localStorage.setItem = (key, value) => {
  if (key === Store.KEY && failNextMainWrite) {
    failNextMainWrite = false;
    throw new Error('quota');
  }
  return originalSetItem(key, value);
};
const pressureData = Store.fresh();
pressureData.quizHistory = Array.from({length: 800}, (_, index) => ({
  id: `quiz-pressure-${index}`, direction: 'ko-zh', correct: index % 10, total: 10, date: new Date(2026, 0, 1, 0, index).toISOString(),
}));
pressureData.practiceRecords = Array.from({length: 600}, (_, index) => ({
  id: `practice-pressure-${index}`, examNumber: '96', section: 'reading', mode: 'instant', scope: 'mini',
  totalQuestions: 150, correctAnswers: 80, unanswered: 0, date: new Date(2026, 0, 1, 0, index).toISOString(),
  questionIds: Array.from({length: 150}, (__, questionIndex) => `q-${index}-${questionIndex}`),
  answers: Array.from({length: 150}, (__, questionIndex) => ({questionId: `q-${index}-${questionIndex}`, selected: 'A', correct: questionIndex % 2 === 0, timeSeconds: questionIndex})),
  questionTimes: Object.fromEntries(Array.from({length: 150}, (__, questionIndex) => [`q-${index}-${questionIndex}`, questionIndex])),
}));
const pressureSave = Store.save(pressureData);
global.localStorage.setItem = originalSetItem;
assert.equal(pressureSave.ok, true);
assert.equal(pressureSave.compacted, true);
assert.equal(pressureSave.data.quizHistory.length, 500);
assert.equal(pressureSave.data.practiceRecords.length, 500);
assert.ok(pressureSave.data.practiceRecords.every(record => record.answers.length <= 120));

const oldBackup = Store.parseBackup({app: Store.APP, schemaVersion: 5, data: migrated});
assert.equal(oldBackup.words.length, 4069);
assert.equal(oldBackup.questionBank.length, 1206);
const oldDataWithoutProfile = {...migrated};
delete oldDataWithoutProfile.studyProfile;
assert.deepEqual(Store.merge(migrated, oldDataWithoutProfile).studyProfile, migrated.studyProfile);
assert.deepEqual(Store.merge({...migrated, questionBookmarks: ['q1']}, {...oldDataWithoutProfile, questionBookmarks: ['q2']}).questionBookmarks, ['q1', 'q2']);

// Deletions, edited bundled content and learning progress survive compact reloads.
const compactRoundTrip = Store.fresh();
const deletedWordId = compactRoundTrip.words[0].id;
compactRoundTrip.words.shift();
compactRoundTrip.words[0].reviewCount = 9;
compactRoundTrip.words[0].lastResult = 'good';
compactRoundTrip.words[1].chinese = '自定义释义';
compactRoundTrip.words[1].userEdited = true;
assert.equal(Store.save(compactRoundTrip).ok, true);
const restoredCompact = Store.load().data;
assert.equal(restoredCompact.words.some(word => word.id === deletedWordId), false);
assert.equal(restoredCompact.words[0].reviewCount, 9);
assert.equal(restoredCompact.words.find(word => word.id === compactRoundTrip.words[1].id).chinese, '自定义释义');

console.log('TOPIK web data tests passed.');
