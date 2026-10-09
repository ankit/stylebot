import type { DemoMessages } from '..';

const demo: DemoMessages = {
  scenes: {
    pin: {
      title: '固定到工具栏',
      body: '让 Stylebot 一键可达。',
      captions: {
        menu: 'Stylebot 起初在扩展程序菜单里。',
        pinned: '已固定。Stylebot 现在就在工具栏上。',
      },
    },
    open: {
      title: '打开编辑器',
      keysBody: '点击图标，或按 {keys}。',
      captions: {
        iconThenStyle: '点击 Stylebot 图标，再点击“设置此页面样式”。',
        orKeys: '也可以按 {keys} 直接打开。',
      },
    },
    pick: {
      title: '选择元素',
      fieldsBody: '点击选中，各字段会显示它当前的样式。',
      captions: {
        hoverToSee: '悬停即可看到哪些元素可以修改。',
        select: '点击选中，选择器会自动填好。',
        computed: '每个字段都显示该元素当前的计算值。',
      },
    },
    style: {
      title: '修改样式',
      body: '用“基础”中的控件，或直接写 CSS。',
      captions: {
        size: '设置字号…',
        color: '…再设置颜色。',
        plainCss: '每处改动都是普通的 CSS，为此网站保存。',
        byHand: '也可以手写 CSS。',
        live: '页面随输入实时更新。',
      },
    },
    profiles: {
      title: '方案',
      looksBody: '为同一个网站保存不同的外观。',
      captions: {
        createForLook: '为新外观创建方案。',
        created: '{profile} 从空白开始，“{defaultProfile}”方案仍然保留。',
        newspaperLook: '给它换上报纸风格。',
        darkLook: '给它换上温暖的深色风格。',
        switchAnytime: '随时在两个方案之间切换。',
        backToDefault: '回到“{defaultProfile}”。一个网站，两种外观。',
      },
    },
  },
  browser: {
    extensions: '扩展程序',
    fullAccess: '拥有完全访问权限',
    fullAccessNote: '这些扩展程序可以查看和更改此网站上的信息。',
    otherExtensions: {
      adBlocker: '广告拦截器',
      passwordManager: '密码管理器',
      translate: '翻译',
      webArchive: '网页存档',
    },
  },
  popup: {
    readability: '简阅',
    styleThisPage: '设置此页面样式',
  },
  editor: {
    defaultProfile: '默认',
    newProfile: '报纸',
    newProfileDark: '夜猫子',
    createProfile: '创建方案',
    pickAnElement: '选择元素',
    tabs: {
      basic: '基础',
      code: '代码',
      presets: '预设',
      chat: '聊天',
    },
    basic: {
      hide: '隐藏',
      reset: '重置',
      text: '文本',
      font: '字体',
      defaultFont: '默认',
      size: '字号',
      lineHeight: '行高',
      color: '颜色',
      decoration: '文本修饰',
      none: '无',
      alignment: '对齐方式',
      background: '背景',
      box: '框',
      effects: '效果',
      moreProperties: '更多属性',
    },
    code: {
      noStyles: '还没有样式',
    },
    presets: {
      readability: '简阅',
      articlesOnly: '仅限文章',
      readabilityDescription:
        '将此网站的文章转换为整洁、无干扰的阅读视图，主题、字体和字号均可自选。',
      grayscale: '灰度',
      grayscaleDescription: '将灰度应用于该页面',
    },
  },
  article: {
    nav: {
      news: '新闻',
      travel: '旅行',
      signIn: '登录',
    },
    kicker: '旅行 · 深度',
    headline: '夜间渡轮悄然回归',
    dek: '三家运营商押注：旅客愿意放弃速度，换来一间客舱、一片海景，还不用去机场。',
    byline: 'Marta Linde · 9月24日 · 6 分钟阅读',
    paragraphs: [
      '最后一班夜航停运二十年后，三家运营商正让客舱重回水面。卖点很简单：晚饭后登船，一觉睡过整段航程，醒来已身在另一个国家。',
      '首条复航线路一周内就订满了整个夏天。大多数乘客不到四十岁，许多人从未乘坐过任何卧铺。运营商说，最先订满的是客舱，然后是躺椅座位，最后才是甲板。',
    ],
    quote: '“没有人是为了省时间才订的。大家订它，是想丢掉一点时间。”',
    quoteBy: '— Ines Varga，航线规划师',
  },
  steps: {
    heading: '使用方法',
    counter: '{current} / {total}',
    jump: '跳到这一步',
  },
};

export default demo;
