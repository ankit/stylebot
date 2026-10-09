import type { DemoMessages } from '..';

const demo: DemoMessages = {
  scenes: {
    pin: {
      title: '釘選到工具列',
      body: '讓 Stylebot 隨手可及。',
      captions: {
        menu: 'Stylebot 一開始在擴充功能選單中。',
        pinned: '已釘選。Stylebot 現在就在工具列上。',
      },
    },
    open: {
      title: '開啟編輯器',
      keysBody: '按一下圖示，或按 {keys}。',
      captions: {
        iconThenStyle: '按一下 Stylebot 圖示，再按「設定此頁面樣式」。',
        orKeys: '或按 {keys} 直接開啟。',
      },
    },
    pick: {
      title: '選擇元素',
      fieldsBody: '按一下即可選取，欄位會顯示它目前的樣式。',
      captions: {
        hoverToSee: '將滑鼠移到元素上，看看哪些可以設定樣式。',
        select: '按一下即可選取，選擇器會自動填入。',
        computed: '每個欄位都會顯示該元素目前的計算值。',
      },
    },
    style: {
      title: '設定樣式',
      body: '使用基本控制項，或撰寫 CSS。',
      captions: {
        size: '設定字級…',
        color: '…還有顏色。',
        plainCss: '每項變更都是一般的 CSS，為這個網站儲存。',
        byHand: '也可以手寫 CSS。',
        live: '頁面會隨著你輸入即時更新。',
      },
    },
    profiles: {
      title: '設定檔',
      looksBody: '為同一個網站保存不同的外觀。',
      captions: {
        createForLook: '建立設定檔，打造新外觀。',
        created: '「{profile}」從空白開始，「{defaultProfile}」仍然保留。',
        newspaperLook: '換上報紙風格的外觀。',
        darkLook: '換上溫暖的深色外觀。',
        switchAnytime: '隨時在兩者之間切換。',
        backToDefault: '回到「{defaultProfile}」。一個網站，兩種外觀。',
      },
    },
  },
  browser: {
    extensions: '擴充功能',
    fullAccess: '完整存取權',
    fullAccessNote: '這些擴充功能可以查看及變更這個網站上的資訊。',
    otherExtensions: {
      adBlocker: '廣告封鎖器',
      passwordManager: '密碼管理工具',
      translate: '翻譯',
      webArchive: '網頁封存',
    },
  },
  popup: {
    readability: '簡閱',
    styleThisPage: '設定此頁面樣式',
  },
  editor: {
    defaultProfile: '預設',
    newProfile: '報紙',
    newProfileDark: '夜貓子',
    createProfile: '建立設定檔',
    pickAnElement: '選擇元素',
    tabs: {
      basic: '基本',
      code: '程式碼',
      presets: '預設',
      chat: '聊天',
    },
    basic: {
      hide: '隱藏',
      reset: '重設',
      text: '文字',
      font: '字型',
      defaultFont: '預設',
      size: '字級',
      lineHeight: '行高',
      color: '顏色',
      decoration: '文字修飾',
      none: '無',
      alignment: '對齊方式',
      background: '背景',
      box: '框',
      effects: '效果',
      moreProperties: '更多屬性',
    },
    code: {
      noStyles: '尚無樣式',
    },
    presets: {
      readability: '簡閱',
      articlesOnly: '僅限文章',
      readabilityDescription:
        '將此網站的文章轉換為整潔、無干擾的閱讀檢視，主題、字型和字級都能自選。',
      grayscale: '灰度',
      grayscaleDescription: '將灰度應用於該頁面',
    },
  },
  article: {
    nav: {
      news: '新聞',
      travel: '旅遊',
      signIn: '登入',
    },
    kicker: '旅遊 · 深度報導',
    headline: '夜間渡輪悄悄回歸',
    dek: '三家業者押注旅客願意捨棄速度，換來一間船艙、一片海景，而且不必去機場。',
    byline: 'Marta Linde · 9月24日 · 6 分鐘閱讀',
    paragraphs: [
      '最後一班夜航停駛二十年後，三家業者正讓船艙重回海上。賣點很簡單：晚餐後登船，一覺睡過整段航程，醒來已身在另一個國家。',
      '首條復航航線一週內就訂滿整個夏天。多數乘客不到四十歲，許多人從沒搭過任何臥鋪。業者表示，最先客滿的是船艙，接著是躺椅座位，最後才是甲板。',
    ],
    quote: '「沒有人是為了省時間才訂的。大家訂它，是想丟掉一點時間。」',
    quoteBy: '— Ines Varga，航線規劃師',
  },
  steps: {
    heading: '運作方式',
    counter: '{current} / {total}',
    jump: '跳到這裡',
  },
};

export default demo;
