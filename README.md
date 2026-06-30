# TOPIK Study Companion

一个只使用 HTML、CSS、JavaScript 和 localStorage 的个人 TOPIK 学习网站。无需登录、后端、Firebase 或数据库。

## 功能

- 每日学习计划与连续学习天数
- 可扩展到约 5,000 条的本地词库，支持 JSON/CSV 导入和 100 条分页渲染
- 单词元数据：韩语、中文、词性、双语例句、TOPIK 等级、分类和复习状态
- 闪卡前后切换、按钮/滑动导航、复习范围筛选和复习计划
- 韩语拼写练习、字符错误提示、无限重试、双向选择题和错词本
- 语法笔记、搜索和复习记录
- OpenAI 韩语写作批改与中文解释
- 34 份历届 TOPIK PDF，PDF 模式继续保留
- 可手动维护的阅读、听力、写作题库（当前练习引擎先开放阅读四选一）
- 在线阅读练习、即时判题、中文/韩语解析和自动成绩记录
- 自动错题本、错误次数、重新练习和已掌握状态
- 真题完成状态、分数、正确率、错题笔记和复习日期
- 最近七天学习统计和真题成绩历史
- v5 JSON 数据备份、导入、合并及旧版 v2/v3/v4 数据迁移

## 导入大型词库

在“单词训练”页面点击“导入 JSON/CSV”。JSON 可以是数组，也可以使用 `words` 或 `vocabulary` 字段：

```json
[
  {
    "korean": "간과하다",
    "chinese": "忽视",
    "partOfSpeech": "动词",
    "example": "문제를 간과해서는 안 된다.",
    "exampleZh": "不能忽视问题。",
    "topikLevel": "5",
    "category": "社会"
  }
]
```

CSV 使用 UTF-8 编码和表头：

```csv
korean,chinese,partOfSpeech,example,exampleZh,topikLevel,category,mastered,reviewCount,lastReviewDate
간과하다,忽视,动词,문제를 간과해서는 안 된다.,不能忽视问题。,5,社会,false,0,
```

导入支持合并或替换。合并时，相同韩语和中文释义的词条会保留已有掌握状态、复习次数和错词记录。实际可保存容量取决于浏览器的 localStorage 配额。

## 本地打开

直接打开 `index.html` 即可。为了更接近部署环境，也可以运行本地静态服务器：

```powershell
python -m http.server 8080
```

然后访问 `http://localhost:8080`。

旧版数据保存在 `TOPIK学习.html` 对应的浏览器存储中。迁移时请先在旧版“进度”页导出 JSON，再在新版导入。

## GitHub Pages

1. 将整个目录提交并推送到 GitHub 仓库。
2. 打开仓库的 **Settings → Pages**。
3. 在 **Build and deployment** 中选择 **Deploy from a branch**。
4. 选择主分支和 `/ (root)`，然后保存。

入口文件已经是标准的 `index.html`。资源和 PDF 均使用相对路径，因此仓库部署在子路径下时仍可打开。

## Netlify

- 在 Netlify 中导入该 GitHub 仓库；或把整个项目文件夹拖入 Netlify Deploys。
- 发布目录使用项目根目录 `.`。
- `netlify.toml` 已包含静态资源和 PDF 缓存设置，不需要构建命令。

## 数据与安全

- 学习数据只保存在当前浏览器的 localStorage 中，不会跨设备自动同步。
- 在另一台设备打开网站后，使用“学习进度 → 数据与备份”导入 JSON。
- OpenAI API Key 只保留在当前页面内，不会写入 localStorage 或备份。
- 纯前端无法隐藏 API Key；请使用个人项目密钥并设置用量限制。
- 部署到公开地址前，请确认真题翻译解析文件允许公开传播。
- 当前在线练习仅实现阅读四选一；听力音频和写作自动评分留待后续版本。

## 项目结构

```text
index.html
assets/
  css/app.css
  js/data.js
  js/storage.js
  js/app.js
  icon.svg
resources/past-papers/
manifest.webmanifest
netlify.toml
```

当前部署产品是根目录中的静态网站；Flutter 试验源码不属于网页发布文件。
