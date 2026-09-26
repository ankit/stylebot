export type Patch = Record<string, unknown> & {
  cur?: string;
  click?: number;
  qType?: boolean;
  keyType?: boolean;
  chatType?: boolean;
};

export type Scene = {
  title: string;
  body: string;
  dur: number;
  acts: [number, Patch][];
};

export const INIT = {
  codeScroll: false,
  qChars: 0,
  agentTheme: false,
  prov: null as string | null,
  keyFocus: false,
  keyLen: 0,
  keySaving: false,
  keyOk: false,
  chatDraft: 0,
  chatSent: false,
  chatThinking: false,
  chatReplied: false,
  thinkT: 0,
  pinned: true,
  menuOpen: false,
  popOpen: false,
  editorOpen: false,
  inspecting: false,
  hover: null as string | null,
  sel: null as string | null,
  h1Size: 32,
  h1Color: null as string | null,
  read: false,
  gray: false,
  keys: false,
  keyDown: false,
  caption: '',
  tab: 'basic',
  focus: null as string | null,
};

export type DemoState = typeof INIT;

export const SCENES: Scene[] = [
  {
    title: 'Open the editor',
    body: 'Click the icon, then Style this page. Or press alt shift M.',
    dur: 6600,
    acts: [
      [0, { caption: 'Click the Stylebot icon.', cur: 'sbicon' }],
      [700, { click: 1, popOpen: true }],
      [
        1500,
        {
          cur: 'style-btn',
          caption:
            'The popup shows this site’s status. Style this page opens the editor.',
        },
      ],
      [2700, { click: 1, popOpen: false, editorOpen: true, inspecting: true }],
      [
        3500,
        {
          keys: true,
          cur: 'h1',
          caption: 'Next time, skip the popup: alt shift M.',
        },
      ],
      [4300, { keyDown: true }],
      [4600, { keyDown: false }],
      [5800, { keys: false }],
    ],
  },
  {
    title: 'Pick an element',
    body: 'The picker is on when the editor opens. Hover, then click to select.',
    dur: 5600,
    acts: [
      [
        0,
        {
          inspecting: true,
          caption: 'The picker is already on. Hover to see what can be styled.',
          cur: 'header',
        },
      ],
      [600, { hover: 'header' }],
      [2000, { cur: 'h1' }],
      [2600, { hover: 'h1' }],
      [
        3600,
        {
          click: 1,
          sel: 'h1',
          hover: null,
          inspecting: false,
          caption: 'Click to select. The selector fills in for you.',
        },
      ],
    ],
  },
  {
    title: 'Change it',
    body: 'Set size, colour and spacing in Basic. Every change is saved as CSS.',
    dur: 8400,
    acts: [
      [0, { caption: 'Set the size…', cur: 'size' }],
      [800, { click: 1, focus: 'size' }],
      [1200, { h1Size: 36 }],
      [1450, { h1Size: 40 }],
      [1700, { h1Size: 44 }],
      [2400, { cur: 'color', caption: '…and the colour.' }],
      [3200, { click: 1, focus: 'color' }],
      [3600, { h1Color: '#b0303a' }],
      [
        4400,
        {
          focus: null,
          cur: 'tab-code',
          caption: 'Every change is plain CSS, ready to edit.',
        },
      ],
      [5200, { click: 1, tab: 'code' }],
      [
        6400,
        { caption: 'Saved for this site. It loads every time you visit.' },
      ],
    ],
  },
  {
    title: 'Write CSS',
    body: 'The Code tab is a full stylesheet. The page updates as you type.',
    dur: 8200,
    acts: [
      [0, { caption: 'Or write CSS by hand in the Code tab.', cur: 'code' }],
      [800, { click: 1, qType: true }],
      [4200, { cur: 'quote', caption: 'The quote restyles as you type.' }],
    ],
  },
  {
    title: 'Describe it',
    body: 'Add your Claude or OpenAI key and tell the Stylebot agent what you want. It writes the CSS.',
    dur: 16000,
    acts: [
      [
        0,
        {
          caption: 'The Stylebot agent lives in the Chat tab.',
          cur: 'tab-chat',
        },
      ],
      [800, { click: 1, tab: 'chat' }],
      [
        1500,
        {
          caption: 'Bring your own key: pick Claude or OpenAI.',
          cur: 'prov-claude',
        },
      ],
      [2200, { click: 1, prov: 'claude' }],
      [2800, { cur: 'key-input' }],
      [3400, { click: 1, keyFocus: true, keyType: true }],
      [4700, { cur: 'key-save', keyFocus: false }],
      [5300, { click: 1, keySaving: true }],
      [
        5900,
        {
          keySaving: false,
          keyOk: true,
          caption: 'Connected. The key stays in your browser.',
        },
      ],
      [
        6600,
        {
          cur: 'chat-input',
          chatType: true,
          caption: 'Now ask for anything, even a whole theme.',
        },
      ],
      [8400, { click: 1, chatSent: true, chatDraft: 0 }],
      [8800, { chatThinking: true, thinkT: 0 }],
      [9200, { thinkT: 400 }],
      [9600, { thinkT: 800 }],
      [
        10000,
        {
          chatThinking: false,
          chatReplied: true,
          agentTheme: true,
          caption: 'The agent applies the change and sums up what it did.',
        },
      ],
      [11600, { cur: 'view-code' }],
      [12400, { click: 1, tab: 'code' }],
      [
        12800,
        {
          codeScroll: true,
          caption: 'The full CSS lands in the Code tab, ready to edit.',
        },
      ],
    ],
  },
];

export const QUOTE_CSS = [
  { k: 'font', txt: 'font-family: Lora, serif;' },
  { k: 'size', txt: 'font: italic 20px/1.45;' },
  { k: 'bg', txt: 'background: #faf4ee;' },
  { k: 'pad', txt: 'padding: 18px 20px;' },
  { k: 'radius', txt: 'border-radius: 8px;' },
  { k: 'border', txt: 'border-left: 3px solid #c2410c;' },
];

export const QUOTE_TOTAL = QUOTE_CSS.reduce((a, q) => a + q.txt.length, 0);

export const AGENT_CSS: [string, [string, string][]][] = [
  [
    'body',
    [
      ['background', '#2d353b'],
      ['color', '#d3c6aa'],
      ['font-family', 'Lora, Georgia, serif'],
    ],
  ],
  [
    '.site-header',
    [
      ['background', '#343f44'],
      ['border-bottom', '1px solid #859289'],
      ['color', '#d3c6aa'],
    ],
  ],
  ['.kicker', [['color', '#a7c080']]],
  [
    'article h1',
    [
      ['font-family', 'Newsreader, serif'],
      ['font-weight', '600'],
      ['color', '#e69875'],
    ],
  ],
  ['.dek, .byline', [['color', '#859289']]],
  ['.avatar', [['background', '#83c092']]],
  ['article p', [['color', '#d3c6aa']]],
  [
    'blockquote',
    [
      ['background', '#343f44'],
      ['border-left-color', '#e69875'],
    ],
  ],
  ['a', [['color', '#7fbbb3']]],
  ['a:hover', [['color', '#e69875']]],
  ['::selection', [['background', '#343f44']]],
];

export const CHAT_MSG = 'give this site an Everforest theme with nicer fonts';

export const KEY_LEN = 24;

export const PIN_SCENE: Scene = {
  title: 'Pin it to the toolbar',
  body: 'Stylebot starts in the extensions menu. Pin it so it stays one click away.',
  dur: 6000,
  acts: [
    [0, { caption: 'Stylebot starts in the extensions menu.', cur: 'puzzle' }],
    [900, { click: 1, menuOpen: true }],
    [1800, { cur: 'pin' }],
    [2700, { click: 1, pinned: true }],
    [
      3400,
      {
        menuOpen: false,
        cur: 'sbicon',
        caption: 'Pinned. Stylebot is now in your toolbar.',
      },
    ],
  ],
};
