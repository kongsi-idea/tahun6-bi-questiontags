# 侦探语法局 Question Tags · 交接

## ⏯️ 目前做到哪
2026-10-10 已上线 v1.0：https://tahun6-bi-questiontags.vercel.app ，Hub 已上架，`npm run check` 全过，push main 自动部署。10-11 按老师反馈改：选项区居中、代词 4+4 两排、人名换成性别明确的常见名（7 题音档已重录）。决定与踩坑见 `agents.md`。

## 🚦 目前状态
- 课本出处：Year 6 英文 Unit 10 Lesson 3 Grammar（Pupil's Book p.125、Workbook p.104）
- DSKP 对照：未核对（不写进 Hub 的 DSKP 索引）
- 玩法：3 案（Be 14／Can 13／Do 14）＋拓展档案 `I am…aren't I`（5 题，课本外、不计分、三案后解锁）。每题三步：判断正负 → 选助动词 → 选代词；线索两级。
- 署名：Hub `creator: { name: "Teacher Irene Wong", initial: "W" }`（与 tahun2-bi-punctuation 一致），工具页脚同名。

## ➡️ 下一步
1. Irene 老师与学生试用后收集反馈（题量、线索、拓展档案）。
2. 待办：iPhone／Safari 真机实测；DSKP 代码核对官方 PDF 后再收进 dskp-index。

## ⚠️ 注意事项
- 题库唯一来源 `build-content.py`（生成 js/bank.js、content/sentences.md、content/bank.json），改完再跑 `gen-voice.py` 补录音。
- 本机测试：`python3 -m http.server 8791 --bind 127.0.0.1`，`python3 test-e2e.py`。
- 原稿 `He never says what he is thinking, does he?` 超纲，已移除；Let's／命令句等也未收。
- 拓展档案本机测试可加 `?unlock=1`。

## 🕐 最后更新
2026-10-11（Claude Sonnet 5.5）· git push：待推→见下