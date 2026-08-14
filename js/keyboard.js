/* keyboard.js — 화면 자판 그리기, 다음 키 안내, 눌림 표시 */
(function (global) {
  'use strict';

  var F = { // 손가락 구역
    L5: 'l5', L4: 'l4', L3: 'l3', L2: 'l2',
    R2: 'r2', R3: 'r3', R4: 'r4', R5: 'r5'
  };

  var ROWS = [
    [
      { code: 'Backquote', en: '`', f: F.L5 }, { code: 'Digit1', en: '1', f: F.L5 },
      { code: 'Digit2', en: '2', f: F.L4 }, { code: 'Digit3', en: '3', f: F.L3 },
      { code: 'Digit4', en: '4', f: F.L2 }, { code: 'Digit5', en: '5', f: F.L2 },
      { code: 'Digit6', en: '6', f: F.R2 }, { code: 'Digit7', en: '7', f: F.R2 },
      { code: 'Digit8', en: '8', f: F.R3 }, { code: 'Digit9', en: '9', f: F.R4 },
      { code: 'Digit0', en: '0', f: F.R5 }, { code: 'Minus', en: '-', f: F.R5 },
      { code: 'Equal', en: '=', f: F.R5 },
      { code: 'Backspace', en: '⌫', f: F.R5, w: 2, wide: true }
    ],
    [
      { code: 'Tab', en: 'Tab', f: F.L5, w: 1.5, wide: true },
      { code: 'KeyQ', en: 'Q', f: F.L5 }, { code: 'KeyW', en: 'W', f: F.L4 },
      { code: 'KeyE', en: 'E', f: F.L3 }, { code: 'KeyR', en: 'R', f: F.L2 },
      { code: 'KeyT', en: 'T', f: F.L2 }, { code: 'KeyY', en: 'Y', f: F.R2 },
      { code: 'KeyU', en: 'U', f: F.R2 }, { code: 'KeyI', en: 'I', f: F.R3 },
      { code: 'KeyO', en: 'O', f: F.R4 }, { code: 'KeyP', en: 'P', f: F.R5 },
      { code: 'BracketLeft', en: '[', f: F.R5 }, { code: 'BracketRight', en: ']', f: F.R5 },
      { code: 'Backslash', en: '\\', f: F.R5, w: 1.5, wide: true }
    ],
    [
      { code: 'CapsLock', en: 'Caps', f: F.L5, w: 1.8, wide: true },
      { code: 'KeyA', en: 'A', f: F.L5, home: true }, { code: 'KeyS', en: 'S', f: F.L4, home: true },
      { code: 'KeyD', en: 'D', f: F.L3, home: true }, { code: 'KeyF', en: 'F', f: F.L2, home: true },
      { code: 'KeyG', en: 'G', f: F.L2 }, { code: 'KeyH', en: 'H', f: F.R2 },
      { code: 'KeyJ', en: 'J', f: F.R2, home: true }, { code: 'KeyK', en: 'K', f: F.R3, home: true },
      { code: 'KeyL', en: 'L', f: F.R4, home: true }, { code: 'Semicolon', en: ';', f: F.R5, home: true },
      { code: 'Quote', en: "'", f: F.R5 },
      { code: 'Enter', en: 'Enter', f: F.R5, w: 2.2, wide: true }
    ],
    [
      { code: 'ShiftLeft', en: 'Shift', f: F.L5, w: 2.4, wide: true },
      { code: 'KeyZ', en: 'Z', f: F.L5 }, { code: 'KeyX', en: 'X', f: F.L4 },
      { code: 'KeyC', en: 'C', f: F.L3 }, { code: 'KeyV', en: 'V', f: F.L2 },
      { code: 'KeyB', en: 'B', f: F.L2 }, { code: 'KeyN', en: 'N', f: F.R2 },
      { code: 'KeyM', en: 'M', f: F.R2 }, { code: 'Comma', en: ',', f: F.R3 },
      { code: 'Period', en: '.', f: F.R4 }, { code: 'Slash', en: '/', f: F.R5 },
      { code: 'ShiftRight', en: 'Shift', f: F.R5, w: 2.6, wide: true }
    ],
    [
      { code: 'Space', en: '스페이스', f: 'th', w: 10, wide: true }
    ]
  ];

  var els = {};        // code → element
  var hinted = [];     // 현재 안내 중인 키
  var root = null;

  function render(container) {
    root = container;
    root.innerHTML = '';
    els = {};

    ROWS.forEach(function (row) {
      var rowEl = document.createElement('div');
      rowEl.className = 'kb-row';

      row.forEach(function (key) {
        var el = document.createElement('div');
        el.className = 'kb-key f-' + key.f;
        if (key.wide) el.classList.add('wide');
        if (key.home) el.classList.add('home');
        el.style.flexGrow = key.w || 1;

        var map = Hangul.KEYMAP[key.code];

        var en = document.createElement('span');
        en.className = 'kb-en';
        en.textContent = key.en;
        el.appendChild(en);

        if (map) {
          var kr = document.createElement('span');
          kr.className = 'kb-kr';
          kr.textContent = map.n;
          el.appendChild(kr);
          if (map.s) {
            var sh = document.createElement('span');
            sh.className = 'kb-sh';
            sh.textContent = map.s;
            el.appendChild(sh);
          }
        }

        els[key.code] = el;
        rowEl.appendChild(el);
      });

      root.appendChild(rowEl);
    });
  }

  /* 다음에 눌러야 할 키를 표시. shift 가 필요하면 Shift 키도 함께 */
  function hint(code, shift) {
    clearHint();
    if (!code) return;
    var el = els[code];
    if (el) { el.classList.add('next'); hinted.push(el); }
    if (shift) {
      /* 누를 키와 반대쪽 Shift 를 안내한다 */
      var side = el && /f-l/.test(el.className) ? 'ShiftRight' : 'ShiftLeft';
      var s = els[side];
      if (s) { s.classList.add('next-shift'); hinted.push(s); }
    }
  }

  function clearHint() {
    hinted.forEach(function (el) {
      el.classList.remove('next');
      el.classList.remove('next-shift');
    });
    hinted = [];
  }

  /* 실제로 눌렀을 때 잠깐 반짝 */
  function flash(code, bad) {
    var el = els[code];
    if (!el) return;
    var cls = bad ? 'bad' : 'hit';
    el.classList.remove(cls);
    void el.offsetWidth;          // 애니메이션 재시작
    el.classList.add(cls);
    setTimeout(function () { el.classList.remove(cls); }, 180);
  }

  function setFingerColors(on) {
    if (root) root.classList.toggle('show-fingers', !!on);
  }

  global.Keyboard = {
    render: render,
    hint: hint,
    clearHint: clearHint,
    flash: flash,
    setFingerColors: setFingerColors
  };
})(window);
