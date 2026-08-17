/* data.js — 언어별 연습 자료 (낱자 / 낱말 / 문장) */
(function (global) {
  'use strict';

  /* ───────────────────────────── 한글 두벌식 ───────────────────────────── */
  var KO = {
    label: '한글',
    badge: '두벌식',
    lead: '한글 조합을 게임이 직접 처리합니다. ' +
          '<strong>한/영 입력기 상태와 상관없이</strong> 자판 위치만 맞으면 그대로 입력돼요.',
    speedUnit: '타/분',

    DRILL: {
      home: {
        label: '기본 자리',
        hint: 'ㅁㄴㅇㄹㅎ · ㅗㅓㅏㅣ (a s d f g h j k l)',
        chars: ['ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ']
      },
      top: {
        label: '윗줄',
        hint: 'ㅂㅈㄷㄱㅅ · ㅛㅕㅑㅐㅔ (q w e r t y u i o p)',
        chars: ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ']
      },
      bottom: {
        label: '아랫줄',
        hint: 'ㅋㅌㅊㅍ · ㅠㅜㅡ (z x c v b n m)',
        chars: ['ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ']
      },
      shift: {
        label: '쌍자음',
        hint: 'Shift + q w e r t o p → ㅃㅉㄸㄲㅆㅒㅖ',
        chars: ['ㅃ', 'ㅉ', 'ㄸ', 'ㄲ', 'ㅆ', 'ㅒ', 'ㅖ']
      },
      all: {
        label: '전체',
        hint: '자판 전체 낱자를 섞어서 연습합니다',
        chars: ['ㅂ', 'ㅈ', 'ㄷ', 'ㄱ', 'ㅅ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ',
                'ㅁ', 'ㄴ', 'ㅇ', 'ㄹ', 'ㅎ', 'ㅗ', 'ㅓ', 'ㅏ', 'ㅣ',
                'ㅋ', 'ㅌ', 'ㅊ', 'ㅍ', 'ㅠ', 'ㅜ', 'ㅡ',
                'ㅃ', 'ㅉ', 'ㄸ', 'ㄲ', 'ㅆ']
      }
    },

    WORDS: {
      easy: {
        label: '초급',
        hint: '받침 없는 짧은 낱말',
        list: ['나무', '바다', '하늘', '구름', '노래', '지도', '우유', '사자',
               '다리', '머리', '소리', '시계', '자유', '도시', '기차', '나비',
               '모래', '파도', '새우', '조개', '오리', '두부', '배추', '허리',
               '여기', '저기', '거리', '무지개', '어머니', '아버지', '코끼리',
               '자매', '휴지', '가위', '재주', '보리', '나라', '유리', '토마토']
      },
      normal: {
        label: '중급',
        hint: '받침이 있는 일상 낱말',
        list: ['학교', '사랑', '친구', '선생님', '컴퓨터', '자판기', '음악',
               '영화', '공원', '계절', '겨울', '바람', '햇빛', '강물', '산책',
               '도서관', '지하철', '김치', '비빔밥', '한글', '세종', '문장',
               '연습', '손가락', '키보드', '화면', '창문', '시간', '정확',
               '생각', '기분', '행복', '건강', '운동장', '방학', '숙제',
               '전화번호', '냉장고', '가족', '주말', '선물', '약속', '출발']
      },
      hard: {
        label: '고급',
        hint: '겹받침과 어려운 조합',
        list: ['닭갈비', '앉다', '없다', '값어치', '넓다', '짧다', '읽기',
               '밟다', '훑다', '옳다', '얹다', '핥다', '굶주림', '흙길',
               '여덟', '넋두리', '웃옷', '꽃잎', '밝다', '젊음', '싫증',
               '앓다', '몫', '삯', '낚시', '깎다', '볶음밥', '뚫다',
               '꿰맴', '띄어쓰기', '왕밤빵', '쌍꺼풀', '뛰어넘다', '외곬',
               '읊조리다', '핥아먹다', '넓둥글다', '옮겨심기', '짊어지다']
      }
    },

    SENTENCES: {
      proverb: {
        label: '속담',
        hint: '한국 속담으로 연습합니다',
        list: [
          '가는 말이 고와야 오는 말이 곱다.',
          '티끌 모아 태산.',
          '세 살 버릇 여든까지 간다.',
          '발 없는 말이 천 리 간다.',
          '낮말은 새가 듣고 밤말은 쥐가 듣는다.',
          '고생 끝에 낙이 온다.',
          '천 리 길도 한 걸음부터.',
          '백지장도 맞들면 낫다.',
          '우물을 파도 한 우물을 파라.',
          '호랑이도 제 말 하면 온다.',
          '원숭이도 나무에서 떨어진다.',
          '빈 수레가 요란하다.',
          '아는 길도 물어 가라.',
          '돌다리도 두들겨 보고 건너라.',
          '소 잃고 외양간 고친다.',
          '등잔 밑이 어둡다.',
          '믿는 도끼에 발등 찍힌다.',
          '구슬이 서 말이라도 꿰어야 보배.',
          '열 번 찍어 아니 넘어가는 나무 없다.',
          '남의 떡이 더 커 보인다.'
        ]
      },
      daily: {
        label: '일반',
        hint: '일상 문장과 타자 요령',
        list: [
          '오늘도 좋은 하루 보내세요.',
          '한글은 세종대왕이 만든 우리나라의 글자입니다.',
          '타자 연습은 꾸준히 하는 것이 가장 중요합니다.',
          '자판을 보지 않고 치는 연습을 해 봅시다.',
          '정확도가 속도보다 먼저입니다.',
          '손목에 무리가 가지 않도록 자세를 바르게 하세요.',
          '봄이 오면 벚꽃이 활짝 핍니다.',
          '커피 한 잔의 여유를 즐겨 보세요.',
          '책을 많이 읽으면 생각이 깊어집니다.',
          '작은 습관이 큰 변화를 만듭니다.',
          '왼손 검지는 언제나 자판의 오른쪽 홈에 둡니다.',
          '오늘 하루도 수고 많으셨습니다.',
          '창밖으로 첫눈이 소복하게 내리고 있습니다.',
          '천천히 정확하게 치는 것부터 시작하세요.',
          '실수해도 괜찮으니 끝까지 쳐 봅시다.',
          '가을 하늘은 높고 말은 살이 찝니다.',
          '주말에는 가까운 공원을 산책하려고 합니다.',
          '좋은 자세가 빠른 손보다 오래갑니다.'
        ]
      }
    }
  };

  /* ───────────────────────────── 영문 QWERTY ───────────────────────────── */
  var EN = {
    label: 'English',
    badge: 'QWERTY',
    lead: '영문 QWERTY 자판을 연습합니다. 한글과 마찬가지로 ' +
          '<strong>입력기 상태와 상관없이</strong> 자판 위치 그대로 입력돼요.',
    speedUnit: 'WPM',

    DRILL: {
      home: {
        label: 'Home row',
        hint: '기본 자리 a s d f g · h j k l ;',
        chars: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';']
      },
      top: {
        label: 'Top row',
        hint: '윗줄 q w e r t · y u i o p',
        chars: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p']
      },
      bottom: {
        label: 'Bottom row',
        hint: '아랫줄 z x c v b · n m , . /',
        chars: ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/']
      },
      caps: {
        label: 'Capitals',
        hint: 'Shift 를 함께 눌러 대문자를 칩니다',
        chars: ['A', 'S', 'D', 'F', 'J', 'K', 'L', 'Q', 'W', 'E',
                'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'Z', 'X', 'C']
      },
      all: {
        label: 'All keys',
        hint: '알파벳 26자를 섞어서 연습합니다',
        chars: 'abcdefghijklmnopqrstuvwxyz'.split('')
      }
    },

    WORDS: {
      easy: {
        label: 'Easy',
        hint: '3–4 글자 기본 낱말',
        list: ['the', 'and', 'cat', 'dog', 'run', 'sun', 'box', 'key', 'top',
               'red', 'fly', 'cup', 'map', 'hat', 'sit', 'big', 'joy', 'ice',
               'oak', 'pen', 'book', 'tree', 'rain', 'blue', 'road', 'fish',
               'hand', 'time', 'good', 'work', 'play', 'jump', 'star', 'door',
               'song', 'cold', 'ship', 'gold', 'wind', 'bird', 'lake', 'moon']
      },
      normal: {
        label: 'Normal',
        hint: '5–6 글자 일상 낱말',
        list: ['about', 'water', 'house', 'light', 'world', 'music', 'paper',
               'green', 'table', 'phone', 'dream', 'bread', 'cloud', 'river',
               'smile', 'night', 'quiet', 'brave', 'ocean', 'plant', 'north',
               'sugar', 'field', 'happy', 'stone', 'train', 'glass', 'sound',
               'winter', 'summer', 'friend', 'window', 'garden', 'silver',
               'orange', 'purple', 'coffee', 'flower', 'market', 'travel']
      },
      hard: {
        label: 'Hard',
        hint: '길고 손이 많이 움직이는 낱말',
        list: ['keyboard', 'practice', 'sentence', 'language', 'computer',
               'remember', 'syllable', 'question', 'birthday', 'alphabet',
               'knowledge', 'beautiful', 'wonderful', 'chocolate', 'adventure',
               'technology', 'understand', 'experience', 'restaurant',
               'appreciate', 'background', 'everything', 'university',
               'complicated', 'independent', 'conversation', 'neighborhood',
               'extraordinary', 'responsibility', 'characteristic']
      }
    },

    SENTENCES: {
      pangram: {
        label: 'Pangrams',
        hint: '알파벳 26자가 모두 들어간 문장',
        list: [
          'The quick brown fox jumps over the lazy dog.',
          'Sphinx of black quartz, judge my vow.',
          'The five boxing wizards jump quickly.',
          'How vexingly quick daft zebras jump!',
          'Jackdaws love my big sphinx of quartz.',
          'Waltz, bad nymph, for quick jigs vex.',
          'Bright vixens jump; dozy fowl quack.',
          'The jay, pig, fox, zebra and my wolves quack!',
          'Quick zephyrs blow, vexing daft Jim.',
          'Jumpy halfling dwarves pick quartz box.'
        ]
      },
      general: {
        label: 'General',
        hint: '타자 자세와 요령에 관한 문장',
        list: [
          'Practice a little every day and your speed will follow.',
          'Keep your wrists straight and your shoulders relaxed.',
          'Accuracy comes first; speed arrives on its own.',
          'Rest your fingers on the home row before you begin.',
          'Look at the screen, not at your hands.',
          'Type slowly enough to get every letter right.',
          'Short, regular sessions beat one long session.',
          'The home row is where every reach starts and ends.',
          'Small habits build into large improvements.',
          'Take a short break whenever your hands feel tired.',
          'Let your thumbs rest lightly on the space bar.',
          'A steady rhythm is worth more than a fast burst.',
          'Read one word ahead of the one you are typing.',
          'Sit tall, breathe easy, and keep your elbows low.',
          'Mistakes are cheap when you catch them early.'
        ]
      }
    }
  };

  /* 떨어뜨리기용 낱말은 쉬움+보통을 합쳐 쓴다 */
  KO.FALL_WORDS = KO.WORDS.easy.list.concat(KO.WORDS.normal.list);
  EN.FALL_WORDS = EN.WORDS.easy.list.concat(EN.WORDS.normal.list);

  /* 낱말 떨어뜨리기: 난이도별 설정 (언어 공통) */
  var FALL = {
    easy:   { label: '쉬움', hint: '천천히 떨어집니다', speed: 14, spawn: 2200, lives: 5 },
    normal: { label: '보통', hint: '적당한 속도',       speed: 20, spawn: 1700, lives: 3 },
    hard:   { label: '어려움', hint: '빠르고 촘촘하게', speed: 28, spawn: 1200, lives: 3 }
  };

  global.Data = {
    LANG: { ko: KO, en: EN },
    FALL: FALL
  };
})(window);
