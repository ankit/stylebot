import type { SiteMessages } from '..';

const site: SiteMessages = {
  meta: {
    title: 'Stylebot - 随心改造任何网站',
    titleSuffix: '{title} - Stylebot',
    description:
      '指向页面上的任何内容直接修改，或者描述你想要的效果，Stylebot 会编写 CSS。免费开源，支持 Chrome、Firefox 和 Edge。',
  },
  header: {
    home: 'Stylebot 首页',
    manual: '手册',
    install: '安装',
    language: '语言',
    suggest: '以简体中文查看此页面',
    dismiss: '关闭',
    theme: '主题：{theme}',
  },
  themes: {
    light: '浅色',
    dark: '深色',
    stylebot: 'Stylebot',
    newsprint: '报纸',
  },
  footer: {
    changelog: '更新日志',
    donate: '请我喝杯咖啡',
  },
  store: {
    add: '添加至 {store}',
    addFree: '添加至 {store}，免费',
    reinstall: '为 {store} 重新安装',
  },
  zoom: {
    label: '放大的截图',
    close: '关闭',
  },
  home: {
    title: '随心{word}任何网站。',
    titleWord: '改造',
    titleWordHint: '点击换个样式',
    lede: '指向页面上的任何内容直接修改，或者只需描述你想要的效果。Stylebot 会编写 CSS，并在你每次回访时加载你的样式。',
    also: '也支持 {first} 和 {second}',
    installTitle: '安装 Stylebot',
    installBody:
      '自 2011 年起免费开源。无需账户，没有跟踪。样式保存在你的浏览器中，代码公开在 GitHub 上。',
    cli: '在用编程智能体？添加 <a href="#cli">CLI</a>：',
  },
  cli: {
    copy: '复制',
    copied: '已复制',
    copyCommand: '复制 {command}',
    title: '与你的编程智能体协作',
    body: 'Claude Code、Codex、Cursor 或任何能运行命令的智能体，都可以在终端中使用 Stylebot。',
    guide: '设置 CLI →',
    demo: {
      terminal: '终端 · 编程智能体',
      prompt: '让 {site} 在夜里读起来更舒服',
      done: '深色背景，更暖的文字，更大的衬线正文。广告已移除。',
      before: '修改前',
      after: '修改后',
      kicker: '旅行',
      headline: '夜间渡轮悄然回归',
      dek: '三家运营商押注：旅客愿意放弃速度，换来一间客舱、一片海景，还不用去机场。',
      text: '22:40 从罗斯托克出发的班次悄然启航。等港口的灯光落在身后，大多数乘客已找到自己的客舱，酒吧里也只剩低低的交谈声。',
      ad: '广告',
    },
    page: {
      title: '命令行',
      description:
        '在终端中控制 Stylebot，或让 Claude Code、Codex、Cursor 等编程智能体用你自己的订阅，在浏览器中修改网站样式。',
      heading: '在终端中使用 Stylebot',
      lede: '在命令行中控制 Stylebot，或交给 Claude Code、Codex、Cursor 等编程智能体来做。智能体直接在你的浏览器中修改网站样式，使用你自己的订阅，无需 API 密钥。',
      setup: '开始设置',
      install: '安装 Stylebot',
      installBody: '适用于 Chrome 或 Edge。命令行暂不支持 Firefox。',
      cli: '安装 CLI',
      cliBody: '需要 Node 20 或更高版本。',
      connect: '连接到你的浏览器',
      connectBody: '这会在 Chrome 和 Edge 中注册 CLI，让 Stylebot 能连接到它。',
      access: '开启命令行访问',
      accessBody:
        '在 Stylebot 设置的“基本”中，开启<strong>允许此电脑上的应用控制 Stylebot</strong>，并允许浏览器请求的权限。',
      plugin: '添加 Claude Code 插件',
      optional: '可选',
      pluginBody: '在 Claude Code 中运行：',
      tryIt: '然后试试：',
      commands: '命令',
      commandsBody:
        '智能体会替你运行这些命令，你也可以自己运行。<code>stylebot --help</code> 会列出所有命令。',
      examples: {
        open: '在你当前窗口后方的窗口中打开页面，并输出其标签页 ID。',
        outline: '以概要形式输出页面上的可见元素。',
        css: '将 CSS 保存为该网站的样式并应用，然后检查页面。',
        screenshot: '保存标签页的截图。',
      },
      privacy: '隐私',
      privacyBody: [
        '命令行访问默认关闭，需要你手动开启。开启后，此电脑上的应用可以读取你打开的页面、截取屏幕截图并更改你的样式。随时可以在 Stylebot 的设置中关闭。',
        'Stylebot 和 CLI 只在这台电脑上相互通信，不会向任何地方发送数据。智能体会把它读取的内容发送给自己的服务商，例如 Claude Code 会发送给 Anthropic。',
      ],
    },
  },
  gallery: {
    title: '从这些样式开始',
    lede: '复制一个按喜好调整，或者从零开始。',
    hint: '将它粘贴到 {site} 上的“代码”标签页中。',
    enlarge: '放大 {site}：{name}',
    alt: '用 Stylebot 改造的 {site}：{name}',
    install: '安装',
    installTitle: '安装到 Stylebot',
    installed: '已安装',
    installedAs: '已安装为 {name}',
    installFailed: '无法安装',
    copy: '复制 CSS',
    copied: '已复制',
    source: '在 GitHub 上查看',
    lightbox: '改造后的网站',
    close: '关闭',
  },
  quotes: {
    title: '大家都喜欢 Stylebot',
  },
  features: {
    title: '更多功能。',
    previous: '上一个功能',
    next: '下一个功能',
    sync: {
      title: '同步',
      body: '连接 Google Drive，你的样式就会跟着你到每台登录的电脑上。Stylebot 每 30 分钟同步一次，编辑后也会立即同步。',
      connected: '已连接到 Google 云端硬盘',
      synced: '2 分钟前已同步',
      syncNow: '立即同步',
      savedTo: '保存到',
      disconnect: '断开连接',
      schedule: '计划',
      scheduleValue: '每 30 分钟，以及编辑样式后立即同步',
    },
    history: {
      title: '版本历史',
      body: '样式的每次改动都会保留，最新的在前。打开一条记录即可查看改了什么，一键恢复。',
      today: '今天，9月25日',
      yesterday: '昨天，9月24日',
      noChanges: '无更改',
      edited: '编辑了',
      sites: '10 个网站',
      current: '当前',
      times: ['01:04', '00:41', '23:41'],
    },
    presets: {
      title: '预设',
      body: '简阅和灰度适用于任何网站，并且可以与你自己的改动叠加。',
      readability: '简阅',
      articlesOnly: '仅限文章',
      readabilityBody: '整洁的阅读视图，主题、字体和字号均可自选。',
      grayscale: '灰度',
      grayscaleBody: '将灰度应用于该页面',
    },
    chat: {
      title: '聊天',
      body: '没有编程智能体？在“聊天”标签页中描述改动，Stylebot 就会编写 CSS。使用你自己的 Claude、OpenAI 或 Gemini 密钥，密钥只保存在你的浏览器中。',
      prompt: '让这篇文章在夜里读起来更舒服',
      reply:
        '已换成深色背景和更暖的文字，正文改用更大的衬线字体，并加大了行距。',
      updated: '已更新样式',
      undo: '撤销',
      placeholder: '描述一项改动',
    },
  },
  welcome: {
    title: '欢迎',
    description: '大约一分钟，从头到尾了解 Stylebot 的用法。',
    heading: 'Stylebot 已安装。',
    yourTurn: '轮到你了。',
    yourTurnBody: '打开任意网站，按下快捷键。在你动手之前，什么都不会改变。',
    manual: '手册',
    agentTitle: '连接你的编程智能体',
    agentBody:
      'Claude Code、Codex、Cursor 或任何能运行命令的智能体，都可以在终端中使用 Stylebot。',
    agentPrompt: '给这个网站换上 Everforest 主题，字体也弄好看点',
    agentReply: '已换成 Everforest 配色，字体用了 Lora 和 Newsreader。',
  },
  goodbye: {
    title: '再见',
    description: '感谢使用 Stylebot。',
    panda: '一只挥手告别的像素熊猫',
    heading: '感谢使用 Stylebot。',
    lede: '你的样式已从此浏览器中移除。如果开启过同步，Google Drive 中仍有一份备份。',
    changedMind: '改主意了？',
    note: '我从 2011 年起就一直在做 Stylebot。感谢你试用它，也感谢你留下的任何反馈。',
    signature: '— Ankit',
    feedback: {
      question: '为什么卸载？',
      optional: '选填，只需一秒钟。',
      reasons: [
        '不再需要了',
        '不好用',
        '把某个网站弄坏了',
        '缺少某个功能',
        '太慢',
        '其他原因',
      ],
      placeholder: '还有什么想说的？（选填）',
      send: '发送反馈',
      sendNote: '直接发给维护者。',
      thanks: '谢谢你。每条反馈都会被认真阅读。',
    },
  },
  manual: {
    title: '手册',
    description:
      'Stylebot 使用方法：设置网站样式、方案、命令行、聊天、同步、URL 规则和快捷键。',
    lede: 'Stylebot 怎么用，从你的第一个样式到方案、聊天和同步。',
    sections: '手册章节',
    toc: {
      start: '入门',
      profiles: '方案',
      cli: '命令行',
      chat: '聊天',
      presets: '简阅和灰度',
      sync: '同步、备份和历史',
      urls: 'URL 规则',
      shortcuts: '快捷键',
      help: '帮助和支持',
    },
    start: {
      open: '点击工具栏中的 Stylebot 图标，再点击<strong>设置此页面样式</strong>。也可以在任意标签页按 [[alt+shift+M]]，或右键点击某个元素，选择<strong>Stylebot → 为元素设置样式</strong>。',
      shot: '“基础”标签页，正在选取维基百科文章中的一个链接',
      pick: '点击选取器，在页面上悬停，然后点击某个元素。点击前按 [[↑]] 可改为选中它的父元素。然后在<strong>基础</strong>中修改，或在<strong>代码</strong>中编写 CSS。改动会随时保存，每次访问该网站时都会加载。',
      fonts: '字体',
      fontsBody:
        '可搜索 400 种 <a href="https://fonts.google.com/">Google Fonts</a> 字体，Stylebot 会加载你选中的那一种；也可以输入电脑上已安装的任何字体。',
      position: '编辑器位置',
      positionBody:
        '在 Chrome 和 Edge 中，编辑器会在侧边栏中打开。通过 <strong>⋯</strong> 菜单中的<strong>位置</strong>，可以在独立窗口中打开，或停靠在页面中。Firefox 没有侧边栏。',
      off: '关闭样式',
      offBody:
        '使用弹出式窗口中的开关，或按 [[alt+shift+S]]。样式仍会保留，只是不再应用。',
      callout:
        '有些网站使用自动生成的类名，网站更新时类名会变。如果某个样式失效了，重新选取该元素即可得到新的选择器。',
    },
    profiles: {
      intro:
        '方案是同一网站的另一份样式表，这样你可以保存多套外观并来回切换。同一时间只应用一个方案，每个网站都从“默认”开始。',
      shot: 'Hacker News 上的弹出式窗口，有四个方案：Violet Hour、Everforest、Hearth 和 Newspaper',
      manage:
        '点击编辑器标题栏中网站旁边的方案名称，即可创建、重命名、复制或删除方案。可以在那里或弹出式窗口中切换方案；在弹出式窗口中选择<strong>无样式</strong>可关闭该网站的样式。新方案从空白开始。',
    },
    cli: {
      intro:
        '借助 <code>stylebot</code> 命令，Claude Code、Codex、Cursor 等编程智能体可以直接在你的浏览器中修改网站样式，使用你自己的订阅，无需 API 密钥。这是让智能体设置网站样式的最佳方式，你也可以自己运行这些命令。',
      setup: '配置',
      setupBody:
        '安装 CLI，将它连接到你的浏览器，然后在设置中开启<strong>允许此电脑上的应用控制 Stylebot</strong>。<a href="{cli}">命令行页面</a>会逐步带你完成。目前仅支持 Chrome 和 Edge。',
      claudeCodeBody:
        '添加 Stylebot 插件，然后用 <code>/stylebot</code> 提出改动，例如为某个网站换上深色主题。',
      privacy: '隐私',
      privacyBody:
        '命令行访问默认关闭，需要你手动开启。Stylebot 和 CLI 只在这台电脑上相互通信；智能体会把它读取的内容发送给自己的服务商。',
    },
    chat: {
      intro:
        '聊天最适合快速修改。在“聊天”标签页中描述你想要的改动，Stylebot 就会编写 CSS。可以选取元素来指明要改的地方，也可以附加截图来说明你的意思。更大的改动，比如整套新主题，请使用<a href="#cli">命令行</a>。',
      shot: '“聊天”标签页：在 Hacker News 上要求换成森林主题和易读的衬线字体之后',
      key: '使用你自己的密钥',
      keyBody:
        '连接 Claude、OpenAI 或 Gemini 的 API 密钥。密钥只保存在这台电脑上，从不同步。消息直接从你的浏览器发送到服务商。',
      changes: '改动去了哪里',
      changesBody:
        '每处改动都会立即应用，并添加到当前方案的样式表中。点击<strong>添加了 N 行</strong>可在“代码”中查看，也可以在聊天中撤销。',
      cost: '费用',
      costBody: '消息框下方的 token 数显示这次对话已用的量，并附有预估费用。',
    },
    presets: {
      intro:
        '两者都在“预设”标签页中，并且可以与你自己的改动叠加。<strong>简阅</strong>把网站的文章变成整洁的阅读视图，主题、字体、字号和宽度均可自选；不是文章的页面不受影响。<strong>灰度</strong>去除网站的色彩，强度可调。',
      shot: '维基百科“数学”条目的简阅视图，已打开“阅读设置”',
    },
    sync: {
      shot: '设置页面，已连接到 Google Drive 并完成同步',
      drive: 'Google Drive 同步',
      driveBody:
        '在设置中连接 Google Drive。你的样式（包括方案）每 30 分钟同步一次，编辑后也会立即同步。Stylebot 只能看到它在你的 Drive 中创建的文件，也没有 Stylebot 服务器。',
      conflicts: '冲突',
      conflictsBody:
        '如果同一个样式在两台电脑上都改过，会保留你较新的改动，另一个版本保存在注释中，不会丢失任何内容。',
      backup: '备份',
      backupBody: '在设置中将所有样式导出或导入为 JSON。',
      history: '版本历史',
      historyBody:
        '这台电脑上的每次改动都会保留在设置中，包括通过同步传来的改动。可以把部分或全部网站恢复到任何旧版本。',
      historyShot: '设置中的版本历史，最新的改动在前',
    },
    urls: {
      intro:
        '默认情况下，Stylebot 按域名把样式匹配到网站。如需更精确的匹配，可在设置中编辑样式的 URL，并使用以下模式。',
      wildcards: {
        anything: '匹配任意字符序列。',
        segment: '匹配任意字符序列，直到遇到 /。',
        list: '分隔多个模式。URL 只要匹配其中任一模式即可。',
        regex: '放在 URL 开头时，会把它变成正则表达式。',
      },
      examplesTitle: '示例',
      examples: {
        domain: '域名 docs.google.com 或其任意子域名。',
        prefix: '任何以 docs 开头的 URL。',
        numbered: 'docs.google.com、docs1.google.com、docs2.google.com 等。',
        subdomains: 'news.ycombinator.com 和 apps.ycombinator.com。',
        either: '两个域名之一，或它们的任意子域名。',
        regex: '仅限 Reddit 首页。',
        everywhere: '所有网站。适合想在任何地方都生效的样式。',
      },
    },
    shortcuts: {
      intro:
        '全局快捷键在 Stylebot 能设置样式的任何页面上都有效；可在浏览器的快捷键设置中更改，设置中有链接。编辑器自身的快捷键，请在编辑器中按 [[?]] 查看。',
      or: '或',
      unset: '未设置；请在浏览器中指定',
      global: '全局',
      picker: '选取元素时',
      actions: {
        toggleEditor: '开启/关闭编辑器',
        toggleStyling: '开启/关闭样式',
        toggleReadability: '开启/关闭简阅',
        toggleGrayscale: '开启/关闭灰度',
        parent: '选择父元素',
        child: '返回子元素',
        select: '选择高亮的元素',
      },
    },
    help: {
      body: '发现了 bug 或有新想法？请在 <a href="{issues}">GitHub</a> 上提交 issue。Stylebot 免费开源，自 2011 年起持续维护。如果它对你有用，欢迎<a href="{donate}">请我喝杯咖啡</a>来支持它。',
    },
  },
  privacy: {
    title: '隐私',
    description: 'Stylebot 如何处理你的数据：没有服务器，没有账户，没有分析。',
    lede: 'Stylebot 没有服务器，没有账户，也没有分析统计。除非你开启同步、聊天或命令行，否则你的样式只留在浏览器中；开启后，数据会直接发送到你选择的服务或你允许的应用。',
    updated: '最后更新：{date}',
    browser: {
      title: '保存在浏览器中的内容',
      body: [
        '你的样式、方案、设置、历史记录、聊天记录和 API 密钥都保存在浏览器的扩展程序存储中，卸载 Stylebot 会将它们删除。Stylebot 读取你访问的页面是为了设置样式，除非你使用聊天或命令行，否则不会从中发送任何内容。',
      ],
    },
    sync: {
      title: 'Google Drive 同步',
      body: [
        '在设置中连接 Google Drive 后，你的样式会保存到你自己 Drive 中的一个文件。Stylebot 只能看到它自己创建的文件。它的访问令牌保存在你的浏览器中，一小时后过期。可以在设置或你的 <a href="https://myaccount.google.com/connections">Google 账号</a>中断开连接。',
        'Stylebot 对从 Google API 获取的信息的使用遵守 <a href="https://developers.google.com/terms/api-services-user-data-policy">Google API 服务用户数据政策</a>，包括其中的“有限使用”要求。',
      ],
    },
    chat: {
      title: '聊天',
      body: [
        '添加 API 密钥并发送消息后，浏览器会把以下内容直接发送给该服务商：你的消息、你附加的截图、页面的地址和标题、页面上可见内容的概要，以及页面的 CSS 和你的样式。其中可能包含页面上显示的个人信息，所以不愿与服务商分享的页面，请不要在上面使用聊天。适用各服务商的政策：<a href="https://www.anthropic.com/legal/privacy">Anthropic</a>、<a href="https://openai.com/policies/privacy-policy/">OpenAI</a>、<a href="https://ai.google.dev/gemini-api/terms">Google</a>。',
      ],
    },
    cli: {
      title: '命令行',
      body: [
        '在设置中开启<q>允许此电脑上的应用控制 Stylebot</q>后，以你的身份运行的应用就能通过只有你能使用的本地连接，列出你的标签页、读取页面、截取屏幕截图，以及读取和更改你的样式。它们读取的内容可能会发送到它们所用的服务，例如编程智能体背后的模型。关闭此选项即可断开连接。',
      ],
    },
    fonts: {
      title: '字体和导入的 CSS',
      body: [
        '样式中的 Google Fonts 字体从 Google 下载，Google 会看到你的 IP 地址。通过 <code>@import</code> 引入的样式表会从其地址获取。',
      ],
    },
    site: {
      title: '本网站',
      body: [
        'stylebot.dev 没有广告或 Cookie，托管在 GitHub Pages 上，GitHub Pages 会保留标准的服务器日志。Plausible 按页面、来源、国家/地区和设备类型统计访问量，不使用 Cookie，也不记录任何能识别你身份的信息。',
      ],
    },
    sharing: {
      title: '数据共享',
      body: [
        'Stylebot 不会收集、出售或共享你的数据。只有在你使用上述服务时，数据才会离开你的浏览器，发送到这些服务。',
      ],
    },
    contact: {
      title: '变更和联系方式',
      body: [
        '本政策的变更记录在 <a href="{history}">GitHub 上的网站历史</a>中。如有疑问，请发送邮件至 <a href="mailto:{email}">{email}</a>，或提交 <a href="{issues}">GitHub issue</a>。',
      ],
    },
    translation:
      '本页为译文。如与<a href="{original}">英文版本</a>有出入，以英文版本为准。',
  },
  releases: {
    title: '{version} 新功能',
    bugFixes: '还有大量<a href="{changelog}">问题修复</a>',
    sections: '章节',
    r31: {
      description:
        'Stylebot 3.1 新增通过 Google Drive 同步和备份、可调整大小的编辑器以及调色板。',
      syncTitle: '通过 Google Drive 同步和备份',
      syncAlt: '通过 Google Drive 同步样式',
      syncBody: [
        '在 Stylebot 的<strong>设置页面</strong>中开启并授权 Google Drive 同步。',
        '开启后，在弹出式窗口或设置页面中点击<strong>立即同步</strong>，即可将浏览器中的样式与 Google Drive 上备份的样式同步。',
      ],
      resizeTitle: '调整 Stylebot 编辑器大小',
      resizeAlt: '正在调整 Stylebot 编辑器的大小',
      resizeBody:
        '现在可以调整 Stylebot 编辑器的大小，还可以选择让页面收窄，避免内容被编辑器挡住。',
      colorsTitle: '调色板',
      colorsAlt: '从调色板中选取颜色',
      colorsBody: '改进后的取色器带有调色板，更容易挑出好看的颜色。',
    },
    r32: {
      description:
        'Stylebot 3.2 带来更快、无闪烁的样式应用，重新设计的简阅模式，以及更简洁的弹出式窗口。',
      lede: 'Stylebot 重新开始积极开发，后续还有更多更新。',
      fasterTitle: '更快、无闪烁的样式应用',
      fasterBody:
        'CSS 现在会缓存并即时应用，页面不再在样式加载前闪现未修改的样子，整体也更加流畅。',
      readabilityTitle: '重新设计的简阅模式',
      readabilityAlt: '简阅模式新的内嵌主题和排版控件',
      readabilityItems: [
        '更新的文章提取算法，页面清理效果更好',
        '启动更快，在页面其余部分加载完成前就会应用',
        '可直接调整主题和排版',
        '更流畅的加载动画',
        '可用快捷键开启/关闭',
      ],
      popupTitle: '更简洁的弹出式窗口',
      popupAlt: '重新设计的 Stylebot 弹出式窗口',
      popupItems: ['整行均可点击的开关', '直达设置的按钮', '支持深色模式'],
    },
    r40: {
      description:
        'Stylebot 4.0 带来重新设计的编辑器、面向编程智能体的命令行、方案、侧边栏、聊天、版本历史和同步。',
      lede: '重新设计的编辑器、面向编程智能体的命令行、方案和侧边栏。',
      toc: {
        editor: '重新设计的编辑器',
        cli: '命令行',
        profiles: '方案',
        panel: '侧边栏',
        history: '版本历史',
        sync: '同步',
        chat: '聊天',
        more: '更多',
      },
      editorTitle: '重新设计的编辑器',
      editorAlt:
        '重新设计的“基础”标签页，正在用 Newspaper 方案修改 Hacker News 的样式',
      editorBody: '从零开始重建，现在支持深色模式。',
      editorItems: [
        '分组的控件，显示页面自身的值',
        '更好的选择器生成：网站更新后选择器依然有效，还有其他选择器可选',
        '值被其他规则覆盖时会标明',
        '调色板和取色器',
        '悬停在颜色或字体上，即可在页面上预览',
        '在“更多属性”中直接编辑其他任何 CSS 属性',
        '支持撤销',
      ],
      profilesTitle: '方案',
      profilesAlt: '某个网站的弹出式窗口，有 Dracula 和 Gruvbox 两个方案',
      profilesBody: '为一个网站保存多套外观，可在编辑器或弹出式窗口中切换。',
      panelTitle: '侧边栏或独立窗口',
      panelAlt: '编辑器菜单，“位置”设为侧边栏',
      panelBody:
        '在 Chrome 和 Edge 中，编辑器会在侧边栏中打开。也可以通过编辑器 <strong>⋯</strong> 菜单中的<strong>位置</strong>，把它弹出到独立窗口中。',
      historyTitle: '版本历史',
      historyBody: '每次改动都会保留，可恢复到任何旧版本。',
      syncTitle: '同步',
      syncBody:
        'Google Drive 同步更加稳定，会合并来自不同电脑的改动，不会丢失任何内容。每 30 分钟自动同步一次，编辑后也会立即同步。',
      chatTitle: '聊天',
      chatBody:
        '没有编程智能体？描述你想要的效果，或选一个推荐的风格，Stylebot 就会编写 CSS。使用你自己的 Claude、OpenAI 或 Gemini 密钥。',
      chatAlt: '“聊天”标签页为页面推荐的风格：“温馨”“宁静”和“只有链接是彩色”',
      moreTitle: '更多',
      moreItems: [
        '全新的 stylebot.dev',
        '全新的 Stylebot 图标',
        '样式现在也能应用到 Shadow DOM 内部，在用 Web Components 构建的网站上同样有效',
        'Stylebot 的快捷键现在在浏览器的快捷键设置中管理。在 Chrome 和 Edge 中，你改过的快捷键已恢复为默认值，请在那里重新设置。',
        'Stylebot 现已支持越南语',
      ],
    },
  },
  notFound: {
    title: '找不到页面',
    description: '此页面不存在。',
    heading: '此页面不存在，而且难看极了。',
    done: '好多了。这个页面依然不存在，但至少现在好看了。',
    pageTitle: '404 Not Found',
    pageBody: '在此服务器上找不到请求的 URL。',
    pageLink: '返回首页',
    nice: '✨ 直接变好看',
  },
};

export default site;
