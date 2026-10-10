(function () {
  'use strict';
  const BANK = window.BANK;
  const $ = (id) => document.getElementById(id);
  const el = {
    home: $('home'), quiz: $('quiz'), results: $('results'), caseList: $('caseList'),
    fileTag: $('fileTag'), fill: $('progressFill'), caseNumber: $('caseNumber'), statement: $('statement'),
    stepTitle: $('stepTitle'), choices: $('choices'), clueBtn: $('clueBtn'), clueText: $('clueText'),
    feedback: $('feedback'), fbVerdict: $('fbVerdict'), fbText: $('fbText'), sayBtn: $('sayBtn'), nextBtn: $('nextBtn'),
    stamp: $('stamp'), scoreBig: $('scoreBig'), rankText: $('rankText'), summaryLine: $('summaryLine'),
    missList: $('missList'), retryMissBtn: $('retryMissBtn'), homeBtn: $('homeBtn'),
  };

  // ---------- 小工具 ----------
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const store = {
    get() { try { return JSON.parse(localStorage.getItem('tqs-best') || '{}'); } catch (e) { return {}; } },
    set(o) { try { localStorage.setItem('tqs-best', JSON.stringify(o)); } catch (e) { /* 无痕模式等：不影响使用 */ } },
  };
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  const mainCases = BANK.filter((c) => c.key !== 'ext');

  // 句子标记 → HTML：[主语] {动词} {动词|n} <否定词>
  function renderStatement(raw) {
    const re = /\[([^\]]+)\]|\{([^}|]+)(\|n)?\}|<([^>]+)>/g;
    let out = '', last = 0, m;
    while ((m = re.exec(raw))) {
      out += esc(raw.slice(last, m.index));
      if (m[1] !== undefined) out += '<span class="s">' + esc(m[1]) + '</span>';
      else if (m[2] !== undefined) out += '<span class="v' + (m[3] ? ' n' : '') + '">' + esc(m[2]) + '</span>';
      else out += '<span class="n">' + esc(m[4]) + '</span>';
      last = re.lastIndex;
    }
    return out + esc(raw.slice(last));
  }

  // ---------- 选项 ----------
  const PRONOUNS = ['I', 'you', 'he', 'she', 'it', 'we', 'they', 'there'];
  function helperChips(q, ext) {
    if (!q.stmtNeg) return ext ? ["isn't", "aren't", 'am not', "don't", "can't"] : ["isn't", "aren't", "can't", "don't", "doesn't"];
    return ext ? ['is', 'are', 'am', 'do', 'can'] : ['is', 'are', 'can', 'do', 'does'];
  }

  // ---------- 讲解 ----------
  function explain(q) {
    const parts = [q.stmtNeg
      ? 'The statement is negative, so the tag is positive.'
      : 'The statement is positive, so the tag is negative.'];
    if (q.pro === 'I') {
      parts.push(q.stmtNeg ? 'After “I am not…” we ask “am I?”.' : 'Special rule: after “I am…” we say “aren’t I?” (never “amn’t I”).');
    } else if (q.base === 'can') {
      parts.push('“can” comes back in the tag: ' + q.aux + '.');
    } else if (q.base === 'is' || q.base === 'are') {
      parts.push('“' + q.verb + '” is a form of be, so the tag repeats be: ' + q.aux + '.');
    } else if (/^do(es)?n't$/.test(q.verb)) {
      parts.push('“' + q.verb + '” is a do-verb, so the tag uses “' + q.aux + '”.');
    } else {
      parts.push('“' + q.verb + '” is an action verb (not be, not can), so the tag uses do/does: ' + q.aux + '.');
    }
    if (q.pro !== 'I') parts.push('The subject “' + q.subj + '” comes back as “' + q.pro + '”.');
    return parts.join(' ');
  }

  // ---------- 状态 ----------
  let S = null; // { caseObj, queue, idx, step, dirty, clue, cleanIds, missed[], picks }

  function show(which) {
    ['home', 'quiz', 'results'].forEach((k) => { el[k].hidden = k !== which; });
    window.scrollTo(0, 0);
  }

  function renderHome() {
    const best = store.get();
    const allDone = mainCases.every((c) => best[c.key] != null) || /[?&]unlock=1/.test(location.search);
    el.caseList.innerHTML = '';
    BANK.forEach((c) => {
      const locked = c.key === 'ext' && !allDone;
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'case-card' + (c.key === 'ext' ? ' ext' : '');
      b.disabled = locked;
      const bestTxt = best[c.key] != null ? '<span class="best">Best ' + best[c.key] + '/' + c.qs.length + '</span>'
        : '<span class="best none">' + (locked ? 'Locked' : 'New file') + '</span>';
      const sub = locked ? 'Solve Cases 1–3 to unlock · beyond the textbook'
        : c.key === 'ext' ? 'Beyond the textbook · not part of your score · ' + c.qs.length + ' statements'
        : c.rule + ' · ' + c.qs.length + ' statements';
      b.innerHTML = '<span><h2>' + esc(c.title) + '</h2><small>' + esc(sub) + '</small></span>' + bestTxt;
      b.addEventListener('click', () => startCase(c, c.qs));
      el.caseList.appendChild(b);
    });
    el.fileTag.textContent = 'OPEN FILES';
    el.fill.style.width = '0%';
    show('home');
  }

  function startCase(c, qs) {
    S = { caseObj: c, queue: shuffle(qs), idx: 0, step: 1, dirty: false, clue: 0, clean: 0, missed: [], total: qs.length, full: qs.length === c.qs.length };
    show('quiz');
    renderQuestion();
  }

  const cur = () => S.queue[S.idx];
  const isExt = () => S.caseObj.key === 'ext';

  function renderQuestion() {
    const q = cur();
    S.step = 1; S.dirty = false; S.clue = 0; S.picks = {};
    el.fileTag.textContent = 'FILE ' + pad(S.idx + 1) + '/' + pad(S.total);
    el.fill.style.width = (S.idx / S.total) * 100 + '%';
    el.caseNumber.textContent = S.caseObj.title.toUpperCase() + ' · STATEMENT ' + (S.idx + 1) + ' OF ' + S.total;
    el.feedback.hidden = true; el.nextBtn.hidden = true;
    el.clueBtn.parentElement.hidden = false; el.clueBtn.disabled = false; el.clueText.textContent = '';
    drawStatement();
    renderStep();
  }

  function drawStatement(done) {
    const q = cur();
    const tailHtml = done
      ? '<span class="slot">' + esc(q.tail) + '</span>'
      : '<span class="slot' + (S.picks.helper ? '' : ' empty') + '">' + esc(S.picks.helper || '·') + '</span>' +
        '<span class="slot' + (S.picks.pro ? '' : ' empty') + '">' + esc(S.picks.pro || '·') + '</span>';
    el.statement.innerHTML = renderStatement(q.raw) + ', ' + tailHtml + '?';
    el.statement.dataset.hl = '';
  }

  function renderStep() {
    const q = cur();
    el.statement.dataset.hl = '';
    el.clueText.textContent = ''; S.clue = 0; el.clueBtn.disabled = false;
    let title, chips;
    if (S.step === 1) {
      title = 'Is the statement positive or negative?';
      chips = ['Positive', 'Negative'];
    } else if (S.step === 2) {
      title = 'The tag must be ' + (q.stmtNeg ? 'POSITIVE' : 'NEGATIVE') + '. Which helper verb?';
      chips = helperChips(q, isExt());
    } else {
      title = 'Which pronoun finishes the tag?';
      chips = PRONOUNS;
    }
    el.stepTitle.innerHTML = '<span class="num">Step ' + S.step + '/3</span>' + esc(title);
    el.choices.innerHTML = '';
    chips.forEach((txt, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'choice' + (S.step === 1 ? ' wide' : '');
      b.innerHTML = '<span class="k">' + (i + 1) + '</span>' + esc(txt);
      b.addEventListener('click', () => pick(b, txt));
      el.choices.appendChild(b);
    });
  }

  function correctFor(step) {
    const q = cur();
    if (step === 1) return q.stmtNeg ? 'Negative' : 'Positive';
    if (step === 2) return q.aux === 'am' ? 'am' : q.aux;
    return q.pro;
  }

  function pick(btn, txt) {
    if (btn.disabled) return;
    if (txt === correctFor(S.step)) {
      btn.classList.add('right');
      [...el.choices.children].forEach((b) => { b.disabled = true; });
      if (S.step === 2) S.picks.helper = txt;
      if (S.step === 3) S.picks.pro = txt;
      drawStatement();
      if (S.step < 3) { S.step++; setTimeout(renderStep, 350); }
      else solved();
    } else {
      S.dirty = true;
      btn.classList.add('wrong'); btn.disabled = true;
      el.clueText.textContent = 'Not quite — try another one.';
    }
  }

  const CLUES = {
    1: [
      () => { el.statement.dataset.hl = 'neg'; return cur().stmtNeg ? 'Look at the red word: it makes the statement negative.' : 'Look for “not”, “n’t”, “never”… There is none here.'; },
      () => 'Positive statement → negative tag. Negative statement → positive tag.',
    ],
    2: [
      () => { el.statement.dataset.hl = 'verb'; return 'Find the verb in the statement (highlighted).'; },
      () => 'be → be · can → can · any other verb → do / does.',
    ],
    3: [
      () => { el.statement.dataset.hl = 'subj'; return 'The subject (highlighted) comes back in the tag as a pronoun.'; },
      () => '“' + cur().subj + '” → ' + cur().pro,
    ],
  };
  el.clueBtn.addEventListener('click', () => {
    const list = CLUES[S.step];
    S.dirty = true;
    el.clueText.textContent = list[S.clue]();
    S.clue++;
    if (S.clue >= list.length) el.clueBtn.disabled = true;
  });

  function solved() {
    const q = cur();
    drawStatement(true);
    el.stepTitle.innerHTML = ''; el.choices.innerHTML = '';
    el.clueBtn.parentElement.hidden = true; el.clueText.textContent = '';
    if (!S.dirty) S.clean++; else S.missed.push(q);
    el.fbVerdict.textContent = S.dirty ? 'Solved — with a little help.' : 'Solved! Clean work, detective.';
    el.fbText.textContent = explain(q);
    el.sayBtn.hidden = !(window.VOICE_CLIPS && window.VOICE_CLIPS[q.id]);
    el.feedback.hidden = false;
    el.nextBtn.hidden = false;
    el.nextBtn.textContent = S.idx === S.total - 1 ? 'See the case results →' : 'Next statement →';
    el.nextBtn.focus();
  }

  let audio = null;
  el.sayBtn.addEventListener('click', () => {
    const q = cur();
    if (audio) audio.pause();
    audio = new Audio('audio/' + q.id + '.mp3');
    audio.play().catch(() => {});
  });

  el.nextBtn.addEventListener('click', () => {
    if (audio) { audio.pause(); audio = null; }
    S.idx++;
    if (S.idx >= S.total) showResults(); else renderQuestion();
  });

  function rankFor(p) {
    if (p === 100) return 'Master Detective — case airtight.';
    if (p >= 90) return 'Senior Detective — sharp instincts.';
    if (p >= 75) return 'Field Detective — solid work.';
    if (p >= 50) return 'Rookie Detective — keep training.';
    return 'Trainee — read the case notes, then try again.';
  }

  function showResults() {
    el.fill.style.width = '100%';
    el.fileTag.textContent = 'FILE ' + pad(S.total) + '/' + pad(S.total);
    const pct = Math.round((S.clean / S.total) * 100);
    el.stamp.textContent = 'Case Closed';
    el.scoreBig.textContent = S.clean + '/' + S.total;
    el.rankText.textContent = rankFor(pct);
    el.summaryLine.textContent = S.clean + ' statements solved with no mistakes and no clues.' +
      (isExt() ? ' (Extra file — not part of the main score.)' : '');
    el.missList.innerHTML = '';
    if (S.missed.length) {
      el.missList.innerHTML = '<h3>CASE NOTES · statements to study</h3>' + S.missed.map((q) =>
        '<div class="miss-item">' + esc(q.plain) + ', <b>' + esc(q.tail) + '</b>?</div>').join('');
    }
    el.retryMissBtn.hidden = S.missed.length === 0;
    if (S.full) {
      const best = store.get();
      if (best[S.caseObj.key] == null || S.clean > best[S.caseObj.key]) { best[S.caseObj.key] = S.clean; store.set(best); }
    }
    show('results');
    (S.missed.length ? el.retryMissBtn : el.homeBtn).focus();
  }

  el.retryMissBtn.addEventListener('click', () => startCase(S.caseObj, S.missed.slice()));
  el.homeBtn.addEventListener('click', renderHome);

  // 键盘：数字键选第 N 个选项
  document.addEventListener('keydown', (e) => {
    if (el.quiz.hidden || e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^[1-9]$/.test(e.key)) {
      const b = el.choices.children[Number(e.key) - 1];
      if (b) { e.preventDefault(); b.click(); }
    }
  });

  // 测试用
  window.__tq = { state: () => S, bank: BANK, correctFor };
  renderHome();
})();
