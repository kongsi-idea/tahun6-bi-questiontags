# 侦探语法局 Case Files: Question Tags（tahun6-bi-questiontags）

Year 6 英文 Unit 10 Lesson 3 Grammar（PB p.125、WB p.104）的 question tags 练习，Teacher Irene Wong 的点子（原稿是 40 题选择题 HTML）。线上 https://tahun6-bi-questiontags.vercel.app ，push main 即自动部署。现况见 `handoff.md`，共用规则见 `../agents.md`。

## 关键决定（代码看不出来的）
- **题库唯一来源 `build-content.py`**：改完跑它（生成 `js/bank.js`、`content/bank.json`、`content/sentences.md`），再跑 `gen-voice.py`。录音档名是题目 id，**改了句子必须删掉对应 `audio/<id>.mp3` 再重录**，否则声音还是旧句子（10-11 改人名时踩过）。
- **范围只限课本三类：be、can、present simple（do/does）**。Let's→shall we、命令句→will you、never/nobody 老师明说不在纲要，**刻意不做**；原稿 `He never says…` 已移除。唯一例外是「拓展档案」`I am…aren't I`（老师认为英语语法书可教），标明课本外、不计分、三案都完成后解锁。
- **从选择题改成三步拼装**（正负 → 助动词 → 代词）：原稿 4 选项里 2 个是错助动词，实际是二选一，答案又集中在 B（25/40）。线索用课本原话（be→be、can→can、其他→do/does）。
- **「零失误」＝没选错且没点线索**，只有它计入分数；错了仍可重选直到答对，不会卡死。
- **人名用性别一目了然的常见名**（Tom/Lucy/Ali/Mary/Peter/Mei Ling，The policeman）。原稿 Pat Plump、Sue Snaps、Dr Green、Tim Tall 学生看不出男女。老师 10-11 点名。
- **选项区居中；代词固定 4+4 两排**（老师 10-11 定）。
- **署名**：Hub `creator: Teacher Irene Wong`，initial `W`；页脚同名。
- **视觉方向 A「案卷纸质」**（老师选）；字体 Special Elite（标题）＋Andika（正文），均嵌入。
- 朗读：edge-tts `en-GB-SoniaNeural`，**学生自己点 Listen**，不自动播。
- 不做：DSKP 对照（未核官方 PDF）、班级名单、跨设备进度；localStorage 只存各案最佳分（用来解锁拓展）。
