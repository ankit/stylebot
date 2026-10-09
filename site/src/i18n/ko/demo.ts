import type { DemoMessages } from '..';

const demo: DemoMessages = {
  scenes: {
    pin: {
      title: '툴바에 고정',
      body: '클릭 한 번이면 Stylebot을 열 수 있습니다.',
      captions: {
        menu: 'Stylebot은 처음에 확장 프로그램 메뉴에 있습니다.',
        pinned: '고정했습니다. 이제 Stylebot이 툴바에 있습니다.',
      },
    },
    open: {
      title: '편집기 열기',
      keysBody: '아이콘을 클릭하거나 {keys}을 누르세요.',
      captions: {
        iconThenStyle:
          'Stylebot 아이콘을 클릭한 다음 이 페이지 스타일 지정을 클릭하세요.',
        orKeys: '또는 {keys}을 눌러 바로 여세요.',
      },
    },
    pick: {
      title: '요소 선택',
      fieldsBody: '클릭해 선택하세요. 각 필드에 현재 스타일이 표시됩니다.',
      captions: {
        hoverToSee: '마우스를 올리면 스타일을 바꿀 수 있는 요소가 보입니다.',
        select: '클릭해 선택하세요. 선택자는 자동으로 입력됩니다.',
        computed: '각 필드에는 요소의 현재 계산된 값이 표시됩니다.',
      },
    },
    style: {
      title: '스타일 지정',
      body: '기본 탭의 컨트롤을 쓰거나 CSS를 작성하세요.',
      captions: {
        size: '크기를 정하고…',
        color: '…색상도 정하세요.',
        plainCss: '모든 변경은 일반 CSS로 이 사이트에 저장됩니다.',
        byHand: 'CSS를 직접 작성할 수도 있습니다.',
        live: '입력하는 대로 페이지가 바뀝니다.',
      },
    },
    profiles: {
      title: '프로필',
      looksBody: '같은 사이트에 여러 디자인을 저장하세요.',
      captions: {
        createForLook: '새 디자인을 시도하려면 프로필을 만드세요.',
        created:
          '{profile} 프로필은 빈 상태로 시작합니다. {defaultProfile} 프로필은 그대로 저장되어 있습니다.',
        newspaperLook: '신문처럼 꾸며 보세요.',
        darkLook: '따뜻한 다크 테마로 꾸며 보세요.',
        switchAnytime: '두 프로필은 언제든 전환할 수 있습니다.',
        backToDefault:
          '{defaultProfile} 프로필로 돌아왔습니다. 한 사이트, 두 가지 디자인.',
      },
    },
  },
  browser: {
    extensions: '확장 프로그램',
    fullAccess: '전체 액세스',
    fullAccessNote:
      '이 확장 프로그램은 이 사이트의 정보를 확인하고 변경할 수 있습니다.',
    otherExtensions: {
      adBlocker: '광고 차단기',
      passwordManager: '비밀번호 관리자',
      translate: '번역',
      webArchive: '웹 아카이브',
    },
  },
  popup: {
    readability: '가독성 모드',
    styleThisPage: '이 페이지 스타일 지정',
  },
  editor: {
    defaultProfile: '기본',
    newProfile: '신문',
    newProfileDark: '올빼미',
    createProfile: '프로필 만들기',
    pickAnElement: '요소 선택',
    tabs: {
      basic: '기본',
      code: '코드',
      presets: '프리셋',
      chat: '채팅',
    },
    basic: {
      hide: '숨기기',
      reset: '재설정',
      text: '텍스트 설정',
      font: '글꼴',
      defaultFont: '기본값',
      size: '글꼴 크기',
      lineHeight: '행 높이',
      color: '색상',
      decoration: '글자 꾸미기',
      none: '없음',
      alignment: '텍스트 정렬',
      background: '배경',
      box: '박스',
      effects: '효과',
      moreProperties: '추가 속성',
    },
    code: {
      noStyles: '아직 스타일 없음',
    },
    presets: {
      readability: '가독성 모드',
      articlesOnly: '기사만 해당',
      readabilityDescription:
        '이 사이트의 기사를 방해 요소 없는 깔끔한 읽기 화면으로 바꿉니다. 테마, 글꼴, 크기는 원하는 대로 고를 수 있습니다.',
      grayscale: '회색조 모드',
      grayscaleDescription: '페이지에 회색조 스타일을 적용합니다.',
    },
  },
  article: {
    nav: {
      news: '뉴스',
      travel: '여행',
      signIn: '로그인',
    },
    kicker: '여행 · 기획',
    headline: '조용히 돌아온 야간 페리',
    dek: '여행객이 속도 대신 선실과 바다 전망, 공항 없는 여정을 택하리라는 데 세 선사가 승부를 걸었다.',
    byline: 'Marta Linde · 9월 24일 · 6분 읽기',
    paragraphs: [
      '마지막 야간 항로가 끊긴 지 20년, 세 선사가 다시 선실을 바다에 띄우고 있다. 제안은 단순하다. 저녁을 먹고 배에 올라, 자는 동안 바다를 건너고, 눈을 뜨면 다른 나라에 와 있는 것이다.',
      '처음 재개된 노선은 일주일 만에 여름 예약이 모두 찼다. 승객 대부분은 마흔 살 미만이고, 야간 열차나 배를 한 번도 타 본 적 없는 이도 많다. 선사들에 따르면 선실이 가장 먼저 차고, 그다음은 리클라이닝 좌석, 마지막이 갑판이다.',
    ],
    quote:
      '“시간을 아끼려고 이걸 예약하는 사람은 없어요. 시간을 조금 잃으려고 예약하죠.”',
    quoteBy: '— Ines Varga, 항로 기획자',
  },
  steps: {
    heading: '사용 방법',
    counter: '{current} / {total}',
    jump: '이 지점으로 이동',
  },
};

export default demo;
