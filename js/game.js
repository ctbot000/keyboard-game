/* game.js — 화면 전환, 연습 모드, 낱말 떨어뜨리기 게임 */
(function () {
  'use strict';

  var $ = function (sel) { return document.querySelector(sel); };
  var RECORD_KEY = 'hangul-typing-records';

  /* ---------------------------------------------------------------- 소리 */
  var Sound = {
    on: true,
    ctx: null,
    ensure: function () {
      if (!this.ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    },
    beep: function (freq, dur, type, vol) {
      if (!this.on) return;
      var ctx = this.ensure();
      if (!ctx) return;
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = type || 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol || 0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    },
    key: function () { this.beep(880, 0.03, 'square', 0.03); },
    err: function () { this.beep(150, 0.12, 'sawtooth', 0.05); },
    done: function () {
      this.beep(660, 0.08, 'triangle', 0.06);
      var self = this;
      setTimeout(function () { self.beep(990, 0.12, 'triangle', 0.06); }, 80);
    },
    boom: function () { this.beep(300, 0.15, 'triangle', 0.06); },
    over: function () {
      var self = this;
      [440, 350, 260, 180].forEach(function (f, i) {
        setTimeout(function () { self.beep(f, 0.18, 'sawtooth', 0.06); }, i * 130);
      });
    }
  };

  /* ------------------------------------------------------------ 기록 저장 */
  function loadRecords() {
    try { return JSON.parse(localStorage.getItem(RECORD_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveRecord(key, value) {
    var r = loadRecords();
    r[key] = value;
    try { localStorage.setItem(RECORD_KEY, JSON.stringify(r)); } catch (e) { /* 무시 */ }
  }

  /* -------------------------------------------------------------- 유틸 */
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function pick(arr, n) {
    var out = [];
    while (out.length < n) out = out.concat(shuffle(arr));
    return out.slice(0, n);
  }
  /* 글자마다 "여기까지 치면 완성" 인 누적 타수 */
  function charEnds(text) {
    var ends = [], n = 0;
    for (var i = 0; i < text.length; i++) {
      n += Hangul.textToStrokes(text[i]).length;
      ends.push(n);
    }
    return ends;
  }
  function fmtTime(ms) {
    var s = Math.floor(ms / 1000);
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  /* --------------------------------------------------------------- 상태 */
  var S = {
    screen: 'menu',
    mode: null,      // drill | word | sentence | fall
    opt: null,
    optLabel: '',
    running: false,

    items: [],       // 쳐야 할 문자열 목록
    idx: 0,
    target: '',
    expected: [],    // 현재 항목의 타건 순서
    ends: [],
    typed: [],       // 지금까지 친 낱자 (틀린 것 포함)

    startAt: 0,
    typedStrokes: 0, // 실제로 누른 타수
    errorStrokes: 0,
    doneStrokes: 0,  // 완료된 항목의 타수 합

    timer: null,

    // 낱말 떨어뜨리기
    fall: null
  };

  /* -------------------------------------------------------------- 화면 */
  function show(name) {
    S.screen = name;
    ['menu', 'play', 'result'].forEach(function (n) {
      $('#screen-' + n).classList.toggle('hidden', n !== name);
    });
    $('#btn-menu').classList.toggle('hidden', name === 'menu');
  }

  /* ------------------------------------------------------ 연습 모드 시작 */
  function startPractice(mode, optKey) {
    S.mode = mode;
    S.opt = optKey;

    if (mode === 'drill') {
      var d = Data.DRILL[optKey];
      S.optLabel = d.label;
      S.items = chunk(pick(d.jamo, 40), 10);   // 낱자 10개씩 4줄
      $('#play-hint').textContent = d.hint + ' · 틀린 키는 입력되지 않습니다';
    } else if (mode === 'word') {
      var w = Data.WORDS[optKey];
      S.optLabel = w.label;
      S.items = pick(w.list, 20);
      $('#play-hint').textContent = w.hint + ' · 낱말을 다 치면 자동으로 넘어갑니다';
    } else {
      var t = Data.SENTENCES[optKey];
      S.optLabel = t.label;
      S.items = pick(t.list, 5);
      $('#play-hint').textContent = t.hint + ' · 띄어쓰기와 문장부호까지 그대로 칩니다';
    }

    S.idx = 0;
    S.typedStrokes = 0;
    S.errorStrokes = 0;
    S.doneStrokes = 0;
    S.startAt = 0;
    S.running = true;

    $('#play-mode').textContent = modeName(mode) + ' · ' + S.optLabel;
    $('#field-practice').classList.remove('hidden');
    $('#field-fall').classList.add('hidden');

    loadItem();
    show('play');
    tick();
    S.timer = setInterval(tick, 200);
  }

  function chunk(arr, n) {
    var out = [];
    for (var i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n).join(''));
    return out;
  }

  function modeName(m) {
    return { drill: '자리 연습', word: '낱말 연습', sentence: '문장 연습', fall: '낱말 떨어뜨리기' }[m];
  }

  function loadItem() {
    S.target = S.items[S.idx];
    S.expected = Hangul.textToStrokes(S.target);
    S.ends = charEnds(S.target);
    S.typed = [];
    renderPractice();
  }

  /* 지금까지 맞게 친 타수와, 틀린 지점 */
  function analyze() {
    var d = -1;
    for (var i = 0; i < S.typed.length; i++) {
      if (i >= S.expected.length || S.typed[i] !== S.expected[i].jamo) { d = i; break; }
    }
    var ok = d < 0 ? S.typed.length : d;
    var doneChars = 0;
    while (doneChars < S.ends.length && S.ends[doneChars] <= ok) doneChars++;
    return { ok: ok, hasError: d >= 0, doneChars: doneChars };
  }

  function renderPractice() {
    var a = analyze();
    var html = '';
    for (var i = 0; i < S.target.length; i++) {
      var cls = '';
      if (i < a.doneChars) cls = 'ok';
      else if (i === a.doneChars) cls = a.hasError ? 'bad' : 'cur';
      var ch = S.target[i] === ' ' ? '&nbsp;' : escapeHtml(S.target[i]);
      html += '<span class="ch ' + cls + '">' + ch + '</span>';
    }
    $('#target').innerHTML = html;
    $('#target').classList.toggle('drill', S.mode === 'drill');

    if (S.mode === 'drill') {
      $('#typed').classList.add('hidden');
    } else {
      $('#typed').classList.remove('hidden');
      var text = Hangul.compose(S.typed);
      $('#typed').innerHTML = text
        ? escapeHtml(text).replace(/ /g, '&nbsp;') + '<span class="caret"></span>'
        : '<span class="caret"></span>';
      $('#typed').classList.toggle('has-error', a.hasError);
    }

    /* 남은 항목 미리보기 */
    var next = S.items.slice(S.idx + 1, S.idx + 4).map(function (s) {
      return '<span>' + escapeHtml(s.length > 18 ? s.slice(0, 18) + '…' : s) + '</span>';
    }).join('');
    $('#upcoming').innerHTML = next;

    /* 다음 키 안내 */
    if (a.hasError) {
      Keyboard.hint('Backspace', false);
    } else if (a.ok < S.expected.length) {
      var e = S.expected[a.ok];
      Keyboard.hint(e.code, e.shift);
    } else {
      Keyboard.clearHint();
    }

    $('#progress').textContent = (S.idx + 1) + ' / ' + S.items.length;
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* --------------------------------------------------------- 입력 처리 */
  function onPracticeKey(jamo, code, shift) {
    if (!S.startAt) S.startAt = Date.now();

    var a = analyze();
    var expectHere = S.expected[S.typed.length];
    var correct = !a.hasError && expectHere && expectHere.jamo === jamo;

    /* 자리 연습은 틀린 키를 받아주지 않는다 (초보자용) */
    if (S.mode === 'drill' && !correct) {
      S.typedStrokes++;
      S.errorStrokes++;
      Sound.err();
      Keyboard.flash(code, true);
      shake($('#target'));
      renderPractice();
      return;
    }

    S.typed.push(jamo);
    S.typedStrokes++;
    if (!correct) S.errorStrokes++;

    Keyboard.flash(code, !correct);
    if (correct) Sound.key(); else Sound.err();

    var b = analyze();
    if (!b.hasError && S.typed.length === S.expected.length) {
      S.doneStrokes += S.expected.length;
      S.idx++;
      if (S.idx >= S.items.length) { finishPractice(); return; }
      Sound.done();
      loadItem();
      return;
    }
    renderPractice();
  }

  function onBackspace() {
    if (S.mode === 'drill') return;      // 자리 연습은 지울 게 없다
    if (S.typed.length === 0) return;
    S.typed.pop();
    renderPractice();
  }

  function shake(el) {
    el.classList.remove('shake');
    void el.offsetWidth;
    el.classList.add('shake');
  }

  /* ---------------------------------------------------------- 통계 표시 */
  function stats() {
    var a = S.mode === 'fall' ? null : analyze();
    var strokes = S.doneStrokes + (a ? a.ok : 0);
    var ms = S.startAt ? Date.now() - S.startAt : 0;
    var min = ms / 60000;
    /* 0.5초는 지나야 타수를 낸다. 안 그러면 첫 타에서 터무니없는 값이 나온다 */
    var cpm = ms >= 500 ? Math.round(strokes / min) : 0;
    var acc = S.typedStrokes > 0
      ? Math.round(((S.typedStrokes - S.errorStrokes) / S.typedStrokes) * 100)
      : 100;
    return { cpm: cpm, acc: acc, ms: ms, strokes: strokes };
  }

  function tick() {
    if (S.mode === 'fall') return;
    var s = stats();
    $('#stat-cpm').textContent = s.cpm;
    $('#stat-acc').textContent = s.acc + '%';
    $('#stat-time').textContent = fmtTime(s.ms);
  }

  /* ------------------------------------------------------------ 결과 */
  function finishPractice() {
    S.running = false;
    clearInterval(S.timer);
    Keyboard.clearHint();
    Sound.done();

    var s = stats();
    var key = S.mode + ':' + S.opt;
    var rec = loadRecords()[key];
    var best = !rec || s.cpm > rec.cpm;
    if (best) saveRecord(key, { cpm: s.cpm, acc: s.acc });

    $('#result-title').textContent = modeName(S.mode) + ' · ' + S.optLabel + ' 완료';
    $('#result-grid').innerHTML =
      card('타수', s.cpm, '타/분') +
      card('정확도', s.acc + '%', '') +
      card('걸린 시간', fmtTime(s.ms), '') +
      card('오타', S.errorStrokes, '번');
    $('#result-note').textContent = best
      ? '🎉 최고 기록을 세웠습니다!'
      : (rec ? '최고 기록: ' + rec.cpm + '타 / 정확도 ' + rec.acc + '%' : '');
    $('#result-note').classList.toggle('hl', !!best);
    show('result');
  }

  function card(label, value, unit) {
    return '<div class="rcard"><div class="rlabel">' + label + '</div>' +
           '<div class="rvalue">' + value + '<small>' + unit + '</small></div></div>';
  }

  /* ------------------------------------------ 낱말 떨어뜨리기 (게임 모드) */
  function startFall(optKey) {
    var cfg = Data.FALL[optKey];
    S.mode = 'fall';
    S.opt = optKey;
    S.optLabel = cfg.label;
    S.running = true;
    S.typedStrokes = 0;
    S.errorStrokes = 0;
    S.startAt = 0;

    S.fall = {
      cfg: cfg,
      words: [],
      buf: [],
      score: 0,
      level: 1,
      lives: cfg.lives,
      cleared: 0,
      speed: cfg.speed,
      spawnEvery: cfg.spawn,
      lastSpawn: 0,
      last: 0,
      raf: null
    };

    $('#play-mode').textContent = '낱말 떨어뜨리기 · ' + cfg.label;
    $('#play-hint').textContent = cfg.hint + ' · 떨어지는 낱말을 쳐서 없애세요 (Esc 로 입력 취소)';
    $('#field-practice').classList.add('hidden');
    $('#field-fall').classList.remove('hidden');
    $('#fall-words').innerHTML = '';
    updateFallHud();
    renderBuf();
    show('play');

    S.fall.last = performance.now();
    S.fall.lastSpawn = performance.now();
    S.fall.raf = requestAnimationFrame(fallLoop);
  }

  function spawnWord() {
    var f = S.fall;
    var field = $('#fall-words');
    var text = Data.FALL_WORDS[Math.floor(Math.random() * Data.FALL_WORDS.length)];

    var el = document.createElement('div');
    el.className = 'fword';
    el.innerHTML = text.split('').map(function (c) {
      return '<span>' + escapeHtml(c) + '</span>';
    }).join('');
    field.appendChild(el);

    var maxX = Math.max(10, field.clientWidth - el.offsetWidth - 10);
    var w = {
      text: text,
      strokes: Hangul.textToStrokes(text).map(function (s) { return s.jamo; }),
      ends: charEnds(text),
      el: el,
      x: 10 + Math.random() * maxX,
      y: -30,
      speed: f.speed * (0.85 + Math.random() * 0.3)
    };
    place(w);
    f.words.push(w);
  }

  function place(w) {
    w.el.style.transform = 'translate(' + w.x + 'px,' + w.y + 'px)';
  }

  function fallLoop(now) {
    var f = S.fall;
    if (!f || !S.running) return;

    var dt = Math.min(64, now - f.last) / 1000;
    f.last = now;

    if (now - f.lastSpawn > f.spawnEvery) {
      f.lastSpawn = now;
      spawnWord();
    }

    var field = $('#fall-words');
    var floor = field.clientHeight - 26;

    for (var i = f.words.length - 1; i >= 0; i--) {
      var w = f.words[i];
      w.y += w.speed * dt * 3;
      place(w);
      if (w.y >= floor) {
        w.el.classList.add('miss');
        (function (el) { setTimeout(function () { el.remove(); }, 260); })(w.el);
        f.words.splice(i, 1);
        /* 치던 낱말이 떨어졌으면 입력 버퍼를 비운다.
           (splice 뒤에 판단해야 남은 낱말 기준으로 정확하다) */
        if (f.buf.length && !matched()) f.buf = [];
        renderBuf();
        f.lives--;
        Sound.err();
        shake($('#fall-field'));
        updateFallHud();
        if (f.lives <= 0) { endFall(); return; }
      }
    }

    if (S.startAt) {
      var s = stats();
      $('#stat-cpm').textContent = s.cpm;
      $('#stat-acc').textContent = s.acc + '%';
      $('#stat-time').textContent = fmtTime(s.ms);
    }

    f.raf = requestAnimationFrame(fallLoop);
  }

  /* 현재 입력 버퍼로 진행 중인 낱말 */
  function matched() {
    var f = S.fall;
    if (!f.buf.length) return null;
    for (var i = 0; i < f.words.length; i++) {
      if (startsWith(f.words[i].strokes, f.buf)) return f.words[i];
    }
    return null;
  }
  function startsWith(arr, pre) {
    if (pre.length > arr.length) return false;
    for (var i = 0; i < pre.length; i++) if (arr[i] !== pre[i]) return false;
    return true;
  }

  function onFallKey(jamo, code) {
    var f = S.fall;
    if (!S.startAt) S.startAt = Date.now();

    var next = f.buf.concat([jamo]);
    var hit = null, complete = null;
    for (var i = 0; i < f.words.length; i++) {
      if (startsWith(f.words[i].strokes, next)) {
        hit = hit || f.words[i];
        if (f.words[i].strokes.length === next.length) {
          if (!complete || f.words[i].y > complete.y) complete = f.words[i];
        }
      }
    }

    S.typedStrokes++;
    if (!hit) {
      S.errorStrokes++;
      Sound.err();
      Keyboard.flash(code, true);
      shake($('#fall-buf'));
      return;
    }

    f.buf = next;
    S.doneStrokes++;
    Sound.key();
    Keyboard.flash(code, false);

    if (complete) {
      destroy(complete);
      f.buf = [];
    }
    renderBuf();
  }

  function destroy(w) {
    var f = S.fall;
    var i = f.words.indexOf(w);
    if (i >= 0) f.words.splice(i, 1);
    w.el.classList.add('pop');
    setTimeout(function () { w.el.remove(); }, 240);

    f.score += w.text.length * 10 * f.level;
    f.cleared++;
    Sound.boom();

    if (f.cleared % 8 === 0) {
      f.level++;
      f.speed *= 1.08;
      f.spawnEvery = Math.max(500, f.spawnEvery * 0.92);
      flashLevel();
    }
    updateFallHud();
  }

  function flashLevel() {
    var el = $('#level-up');
    el.textContent = 'LEVEL ' + S.fall.level;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    Sound.done();
  }

  function renderBuf() {
    var f = S.fall;
    var text = Hangul.compose(f.buf);
    $('#fall-buf').innerHTML = text
      ? escapeHtml(text) + '<span class="caret"></span>'
      : '<span class="ghost">낱말을 치세요</span>';

    var cur = matched();
    f.words.forEach(function (w) {
      w.el.classList.toggle('locked', w === cur);
      var spans = w.el.children;
      var done = 0;
      if (w === cur) while (done < w.ends.length && w.ends[done] <= f.buf.length) done++;
      for (var i = 0; i < spans.length; i++) {
        spans[i].className = i < done ? 'ok' : '';
      }
    });

    if (cur) {
      var stroke = Hangul.jamoToStroke(cur.strokes[f.buf.length]);
      Keyboard.hint(stroke.code, stroke.shift);
    } else {
      Keyboard.clearHint();
    }
  }

  function updateFallHud() {
    var f = S.fall;
    $('#fall-score').textContent = f.score;
    $('#fall-level').textContent = f.level;
    $('#fall-lives').textContent = '♥'.repeat(Math.max(0, f.lives));
    $('#progress').textContent = '없앤 낱말 ' + f.cleared;
  }

  function endFall() {
    var f = S.fall;
    S.running = false;
    cancelAnimationFrame(f.raf);
    Keyboard.clearHint();
    Sound.over();

    var s = stats();
    var key = 'fall:' + S.opt;
    var rec = loadRecords()[key];
    var best = !rec || f.score > rec.score;
    if (best) saveRecord(key, { score: f.score, level: f.level });

    $('#result-title').textContent = '게임 종료 · ' + S.optLabel;
    $('#result-grid').innerHTML =
      card('점수', f.score, '점') +
      card('레벨', f.level, '') +
      card('없앤 낱말', f.cleared, '개') +
      card('정확도', s.acc + '%', '');
    $('#result-note').textContent = best
      ? '🎉 최고 점수를 세웠습니다!'
      : (rec ? '최고 점수: ' + rec.score + '점 (레벨 ' + rec.level + ')' : '');
    $('#result-note').classList.toggle('hl', !!best);
    show('result');
  }

  function quit() {
    S.running = false;
    clearInterval(S.timer);
    if (S.fall && S.fall.raf) cancelAnimationFrame(S.fall.raf);
    Keyboard.clearHint();
    show('menu');
    renderRecords();
  }

  /* --------------------------------------------------------- 키 이벤트 */
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.code === 'Escape') {
      if (S.screen === 'play') {
        if (S.mode === 'fall' && S.fall && S.fall.buf.length) {
          e.preventDefault();
          S.fall.buf = [];
          renderBuf();
        } else {
          e.preventDefault();
          quit();
        }
      }
      return;
    }

    if (S.screen !== 'play' || !S.running) return;

    if (e.code === 'Backspace') {
      e.preventDefault();
      if (S.mode === 'fall') {
        if (S.fall.buf.length) { S.fall.buf.pop(); renderBuf(); }
      } else {
        onBackspace();
      }
      return;
    }

    var jamo = Hangul.keyToJamo(e.code, e.shiftKey);
    if (jamo === null) {
      /* 문장 연습의 문장부호처럼 한글이 아닌 키 */
      if (S.mode === 'sentence') jamo = Hangul.keyToChar(e.code, e.shiftKey);
      if (jamo === null) return;
    }
    if (S.mode === 'fall' && jamo === ' ') { e.preventDefault(); return; }

    e.preventDefault();
    if (S.mode === 'fall') onFallKey(jamo, e.code);
    else onPracticeKey(jamo, e.code, e.shiftKey);
  });

  /* ------------------------------------------------------------ 메뉴 */
  function buildMenu() {
    var menu = $('#modes');
    var groups = [
      { mode: 'drill', icon: '⌨️', title: '자리 연습',
        desc: '자판 위치를 손에 익힙니다. 틀린 키는 입력되지 않아요.',
        opts: Object.keys(Data.DRILL).map(function (k) {
          return { key: k, label: Data.DRILL[k].label };
        }) },
      { mode: 'word', icon: '📝', title: '낱말 연습',
        desc: '낱말 20개를 칩니다. 다 치면 자동으로 다음 낱말로 넘어갑니다.',
        opts: Object.keys(Data.WORDS).map(function (k) {
          return { key: k, label: Data.WORDS[k].label };
        }) },
      { mode: 'sentence', icon: '📖', title: '문장 연습',
        desc: '띄어쓰기와 문장부호까지 포함한 문장 5개를 칩니다.',
        opts: Object.keys(Data.SENTENCES).map(function (k) {
          return { key: k, label: Data.SENTENCES[k].label };
        }) },
      { mode: 'fall', icon: '🎮', title: '낱말 떨어뜨리기',
        desc: '떨어지는 낱말을 쳐서 없애세요. 바닥에 닿으면 생명이 줄어듭니다.',
        opts: Object.keys(Data.FALL).map(function (k) {
          return { key: k, label: Data.FALL[k].label };
        }) }
    ];

    menu.innerHTML = groups.map(function (g) {
      return '<div class="card">' +
        '<div class="card-head"><span class="icon">' + g.icon + '</span>' +
        '<h3>' + g.title + '</h3></div>' +
        '<p>' + g.desc + '</p>' +
        '<div class="chips">' + g.opts.map(function (o) {
          return '<button class="chip" data-mode="' + g.mode + '" data-opt="' + o.key + '">' +
                 o.label + '</button>';
        }).join('') + '</div>' +
        '<div class="rec" data-mode="' + g.mode + '"></div>' +
        '</div>';
    }).join('');

    menu.addEventListener('click', function (e) {
      var btn = e.target.closest('.chip');
      if (!btn) return;
      Sound.ensure();
      var mode = btn.dataset.mode;
      if (mode === 'fall') startFall(btn.dataset.opt);
      else startPractice(mode, btn.dataset.opt);
    });
  }

  function renderRecords() {
    var recs = loadRecords();
    document.querySelectorAll('.rec').forEach(function (el) {
      var mode = el.dataset.mode;
      var parts = [];
      Object.keys(recs).forEach(function (k) {
        if (k.indexOf(mode + ':') !== 0) return;
        var opt = k.split(':')[1];
        var src = mode === 'fall' ? Data.FALL
                : mode === 'word' ? Data.WORDS
                : mode === 'sentence' ? Data.SENTENCES : Data.DRILL;
        var label = src[opt] ? src[opt].label : opt;
        parts.push(label + ' ' + (mode === 'fall'
          ? recs[k].score + '점'
          : recs[k].cpm + '타'));
      });
      el.textContent = parts.length ? '최고 기록 · ' + parts.join(' / ') : '';
    });
  }

  /* ------------------------------------------------------------- 시작 */
  function init() {
    Keyboard.render($('#keyboard'));
    Keyboard.setFingerColors(true);
    buildMenu();
    renderRecords();

    $('#btn-menu').addEventListener('click', quit);
    $('#btn-again').addEventListener('click', function () {
      if (S.mode === 'fall') startFall(S.opt);
      else startPractice(S.mode, S.opt);
    });
    $('#btn-back').addEventListener('click', quit);

    var fingerOn = true;
    $('#btn-finger').addEventListener('click', function () {
      fingerOn = !fingerOn;
      Keyboard.setFingerColors(fingerOn);
      this.classList.toggle('off', !fingerOn);
    });
    $('#btn-sound').addEventListener('click', function () {
      Sound.on = !Sound.on;
      this.textContent = Sound.on ? '🔊' : '🔇';
      this.classList.toggle('off', !Sound.on);
    });

    show('menu');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
