# 侦探语法局 Question Tags · 交接

## ⏯️ 目前做到哪
方案 2026-10-10 老师通过（Tahun 6，Irene 老师内容，视觉 A 案卷纸质，拓展档案后解锁，朗读学生自选）。已开发完，本机 e2e 全过，等 verify 子代理验收和老师本机实测。未部署、未上架。

## 🚦 目前状态
- 课本出处：Year 6 英文 Unit 10 Lesson 3 Grammar（Pupil's Book p.125、Workbook p.104）
- DSKP 对照：未核对（不写进 Hub 的 DSKP 索引）
- 玩法：3 案（Be 14／Can 13／Do 14）＋拓展档案 `I am…aren't I`（5 题，课本外、不计分、三案后解锁）。每题三步：判断正负 → 选助动词 → 选代词；线索两级。
- 署名：Hub `creator: { name: "Teacher Irene Wong", initial: "W" }`（与 tahun2-bi-punctuation 一致），工具页脚同名。

## ➡️ 下一步
1. 老师本机点过并说「可以发布」。
2. 部署（`--scope kongsi-idea`）→ set-vercel-secret／add-actions → Hub 登记（封面 cx-draw 生图＋横式截图）→ `npm run check -- tahun6-bi-questiontags`。

## ⚠️ 注意事项
- 题库唯一来源 `build-content.py`（生成 js/bank.js、content/sentences.md、content/bank.json），改完再跑 `gen-voice.py` 补录音。
- 本机测试：`python3 -m http.server 8791 --bind 127.0.0.1`，`python3 test-e2e.py`。
- 原稿 `He never says what he is thinking, does he?` 超纲，已移除；Let's／命令句等也未收。
- 拓展档案本机测试可加 `?unlock=1`。

## 🕐 最后更新
2026-10-10
