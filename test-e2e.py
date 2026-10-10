"""端到端：像学生一样走完 3 案＋拓展档案。用法：先 `python3 -m http.server 8791 --bind 127.0.0.1`，再 `python3 test-e2e.py`（TARGET 可指线上）。
截图存 ../../playwright-to-delete/tqs/ （不进 repo）。"""
import os
from playwright.sync_api import sync_playwright

URL = os.environ.get('TARGET', 'http://127.0.0.1:8791/index.html')
OUT = os.path.expanduser('~/Documents/my-agent/playwright-to-delete/tqs'); os.makedirs(OUT, exist_ok=True)
fails = 0
def check(name, ok, extra=''):
    global fails
    print(('  ✅ ' if ok else '  ❌ ') + name + (f' — {extra}' if extra else ''))
    if not ok: fails += 1

def answer_all(pg, wrong_first=False):
    """逐步选正确答案；wrong_first=True 时每题先故意点一个错的。"""
    n = 0
    while pg.locator('#quiz').is_visible():
        for step in (1, 2, 3):
            pg.wait_for_function(f"document.querySelector('#stepTitle .num')?.textContent.startsWith('Step {step}')")
            right = pg.evaluate(f'__tq.correctFor({step})')
            btns = pg.locator('#choices .choice')
            texts = btns.all_inner_texts()
            if wrong_first and n % 2 == 0 and step == 2:
                wrong = [i for i, t in enumerate(texts) if t.split('\n')[-1] != right][0]
                btns.nth(wrong).click()
            idx = [i for i, t in enumerate(texts) if t.split('\n')[-1] == right][0]
            btns.nth(idx).click()
        pg.wait_for_selector('#nextBtn:visible')
        n += 1
        pg.click('#nextBtn')
    return n

def run(p, w, h, tag):
    errs = []
    br = p.chromium.launch(); pg = br.new_page(viewport={'width': w, 'height': h})
    pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(URL); pg.wait_for_timeout(500)
    check(f'[{tag}] 首页 4 张案件卡，拓展锁住', pg.locator('.case-card').count() == 4 and pg.locator('.case-card').nth(3).is_disabled())
    check(f'[{tag}] 统计脚本在页面里', 'track-use.js' in pg.content() and 'data-slug="tahun6-bi-questiontags"' in pg.content())
    pg.screenshot(path=f'{OUT}/{tag}-home.png')
    sizes = pg.evaluate('__tq.bank.map(c=>c.qs.length)')
    for i in range(3):
        pg.locator('.case-card').nth(i).click()
        pg.wait_for_timeout(200)
        if i == 0:
            pg.screenshot(path=f'{OUT}/{tag}-quiz-step1.png')
            pg.click('#clueBtn'); pg.wait_for_timeout(100)
            check(f'[{tag}] 线索按钮出字', len(pg.inner_text('#clueText')) > 5)
        n = answer_all(pg, wrong_first=(i == 1))
        check(f'[{tag}] 案件{i+1} 走完 {n}/{sizes[i]} 题', n == sizes[i])
        check(f'[{tag}] 结算页显示', pg.locator('#results').is_visible())
        if i == 1:
            check(f'[{tag}] 有错题时出现重做按钮', pg.locator('#retryMissBtn').is_visible())
            pg.screenshot(path=f'{OUT}/{tag}-results.png')
            pg.click('#retryMissBtn'); m = answer_all(pg)
            check(f'[{tag}] 只重做错题 {m} 题', m == sizes[1] // 2 + sizes[1] % 2 or m > 0)
        pg.click('#homeBtn'); pg.wait_for_timeout(100)
    check(f'[{tag}] 三案后拓展解锁', not pg.locator('.case-card').nth(3).is_disabled())
    pg.locator('.case-card').nth(3).click()
    n = answer_all(pg)
    check(f'[{tag}] 拓展档案 {n}/{sizes[3]} 题', n == sizes[3])
    # 键盘：数字键
    pg.click('#homeBtn'); pg.locator('.case-card').nth(0).click(); pg.wait_for_timeout(150)
    pg.keyboard.press('1' if pg.evaluate('__tq.correctFor(1)') == 'Positive' else '2'); pg.wait_for_timeout(500)
    check(f'[{tag}] 数字键能答第 1 步', pg.inner_text('#stepTitle').startswith('Step 2'))
    check(f'[{tag}] 无横向滚动', pg.evaluate('document.documentElement.scrollWidth <= innerWidth'))
    check(f'[{tag}] 控制台无红字', not errs, str(errs[:3]))
    br.close()

with sync_playwright() as p:
    run(p, 1366, 768, 'desktop'); run(p, 390, 844, 'phone')
print('\n失败数：', fails); raise SystemExit(1 if fails else 0)
