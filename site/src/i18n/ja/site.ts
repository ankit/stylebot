import type { SiteMessages } from '..';

const site: SiteMessages = {
  meta: {
    title: 'Stylebot - どんなサイトも自分好みに',
    titleSuffix: '{title} - Stylebot',
    description:
      'ページ上の要素を指して変更するか、望む見た目を言葉で伝えるだけ。CSS は Stylebot が書きます。Chrome、Firefox、Edge 向けの無料のオープンソース拡張機能です。',
  },
  header: {
    home: 'Stylebot ホーム',
    manual: 'マニュアル',
    install: 'インストール',
    language: '言語',
    suggest: 'このページを日本語で表示',
    dismiss: '閉じる',
    theme: 'テーマ：{theme}',
  },
  themes: {
    light: 'ライト',
    dark: 'ダーク',
    stylebot: 'Stylebot',
    newsprint: '新聞紙',
  },
  footer: {
    changelog: '更新履歴',
    donate: 'コーヒーをおごる',
  },
  store: {
    add: '{store} に追加',
    addFree: '{store} に追加（無料）',
    reinstall: '{store} に再インストール',
  },
  zoom: {
    label: '拡大したスクリーンショット',
    close: '閉じる',
  },
  home: {
    title: 'どんなサイトも、{word}に。',
    titleWord: '自分好み',
    titleWordHint: 'クリックで着せ替え',
    lede: 'ページ上の要素を指して変更するか、望む見た目を言葉で伝えるだけ。CSS は Stylebot が書き、サイトを開くたびにスタイルを読み込みます。',
    also: '{first} と {second} にも対応',
    installTitle: 'Stylebot をインストール',
    installBody:
      '2011 年から無料のオープンソースです。アカウント登録もトラッキングもありません。スタイルはブラウザに保存され、コードは GitHub で公開しています。',
    cli: 'コーディングエージェントを使うなら、<a href="#cli">CLI</a> を追加：',
  },
  cli: {
    copy: 'コピー',
    copied: 'コピーしました',
    copyCommand: '{command} をコピー',
    title: 'コーディングエージェントと連携',
    body: 'Claude Code、Codex、Cursor など、コマンドを実行できるエージェントなら、ターミナルから Stylebot を使えます。',
    guide: 'CLI を設定 →',
    demo: {
      terminal: 'ターミナル · コーディングエージェント',
      prompt: '{site} を夜でも読みやすくして',
      done: '背景を暗く、文字を暖色に、本文を大きめのセリフ体にしました。広告は削除しました。',
      before: '変更前',
      after: '変更後',
      kicker: '旅',
      headline: '夜行フェリー、静かな復活',
      dek: '3 つの運航会社が、旅行者はスピードよりも客室と海の眺め、そして空港のない旅を選ぶと見込んでいます。',
      text: 'ロストック発 22:40 の便は、ひっそりと出港します。港の明かりが遠ざかるころには、ほとんどの乗客が客室に落ち着き、バーには低いざわめきだけが残ります。',
      ad: '広告',
    },
    page: {
      title: 'コマンドライン',
      description:
        'ターミナルから Stylebot を操作したり、Claude Code、Codex、Cursor などのコーディングエージェントに、ご自身のサブスクリプションでブラウザ上のサイトのスタイルを変更させたりできます。',
      heading: 'ターミナルから Stylebot を',
      lede: 'コマンドラインから Stylebot を操作するか、Claude Code、Codex、Cursor などのコーディングエージェントに任せられます。エージェントはブラウザ上でそのままサイトのスタイルを変更し、API キーではなくご自身のサブスクリプションを使います。',
      setup: '設定方法',
      install: 'Stylebot をインストール',
      installBody:
        'Chrome または Edge 向けです。Firefox ではまだコマンドラインを使えません。',
      cli: 'CLI をインストール',
      cliBody: 'Node 20 以降が必要です。',
      connect: 'ブラウザに接続',
      connectBody:
        'CLI を Chrome と Edge に登録し、Stylebot から接続できるようにします。',
      access: 'コマンドラインからのアクセスをオン',
      accessBody:
        'Stylebot のオプションの「基本設定」で<strong>このパソコンのアプリに Stylebot の操作を許可</strong>をオンにし、ブラウザの確認を許可します。',
      plugin: 'Claude Code プラグインを追加',
      optional: '任意',
      pluginBody: 'Claude Code で次を実行します：',
      tryIt: '試してみましょう：',
      commands: 'コマンド',
      commandsBody:
        'これらのコマンドは通常エージェントが実行しますが、自分で実行することもできます。<code>stylebot --help</code> ですべてのコマンドを確認できます。',
      examples: {
        open: 'ページを背面のウィンドウで開き、そのタブ ID を出力します。',
        outline: 'ページ上に表示されている要素をアウトラインとして出力します。',
        css: 'CSS をサイトのスタイルとして保存して適用し、ページを確認します。',
        screenshot: 'タブの画像を保存します。',
      },
      privacy: 'プライバシー',
      privacyBody: [
        'コマンドラインからのアクセスは、オンにするまでオフです。オンの間は、このパソコンのアプリが開いているページの読み取り、スクリーンショットの撮影、スタイルの変更を行えます。Stylebot のオプションでいつでもオフにできます。',
        'Stylebot と CLI はこのパソコン上で互いにやり取りするだけで、外部には何も送信しません。エージェントは読み取った内容を自身のプロバイダーに送信します（Claude Code なら Anthropic）。',
      ],
    },
  },
  gallery: {
    title: 'スタイルのお手本',
    lede: 'コピーして好みに合わせて調整するか、ゼロから作ってみましょう。',
    hint: '{site} のコードタブに貼り付けてください。',
    enlarge: '{site} を拡大：{name}',
    alt: 'Stylebot でデザインを変えた {site}：{name}',
    install: 'インストール',
    installTitle: 'Stylebot にインストール',
    installed: 'インストール済み',
    installedAs: '{name} としてインストール済み',
    installFailed: 'インストールに失敗',
    copy: 'CSS をコピー',
    copied: 'コピーしました',
    source: 'GitHub で見る',
    lightbox: 'デザインを変えたサイト',
    close: '閉じる',
  },
  quotes: {
    title: 'ユーザーの声',
  },
  features: {
    title: 'ほかにもこんな機能があります。',
    previous: '前の機能',
    next: '次の機能',
    sync: {
      title: '同期',
      body: 'Google Drive に接続すると、サインインしたどのパソコンにもスタイルが同期されます。同期は 30 分ごとと、編集した直後に行われます。',
      connected: 'Googleドライブに接続済み',
      synced: '2 分前に同期済み',
      syncNow: '今すぐ同期',
      savedTo: '保存先',
      disconnect: '接続を解除',
      schedule: 'スケジュール',
      scheduleValue: '30 分ごと、およびスタイルの編集直後',
    },
    history: {
      title: 'バージョン履歴',
      body: 'スタイルへの変更はすべて、新しい順に保存されます。項目を開くと変更内容を確認でき、ワンクリックで元に戻せます。',
      today: '今日 9月25日',
      yesterday: '昨日 9月24日',
      noChanges: '変更なし',
      edited: '編集済み',
      sites: '10 件',
      current: '現在',
      times: ['1:04', '0:41', '23:41'],
    },
    presets: {
      title: 'プリセット',
      body: 'リーダーモードとグレースケールはどのサイトでも使え、自分で加えた変更と組み合わせられます。',
      readability: 'リーダーモード',
      articlesOnly: '記事のみ',
      readabilityBody:
        'すっきりと読みやすい表示に。テーマ、フォント、サイズは自由に選べます。',
      grayscale: 'グレースケール',
      grayscaleBody: 'ページをグレースケールで表示します。',
    },
    chat: {
      title: 'チャット',
      body: 'コーディングエージェントがなくても大丈夫。チャットタブで変更内容を伝えると、Stylebot が CSS を書きます。Claude、OpenAI、Gemini のキーは自分のものを使い、キーはブラウザ内に保存されます。',
      prompt: '記事を夜でも読みやすくして',
      reply:
        '背景を暗く、文字を暖色にし、本文を行間の広い大きめのセリフ体にしました。',
      updated: 'スタイルを更新しました',
      undo: '元に戻す',
      placeholder: '変更内容を入力',
    },
  },
  welcome: {
    title: 'ようこそ',
    description: 'Stylebot の使い方を、最初から最後まで約 1 分で紹介します。',
    heading: 'Stylebot をインストールしました。',
    yourTurn: 'さあ、試してみましょう。',
    yourTurnBody:
      '好きなサイトを開いて、ショートカットを押してください。押すまでは何も変わりません。',
    manual: 'マニュアル',
    agentTitle: 'コーディングエージェントを接続',
    agentBody:
      'Claude Code、Codex、Cursor など、コマンドを実行できるエージェントなら、ターミナルから Stylebot を使えます。',
    agentPrompt: 'このサイトを Everforest テーマにして、フォントもいい感じに',
    agentReply:
      'Everforest の配色にして、フォントを Lora と Newsreader にしました。',
  },
  goodbye: {
    title: 'さようなら',
    description: 'Stylebot をご利用いただきありがとうございました。',
    panda: '手を振ってお別れするピクセルのパンダ',
    heading: 'Stylebot をご利用いただきありがとうございました。',
    lede: 'このブラウザからスタイルを削除しました。同期をオンにしていた場合、バックアップは Google Drive に残っています。',
    changedMind: '気が変わりましたか？',
    note: '2011 年から Stylebot を開発しています。試していただき、またフィードバックをお寄せいただき、ありがとうございます。',
    signature: '— Ankit',
    feedback: {
      question: 'アンインストールした理由は？',
      optional: '任意です。すぐに終わります。',
      reasons: [
        'もう必要なくなった',
        '使いにくい',
        'サイトの表示が崩れた',
        '欲しい機能がない',
        '動作が遅い',
        'その他',
      ],
      placeholder: 'ほかに何かあれば（任意）',
      send: 'フィードバックを送信',
      sendNote: '開発者に直接届きます。',
      thanks: 'ありがとうございます。すべてに目を通しています。',
    },
  },
  manual: {
    title: 'マニュアル',
    description:
      'Stylebot の使い方：サイトのスタイル変更、プロファイル、コマンドライン、チャット、同期、URL ルール、ショートカット。',
    lede: '最初のスタイルからプロファイル、チャット、同期まで、Stylebot の使い方を紹介します。',
    sections: 'マニュアルの目次',
    toc: {
      start: 'はじめに',
      profiles: 'プロファイル',
      cli: 'コマンドライン',
      chat: 'チャット',
      presets: 'リーダーモードとグレースケール',
      sync: '同期、バックアップ、履歴',
      urls: 'URL ルール',
      shortcuts: 'キーボードショートカット',
      help: 'ヘルプとサポート',
    },
    start: {
      open: 'ツールバーの Stylebot アイコンをクリックし、<strong>このページをカスタマイズ</strong>を選びます。どのタブでも [[alt+shift+M]] を押すか、要素を右クリックして <strong>Stylebot → 要素のスタイルを設定</strong>を選んでもかまいません。',
      shot: 'ベーシックタブで Wikipedia の記事のリンクを選択しているところ',
      pick: 'ピッカーをクリックし、ページ上でマウスを動かして要素をクリックします。クリックする前に [[↑]] を押すと、その親要素を選択できます。あとは<strong>ベーシック</strong>で変更するか、<strong>コード</strong>で CSS を書きます。変更はその場で保存され、サイトを開くたびに読み込まれます。',
      fonts: 'フォント',
      fontsBody:
        '400 種類の <a href="https://fonts.google.com/">Google Fonts</a> から検索でき、選んだフォントは Stylebot が読み込みます。パソコンにインストール済みのフォント名を入力することもできます。',
      position: 'エディタの位置',
      positionBody:
        'Chrome と Edge では、エディタはサイドパネルで開きます。<strong>⋯</strong> メニューの<strong>位置</strong>から、別ウィンドウで開いたり、ページ内に固定したりできます。Firefox にはサイドパネルがありません。',
      off: 'スタイルをオフにする',
      offBody:
        'ポップアップのスイッチか、[[alt+shift+S]] を使います。スタイルは削除されず、適用されなくなるだけです。',
      callout:
        '自動生成されたクラス名を使うサイトでは、サイトの更新でクラス名が変わることがあります。スタイルが効かなくなったら、要素を選び直して新しいセレクタを取得してください。',
    },
    profiles: {
      intro:
        'プロファイルは同じサイト用の別のスタイルシートで、複数のデザインを保存して切り替えられます。一度に適用されるのは 1 つだけで、どのサイトも最初は「デフォルト」から始まります。',
      shot: '4 つのプロファイル（Violet Hour、Everforest、Hearth、Newspaper）がある Hacker News でのポップアップ',
      manage:
        'エディタのヘッダーで、サイト名の横にあるプロファイル名をクリックすると、プロファイルの作成、名前の変更、複製、削除ができます。切り替えはそこかポップアップで行います。ポップアップで<strong>スタイルなし</strong>を選ぶと、そのサイトのスタイリングがオフになります。新しいプロファイルは空の状態から始まります。',
    },
    cli: {
      intro:
        '<code>stylebot</code> コマンドを使うと、Claude Code、Codex、Cursor などのコーディングエージェントが、API キーではなくご自身のサブスクリプションで、ブラウザ上のサイトのスタイルを直接変更できます。エージェントにサイトのスタイルを任せるなら、これが最適な方法です。コマンドを自分で実行することもできます。',
      setup: '設定',
      setupBody:
        'CLI をインストールしてブラウザに接続し、オプションで<strong>このパソコンのアプリに Stylebot の操作を許可</strong>をオンにします。各手順は<a href="{cli}">コマンドラインのページ</a>で説明しています。現在は Chrome と Edge のみに対応しています。',
      claudeCodeBody:
        'Stylebot プラグインを追加し、<code>/stylebot</code> で変更を頼みます（サイトをダークテーマにする、など）。',
      privacy: 'プライバシー',
      privacyBody:
        'コマンドラインからのアクセスは、オンにするまでオフです。Stylebot と CLI はこのパソコン上で互いにやり取りするだけです。エージェントは読み取った内容を自身のプロバイダーに送信します。',
    },
    chat: {
      intro:
        'チャットはちょっとした修正に最適です。チャットタブで望む変更を伝えると、Stylebot が CSS を書きます。要素を選んで対象を示したり、スクリーンショットを添付して意図を伝えたりもできます。テーマを丸ごと作るような大きな変更には、<a href="#cli">コマンドライン</a>を使いましょう。',
      shot: 'Hacker News で、読みやすいセリフ体の森のテーマを頼んだあとのチャットタブ',
      key: '自分の API キーを使う',
      keyBody:
        'Claude、OpenAI、Gemini の API キーを接続します。キーはこのパソコンにのみ保存され、同期されません。メッセージはブラウザからプロバイダーに直接送信されます。',
      changes: '変更の保存先',
      changesBody:
        '変更はすぐに適用され、現在のプロファイルのスタイルシートに追加されます。<strong>N 行を追加</strong>をクリックするとコードで確認でき、チャットから元に戻すこともできます。',
      cost: '料金',
      costBody:
        'メッセージ欄の下のトークン数に、この会話での使用量と料金の目安が表示されます。',
    },
    presets: {
      intro:
        'どちらもプリセットタブにあり、自分で加えた変更と組み合わせられます。<strong>リーダーモード</strong>はサイトの記事をすっきり読みやすい表示に切り替え、テーマ、フォント、サイズ、幅を選べます。記事以外のページはそのままです。<strong>グレースケール</strong>はサイトから色を取り除き、強さも自由に調整できます。',
      shot: 'リーダーモードで表示した Wikipedia の「数学」の記事（読書設定を開いた状態）',
    },
    sync: {
      shot: 'Google Drive に接続して同期済みのオプション画面',
      drive: 'Google Drive 同期',
      driveBody:
        'オプションで Google Drive に接続します。プロファイルを含むスタイルが、30 分ごとと編集した直後に同期されます。Stylebot が見られるのは Drive 内で自分が作成したファイルだけで、Stylebot のサーバーはありません。',
      conflicts: '競合',
      conflictsBody:
        '2 台のパソコンで同じスタイルが変更された場合は新しい編集が残り、もう一方のバージョンはコメントとして保存されるので、何も失われません。',
      backup: 'バックアップ',
      backupBody:
        'オプションから、すべてのスタイルを JSON でエクスポート、インポートできます。',
      history: 'バージョン履歴',
      historyBody:
        'このパソコンでの変更は、同期で届いたものも含めてすべてオプションに保存されます。一部のサイトでもすべてのサイトでも、以前のどのバージョンにも戻せます。',
      historyShot: 'オプションのバージョン履歴（新しい変更が上）',
    },
    urls: {
      intro:
        'Stylebot は通常、ドメイン名でスタイルとサイトを対応させます。より細かく指定したい場合は、オプションでスタイルの URL を編集し、次のパターンを使います。',
      wildcards: {
        anything: '任意の文字列に一致します。',
        segment: '/ が現れるまでの任意の文字列に一致します。',
        list: '複数のパターンを区切ります。いずれかのパターンに一致すれば、その URL は一致します。',
        regex: 'URL の先頭に付けると、正規表現として扱われます。',
      },
      examplesTitle: '例',
      examples: {
        domain: 'docs.google.com ドメインと、そのすべてのサブドメイン。',
        prefix: 'docs で始まるすべての URL。',
        numbered: 'docs.google.com、docs1.google.com、docs2.google.com など。',
        subdomains: 'news.ycombinator.com と apps.ycombinator.com。',
        either: 'どちらかのドメインと、そのすべてのサブドメイン。',
        regex: 'Reddit のトップページのみ。',
        everywhere: 'すべてのサイト。どこにでも適用したいスタイルに便利です。',
      },
    },
    shortcuts: {
      intro:
        'グローバルショートカットは、Stylebot がスタイルを適用できるすべてのページで使えます。変更はブラウザのショートカット設定で行います（オプションからリンクしています）。エディタ独自のショートカットは、エディタで [[?]] を押すと確認できます。',
      or: 'または',
      unset: '未設定（ブラウザで割り当て）',
      global: 'グローバル',
      picker: '要素の選択中',
      actions: {
        toggleEditor: 'エディタを切り替える',
        toggleStyling: 'スタイリングを切り替える',
        toggleReadability: 'リーダーモードを切り替える',
        toggleGrayscale: 'グレースケールを切り替える',
        parent: '親要素を選択',
        child: '子要素に戻る',
        select: 'ハイライトされた要素を選択',
      },
    },
    help: {
      body: 'バグを見つけたときやアイデアがあるときは、<a href="{issues}">GitHub</a> で issue を作成してください。Stylebot は無料のオープンソースで、2011 年からメンテナンスを続けています。役に立ったら、<a href="{donate}">コーヒーをおごって</a>応援していただけるとうれしいです。',
    },
  },
  privacy: {
    title: 'プライバシー',
    description:
      'Stylebot によるデータの扱い：サーバーなし、アカウントなし、アクセス解析なし。',
    lede: 'Stylebot にはサーバーもアカウントもアクセス解析もありません。スタイルはブラウザ内にとどまり、同期、チャット、コマンドラインをオンにした場合だけ、選んだサービスや許可したアプリに直接送られます。',
    updated: '最終更新：{date}',
    browser: {
      title: 'ブラウザ内にとどまるもの',
      body: [
        'スタイル、プロファイル、設定、履歴、チャットの会話、API キーはブラウザの拡張機能ストレージに保存され、Stylebot をアンインストールすると削除されます。Stylebot はスタイルを適用するために閲覧中のページを読み取りますが、チャットやコマンドラインを使わない限り、そこから何も送信しません。',
      ],
    },
    sync: {
      title: 'Google Drive 同期',
      body: [
        'オプションで Google Drive に接続すると、スタイルがご自身の Drive 内のファイルに保存されます。Stylebot が見られるのは、自身が作成したファイルだけです。アクセストークンはブラウザに保存され、1 時間で失効します。接続の解除は、オプションか <a href="https://myaccount.google.com/connections">Google アカウント</a>で行えます。',
        'Stylebot による Google API から受け取った情報の使用は、限定使用の要件を含め、<a href="https://developers.google.com/terms/api-services-user-data-policy">Google API サービスのユーザーデータに関するポリシー</a>に準拠しています。',
      ],
    },
    chat: {
      title: 'チャット',
      body: [
        'API キーを追加してメッセージを送信すると、ブラウザはそのプロバイダーに直接送信します。送信内容は、メッセージ、添付したスクリーンショット、ページのアドレスとタイトル、ページ上に表示されている内容の概要、そのページの CSS とスタイルです。ページに表示されている個人情報が含まれることがあるため、プロバイダーに共有したくないページではチャットを使わないでください。各社のポリシーが適用されます（<a href="https://www.anthropic.com/legal/privacy">Anthropic</a>、<a href="https://openai.com/policies/privacy-policy/">OpenAI</a>、<a href="https://ai.google.dev/gemini-api/terms">Google</a>）。',
      ],
    },
    cli: {
      title: 'コマンドライン',
      body: [
        'オプションで<q>このパソコンのアプリに Stylebot の操作を許可</q>をオンにすると、同じユーザー権限で動くアプリが、ご自身しか使えないローカル接続を通じて、タブの一覧表示、ページの読み取り、スクリーンショットの撮影、スタイルの読み取りと変更を行えるようになります。アプリが読み取った内容は、コーディングエージェントの背後にあるモデルなど、そのアプリが使うサービスに届くことがあります。接続を解除するには、この設定をオフにします。',
      ],
    },
    fonts: {
      title: 'フォントとインポートした CSS',
      body: [
        'スタイル内の Google Fonts は Google からダウンロードされ、Google には IP アドレスが伝わります。<code>@import</code> したスタイルシートは、そのアドレスから取得されます。',
      ],
    },
    site: {
      title: 'このウェブサイト',
      body: [
        'stylebot.dev は広告や Cookie を使っておらず、GitHub Pages でホストされています。GitHub Pages は標準的なサーバーログを記録します。訪問数は Plausible でページ、参照元、国、デバイスの種類ごとに計測しており、Cookie や個人を特定できる情報は使いません。',
      ],
    },
    sharing: {
      title: '共有',
      body: [
        'Stylebot はデータを収集、販売、共有しません。データがブラウザの外に出るのは、上記のサービスを使ったときだけです。',
      ],
    },
    contact: {
      title: '変更とお問い合わせ',
      body: [
        'このポリシーの変更履歴は <a href="{history}">GitHub のサイト履歴</a>で確認できます。ご質問は <a href="mailto:{email}">{email}</a> または <a href="{issues}">GitHub の issue</a> までお寄せください。',
      ],
    },
    translation:
      'このページは翻訳です。<a href="{original}">英語版</a>と内容が異なる場合は、英語版が優先されます。',
  },
  releases: {
    title: '{version} の新機能',
    bugFixes: 'ほかにも多数の<a href="{changelog}">バグ修正</a>',
    sections: 'セクション',
    r31: {
      description:
        'Stylebot 3.1 では、Google Drive での同期とバックアップ、サイズ変更できるエディタ、カラーパレットが加わりました。',
      syncTitle: 'Google Drive で同期とバックアップ',
      syncAlt: 'Google Drive でスタイルを同期',
      syncBody: [
        'Stylebot の<strong>オプションページ</strong>から、Google Drive との同期をオンにして認証します。',
        'オンにしたら、ポップアップかオプションページで<strong>今すぐ同期</strong>をクリックすると、ブラウザのスタイルと Google Drive にバックアップされたスタイルが同期されます。',
      ],
      resizeTitle: 'Stylebot エディタのサイズ変更',
      resizeAlt: 'Stylebot エディタのサイズを変更',
      resizeBody:
        'Stylebot エディタのサイズを変更できるようになりました。ページを縮めて、コンテンツがエディタの下に隠れないようにすることもできます。',
      colorsTitle: 'カラーパレット',
      colorsAlt: 'パレットから色を選択',
      colorsBody:
        'カラーピッカーが改良され、パレットからきれいな色を選びやすくなりました。',
    },
    r32: {
      description:
        'Stylebot 3.2 では、ちらつきのない、より速いスタイル適用を実現し、リーダーモードを一新し、ポップアップもすっきりしました。',
      lede: 'Stylebot の開発が再開しました。今後もアップデートを予定しています。',
      fasterTitle: 'ちらつきのない、より速いスタイル適用',
      fasterBody:
        'CSS がキャッシュされ、すぐに適用されるようになりました。スタイルが追いつくまでページがスタイルなしで一瞬表示されることがなくなり、全体の動作もきびきびしました。',
      readabilityTitle: 'リーダーモードを一新',
      readabilityAlt: 'リーダーモードの新しいテーマとタイポグラフィ設定',
      readabilityItems: [
        '新しい記事抽出アルゴリズムで、ページをよりきれいに整理',
        'ページの読み込みが終わる前に適用され、より速く起動',
        'テーマとタイポグラフィをその場でカスタマイズ',
        'よりなめらかな読み込みアニメーション',
        'キーボードショートカットで切り替え',
      ],
      popupTitle: 'すっきりしたポップアップ',
      popupAlt: '一新された Stylebot のポップアップ',
      popupItems: [
        '行全体をクリックして切り替え',
        '設定ボタンを直接配置',
        'ダークモードに対応',
      ],
    },
    r40: {
      description:
        'Stylebot 4.0 では、エディタを一新し、コーディングエージェント向けのコマンドライン、プロファイル、サイドパネル、チャット、バージョン履歴、同期を追加しました。',
      lede: 'エディタを一新し、コーディングエージェント向けのコマンドライン、プロファイル、サイドパネルを追加しました。',
      toc: {
        editor: 'エディタを一新',
        cli: 'コマンドライン',
        profiles: 'プロファイル',
        panel: 'サイドパネル',
        history: 'バージョン履歴',
        sync: '同期',
        chat: 'チャット',
        more: 'その他',
      },
      editorTitle: 'エディタを一新',
      editorAlt:
        '一新されたベーシックタブで、Newspaper プロファイルを使って Hacker News のスタイルを変更',
      editorBody: 'ゼロから作り直し、ダークモードにも対応しました。',
      editorItems: [
        'ページの現在の値を表示する、グループ化されたコントロール',
        'セレクタの生成を改善。サイトが更新されても効き続け、ほかの候補も選べる',
        'ほかのルールで値が上書きされているときに表示',
        'カラーパレットとスポイト',
        '色やフォントにマウスを合わせると、ページ上でプレビュー',
        '「その他のプロパティ」で、ほかの CSS プロパティもその場で編集',
        '元に戻す操作に対応',
      ],
      profilesTitle: 'プロファイル',
      profilesAlt:
        '「Dracula」と「Gruvbox」の 2 つのプロファイルがあるサイトでのポップアップ',
      profilesBody:
        '1 つのサイトに複数のデザインを保存し、エディタやポップアップから切り替えられます。',
      panelTitle: 'サイドパネル、または専用ウィンドウ',
      panelAlt: '「位置」をサイドパネルに設定したエディタのメニュー',
      panelBody:
        'Chrome と Edge では、エディタはサイドパネルで開きます。エディタの <strong>⋯</strong> メニューの<strong>位置</strong>から、専用のウィンドウに切り離すこともできます。',
      historyTitle: 'バージョン履歴',
      historyBody: 'すべての変更が保存され、以前のどのバージョンにも戻せます。',
      syncTitle: '同期',
      syncBody:
        'Google Drive 同期がより安定しました。別のパソコンでの編集はマージされるので、失われることはありません。同期は 30 分ごとと、編集した直後に自動で行われます。',
      chatTitle: 'チャット',
      chatBody:
        'コーディングエージェントがなくても大丈夫。望む見た目を伝えるか、提案から選ぶと、Stylebot が CSS を書きます。Claude、OpenAI、Gemini のキーは自分のものを使います。',
      chatAlt:
        'ページに合わせて「ほっこり」「落ち着き」「リンクだけカラー」を提案するチャットタブ',
      moreTitle: 'その他',
      moreItems: [
        '新しい stylebot.dev',
        '新しい Stylebot アイコン',
        'Shadow DOM の中にもスタイルが適用されるようになり、Web Components で作られたサイトでも使えます',
        'Stylebot のショートカットは、ブラウザのショートカット設定で管理するようになりました。Chrome と Edge では、変更していたショートカットがデフォルトに戻っているので、そちらで設定し直してください。',
        'Stylebot がベトナム語に対応',
      ],
    },
  },
  notFound: {
    title: 'ページが見つかりません',
    description: 'このページは存在しません。',
    heading: 'このページは存在しません。しかも、見た目がひどい。',
    done: 'ずっと良くなりました。ページは相変わらず存在しませんが、少なくとも見た目は良くなりました。',
    pageTitle: '404 Not Found',
    pageBody: 'リクエストされた URL はこのサーバー上に見つかりませんでした。',
    pageLink: 'ホームページへ',
    nice: '✨ おまかせできれいに',
  },
};

export default site;
