const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const exams = ['83', '91', '96'];
// Verified against the official answer sheets stored in resources/past-papers.
// The third-party 83rd mock page currently marks Q30 as ②, while the official key is ③.
const officialAnswerOverrides = {'83': {30: 3}};

async function fetchContent(url, binary = false) {
  const response = await fetch(url, {headers: {'user-agent': 'TOPIK Study personal learning tool'}});
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return binary ? Buffer.from(await response.arrayBuffer()) : response.text();
}

function parsePage(html, exam) {
  const match = html.match(/questions:\s*(\[[\s\S]*?\])\s*,\s*answers:\s*({[\s\S]*?})\s*,\s*userAnswers/);
  if (!match) throw new Error(`Could not parse ${exam} reading mock page`);
  return {
    questions: vm.runInNewContext(`(${match[1]})`),
    answers: vm.runInNewContext(`(${match[2]})`),
  };
}

function plain(value) {
  return String(value || '')
    .replace(/^NOTICE:[\s\S]*?<br><br>/i, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function difficulty(number) {
  if (number <= 12) return 'easy';
  if (number <= 34) return 'medium';
  return 'hard';
}

function category(number) {
  if (number <= 4) return '语法词汇';
  if (number <= 12) return '信息理解';
  if (number <= 15) return '句子排序';
  if (number <= 18) return '上下文填空';
  if (number <= 24) return '短文理解';
  if (number <= 27) return '新闻标题';
  if (number <= 31) return '上下文填空';
  if (number <= 34) return '内容一致';
  if (number <= 38) return '中心主旨';
  if (number <= 41) return '句子插入';
  if (number <= 43) return '文学阅读';
  if (number <= 47) return '高级阅读';
  return '综合阅读';
}

function explanation(number, answer, option, reconstructed) {
  const prefix = reconstructed ? '本题原文未在公开卷中完整发布，当前题干为明确标注的模拟补全文。' : '';
  const labels = {
    '语法词汇': '把选项代入句子后，语法连接和句意最自然。',
    '信息理解': '应逐项对照图文中的时间、对象、数量和行动。',
    '句子排序': '先找主题句，再根据指代词、转折词和因果关系确定顺序。',
    '上下文填空': '结合空格前后的逻辑关系和搭配选择。',
    '短文理解': '答案可由文章中的明确事实或人物心理推出。',
    '新闻标题': '标题中的省略、比喻和情绪词需要还原成完整句意。',
    '内容一致': '正确项与原文事实一致，其余选项改动了对象、原因或结果。',
    '中心主旨': '正确项概括全文观点，而不是只重复局部细节。',
    '句子插入': '根据前后句的指代对象和逻辑衔接确定位置。',
    '文学阅读': '结合人物行动、心理描写和事件先后判断。',
    '高级阅读': '先确定作者态度，再排除与原文范围或立场不一致的选项。',
    '综合阅读': '结合文章目的、逻辑关系和全文信息综合判断。',
  };
  const type = category(number);
  return `${prefix}${labels[type]} 正确答案是 ${answer}「${option}」。`;
}

async function main() {
  const bank = [];
  for (const exam of exams) {
    const sourceUrl = `https://www.topikguide.com/mock-tests/${exam}-TOPIK-II-Reading-Mock-Test.html`;
    const {questions, answers} = parsePage(await fetchContent(sourceUrl), exam);
    if (questions.length !== 50 || Object.keys(answers).length !== 50) throw new Error(`${exam}: expected 50 questions and answers`);
    const imageDirectory = path.join(root, 'assets', 'questions', exam);
    fs.mkdirSync(imageDirectory, {recursive: true});
    let sharedPassage = '';
    let sharedReconstructed = false;

    for (const question of questions) {
      const number = Number(question.num);
      const originalContext = Array.isArray(question.context) ? question.context.join('\n') : String(question.context || '');
      const hasNotice = /NOTICE:/i.test(originalContext);
      let passage = plain(originalContext);
      if (passage) {
        sharedPassage = passage;
        sharedReconstructed = hasNotice;
      } else if (!question.image) {
        passage = sharedPassage;
      }
      const reconstructed = hasNotice || (!originalContext && !question.image && sharedReconstructed);
      const answerNumber = officialAnswerOverrides[exam]?.[number] || Number(answers[number]);
      const correctAnswer = 'ABCD'[answerNumber - 1];
      const options = (question.options || question.sequences || []).map(plain);
      if (options.length !== 4 || !correctAnswer) throw new Error(`${exam}-${number}: invalid options or answer`);

      let image = '';
      if (question.image) {
        const extension = path.extname(new URL(question.image).pathname) || '.png';
        const filename = `q${String(number).padStart(2, '0')}${extension.toLowerCase()}`;
        const output = path.join(imageDirectory, filename);
        fs.writeFileSync(output, await fetchContent(question.image, true));
        image = `assets/questions/${exam}/${filename}`;
      }

      bank.push({
        id: `topik_${exam}_reading_${String(number).padStart(2, '0')}`,
        examNumber: exam,
        questionNumber: number,
        section: 'reading',
        text: plain(question.question),
        passage,
        insertSentence: plain(question.insert_sentence),
        image,
        options,
        correctAnswer,
        explanationZh: explanation(number, correctAnswer, options[answerNumber - 1], reconstructed),
        explanationKo: `정답은 ${answerNumber}번입니다.`,
        difficulty: difficulty(number),
        related: category(number),
        points: Number(question.points) || 2,
        sourceUrl,
        sourceStatus: reconstructed ? 'reconstructed' : 'official',
        createdAt: '2026-07-01T00:00:00.000Z',
        userEdited: false,
      });
    }
  }

  const ids = new Set(bank.map(question => question.id));
  if (bank.length !== 150 || ids.size !== 150) throw new Error('Expected 150 unique reading questions');
  const output = `(function(){\n  window.TopikReadingBank=${JSON.stringify(bank, null, 2)};\n})();\n`;
  fs.writeFileSync(path.join(root, 'assets', 'js', 'topik-reading-bank.js'), output, 'utf8');
  console.log(`Generated ${bank.length} questions (${bank.filter(question => question.sourceStatus === 'reconstructed').length} reconstructed) and downloaded ${bank.filter(question => question.image).length} images.`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
