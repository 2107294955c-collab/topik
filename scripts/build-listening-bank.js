const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const exams = ['35', '36', '37', '41', '47', '52', '60', '64', '83', '91', '96', '102'];
const verifiedAnswerKeys = {
  '47': '21232314141223343421234342341343213134412114142232',
};

async function fetchContent(url, binary = false) {
  const response = await fetch(url, {headers: {'user-agent': 'TOPIK Study personal learning tool'}});
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return binary ? Buffer.from(await response.arrayBuffer()) : response.text();
}

function parsePage(html, exam) {
  const match = html.match(/questions:\s*(\[[\s\S]*?\])\s*,\s*answers:\s*({[\s\S]*?})\s*,\s*userAnswers/);
  if (!match) throw new Error(`Could not parse ${exam} listening mock page`);
  return {questions: vm.runInNewContext(`(${match[1]})`), answers: vm.runInNewContext(`(${match[2]})`)};
}

function plain(value) {
  return String(value || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function difficulty(number) {
  if (number <= 12) return 'easy';
  if (number <= 30) return 'medium';
  return 'hard';
}

function category(number) {
  if (number <= 3) return '图表判断';
  if (number <= 8) return '对话续接';
  if (number <= 12) return '对话情境';
  if (number <= 16) return '内容一致';
  if (number <= 20) return '中心思想';
  if (number <= 24) return '说话目的';
  if (number <= 28) return '人物态度';
  if (number <= 32) return '新闻与访谈';
  if (number <= 36) return '内容推断';
  if (number <= 40) return '讲座理解';
  if (number <= 44) return '观点理解';
  return '综合听力';
}

function explanation(number, answer, option, hasTranscript) {
  const hints = {
    '图表判断': '先抓人物、地点、动作或数字变化，再与四张图逐项核对。',
    '对话续接': '根据上一句的语气、时态和对话目的选择最自然的回应。',
    '对话情境': '重点判断人物关系、地点以及正在进行的行动。',
    '内容一致': '核对对象、时间、原因与结果，排除偷换信息的选项。',
    '中心思想': '抓住说话者反复强调的核心信息，而不是局部细节。',
    '说话目的': '判断说话者是在说明、请求、建议、介绍还是表达立场。',
    '人物态度': '结合语气、评价词和结论判断人物态度。',
    '新闻与访谈': '先记录主题、关键事实和采访对象的主要回答。',
    '内容推断': '答案需要由对话中的线索推出，不能只依赖单个词。',
    '讲座理解': '注意主题展开顺序、例子作用以及最后的总结。',
    '观点理解': '区分事实介绍与说话者自己的评价或主张。',
    '综合听力': '综合人物立场、结构、细节和说话目的判断。',
  };
  const transcriptNote = hasTranscript ? '交卷或逐题判分后可查看公开听力原文。' : '本题没有公开听力原文，请结合外部录音复盘。';
  return `${hints[category(number)]} 正确答案是 ${answer}「${option}」。${transcriptNote}`;
}

async function main() {
  const bank = [];
  for (const exam of exams) {
    const sourceUrl = `https://www.topikguide.com/mock-tests/${exam}-TOPIK-II-Listening-Mock-Test.html`;
    const {questions, answers} = parsePage(await fetchContent(sourceUrl), exam);
    if (questions.length !== 50 || Object.keys(answers).length !== 50) throw new Error(`${exam}: expected 50 questions and answers`);
    const sourceKey = questions.map(question => Number(answers[question.num])).join('');
    if (verifiedAnswerKeys[exam] && sourceKey !== verifiedAnswerKeys[exam]) throw new Error(`${exam}: source answers differ from the verified official PDF`);
    const imageDirectory = path.join(root, 'assets', 'questions-listening', exam);
    fs.mkdirSync(imageDirectory, {recursive: true});

    for (const question of questions) {
      const number = Number(question.num), answerNumber = Number(answers[number]), correctAnswer = 'ABCD'[answerNumber - 1];
      const rawOptions = question.options || [], imageChoice = rawOptions.every(option => /^https?:\/\//i.test(option));
      const options = imageChoice ? rawOptions.map((_, index) => `图片选项 ${'ABCD'[index]}`) : rawOptions.map(plain);
      const optionImages = [];
      if (imageChoice) {
        for (let index = 0; index < rawOptions.length; index++) {
          const extension = path.extname(new URL(rawOptions[index]).pathname) || '.png';
          const filename = `q${String(number).padStart(2, '0')}-${'abcd'[index]}${extension.toLowerCase()}`;
          fs.writeFileSync(path.join(imageDirectory, filename), await fetchContent(rawOptions[index], true));
          optionImages.push(`assets/questions-listening/${exam}/${filename}`);
        }
      }
      if (options.length !== 4 || !correctAnswer) throw new Error(`${exam}-${number}: invalid options or answer`);
      const transcript = plain(question.transcript);
      bank.push({
        id: `topik_${exam}_listening_${String(number).padStart(2, '0')}`,
        examNumber: exam,
        questionNumber: number,
        section: 'listening',
        text: plain(question.question),
        passage: '', insertSentence: '', image: '', optionImages,
        transcript,
        options, correctAnswer,
        explanationZh: explanation(number, correctAnswer, options[answerNumber - 1], Boolean(transcript)),
        explanationKo: `정답은 ${answerNumber}번입니다.`,
        difficulty: difficulty(number), related: category(number), points: Number(question.points) || 2,
        sourceUrl, sourceStatus: 'official', createdAt: '2026-07-01T00:00:00.000Z', userEdited: false,
      });
    }
  }
  const expected = exams.length * 50, ids = new Set(bank.map(question => question.id));
  if (bank.length !== expected || ids.size !== expected) throw new Error(`Expected ${expected} unique listening questions`);
  fs.writeFileSync(path.join(root, 'assets', 'js', 'topik-listening-bank.js'), `(function(){\n  window.TopikListeningBank=${JSON.stringify(bank, null, 2)};\n})();\n`, 'utf8');
  console.log(`Generated ${bank.length} listening questions, ${bank.filter(question => question.transcript).length} transcripts, and ${bank.reduce((sum, question) => sum + question.optionImages.length, 0)} option images.`);
}

main().catch(error => {console.error(error); process.exitCode = 1});
