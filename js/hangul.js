/*
 * hangul.js — 두벌식(KS X 5002) 자판 매핑과 한글 조합 오토마타
 *
 * 이 게임은 브라우저 IME(입력기)를 쓰지 않는다. 물리 키 위치(event.code)를
 * 낱자(자모)로 직접 바꾸고, 그 자모 배열을 여기서 음절로 조합한다.
 * 덕분에 한/영 입력기 상태와 무관하게 항상 동일하게 동작한다.
 */
(function (global) {
  'use strict';

  var BASE = 0xac00;
  var LAST = 0xd7a3;

  var CHO = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ',
             'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

  var JUNG = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ',
              'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];

  var JONG = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ',
              'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ',
              'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

  /* 물리 키 → 자모. n = 그냥, s = Shift 함께 */
  var KEYMAP = {
    KeyQ: { n: 'ㅂ', s: 'ㅃ' }, KeyW: { n: 'ㅈ', s: 'ㅉ' }, KeyE: { n: 'ㄷ', s: 'ㄸ' },
    KeyR: { n: 'ㄱ', s: 'ㄲ' }, KeyT: { n: 'ㅅ', s: 'ㅆ' }, KeyY: { n: 'ㅛ' },
    KeyU: { n: 'ㅕ' }, KeyI: { n: 'ㅑ' }, KeyO: { n: 'ㅐ', s: 'ㅒ' },
    KeyP: { n: 'ㅔ', s: 'ㅖ' },
    KeyA: { n: 'ㅁ' }, KeyS: { n: 'ㄴ' }, KeyD: { n: 'ㅇ' }, KeyF: { n: 'ㄹ' },
    KeyG: { n: 'ㅎ' }, KeyH: { n: 'ㅗ' }, KeyJ: { n: 'ㅓ' }, KeyK: { n: 'ㅏ' },
    KeyL: { n: 'ㅣ' },
    KeyZ: { n: 'ㅋ' }, KeyX: { n: 'ㅌ' }, KeyC: { n: 'ㅊ' }, KeyV: { n: 'ㅍ' },
    KeyB: { n: 'ㅠ' }, KeyN: { n: 'ㅜ' }, KeyM: { n: 'ㅡ' }
  };

  /* 자모 → 물리 키 (위 표의 역방향) */
  var JAMO_TO_KEY = {};
  Object.keys(KEYMAP).forEach(function (code) {
    JAMO_TO_KEY[KEYMAP[code].n] = { code: code, shift: false };
    if (KEYMAP[code].s) JAMO_TO_KEY[KEYMAP[code].s] = { code: code, shift: true };
  });

  /* 겹모음 / 겹받침 분해표 */
  var JUNG_PARTS = {
    'ㅘ': ['ㅗ', 'ㅏ'], 'ㅙ': ['ㅗ', 'ㅐ'], 'ㅚ': ['ㅗ', 'ㅣ'],
    'ㅝ': ['ㅜ', 'ㅓ'], 'ㅞ': ['ㅜ', 'ㅔ'], 'ㅟ': ['ㅜ', 'ㅣ'],
    'ㅢ': ['ㅡ', 'ㅣ']
  };
  var JONG_PARTS = {
    'ㄳ': ['ㄱ', 'ㅅ'], 'ㄵ': ['ㄴ', 'ㅈ'], 'ㄶ': ['ㄴ', 'ㅎ'],
    'ㄺ': ['ㄹ', 'ㄱ'], 'ㄻ': ['ㄹ', 'ㅁ'], 'ㄼ': ['ㄹ', 'ㅂ'],
    'ㄽ': ['ㄹ', 'ㅅ'], 'ㄾ': ['ㄹ', 'ㅌ'], 'ㄿ': ['ㄹ', 'ㅍ'],
    'ㅀ': ['ㄹ', 'ㅎ'], 'ㅄ': ['ㅂ', 'ㅅ']
  };

  var JUNG_JOIN = {};
  Object.keys(JUNG_PARTS).forEach(function (k) {
    JUNG_JOIN[JUNG_PARTS[k][0] + JUNG_PARTS[k][1]] = k;
  });
  var JONG_JOIN = {};
  Object.keys(JONG_PARTS).forEach(function (k) {
    JONG_JOIN[JONG_PARTS[k][0] + JONG_PARTS[k][1]] = k;
  });

  /* 한글이 아닌 글자를 위한 자판 매핑 (문장 연습의 문장부호 등) */
  var ASCII_KEY = {
    ' ': { code: 'Space', shift: false },
    '.': { code: 'Period', shift: false },
    ',': { code: 'Comma', shift: false },
    '/': { code: 'Slash', shift: false },
    '?': { code: 'Slash', shift: true },
    '!': { code: 'Digit1', shift: true },
    "'": { code: 'Quote', shift: false },
    '"': { code: 'Quote', shift: true },
    ';': { code: 'Semicolon', shift: false },
    ':': { code: 'Semicolon', shift: true },
    '-': { code: 'Minus', shift: false },
    '_': { code: 'Minus', shift: true },
    '=': { code: 'Equal', shift: false },
    '+': { code: 'Equal', shift: true },
    '~': { code: 'Backquote', shift: true },
    '`': { code: 'Backquote', shift: false },
    '(': { code: 'Digit9', shift: true },
    ')': { code: 'Digit0', shift: true },
    '%': { code: 'Digit5', shift: true }
  };
  '0123456789'.split('').forEach(function (d) {
    ASCII_KEY[d] = { code: 'Digit' + d, shift: false };
  });
  'abcdefghijklmnopqrstuvwxyz'.split('').forEach(function (c) {
    ASCII_KEY[c] = { code: 'Key' + c.toUpperCase(), shift: false };
    ASCII_KEY[c.toUpperCase()] = { code: 'Key' + c.toUpperCase(), shift: true };
  });

  /* 물리 키 → 한글이 아닌 문자 (위 표의 역방향) */
  var CODE_TO_CHAR = {};
  Object.keys(ASCII_KEY).forEach(function (ch) {
    var k = ASCII_KEY[ch];
    if (!CODE_TO_CHAR[k.code]) CODE_TO_CHAR[k.code] = {};
    CODE_TO_CHAR[k.code][k.shift ? 's' : 'n'] = ch;
  });

  function isSyllable(ch) {
    var c = ch.charCodeAt(0);
    return c >= BASE && c <= LAST;
  }
  function isVowel(j) { return JUNG.indexOf(j) >= 0; }
  function isConsonant(j) { return CHO.indexOf(j) >= 0 || JONG.indexOf(j) > 0; }

  /* 완성형 음절 → 낱자 배열 (겹모음·겹받침은 실제 타건 순서로 분해) */
  function syllableToJamo(ch) {
    var code = ch.charCodeAt(0) - BASE;
    var cho = Math.floor(code / (21 * 28));
    var jung = Math.floor((code % (21 * 28)) / 28);
    var jong = code % 28;

    var out = [CHO[cho]];
    var v = JUNG[jung];
    out = out.concat(JUNG_PARTS[v] || [v]);
    if (jong > 0) {
      var t = JONG[jong];
      out = out.concat(JONG_PARTS[t] || [t]);
    }
    return out;
  }

  /* 낱자 하나 → 타건 정보 { jamo, code, shift } */
  function jamoToStroke(j) {
    var k = JAMO_TO_KEY[j];
    if (k) return { jamo: j, code: k.code, shift: k.shift };
    var a = ASCII_KEY[j];
    if (a) return { jamo: j, code: a.code, shift: a.shift };
    return { jamo: j, code: null, shift: false };
  }

  /*
   * 문자열 → 타건 순서 배열.
   * 예) "한글" → ㅎ ㅏ ㄴ ㄱ ㅡ ㄹ (6타)
   */
  function textToStrokes(text) {
    var out = [];
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (isSyllable(ch)) {
        syllableToJamo(ch).forEach(function (j) { out.push(jamoToStroke(j)); });
      } else if (JUNG_PARTS[ch]) {
        JUNG_PARTS[ch].forEach(function (j) { out.push(jamoToStroke(j)); });
      } else if (JONG_PARTS[ch]) {
        JONG_PARTS[ch].forEach(function (j) { out.push(jamoToStroke(j)); });
      } else {
        out.push(jamoToStroke(ch));
      }
    }
    return out;
  }

  /* 한 글자를 치는 데 필요한 타수 */
  function strokeCount(text) { return textToStrokes(text).length; }

  /*
   * 조합 오토마타: 낱자 배열 → 화면에 보일 문자열.
   * 순수 함수라서 상태 버그가 없다. 백스페이스는 배열에서 pop 하면 끝.
   */
  function compose(seq) {
    var out = '';
    var cho = -1, jung = -1, jong = 0;

    function flush() {
      if (cho >= 0 && jung >= 0) {
        out += String.fromCharCode(BASE + (cho * 21 + jung) * 28 + jong);
      } else if (cho >= 0) {
        out += CHO[cho];
      } else if (jung >= 0) {
        out += JUNG[jung];
      }
      cho = -1; jung = -1; jong = 0;
    }

    for (var i = 0; i < seq.length; i++) {
      var j = typeof seq[i] === 'string' ? seq[i] : seq[i].jamo;

      if (isVowel(j)) {
        if (cho >= 0 && jung >= 0 && jong > 0) {
          /* 받침이 다음 글자의 초성으로 넘어간다: 닭 + ㅏ → 달가 */
          var t = JONG[jong];
          var parts = JONG_PARTS[t];
          var moved;
          if (parts) { jong = JONG.indexOf(parts[0]); moved = parts[1]; }
          else { jong = 0; moved = t; }
          flush();
          cho = CHO.indexOf(moved);
          jung = JUNG.indexOf(j);
        } else if (jung >= 0) {
          var joined = JUNG_JOIN[JUNG[jung] + j];
          if (joined) {
            jung = JUNG.indexOf(joined);
          } else {
            flush();
            jung = JUNG.indexOf(j);
          }
        } else {
          jung = JUNG.indexOf(j);
        }
      } else if (isConsonant(j)) {
        if (jung < 0) {
          if (cho >= 0) flush();
          cho = CHO.indexOf(j);
          if (cho < 0) { out += j; }
        } else if (jong === 0) {
          var ji = JONG.indexOf(j);
          if (ji > 0 && cho >= 0) {
            jong = ji;
          } else {
            flush();
            cho = CHO.indexOf(j);
            if (cho < 0) out += j;
          }
        } else {
          var join = JONG_JOIN[JONG[jong] + j];
          if (join) {
            jong = JONG.indexOf(join);
          } else {
            flush();
            cho = CHO.indexOf(j);
            if (cho < 0) out += j;
          }
        }
      } else {
        flush();
        out += j;
      }
    }
    flush();
    return out;
  }

  /* 눌린 키 → 자모. 한글 자모가 아니면 null */
  function keyToJamo(code, shift) {
    var m = KEYMAP[code];
    if (m) return shift && m.s ? m.s : m.n;
    if (code === 'Space') return ' ';
    return null;
  }

  /*
   * 눌린 키 → 문장부호 등 한글이 아닌 문자.
   * event.key 를 쓰지 않는 이유: 입력기가 한글 상태면 event.key 가
   * 'Process' 로 오는 브라우저가 있어서 문장부호를 못 친다.
   */
  function keyToChar(code, shift) {
    var c = CODE_TO_CHAR[code];
    if (!c) return null;
    return (shift ? c.s : c.n) || c.n || null;
  }

  global.Hangul = {
    CHO: CHO, JUNG: JUNG, JONG: JONG,
    KEYMAP: KEYMAP,
    isSyllable: isSyllable,
    isVowel: isVowel,
    isConsonant: isConsonant,
    syllableToJamo: syllableToJamo,
    textToStrokes: textToStrokes,
    strokeCount: strokeCount,
    jamoToStroke: jamoToStroke,
    compose: compose,
    keyToJamo: keyToJamo,
    keyToChar: keyToChar
  };
})(window);
