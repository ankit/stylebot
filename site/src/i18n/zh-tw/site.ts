import type { SiteMessages } from '..';

const site: SiteMessages = {
  meta: {
    title: 'Stylebot - 隨心改變任何網站的外觀',
    titleSuffix: '{title} - Stylebot',
    description:
      '指向頁面上的元素直接修改，或描述你想要的效果，由 Stylebot 撰寫 CSS。免費開放原始碼，支援 Chrome、Firefox 和 Edge。',
  },
  header: {
    home: 'Stylebot 首頁',
    manual: '使用手冊',
    install: '安裝',
    language: '語言',
    suggest: '以繁體中文檢視此頁面',
    dismiss: '關閉',
    theme: '主題：{theme}',
  },
  themes: {
    light: '淺色',
    dark: '深色',
    stylebot: 'Stylebot',
    newsprint: '新聞紙',
  },
  footer: {
    changelog: '更新記錄',
    donate: '請我喝杯咖啡',
  },
  store: {
    add: '加到 {store}',
    addFree: '免費加到 {store}',
    reinstall: '重新安裝到 {store}',
  },
  zoom: {
    label: '放大的螢幕截圖',
    close: '關閉',
  },
  home: {
    title: '隨心{word}任何網站。',
    titleWord: '改造',
    titleWordHint: '按一下換個風格',
    lede: '指向頁面上的元素直接修改，或者直接描述你想要的效果。Stylebot 會撰寫 CSS，每次回到網站都會自動載入你的樣式。',
    also: '也支援 {first} 和 {second}',
    installTitle: '安裝 Stylebot',
    installBody:
      '自 2011 年起免費開放原始碼。不需帳戶，也不追蹤。你的樣式保存在瀏覽器中，程式碼公開在 GitHub 上。',
    cli: '在用程式設計代理嗎？加上 <a href="#cli">CLI</a>：',
  },
  cli: {
    copy: '複製',
    copied: '已複製',
    copyCommand: '複製 {command}',
    title: '與你的程式設計代理搭配使用',
    body: 'Claude Code、Codex、Cursor 或任何能執行指令的代理，都能從終端機使用 Stylebot。',
    guide: '設定 CLI →',
    demo: {
      terminal: '終端機 · 程式設計代理',
      prompt: '讓 {site} 在晚上更好讀',
      done: '深色背景、更暖的文字色、更大的襯線內文。已移除廣告。',
      before: '修改前',
      after: '修改後',
      kicker: '旅遊',
      headline: '夜間渡輪悄悄回歸',
      dek: '三家業者押注旅客願意捨棄速度，換來一間船艙、一片海景，而且不必去機場。',
      text: '22:40 從羅斯托克出發的班次悄然啟航。等港口燈火落在身後，多數乘客已找到自己的船艙，酒吧裡也只剩低聲細語。',
      ad: '廣告',
    },
    page: {
      title: '命令列',
      description:
        '從終端機控制 Stylebot，或讓 Claude Code、Codex、Cursor 等程式設計代理用你自己的訂閱方案，在瀏覽器中修改網站樣式。',
      heading: '在終端機中使用 Stylebot',
      lede: '從命令列控制 Stylebot，或交給 Claude Code、Codex、Cursor 等程式設計代理。代理會直接在你的瀏覽器中修改網站樣式，使用你自己的訂閱方案，不需要 API 金鑰。',
      setup: '開始設定',
      install: '安裝 Stylebot',
      installBody: '適用於 Chrome 或 Edge。命令列目前還不支援 Firefox。',
      cli: '安裝 CLI',
      cliBody: '需要 Node 20 或以上版本。',
      connect: '連接到你的瀏覽器',
      connectBody: '這會向 Chrome 和 Edge 註冊 CLI，讓 Stylebot 能與它連線。',
      access: '開啟命令列存取',
      accessBody:
        '在 Stylebot 的選項中，於「基本」下開啟 <strong>允許這台電腦上的應用程式控制 Stylebot</strong>，並允許瀏覽器要求的權限。',
      plugin: '加入 Claude Code 外掛程式',
      optional: '選用',
      pluginBody: '在 Claude Code 中執行：',
      tryIt: '然後試試看：',
      commands: '指令',
      commandsBody:
        '代理會替你執行這些指令，你也可以自己執行。<code>stylebot --help</code> 會列出所有指令。',
      examples: {
        open: '在你目前視窗後方的視窗中開啟頁面，並印出其分頁 ID。',
        outline: '以大綱形式印出頁面上可見的元素。',
        css: '將 CSS 儲存為該網站的樣式並套用，再檢查頁面。',
        screenshot: '將分頁畫面存成圖片。',
      },
      privacy: '隱私權',
      privacyBody: [
        '命令列存取在你開啟之前都是關閉的。開啟後，這台電腦上的應用程式可以讀取你開啟的頁面、擷取螢幕畫面並變更你的樣式。隨時可以在 Stylebot 的選項中關閉。',
        'Stylebot 和 CLI 只在這台電腦上彼此溝通，不會把任何資料傳送到別處。代理則會把讀取到的內容傳送給它自己的供應商，例如 Claude Code 會傳送給 Anthropic。',
      ],
    },
  },
  gallery: {
    title: '從這些樣式開始',
    lede: '複製一個再依喜好調整，或從頭開始。',
    hint: '到 {site} 將它貼進「程式碼」分頁。',
    enlarge: '放大 {site}：{name}',
    alt: '用 Stylebot 改造的 {site}：{name}',
    install: '安裝',
    installTitle: '安裝到 Stylebot',
    installed: '已安裝',
    installedAs: '已安裝為「{name}」',
    installFailed: '無法安裝',
    copy: '複製 CSS',
    copied: '已複製',
    source: '在 GitHub 上檢視',
    lightbox: '改造後的網站',
    close: '關閉',
  },
  quotes: {
    title: '大家都愛 Stylebot',
  },
  features: {
    title: '其他功能，一應俱全。',
    previous: '上一個功能',
    next: '下一個功能',
    sync: {
      title: '同步',
      body: '連線 Google Drive，你的樣式就會跟著你到每一台登入的電腦。Stylebot 每 30 分鐘同步一次，編輯後也會立即同步。',
      connected: '已連線至 Google 雲端硬碟',
      synced: '已於 2 分鐘前同步',
      syncNow: '立即同步',
      savedTo: '儲存至',
      disconnect: '中斷連線',
      schedule: '排程',
      scheduleValue: '每 30 分鐘，以及編輯樣式後立即同步',
    },
    history: {
      title: '版本記錄',
      body: '樣式的每一次變更都會保留，最新的在前。開啟一筆記錄即可查看變更內容，一鍵還原。',
      today: '今天，9月25日',
      yesterday: '昨天，9月24日',
      noChanges: '沒有變更',
      edited: '編輯了',
      sites: '10 個網站',
      current: '目前',
      times: ['上午1:04', '上午12:41', '下午11:41'],
    },
    presets: {
      title: '預設',
      body: '簡閱和灰度適用於任何網站，而且能和你自己的修改疊加。',
      readability: '簡閱',
      articlesOnly: '僅限文章',
      readabilityBody: '整潔的閱讀檢視，主題、字型和字級都能自選。',
      grayscale: '灰度',
      grayscaleBody: '將灰度應用於該頁面',
    },
    chat: {
      title: '聊天',
      body: '沒有程式設計代理？在聊天分頁中描述變更，Stylebot 就會撰寫 CSS。使用你自己的 Claude、OpenAI 或 Gemini 金鑰，金鑰只保存在你的瀏覽器中。',
      prompt: '讓文章在晚上更好讀',
      reply:
        '已改為深色背景配上較暖的文字色，內文也改用較大的襯線字型，並加大行距。',
      updated: '已更新樣式',
      undo: '復原',
      placeholder: '描述一項變更',
    },
  },
  welcome: {
    title: '歡迎',
    description: '花一分鐘左右，從頭到尾了解 Stylebot 怎麼用。',
    heading: 'Stylebot 已安裝。',
    yourTurn: '換你了。',
    yourTurnBody: '開啟任何網站，按下快速鍵。在你動手之前，什麼都不會改變。',
    manual: '使用手冊',
    agentTitle: '連接你的程式設計代理',
    agentBody:
      'Claude Code、Codex、Cursor 或任何能執行指令的代理，都能從終端機使用 Stylebot。',
    agentPrompt: '幫這個網站換成 Everforest 主題，字型也換好看一點',
    agentReply: '已換成 Everforest 配色，字型改用 Lora 和 Newsreader。',
  },
  goodbye: {
    title: '再見',
    description: '感謝你使用 Stylebot。',
    panda: '揮手道別的像素熊貓',
    heading: '感謝你使用 Stylebot。',
    lede: '你的樣式已從這個瀏覽器中移除。如果你開啟過同步，Google Drive 中仍有一份備份。',
    changedMind: '改變主意了？',
    note: '我從 2011 年開始開發 Stylebot。謝謝你試用它，也謝謝你留下的任何意見。',
    signature: '— Ankit',
    feedback: {
      question: '為什麼要解除安裝？',
      optional: '選填，只要一秒鐘。',
      reasons: [
        '不再需要了',
        '很難用',
        '它讓某個網站壞掉了',
        '缺少某個功能',
        '太慢',
        '其他原因',
      ],
      placeholder: '還有其他想說的嗎？（選填）',
      send: '傳送意見',
      sendNote: '會直接寄給維護者。',
      thanks: '謝謝你。每則意見我都會讀。',
    },
  },
  manual: {
    title: '使用手冊',
    description:
      'Stylebot 使用方式：設定網站樣式、設定檔、命令列、聊天、同步、URL 規則和快速鍵。',
    lede: 'Stylebot 怎麼運作：從你的第一個樣式，到設定檔、聊天和同步。',
    sections: '使用手冊章節',
    toc: {
      start: '開始使用',
      profiles: '設定檔',
      cli: '命令列',
      chat: '聊天',
      presets: '簡閱和灰度',
      sync: '同步、備份和版本記錄',
      urls: 'URL 規則',
      shortcuts: '快速鍵',
      help: '說明與支援',
    },
    start: {
      open: '按一下工具列中的 Stylebot 圖示，然後選擇 <strong>設定此頁面樣式</strong>。也可以在任何分頁按 [[alt+shift+M]]，或在元素上按右鍵並選擇 <strong>Stylebot → 為元素設定樣式</strong>。',
      shot: '基本分頁，正在選取維基百科文章中的連結',
      pick: '按一下選取器，將滑鼠移到頁面上，再按一下元素。按一下之前先按 [[↑]]，可改為選取它的父元素。接著在 <strong>基本</strong> 中修改，或在 <strong>程式碼</strong> 中撰寫 CSS。變更會隨時儲存，每次造訪該網站時都會載入。',
      fonts: '字型',
      fontsBody:
        '搜尋 400 種 <a href="https://fonts.google.com/">Google Fonts</a>，Stylebot 會載入你選的字型；也可以輸入電腦上已安裝的任何字型。',
      position: '編輯器位置',
      positionBody:
        '在 Chrome 和 Edge 中，編輯器會在側邊面板開啟。使用其 <strong>⋯</strong> 選單中的 <strong>位置</strong>，即可改在獨立視窗中開啟，或停靠在頁面中。Firefox 沒有側邊面板。',
      off: '關閉樣式',
      offBody:
        '使用彈出式視窗中的開關，或按 [[alt+shift+S]]。樣式會保留，只是不套用。',
      callout:
        '有些網站使用自動產生的 class 名稱，網站更新時就會改變。如果樣式失效，請重新選取元素以取得新的選擇器。',
    },
    profiles: {
      intro:
        '設定檔是同一網站的另一份樣式表，讓你保留多種外觀並隨時切換。一次只會套用一個，每個網站一開始都是「預設」。',
      shot: 'Hacker News 上的彈出式視窗，有 Violet Hour、Everforest、Hearth 和 Newspaper 四個設定檔',
      manage:
        '按一下編輯器標題列中網站旁的設定檔名稱，即可建立、重新命名、複製或刪除設定檔。可在那裡或彈出式視窗中切換設定檔；在彈出式視窗中選擇 <strong>無樣式</strong> 會關閉該網站的樣式。新設定檔一開始是空的。',
    },
    cli: {
      intro:
        '<code>stylebot</code> 指令讓 Claude Code、Codex、Cursor 等程式設計代理直接在你的瀏覽器中修改網站樣式，使用你自己的訂閱方案，不需要 API 金鑰。這是讓代理設定網站樣式的最佳方式，你也可以自己執行這些指令。',
      setup: '設定',
      setupBody:
        '安裝 CLI、連接到你的瀏覽器，然後在選項中開啟 <strong>允許這台電腦上的應用程式控制 Stylebot</strong>。<a href="{cli}">命令列頁面</a>會逐步說明每個步驟。目前僅支援 Chrome 和 Edge。',
      claudeCodeBody:
        '加入 Stylebot 外掛程式，再用 <code>/stylebot</code> 要求變更，例如為網站套用深色主題。',
      privacy: '隱私權',
      privacyBody:
        '命令列存取在你開啟之前都是關閉的。Stylebot 和 CLI 只在這台電腦上彼此溝通；代理則會把讀取到的內容傳送給它自己的供應商。',
    },
    chat: {
      intro:
        '聊天最適合快速修正。在聊天分頁中描述你想要的變更，Stylebot 就會撰寫 CSS。你可以選取元素來指明對象，或附加螢幕截圖說明你的意思。若是較大的變更，例如整套新主題，請使用<a href="#cli">命令列</a>。',
      shot: '在 Hacker News 上要求森林主題和易讀襯線字型後的聊天分頁',
      key: '使用你自己的金鑰',
      keyBody:
        '連線 Claude、OpenAI 或 Gemini 的 API 金鑰。金鑰只儲存在這台電腦上，永不同步。訊息會直接從你的瀏覽器傳送到供應商。',
      changes: '變更會加到哪裡',
      changesBody:
        '每項變更都會立即套用，並加入目前設定檔的樣式表。按一下 <strong>新增 N 行</strong> 即可在程式碼分頁中查看，也可以從聊天中復原。',
      cost: '費用',
      costBody: '訊息框下方的 token 數會顯示這段對話的用量，以及預估費用。',
    },
    presets: {
      intro:
        '兩者都在預設分頁中，並能和你自己的修改疊加。<strong>簡閱</strong> 會把網站的文章轉換為整潔的閱讀檢視，主題、字型、字級和寬度都能自選；不是文章的頁面則不受影響。<strong>灰度</strong> 會移除網站的色彩，強度可調。',
      shot: '簡閱檢視中的維基百科「數學」條目，已開啟閱讀設定',
    },
    sync: {
      shot: '已連線至 Google Drive 並完成同步的選項頁面',
      drive: 'Google Drive 同步',
      driveBody:
        '在選項頁面中連線 Google Drive。你的樣式（包括設定檔）每 30 分鐘同步一次，編輯後也會立即同步。Stylebot 只能看到它在你的 Drive 中建立的檔案，而且沒有 Stylebot 伺服器。',
      conflicts: '衝突',
      conflictsBody:
        '如果同一個樣式在兩台電腦上都有變更，會保留你較新的編輯，另一個版本則保存在註解中，不會遺失任何內容。',
      backup: '備份',
      backupBody: '在選項頁面中將所有樣式匯出和匯入為 JSON。',
      history: '版本記錄',
      historyBody:
        '這台電腦上的每一次變更都會保留在選項頁面中，包括透過同步傳來的變更。可為部分或全部網站還原任何先前的版本。',
      historyShot: '選項頁面中的版本記錄，最新的變更在前',
    },
    urls: {
      intro:
        '預設情況下，Stylebot 會依網域名稱將樣式對應到網站。在選項頁面中編輯樣式的 URL，即可使用以下模式做更精確的比對。',
      wildcards: {
        anything: '比對任意字元序列。',
        segment: '比對任意字元序列，直到遇到 / 為止。',
        list: '分隔多個模式。只要任一模式符合，URL 就符合。',
        regex: '放在 URL 開頭時，會將其轉為正規表示式。',
      },
      examplesTitle: '範例',
      examples: {
        domain: '網域 docs.google.com 或其任何子網域。',
        prefix: '任何以 docs 開頭的 URL。',
        numbered: 'docs.google.com、docs1.google.com、docs2.google.com 等等。',
        subdomains: 'news.ycombinator.com 和 apps.ycombinator.com。',
        either: '任一網域，或其任何子網域。',
        regex: '僅限 Reddit 首頁。',
        everywhere: '所有網站。適合想在任何地方套用的樣式。',
      },
    },
    shortcuts: {
      intro:
        '全域快速鍵可在 Stylebot 能設定樣式的任何頁面上使用，可在瀏覽器的快速鍵設定中變更（選項頁面中有連結）。編輯器本身的快速鍵，請在編輯器中按 [[?]] 查看。',
      or: '或',
      unset: '未設定，請在瀏覽器中指定',
      global: '全域',
      picker: '選取元素時',
      actions: {
        toggleEditor: '開啟/關閉編輯器',
        toggleStyling: '開啟/關閉樣式',
        toggleReadability: '開啟/關閉簡閱',
        toggleGrayscale: '開啟/關閉灰度',
        parent: '選取父元素',
        child: '返回子元素',
        select: '選取醒目標示的元素',
      },
    },
    help: {
      body: '發現錯誤或有點子？請到 <a href="{issues}">GitHub</a> 回報問題。Stylebot 免費且開放原始碼，自 2011 年起持續維護。如果它對你有幫助，歡迎<a href="{donate}">請我喝杯咖啡</a>來支持。',
    },
  },
  privacy: {
    title: '隱私權',
    description:
      'Stylebot 如何處理你的資料：沒有伺服器、沒有帳戶、沒有分析工具。',
    lede: 'Stylebot 沒有伺服器、沒有帳戶，也沒有分析工具。除非你開啟同步、聊天或命令列，否則你的樣式只會留在瀏覽器中；開啟後，資料也只會直接傳送到你選擇的服務或你允許的應用程式。',
    updated: '最後更新：{date}',
    browser: {
      title: '留在瀏覽器中的資料',
      body: [
        '你的樣式、設定檔、設定、記錄、聊天對話和 API 金鑰，都儲存在瀏覽器的擴充功能儲存空間中，解除安裝 Stylebot 就會移除這些資料。Stylebot 讀取你造訪的頁面是為了套用樣式，除非你使用聊天或命令列，否則不會從中傳送任何內容。',
      ],
    },
    sync: {
      title: 'Google Drive 同步',
      body: [
        '在選項中連線 Google Drive 後，你的樣式會儲存到你自己 Drive 中的一個檔案。Stylebot 只看得到它自己建立的檔案。它的存取權杖保存在你的瀏覽器中，一小時後失效。你可以在選項或你的 <a href="https://myaccount.google.com/connections">Google 帳戶</a>中中斷連線。',
        'Stylebot 對於從 Google API 取得之資訊的使用方式，遵循 <a href="https://developers.google.com/terms/api-services-user-data-policy">Google API 服務使用者資料政策</a>，包括「有限使用」規定。',
      ],
    },
    chat: {
      title: '聊天',
      body: [
        '新增 API 金鑰並傳送訊息後，瀏覽器會將以下內容直接傳送給該供應商：你的訊息、你附加的任何螢幕截圖、頁面的 URL 和標題、頁面上可見內容的大綱，以及頁面的 CSS 和你的樣式。其中可能包含頁面上顯示的個人資訊，因此不想分享給供應商的頁面，請勿使用聊天。適用各供應商的政策：<a href="https://www.anthropic.com/legal/privacy">Anthropic</a>、<a href="https://openai.com/policies/privacy-policy/">OpenAI</a>、<a href="https://ai.google.dev/gemini-api/terms">Google</a>。',
      ],
    },
    cli: {
      title: '命令列',
      body: [
        '在選項中開啟 <q>允許這台電腦上的應用程式控制 Stylebot</q> 後，以你的身分執行的應用程式就能透過只有你能使用的本機連線，列出你的分頁、讀取頁面、擷取螢幕畫面，以及讀取和變更你的樣式。它們讀取的內容可能會傳送到它們使用的服務，例如程式設計代理背後的模型。關閉此設定即可中斷連線。',
      ],
    },
    fonts: {
      title: '字型和匯入的 CSS',
      body: [
        '樣式中的 Google Fonts 字型會從 Google 下載，Google 會看到你的 IP 位址。透過 <code>@import</code> 匯入的樣式表會從其位址抓取。',
      ],
    },
    site: {
      title: '本網站',
      body: [
        'stylebot.dev 沒有廣告或 Cookie，託管於 GitHub Pages，GitHub Pages 會保留標準的伺服器記錄。Plausible 會依頁面、來源網站、國家/地區和裝置類型計算造訪次數，不使用 Cookie，也不會記錄任何能識別你身分的資訊。',
      ],
    },
    sharing: {
      title: '分享',
      body: [
        'Stylebot 不會收集、販售或分享你的資料。只有在你使用上述服務時，資料才會離開你的瀏覽器，傳送到這些服務。',
      ],
    },
    contact: {
      title: '變更與聯絡方式',
      body: [
        '本政策的變更都記錄在 <a href="{history}">GitHub 上的網站歷史記錄</a>中。如有疑問，請寄信至 <a href="mailto:{email}">{email}</a>，或建立 <a href="{issues}">GitHub issue</a>。',
      ],
    },
    translation:
      '這是翻譯版本。如與<a href="{original}">英文版本</a>有出入，以英文版本為準。',
  },
  releases: {
    title: '{version} 版新功能',
    bugFixes: '還有許多<a href="{changelog}">錯誤修正</a>',
    sections: '章節',
    r31: {
      description:
        'Stylebot 3.1 新增透過 Google Drive 同步和備份、可調整大小的編輯器，以及調色盤。',
      syncTitle: '透過 Google Drive 同步和備份',
      syncAlt: '透過 Google Drive 同步樣式',
      syncBody: [
        '在 Stylebot 的 <strong>選項頁面</strong> 中開啟同步並授權 Google Drive。',
        '開啟後，在彈出式視窗或選項頁面中按一下 <strong>立即同步</strong>，即可將瀏覽器中的樣式與 Google Drive 上備份的樣式同步。',
      ],
      resizeTitle: '調整 Stylebot 編輯器大小',
      resizeAlt: '正在調整 Stylebot 編輯器大小',
      resizeBody:
        '現在可以調整 Stylebot 編輯器的大小，也可以選擇讓頁面縮窄，避免內容被編輯器擋住。',
      colorsTitle: '調色盤',
      colorsAlt: '從調色盤中挑選顏色',
      colorsBody: '改良的顏色選擇器加入了調色盤，更容易挑出好看的顏色。',
    },
    r32: {
      description:
        'Stylebot 3.2 帶來更快、不閃爍的樣式套用，重新設計的簡閱模式，以及更簡潔的彈出式視窗。',
      lede: 'Stylebot 重新恢復積極開發，後續還有更多更新。',
      fasterTitle: '更快、不閃爍的樣式套用',
      fasterBody:
        'CSS 現在會先快取並立即套用，頁面不再在樣式套用前閃現未設定樣式的畫面，整體使用起來也更流暢。',
      readabilityTitle: '重新設計的簡閱模式',
      readabilityAlt: '簡閱模式新的內嵌主題和字體排版控制項',
      readabilityItems: [
        '更新的文章擷取演算法，更能清理頁面',
        '啟用更快，在頁面其他部分載入前就套用',
        '可直接自訂主題和字體排版',
        '更流暢的載入動畫',
        '可用快速鍵開啟/關閉',
      ],
      popupTitle: '更簡潔的彈出式視窗',
      popupAlt: 'Stylebot 重新設計的彈出式視窗',
      popupItems: ['整列都可點按的開關', '直接開啟設定的按鈕', '支援深色模式'],
    },
    r40: {
      description:
        'Stylebot 4.0 帶來重新設計的編輯器、供程式設計代理使用的命令列、設定檔、側邊面板、聊天、版本記錄和同步。',
      lede: '重新設計的編輯器、供程式設計代理使用的命令列、設定檔，以及側邊面板。',
      toc: {
        editor: '重新設計的編輯器',
        cli: '命令列',
        profiles: '設定檔',
        panel: '側邊面板',
        history: '版本記錄',
        sync: '同步',
        chat: '聊天',
        more: '更多改進',
      },
      editorTitle: '重新設計的編輯器',
      editorAlt:
        '重新設計的基本分頁，正以 Newspaper 設定檔設定 Hacker News 的樣式',
      editorBody: '從頭重新打造，現在支援深色模式。',
      editorItems: [
        '分組的控制項，顯示頁面本身的值',
        '更好的選擇器產生方式：網站更新後選擇器仍然有效，也有其他選擇器可挑選',
        '其他規則覆寫某個值時會顯示出來',
        '調色盤和滴管',
        '將滑鼠移到顏色或字型上，即可在頁面上預覽',
        '在「更多屬性」中直接編輯任何其他 CSS 屬性',
        '支援復原',
      ],
      profilesTitle: '設定檔',
      profilesAlt: '在有 Dracula 和 Gruvbox 兩個設定檔的網站上開啟的彈出式視窗',
      profilesBody: '為同一網站保留多種外觀，並從編輯器或彈出式視窗中切換。',
      panelTitle: '側邊面板，或獨立視窗',
      panelAlt: '編輯器選單，位置設為側邊面板',
      panelBody:
        '在 Chrome 和 Edge 中，編輯器會在側邊面板開啟。也可以從編輯器 <strong>⋯</strong> 選單中的 <strong>位置</strong>，將它移到獨立視窗。',
      historyTitle: '版本記錄',
      historyBody: '每一次變更都會保留，可還原任何先前的版本。',
      syncTitle: '同步',
      syncBody:
        'Google Drive 同步更加穩定。來自不同電腦的編輯會合併，不會遺失任何內容。每 30 分鐘會自動同步一次，編輯後也會立即同步。',
      chatTitle: '聊天',
      chatBody:
        '沒有程式設計代理？描述你想要的效果，或挑選建議的外觀，Stylebot 就會撰寫 CSS。使用你自己的 Claude、OpenAI 或 Gemini 金鑰。',
      chatAlt:
        '聊天分頁為頁面建議的外觀：「溫馨」、「寧靜」和「只有連結是彩色」',
      moreTitle: '更多改進',
      moreItems: [
        '全新的 stylebot.dev',
        '全新的 Stylebot 圖示',
        '樣式現在也會套用到 shadow DOM 內，因此在以 Web Components 建構的網站上也能運作',
        'Stylebot 的快速鍵現在改由瀏覽器的快速鍵設定管理。在 Chrome 和 Edge 中，你先前改過的快速鍵都已恢復預設，請到那裡重新設定。',
        'Stylebot 現已支援越南文',
      ],
    },
  },
  notFound: {
    title: '找不到頁面',
    description: '這個頁面不存在。',
    heading: '這個頁面不存在，而且長得很醜。',
    done: '好多了。這個頁面還是不存在，但至少現在看起來不錯。',
    pageTitle: '404 找不到頁面',
    pageBody: '在此伺服器上找不到要求的 URL。',
    pageLink: '前往首頁',
    nice: '✨ 讓它變好看',
  },
};

export default site;
