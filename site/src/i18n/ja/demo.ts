import type { DemoMessages } from '..';

const demo: DemoMessages = {
  scenes: {
    pin: {
      title: 'ツールバーに固定',
      body: 'Stylebot をワンクリックで開けるようにします。',
      captions: {
        menu: 'Stylebot は最初、拡張機能メニューの中にあります。',
        pinned: '固定しました。Stylebot がツールバーに表示されます。',
      },
    },
    open: {
      title: 'エディタを開く',
      keysBody: 'アイコンをクリックするか、{keys} を押します。',
      captions: {
        iconThenStyle:
          'Stylebot アイコンをクリックし、「このページをカスタマイズ」を選びます。',
        orKeys: '{keys} を押して直接開くこともできます。',
      },
    },
    pick: {
      title: '要素を選択',
      fieldsBody: 'クリックで選択すると、現在のスタイルが表示されます。',
      captions: {
        hoverToSee:
          'マウスを合わせると、スタイルを変えられる要素がわかります。',
        select: 'クリックで選択すると、セレクタが自動で入力されます。',
        computed: '各フィールドには、要素の現在の計算値が表示されます。',
      },
    },
    style: {
      title: 'スタイルを変える',
      body: 'ベーシックの設定を使うか、CSS を書きます。',
      captions: {
        size: 'サイズを設定して…',
        color: '…色も変えます。',
        plainCss: 'どの変更も普通の CSS として、このサイト用に保存されます。',
        byHand: 'CSS を手で書くこともできます。',
        live: '入力するそばからページが更新されます。',
      },
    },
    profiles: {
      title: 'プロファイル',
      looksBody: '同じサイトに別々のデザインを保存できます。',
      captions: {
        createForLook: '新しいデザイン用にプロファイルを作成します。',
        created:
          '{profile} は空の状態から始まります。{defaultProfile} もそのまま保存されています。',
        newspaperLook: '新聞のようなデザインにします。',
        darkLook: '暖かみのあるダークなデザインにします。',
        switchAnytime: 'いつでも切り替えられます。',
        backToDefault:
          '{defaultProfile} に戻します。1 つのサイトに 2 つのデザイン。',
      },
    },
  },
  browser: {
    extensions: '拡張機能',
    fullAccess: 'フルアクセス',
    fullAccessNote:
      'これらの拡張機能は、このサイト上の情報を表示、変更できます。',
    otherExtensions: {
      adBlocker: '広告ブロッカー',
      passwordManager: 'パスワードマネージャー',
      translate: '翻訳',
      webArchive: 'ウェブアーカイブ',
    },
  },
  popup: {
    readability: 'リーダーモード',
    styleThisPage: 'このページをカスタマイズ',
  },
  editor: {
    defaultProfile: 'デフォルト',
    newProfile: '新聞',
    newProfileDark: '夜ふかし',
    createProfile: 'プロファイルを作成',
    pickAnElement: '要素を選択',
    tabs: {
      basic: 'ベーシック',
      code: 'コード',
      presets: 'プリセット',
      chat: 'チャット',
    },
    basic: {
      hide: '非表示',
      reset: 'リセット',
      text: 'テキスト',
      font: 'フォント',
      defaultFont: 'デフォルト',
      size: 'サイズ',
      lineHeight: '行の高さ',
      color: '色',
      decoration: '装飾',
      none: 'なし',
      alignment: '配置',
      background: '背景',
      box: 'ボックス',
      effects: 'エフェクト',
      moreProperties: 'その他のプロパティ',
    },
    code: {
      noStyles: 'スタイルはまだありません',
    },
    presets: {
      readability: 'リーダーモード',
      articlesOnly: '記事のみ',
      readabilityDescription:
        'このサイトの記事を、すっきりとした読みやすい表示に切り替えます。テーマ、フォント、サイズは自由に選べます。',
      grayscale: 'グレースケール',
      grayscaleDescription: 'ページをグレースケールで表示します。',
    },
  },
  article: {
    nav: {
      news: 'ニュース',
      travel: '旅',
      signIn: 'ログイン',
    },
    kicker: '旅 · 特集',
    headline: '夜行フェリー、静かな復活',
    dek: '3 つの運航会社が、旅行者はスピードよりも客室と海の眺め、そして空港のない旅を選ぶと見込んでいます。',
    byline: 'Marta Linde · 9月24日 · 6分で読めます',
    paragraphs: [
      '最後の夜行便が廃止されてから 20 年。3 つの運航会社が、再び海に客室を浮かべようとしています。うたい文句はシンプルです。夕食後に乗船し、眠っているうちに海を渡り、目覚めれば別の国。',
      '最初に復活した航路は、1 週間で夏の予約が埋まりました。乗客の多くは 40 歳未満で、夜行の乗り物は初めてという人も少なくありません。運航会社によると、まず客室が埋まり、次にリクライニングシート、最後にデッキだといいます。',
    ],
    quote:
      '「時間を節約したくて予約する人はいません。少しだけ時間を手放したくて予約するんです」',
    quoteBy: '— Ines Varga（航路プランナー）',
  },
  steps: {
    heading: '使い方',
    counter: '{current} / {total}',
    jump: 'この場面に移動',
  },
};

export default demo;
