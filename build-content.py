"""题库唯一来源。改这里 → 跑 `python3 build-content.py` → 生成 js/bank.js、content/sentences.md（给 Irene 老师过目）。
再跑 gen-voice.py 补录音。不要手改 bank.js。

语句标记：[主语]  {动词}  {动词|n}（动词本身含否定，如 aren't）  <否定词>（如 not）。
每行：(id, 带标记的句子, 答案尾巴, 来源)
尾巴 = 助动词(+否定) + 代词，例如 "isn't she"。"""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))

# 来源：O=原稿(Irene 老师)  PB=Pupil's Book p.125  WB=Workbook p.104
CASES = [
 ('be', 'Case 1 · Be Inspector', 'is / are', [
  ('b01', '[She] {is} a suspect', "isn't she", 'O'),
  ('b02', '[They] {are} <not> thieves', 'are they', 'O'),
  ('b03', '[The dinosaur egg] {is} valuable', "isn't it", 'O'),
  ('b04', "[We] {aren't|n} suspects", 'are we', 'O'),
  ('b05', '[Pat Plump] {is} drawing hieroglyphics', "isn't he", 'O'),
  ('b06', '[Lucy Specks] {is} a university student', "isn't she", 'O'),
  ('b07', '[The museum windows] {are} closed', "aren't they", 'O'),
  ('b08', "[You] {aren't|n} angry with the police", 'are you', 'O'),
  ('b09', '[The old museum] {is} very beautiful', "isn't it", 'O'),
  ('b10', '[The police officer] {is} here', "isn't he", 'O'),
  ('b11', "[He] {isn't|n} good at football", 'is he', 'O'),
  ('b12', "[We]{'re} rich", "aren't we", 'WB'),
  ('b13', '[The treasure] {is} under this tree', "isn't it", 'WB'),
  ('b14', "[There]{'s} a photo of it in the guide book", "isn't there", 'WB'),
 ]),
 ('can', 'Case 2 · Can Detective', 'can / can’t', [
  ('c01', '[He] {can} solve the crime', "can't he", 'O'),
  ('c02', "[She] {can't|n} draw a map", 'can she', 'O'),
  ('c03', '[You] {can} run very fast', "can't you", 'O'),
  ('c04', "[They] {can't|n} find the missing egg", 'can they', 'O'),
  ('c05', '[We] {can} leave the room now', "can't we", 'O'),
  ('c06', "[Tim Tall] {can't|n} see the thief", 'can he', 'O'),
  ('c07', '[The police] {can} help us', "can't they", 'O'),
  ('c08', '[You] {can} speak English', "can't you", 'O'),
  ('c09', "[Miss Pepper] {can't|n} drive a big car", 'can she', 'O'),
  ('c10', '[Birds] {can} fly high', "can't they", 'O'),
  ('c11', '[We] {can} buy a new boat', "can't we", 'PB'),
  ('c12', "[You] {can't|n} row very fast", 'can you', 'WB'),
  ('c13', '[You] {can} read a map', "can't you", 'WB'),
 ]),
 ('do', 'Case 3 · Do Files', 'do / does', [
  ('d01', '[You] {live} near the museum', "don't you", 'O'),
  ('d02', '[He] {likes} pizza', "doesn't he", 'O'),
  ('d03', "[They] {don't|n} know where the secret is", 'do they', 'O'),
  ('d04', '[We] {want} to find the clues', "don't we", 'O'),
  ('d05', '[Dr Green] {works} in the laboratory', "doesn't he", 'O'),
  ('d06', "[You] {don't|n} have a map and a shovel", 'do you', 'O'),
  ('d07', '[The thieves] {run} away very fast', "don't they", 'O'),
  ('d08', '[She] {plays} basketball every evening', "doesn't she", 'O'),
  ('d09', "[You] {don't|n} like scary stories", 'do you', 'O'),
  ('d10', '[The children] {look} for clues', "don't they", 'O'),
  ('d11', '[Sue Snaps] {borrows} the camera', "doesn't she", 'O'),
  ('d12', "[You] {don't|n} feel well today", 'do you', 'O'),
  ('d13', '[You] {play} tennis on Sundays', "don't you", 'O'),
  ('d14', '[The map] {shows} where the treasure is', "doesn't it", 'WB'),
 ]),
 ('ext', 'Extra File · I am…', 'am I?', [
  ('x01', '[I] {am} your English teacher', "aren't I", 'O'),
  ('x02', '[I] {am} <not> a suspect', 'am I', 'O'),
  ('x03', '[I] {am} very late for the bus', "aren't I", 'O'),
  ('x04', '[I] {am} a good detective', "aren't I", 'Ext'),
  ('x05', '[I] {am} <not> late today', 'am I', 'Ext'),
 ]),
]

NEG = re.compile(r"n't$")

def build():
    out, md = [], ['# 侦探语法局 Question Tags · 题库（供 Irene 老师过目）\n',
                   '来源：O = Irene 老师原稿 · PB = Pupil\'s Book p.125 · WB = Workbook p.104 · Ext = 课本外拓展（计分之外）\n']
    for key, title, rule, items in CASES:
        md.append(f'\n## {title}（{len(items)} 题）\n')
        qs = []
        for qid, raw, tail, src in items:
            aux, pro = tail.split(' ', 1)
            tail_neg = bool(NEG.search(aux))
            stmt_neg = not tail_neg          # 尾巴否定 ⇔ 句子肯定
            assert (('|n' in raw) or ('<' in raw)) == stmt_neg, ('极性对不上', qid, raw, tail)
            plain = re.sub(r'\|n', '', raw)
            plain = re.sub(r'[\[\]{}<>]', '', plain)
            base = {"isn't": 'is', "aren't": 'are', "can't": 'can', "don't": 'do', "doesn't": 'does'}.get(aux, aux)
            if pro == 'I' and aux in ("aren't", 'am'):
                base = 'am'
            subj = re.search(r'\[([^\]]+)\]', raw).group(1)
            verb = re.search(r'\{([^}|]+)', raw).group(1)
            qs.append({'id': qid, 'raw': raw, 'plain': plain, 'tail': tail, 'aux': aux, 'pro': pro,
                       'stmtNeg': stmt_neg, 'base': base, 'subj': subj, 'verb': verb, 'src': src,
                       'say': f'{plain}, {tail}?'.replace('  ', ' ')})
            md.append(f'- `{qid}` [{src}] {plain}, **{tail}**?')
        out.append({'key': key, 'title': title, 'rule': rule, 'qs': qs})
    with open(os.path.join(HERE, 'js', 'bank.js'), 'w', encoding='utf-8') as f:
        f.write('// 由 build-content.py 生成，不要手改\nwindow.BANK = ' + json.dumps(out, ensure_ascii=False, indent=1) + ';\n')
    with open(os.path.join(HERE, 'content', 'sentences.md'), 'w', encoding='utf-8') as f:
        f.write('\n'.join(md) + '\n')
    with open(os.path.join(HERE, 'content', 'bank.json'), 'w', encoding='utf-8') as f:
        json.dump(out, f, ensure_ascii=False)
    print({c['key']: len(c['qs']) for c in out}, '共', sum(len(c['qs']) for c in out))

build()
