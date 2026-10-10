"""预录朗读：从 content/bank.json 取每题完整句（含尾巴）→ edge-tts → audio/<id>.mp3，并写 audio/manifest.js。
改了题库先跑 build-content.py；已存在的档不重录。用法：python3 gen-voice.py"""
import asyncio, json, os
import edge_tts

HERE = os.path.dirname(os.path.abspath(__file__))
AUDIO = os.path.join(HERE, 'audio'); os.makedirs(AUDIO, exist_ok=True)
VOICE, RATE = 'en-GB-SoniaNeural', '-10%'
bank = json.load(open(os.path.join(HERE, 'content', 'bank.json'), encoding='utf-8'))
lines = [(q['id'], q['say']) for c in bank for q in c['qs']]

async def one(sem, qid, text):
    out = os.path.join(AUDIO, qid + '.mp3')
    if os.path.exists(out) and os.path.getsize(out) > 1000: return 'skip'
    async with sem:
        for _ in range(3):
            try:
                await edge_tts.Communicate(text + '?', VOICE, rate=RATE).save(out); return 'new'
            except Exception as e:
                err = e; await asyncio.sleep(1.5)
        raise err

async def main():
    sem = asyncio.Semaphore(6)
    res = await asyncio.gather(*(one(sem, i, t) for i, t in lines))
    print(f'{len(lines)} 句：新录 {res.count("new")}，已存在 {res.count("skip")}')
asyncio.run(main())
with open(os.path.join(AUDIO, 'manifest.js'), 'w', encoding='utf-8') as f:
    f.write('// 由 gen-voice.py 生成，不要手改\nwindow.VOICE_CLIPS = ' + json.dumps({i: 1 for i, _ in lines}, separators=(',', ':')) + ';\n')
