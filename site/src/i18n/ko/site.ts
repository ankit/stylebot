import type { SiteMessages } from '..';

const site: SiteMessages = {
  meta: {
    title: 'Stylebot - 어떤 웹사이트든 내 스타일로',
    titleSuffix: '{title} - Stylebot',
    description:
      '페이지에서 요소를 가리켜 바꾸거나 원하는 모습을 설명하세요. CSS는 Stylebot이 작성합니다. Chrome, Firefox, Edge용 무료 오픈 소스 확장 프로그램입니다.',
  },
  header: {
    home: 'Stylebot 홈',
    manual: '설명서',
    install: '설치',
    language: '언어',
    suggest: '이 페이지를 한국어로 보기',
    dismiss: '닫기',
    theme: '테마: {theme}',
  },
  themes: {
    light: '라이트',
    dark: '다크',
    stylebot: 'Stylebot',
    newsprint: '신문지',
  },
  footer: {
    changelog: '변경 내역',
    donate: '커피 한 잔 사 주기',
  },
  store: {
    add: '{store}에 추가',
    addFree: '{store}에 추가 — 무료입니다',
    reinstall: '{store}에 다시 설치',
  },
  zoom: {
    label: '확대한 스크린샷',
    close: '닫기',
  },
  home: {
    title: '어떤 웹사이트든 내 {word}로.',
    titleWord: '스타일',
    titleWordHint: '클릭해 스타일 바꾸기',
    lede: '페이지에서 요소를 가리켜 바꾸거나, 원하는 모습을 말로 설명하세요. CSS는 Stylebot이 작성하고, 사이트를 다시 방문할 때마다 스타일을 불러옵니다.',
    also: '{first}, {second}에서도 사용 가능',
    installTitle: 'Stylebot 설치',
    installBody:
      '2011년부터 무료 오픈 소스입니다. 계정도 추적도 없습니다. 스타일은 브라우저에 저장되고, 코드는 GitHub에 공개되어 있습니다.',
    cli: '코딩 에이전트를 쓰시나요? <a href="#cli">CLI</a>를 추가하세요:',
  },
  cli: {
    copy: '복사',
    copied: '복사됨',
    copyCommand: '{command} 복사',
    title: '코딩 에이전트와 함께 쓰세요',
    body: 'Claude Code, Codex, Cursor 등 명령을 실행할 수 있는 에이전트라면 터미널에서 Stylebot을 사용할 수 있습니다.',
    guide: 'CLI 설정하기 →',
    demo: {
      terminal: '터미널 · 코딩 에이전트',
      prompt: '{site} 페이지를 밤에 읽기 편하게 바꿔 줘',
      done: '어두운 배경, 따뜻한 글자색, 더 큰 세리프 본문. 광고는 제거했습니다.',
      before: '변경 전',
      after: '변경 후',
      kicker: '여행',
      headline: '조용히 돌아온 야간 페리',
      dek: '여행객이 속도 대신 선실과 바다 전망, 공항 없는 여정을 택하리라는 데 세 선사가 승부를 걸었다.',
      text: '로스토크발 22시 40분 배는 요란한 배웅 없이 출항한다. 항구의 불빛이 뒤로 멀어질 무렵이면 승객 대부분은 선실을 찾아 들어갔고, 바에는 나지막한 웅성거림만 남는다.',
      ad: '광고',
    },
    page: {
      title: '명령줄',
      description:
        '터미널에서 Stylebot을 제어하거나, Claude Code, Codex, Cursor 같은 코딩 에이전트가 사용 중인 구독으로 브라우저에서 사이트 스타일을 바꾸게 하세요.',
      heading: '터미널에서 쓰는 Stylebot',
      lede: '명령줄에서 Stylebot을 제어하거나, Claude Code, Codex, Cursor 같은 코딩 에이전트에게 맡기세요. 에이전트는 API 키 대신 사용 중인 구독을 이용해 브라우저에서 바로 사이트 스타일을 바꿉니다.',
      setup: '설정하기',
      install: 'Stylebot 설치',
      installBody:
        'Chrome 또는 Edge용입니다. Firefox에서는 아직 명령줄을 사용할 수 없습니다.',
      cli: 'CLI 설치',
      cliBody: 'Node 20 이상이 필요합니다.',
      connect: '브라우저에 연결',
      connectBody:
        'Chrome과 Edge에 CLI를 등록해 Stylebot이 CLI에 연결할 수 있게 합니다.',
      access: '명령줄 액세스 켜기',
      accessBody:
        'Stylebot 옵션의 일반 페이지에서 <strong>이 컴퓨터의 앱이 Stylebot을 제어하도록 허용</strong>을 켜고, 브라우저가 요청하는 권한을 허용하세요.',
      plugin: 'Claude Code 플러그인 추가',
      optional: '선택 사항',
      pluginBody: 'Claude Code에서 다음을 실행하세요:',
      tryIt: '그런 다음 사용해 보세요:',
      commands: '명령어',
      commandsBody:
        '에이전트가 대신 실행하지만 직접 실행할 수도 있습니다. 전체 목록은 <code>stylebot --help</code>로 볼 수 있습니다.',
      examples: {
        open: '현재 창 뒤에 있는 창에서 페이지를 열고 탭 ID를 출력합니다.',
        outline: '페이지에 보이는 요소를 개요 형태로 출력합니다.',
        css: 'CSS를 사이트의 스타일로 저장해 적용하고 페이지를 확인합니다.',
        screenshot: '탭의 이미지를 저장합니다.',
      },
      privacy: '개인정보 보호',
      privacyBody: [
        '명령줄 액세스는 직접 켜기 전까지 꺼져 있습니다. 켜져 있는 동안에는 이 컴퓨터의 앱이 열린 페이지를 읽고, 스크린샷을 찍고, 스타일을 바꿀 수 있습니다. Stylebot 옵션에서 언제든 끌 수 있습니다.',
        'Stylebot과 CLI는 이 컴퓨터 안에서 서로만 통신하며, 외부로는 아무것도 보내지 않습니다. 다만 에이전트는 읽은 내용을 자신의 제공업체로 보냅니다. Claude Code라면 Anthropic으로 보냅니다.',
      ],
    },
  },
  gallery: {
    title: '바로 시작할 수 있는 스타일',
    lede: '하나를 복사해 원하는 대로 고치거나, 처음부터 직접 만들어 보세요.',
    hint: '{site}에서 코드 탭에 붙여넣으세요.',
    enlarge: '{site} 확대: {name}',
    alt: 'Stylebot으로 꾸민 {site}: {name}',
    install: '설치',
    installTitle: 'Stylebot에 설치',
    installed: '설치됨',
    installedAs: '{name} 프로필로 설치됨',
    installFailed: '설치하지 못함',
    copy: 'CSS 복사',
    copied: '복사됨',
    source: 'GitHub에서 보기',
    lightbox: '새로 꾸민 사이트',
    close: '닫기',
  },
  quotes: {
    title: '사용자들이 사랑하는 Stylebot',
  },
  features: {
    title: '그 밖의 모든 기능.',
    previous: '이전 기능',
    next: '다음 기능',
    sync: {
      title: '동기화',
      body: 'Google Drive를 연결하면 로그인하는 모든 컴퓨터에서 스타일을 사용할 수 있습니다. Stylebot은 30분마다, 그리고 편집 직후에 동기화합니다.',
      connected: 'Google 드라이브에 연결됨',
      synced: '2분 전 동기화됨',
      syncNow: '지금 동기화',
      savedTo: '저장 위치',
      disconnect: '연결 해제',
      schedule: '일정',
      scheduleValue: '30분마다, 그리고 스타일을 편집한 직후',
    },
    history: {
      title: '버전 기록',
      body: '스타일의 모든 변경 사항이 최신순으로 보관됩니다. 항목을 열어 무엇이 바뀌었는지 확인하고 클릭 한 번으로 복원하세요.',
      today: '오늘, 9월 25일',
      yesterday: '어제, 9월 24일',
      noChanges: '변경 없음',
      edited: '편집됨',
      sites: '사이트 10개',
      current: '현재',
      times: ['오전 1:04', '오전 12:41', '오후 11:41'],
    },
    presets: {
      title: '프리셋',
      body: '가독성 모드와 회색조 모드는 어떤 사이트에서든 작동하며, 직접 만든 변경 사항과 함께 적용됩니다.',
      readability: '가독성 모드',
      articlesOnly: '기사만 해당',
      readabilityBody:
        '테마, 글꼴, 크기를 원하는 대로 고를 수 있는 깔끔한 읽기 화면입니다.',
      grayscale: '회색조 모드',
      grayscaleBody: '페이지에 회색조 스타일을 적용합니다.',
    },
    chat: {
      title: '채팅',
      body: '코딩 에이전트가 없으신가요? 채팅 탭에서 원하는 변경을 설명하면 Stylebot이 CSS를 작성합니다. Claude, OpenAI, Gemini 키를 직접 연결해 사용하며, 키는 브라우저에만 저장됩니다.',
      prompt: '밤에 기사 읽기 편하게 해 줘',
      reply:
        '어두운 배경에 따뜻한 글자색으로 바꾸고, 본문은 더 큰 세리프 글꼴에 줄 간격을 넓혔습니다.',
      updated: '스타일 업데이트됨',
      undo: '실행 취소',
      placeholder: '변경 사항 설명',
    },
  },
  welcome: {
    title: '환영합니다',
    description: 'Stylebot 사용법을 처음부터 끝까지 1분 만에 알아보세요.',
    heading: 'Stylebot이 설치되었습니다.',
    yourTurn: '이제 직접 해 보세요.',
    yourTurnBody:
      '아무 사이트나 열고 단축키를 누르세요. 그 전까지는 아무것도 바뀌지 않습니다.',
    manual: '설명서',
    agentTitle: '코딩 에이전트를 연결하세요',
    agentBody:
      'Claude Code, Codex, Cursor 등 명령을 실행할 수 있는 에이전트라면 터미널에서 Stylebot을 사용할 수 있습니다.',
    agentPrompt: '이 사이트에 Everforest 테마 입히고 글꼴도 더 예쁘게 바꿔 줘',
    agentReply: 'Everforest 색상에 Lora와 Newsreader 글꼴을 적용했습니다.',
  },
  goodbye: {
    title: '안녕히 가세요',
    description: 'Stylebot을 사용해 주셔서 감사합니다.',
    panda: '손을 흔들며 작별 인사하는 픽셀 판다',
    heading: 'Stylebot을 사용해 주셔서 감사합니다.',
    lede: '이 브라우저에서 스타일이 삭제되었습니다. 동기화를 켰다면 Google Drive에 백업이 남아 있습니다.',
    changedMind: '마음이 바뀌셨나요?',
    note: '2011년부터 Stylebot을 만들어 왔습니다. 사용해 주셔서, 그리고 남겨 주시는 의견에 감사드립니다.',
    signature: '— Ankit',
    feedback: {
      question: '삭제한 이유가 무엇인가요?',
      optional: '선택 사항이며, 금방 끝납니다.',
      reasons: [
        '더 이상 필요하지 않음',
        '사용하기 어려움',
        '사이트가 제대로 표시되지 않음',
        '필요한 기능이 없음',
        '너무 느림',
        '기타',
      ],
      placeholder: '더 하실 말씀이 있나요? (선택 사항)',
      send: '의견 보내기',
      sendNote: '개발자에게 바로 전달됩니다.',
      thanks: '감사합니다. 보내 주신 의견은 모두 읽습니다.',
    },
  },
  manual: {
    title: '설명서',
    description:
      'Stylebot 사용법: 사이트 스타일 지정, 프로필, 명령줄, 채팅, 동기화, URL 규칙, 단축키.',
    lede: '첫 스타일부터 프로필, 채팅, 동기화까지 Stylebot 사용법을 알아보세요.',
    sections: '설명서 목차',
    toc: {
      start: '시작하기',
      profiles: '프로필',
      cli: '명령줄',
      chat: '채팅',
      presets: '가독성 모드와 회색조 모드',
      sync: '동기화, 백업, 기록',
      urls: 'URL 규칙',
      shortcuts: '키보드 단축키',
      help: '도움말 및 지원',
    },
    start: {
      open: '툴바에서 Stylebot 아이콘을 클릭한 다음 <strong>이 페이지 스타일 지정</strong>을 클릭하세요. 또는 아무 탭에서나 [[alt+shift+M]]을 누르거나, 요소를 마우스 오른쪽 버튼으로 클릭하고 <strong>Stylebot → 요소 스타일 지정</strong>을 선택하세요.',
      shot: 'Wikipedia 문서에서 링크를 선택하는 기본 탭',
      pick: '선택기를 클릭하고 페이지 위로 마우스를 가져간 뒤 요소를 클릭하세요. 클릭하기 전에 [[↑]] 키를 누르면 상위 요소가 대신 선택됩니다. 그런 다음 <strong>기본</strong> 탭에서 바꾸거나 <strong>코드</strong> 탭에서 CSS를 작성하세요. 변경 사항은 바로 저장되고, 사이트를 방문할 때마다 적용됩니다.',
      fonts: '글꼴',
      fontsBody:
        '<a href="https://fonts.google.com/">Google Fonts</a> 400개 중에서 검색하면 고른 글꼴을 Stylebot이 불러옵니다. 컴퓨터에 설치된 글꼴 이름을 직접 입력할 수도 있습니다.',
      position: '편집기 위치',
      positionBody:
        'Chrome과 Edge에서는 편집기가 측면 패널에 열립니다. <strong>⋯</strong> 메뉴의 <strong>위치</strong>에서 별도 창으로 열거나 페이지 안에 고정할 수 있습니다. Firefox에는 측면 패널이 없습니다.',
      off: '스타일 끄기',
      offBody:
        '팝업의 스위치를 사용하거나 [[alt+shift+S]]를 누르세요. 스타일은 삭제되지 않고 적용만 되지 않습니다.',
      callout:
        '일부 사이트는 사이트가 업데이트될 때마다 바뀌는 자동 생성 클래스 이름을 사용합니다. 스타일이 더 이상 작동하지 않으면 요소를 다시 선택해 새 선택자를 받으세요.',
    },
    profiles: {
      intro:
        '프로필은 같은 사이트에 대한 별도의 스타일시트로, 여러 디자인을 저장해 두고 전환할 수 있습니다. 한 번에 하나만 적용되며, 모든 사이트는 기본 프로필로 시작합니다.',
      shot: 'Violet Hour, Everforest, Hearth, Newspaper 네 프로필이 있는 Hacker News의 팝업',
      manage:
        '편집기 헤더에서 사이트 옆의 프로필 이름을 클릭해 프로필을 만들거나, 이름을 바꾸거나, 복제하거나, 삭제하세요. 프로필 전환은 여기서 하거나 팝업에서 할 수 있으며, 팝업에서 <strong>스타일 없음</strong>을 선택하면 사이트의 스타일이 꺼집니다. 새 프로필은 빈 상태로 시작합니다.',
    },
    cli: {
      intro:
        '<code>stylebot</code> 명령을 사용하면 Claude Code, Codex, Cursor 같은 코딩 에이전트가 API 키 대신 사용 중인 구독으로 브라우저에서 바로 사이트 스타일을 바꿀 수 있습니다. 에이전트에게 사이트 스타일을 맡기는 가장 좋은 방법이며, 명령을 직접 실행할 수도 있습니다.',
      setup: '설정',
      setupBody:
        'CLI를 설치하고 브라우저에 연결한 다음, 옵션에서 <strong>이 컴퓨터의 앱이 Stylebot을 제어하도록 허용</strong>을 켜세요. 각 단계는 <a href="{cli}">명령줄 페이지</a>에서 안내합니다. 현재는 Chrome과 Edge만 지원합니다.',
      claudeCodeBody:
        'Stylebot 플러그인을 추가하고 <code>/stylebot</code>으로 사이트에 다크 테마를 적용하는 등의 변경을 요청하세요.',
      privacy: '개인정보 보호',
      privacyBody:
        '명령줄 액세스는 직접 켜기 전까지 꺼져 있습니다. Stylebot과 CLI는 이 컴퓨터 안에서 서로만 통신하며, 에이전트는 읽은 내용을 자신의 제공업체로 보냅니다.',
    },
    chat: {
      intro:
        '채팅은 간단한 수정에 알맞습니다. 채팅 탭에서 원하는 변경을 설명하면 Stylebot이 CSS를 작성합니다. 요소를 선택해 대상을 가리키거나, 스크린샷을 첨부해 원하는 모습을 보여 줄 수도 있습니다. 완전히 새로운 테마처럼 큰 변경에는 <a href="#cli">명령줄</a>을 사용하세요.',
      shot: 'Hacker News에서 읽기 쉬운 세리프 글꼴의 숲 테마를 요청한 뒤의 채팅 탭',
      key: '내 API 키 사용',
      keyBody:
        'Claude, OpenAI, Gemini API 키를 연결하세요. 키는 이 컴퓨터에만 저장되며 동기화되지 않습니다. 메시지는 브라우저에서 제공업체로 바로 전송됩니다.',
      changes: '변경 사항이 저장되는 곳',
      changesBody:
        '각 변경은 바로 적용되고 현재 프로필의 스타일시트에 추가됩니다. <strong>N줄 추가됨</strong>을 클릭하면 코드 탭에서 볼 수 있고, 채팅에서 실행 취소할 수도 있습니다.',
      cost: '비용',
      costBody:
        '메시지 입력란 아래의 토큰 수는 대화에 사용된 양과 예상 비용을 보여 줍니다.',
    },
    presets: {
      intro:
        '두 기능 모두 프리셋 탭에 있으며, 직접 만든 변경 사항과 함께 적용됩니다. <strong>가독성 모드</strong>는 사이트의 기사를 깔끔한 읽기 화면으로 바꾸고 테마, 글꼴, 크기, 너비를 고를 수 있게 하며, 기사가 아닌 페이지는 그대로 둡니다. <strong>회색조 모드</strong>는 사이트에서 색을 빼며, 강도는 원하는 대로 조절할 수 있습니다.',
      shot: '읽기 설정을 연 채 가독성 모드로 본 Wikipedia의 수학 문서',
    },
    sync: {
      shot: '옵션에서 Google Drive에 연결되어 동기화된 모습',
      drive: 'Google Drive 동기화',
      driveBody:
        '옵션에서 Google Drive를 연결하세요. 프로필을 포함한 스타일이 30분마다, 그리고 편집 직후에 동기화됩니다. Stylebot은 Drive에서 자신이 만든 파일만 볼 수 있으며, Stylebot 서버는 없습니다.',
      conflicts: '충돌',
      conflictsBody:
        '두 컴퓨터에서 같은 스타일을 바꾼 경우 더 최근 편집이 유지되고 다른 버전은 주석으로 저장되므로, 잃어버리는 내용이 없습니다.',
      backup: '백업',
      backupBody:
        '옵션에서 모든 스타일을 JSON으로 내보내고 가져올 수 있습니다.',
      history: '버전 기록',
      historyBody:
        '동기화로 들어온 변경을 포함해 이 컴퓨터의 모든 변경 사항이 옵션에 보관됩니다. 일부 사이트 또는 전체 사이트를 이전 버전으로 복원할 수 있습니다.',
      historyShot: '옵션의 버전 기록, 최신 변경이 맨 위',
    },
    urls: {
      intro:
        '기본적으로 Stylebot은 도메인 이름으로 스타일과 웹사이트를 연결합니다. 더 구체적으로 지정하려면 옵션에서 스타일의 URL을 편집하고 다음 패턴을 사용하세요.',
      wildcards: {
        anything: '모든 문자열과 일치합니다.',
        segment: '/가 나올 때까지의 모든 문자열과 일치합니다.',
        list: '패턴 목록을 구분합니다. 패턴 중 하나라도 일치하면 URL이 일치합니다.',
        regex: 'URL 맨 앞에 쓰면 URL을 정규 표현식으로 바꿉니다.',
      },
      examplesTitle: '예시',
      examples: {
        domain: 'docs.google.com 도메인 또는 그 하위 도메인.',
        prefix: 'docs로 시작하는 모든 URL.',
        numbered: 'docs.google.com, docs1.google.com, docs2.google.com 등.',
        subdomains: 'news.ycombinator.com과 apps.ycombinator.com.',
        either: '두 도메인 중 하나 또는 그 하위 도메인.',
        regex: 'Reddit 홈페이지만.',
        everywhere: '모든 사이트. 어디에나 적용할 스타일에 유용합니다.',
      },
    },
    shortcuts: {
      intro:
        '전역 단축키는 Stylebot이 스타일을 적용할 수 있는 모든 페이지에서 작동하며, 옵션에 링크된 브라우저의 단축키 설정에서 바꿀 수 있습니다. 편집기 자체의 단축키는 편집기에서 [[?]] 키를 누르면 볼 수 있습니다.',
      or: '또는',
      unset: '설정 안 됨. 브라우저에서 지정하세요',
      global: '전역',
      picker: '요소를 선택하는 동안',
      actions: {
        toggleEditor: '편집기 열기/닫기',
        toggleStyling: '스타일 켜기/끄기',
        toggleReadability: '가독성 모드 켜기/끄기',
        toggleGrayscale: '회색조 모드 켜기/끄기',
        parent: '상위 요소 선택',
        child: '하위 요소로 돌아가기',
        select: '강조 표시된 요소 선택',
      },
    },
    help: {
      body: '버그를 발견했거나 아이디어가 있으신가요? <a href="{issues}">GitHub</a>에 이슈를 등록하세요. Stylebot은 2011년부터 관리되고 있는 무료 오픈 소스입니다. 유용하게 쓰고 계신다면 <a href="{donate}">커피 한 잔</a>으로 후원할 수 있습니다.',
    },
  },
  privacy: {
    title: '개인정보 처리방침',
    description:
      'Stylebot이 데이터를 다루는 방식: 서버도, 계정도, 분석 도구도 없습니다.',
    lede: 'Stylebot에는 서버도, 계정도, 분석 도구도 없습니다. 동기화, 채팅, 명령줄을 켜지 않는 한 스타일은 브라우저에만 머무르며, 켜면 직접 선택한 서비스나 허용한 앱으로 바로 전달됩니다.',
    updated: '최종 업데이트: {date}',
    browser: {
      title: '브라우저에 저장되는 정보',
      body: [
        '스타일, 프로필, 설정, 기록, 채팅 대화, API 키는 브라우저 확장 프로그램 저장소에 저장되며, Stylebot을 삭제하면 함께 삭제됩니다. Stylebot은 스타일을 적용하기 위해 방문하는 페이지를 읽지만, 채팅이나 명령줄을 사용하지 않는 한 페이지 내용을 어디로도 보내지 않습니다.',
      ],
    },
    sync: {
      title: 'Google Drive 동기화',
      body: [
        '옵션에서 Google Drive를 연결하면 스타일이 본인의 Drive에 있는 파일에 저장됩니다. Stylebot은 자신이 만든 파일만 볼 수 있습니다. 액세스 토큰은 브라우저에 보관되며 1시간 후 만료됩니다. 연결은 옵션이나 <a href="https://myaccount.google.com/connections">Google 계정</a>에서 해제할 수 있습니다.',
        'Google API에서 받은 정보에 대한 Stylebot의 사용은 제한적 사용 요구사항을 포함한 <a href="https://developers.google.com/terms/api-services-user-data-policy">Google API 서비스 사용자 데이터 정책</a>을 준수합니다.',
      ],
    },
    chat: {
      title: '채팅',
      body: [
        'API 키를 추가하고 메시지를 보내면 브라우저가 메시지와 함께 첨부한 스크린샷, 페이지의 주소와 제목, 페이지에 보이는 내용의 개요, 페이지의 CSS와 스타일을 해당 제공업체에 직접 전송합니다. 여기에는 페이지에 표시된 개인정보가 포함될 수 있으므로, 제공업체와 공유하고 싶지 않은 페이지에서는 채팅을 사용하지 마세요. 각 제공업체의 정책이 적용됩니다: <a href="https://www.anthropic.com/legal/privacy">Anthropic</a>, <a href="https://openai.com/policies/privacy-policy/">OpenAI</a>, <a href="https://ai.google.dev/gemini-api/terms">Google</a>.',
      ],
    },
    cli: {
      title: '명령줄',
      body: [
        '옵션에서 <q>이 컴퓨터의 앱이 Stylebot을 제어하도록 허용</q>을 켜면, 사용자 권한으로 실행되는 앱이 본인만 사용할 수 있는 로컬 연결을 통해 탭 목록을 보고, 페이지를 읽고, 스크린샷을 찍고, 스타일을 읽고 변경할 수 있습니다. 앱이 읽은 내용은 코딩 에이전트의 모델처럼 앱이 사용하는 서비스로 전달될 수 있습니다. 연결을 끊으려면 이 설정을 끄세요.',
      ],
    },
    fonts: {
      title: '글꼴과 가져온 CSS',
      body: [
        '스타일에 쓰인 Google Fonts 글꼴은 Google에서 다운로드되며, 이때 Google에 IP 주소가 전달됩니다. <code>@import</code>로 가져온 스타일시트는 해당 주소에서 불러옵니다.',
      ],
    },
    site: {
      title: '이 웹사이트',
      body: [
        'stylebot.dev에는 광고나 쿠키가 없으며, 표준 서버 로그를 보관하는 GitHub Pages에서 호스팅됩니다. Plausible이 쿠키나 사용자를 식별할 수 있는 정보 없이 페이지, 유입 경로, 국가, 기기 유형별로 방문 수를 집계합니다.',
      ],
    },
    sharing: {
      title: '데이터 공유',
      body: [
        'Stylebot은 데이터를 수집, 판매, 공유하지 않습니다. 데이터는 위 서비스를 사용할 때만 해당 서비스로 전송됩니다.',
      ],
    },
    contact: {
      title: '변경 및 문의',
      body: [
        '이 방침의 변경 사항은 <a href="{history}">GitHub의 사이트 기록</a>에서 확인할 수 있습니다. 문의는 <a href="mailto:{email}">{email}</a> 또는 <a href="{issues}">GitHub 이슈</a>로 보내 주세요.',
      ],
    },
    translation:
      '이 문서는 번역본입니다. <a href="{original}">영어 원문</a>과 내용이 다를 경우 영어 원문이 우선합니다.',
  },
  releases: {
    title: '{version}의 새로운 기능',
    bugFixes: '그리고 많은 <a href="{changelog}">버그 수정</a>',
    sections: '섹션',
    r31: {
      description:
        'Stylebot 3.1은 Google Drive 동기화 및 백업, 크기를 조절할 수 있는 편집기, 색상 팔레트를 제공합니다.',
      syncTitle: 'Google Drive로 동기화 및 백업',
      syncAlt: 'Google Drive와 스타일 동기화',
      syncBody: [
        'Stylebot <strong>옵션 페이지</strong>에서 Google Drive 동기화를 켜고 승인하세요.',
        '동기화를 켠 후 팝업이나 옵션 페이지에서 <strong>지금 동기화</strong>를 클릭하면 브라우저의 스타일이 Google Drive에 백업된 스타일과 동기화됩니다.',
      ],
      resizeTitle: 'Stylebot 편집기 크기 조절',
      resizeAlt: 'Stylebot 편집기 크기를 조절하는 모습',
      resizeBody:
        '이제 Stylebot 편집기의 크기를 조절할 수 있습니다. 원하면 페이지를 줄여 콘텐츠가 편집기에 가려지지 않게 할 수도 있습니다.',
      colorsTitle: '색상 팔레트',
      colorsAlt: '팔레트에서 색상을 고르는 모습',
      colorsBody:
        '팔레트를 갖춘 개선된 색상 선택기로 좋은 색을 더 쉽게 고를 수 있습니다.',
    },
    r32: {
      description:
        'Stylebot 3.2는 깜빡임 없는 더 빠른 스타일 적용, 새롭게 디자인한 가독성 모드, 더 깔끔해진 팝업을 제공합니다.',
      lede: 'Stylebot이 다시 활발하게 개발되고 있으며, 앞으로 더 많은 업데이트가 예정되어 있습니다.',
      fasterTitle: '깜빡임 없는 더 빠른 스타일 적용',
      fasterBody:
        '이제 CSS가 캐시되어 즉시 적용되므로, 스타일이 적용되기 전에 페이지가 스타일 없이 잠깐 보이는 일이 없고 전체적으로 더 빠르게 느껴집니다.',
      readabilityTitle: '새롭게 디자인한 가독성 모드',
      readabilityAlt: '가독성 모드의 새로운 인라인 테마 및 타이포그래피 설정',
      readabilityItems: [
        '페이지를 더 잘 정리하는 새로운 기사 추출 알고리즘',
        '나머지 페이지가 로드되기 전에 적용되는 더 빠른 활성화',
        '테마와 타이포그래피를 바로 조정하는 인라인 설정',
        '더 부드러운 로딩 애니메이션',
        '켜고 끄는 키보드 단축키',
      ],
      popupTitle: '더 깔끔해진 팝업',
      popupAlt: '새롭게 디자인한 Stylebot 팝업',
      popupItems: [
        '행 전체를 클릭할 수 있는 토글',
        '설정으로 바로 가는 버튼',
        '다크 모드 지원',
      ],
    },
    r40: {
      description:
        'Stylebot 4.0은 새롭게 디자인한 편집기, 코딩 에이전트를 위한 명령줄, 프로필, 측면 패널, 채팅, 버전 기록, 동기화를 제공합니다.',
      lede: '새롭게 디자인한 편집기, 코딩 에이전트를 위한 명령줄, 프로필, 측면 패널.',
      toc: {
        editor: '새 편집기',
        cli: '명령줄',
        profiles: '프로필',
        panel: '측면 패널',
        history: '버전 기록',
        sync: '동기화',
        chat: '채팅',
        more: '그 밖의 기능',
      },
      editorTitle: '새롭게 디자인한 편집기',
      editorAlt:
        'Newspaper 프로필로 Hacker News에 스타일을 지정하는, 새롭게 디자인한 기본 탭',
      editorBody: '처음부터 다시 만들었고, 이제 다크 모드도 지원합니다.',
      editorItems: [
        '페이지의 현재 값을 보여 주는 그룹별 컨트롤',
        '사이트가 업데이트되어도 계속 작동하고 다른 후보도 고를 수 있는, 개선된 선택자 생성',
        '다른 규칙이 값을 덮어쓰면 표시',
        '색상 팔레트와 스포이트',
        '색상이나 글꼴에 마우스를 올려 페이지에서 미리 보기',
        '추가 속성에서 다른 CSS 속성도 바로 편집',
        '실행 취소 지원',
      ],
      profilesTitle: '프로필',
      profilesAlt: 'Dracula와 Gruvbox, 두 프로필이 있는 사이트의 팝업',
      profilesBody:
        '한 사이트에 여러 디자인을 저장하고 편집기나 팝업에서 전환하세요.',
      panelTitle: '측면 패널 또는 별도 창',
      panelAlt: '위치가 측면 패널로 설정된 편집기 메뉴',
      panelBody:
        'Chrome과 Edge에서는 편집기가 측면 패널에 열립니다. 편집기의 <strong>⋯</strong> 메뉴에 있는 <strong>위치</strong>에서 별도 창으로 띄울 수도 있습니다.',
      historyTitle: '버전 기록',
      historyBody:
        '모든 변경 사항이 보관되며, 이전 버전으로 언제든 복원할 수 있습니다.',
      syncTitle: '동기화',
      syncBody:
        'Google Drive 동기화가 더 안정적입니다. 여러 컴퓨터의 변경 사항을 병합하므로 잃어버리는 내용이 없습니다. 30분마다, 그리고 편집 직후에 자동으로 실행됩니다.',
      chatTitle: '채팅',
      chatBody:
        '코딩 에이전트가 없으신가요? 원하는 것을 설명하거나 제안된 스타일을 고르면 Stylebot이 CSS를 작성합니다. Claude, OpenAI, Gemini 키를 직접 연결해 사용하세요.',
      chatAlt:
        '페이지에 어울리는 스타일을 제안하는 채팅 탭: 아늑하게, 차분하게, 링크만 컬러로',
      moreTitle: '그 밖의 기능',
      moreItems: [
        '새로워진 stylebot.dev',
        '새로운 Stylebot 아이콘',
        '이제 shadow DOM 안에도 스타일이 적용되어, 웹 컴포넌트로 만든 사이트에서도 작동',
        '이제 Stylebot 단축키는 브라우저의 단축키 설정에서 관리합니다. Chrome과 Edge에서는 변경했던 단축키가 기본값으로 돌아가므로, 그곳에서 다시 설정하세요.',
        'Stylebot 베트남어 지원',
      ],
    },
  },
  notFound: {
    title: '페이지를 찾을 수 없음',
    description: '존재하지 않는 페이지입니다.',
    heading: '존재하지 않는 페이지인데, 보기에도 끔찍합니다.',
    done: '훨씬 낫습니다. 페이지는 여전히 없지만, 적어도 이제 보기는 좋습니다.',
    pageTitle: '404 Not Found',
    pageBody: '요청한 URL을 이 서버에서 찾을 수 없습니다.',
    pageLink: '홈페이지로 이동',
    nice: '✨ 알아서 예쁘게',
  },
};

export default site;
