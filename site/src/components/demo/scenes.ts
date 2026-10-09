export type Patch = Record<string, unknown> & {
  cur?: string;
  click?: number;
  qType?: boolean;
  profType?: boolean;
};

export type Scene = {
  title: string;
  body: string;
  dur: number;
  acts: [number, Patch][];
};

export const NEW_PROFILE = 'Newspaper';

export const INIT = {
  qChars: 0,
  lookStep: 0,
  lookDone: false,
  pinned: true,
  menuOpen: false,
  popOpen: false,
  popHover: false,
  editorOpen: false,
  inspecting: false,
  hover: null as string | null,
  sel: null as string | null,
  h1Size: 32,
  h1Color: null as string | null,
  read: false,
  gray: false,
  caption: '',
  tab: 'basic',
  focus: null as string | null,
  profile: 'Default',
  profiles: ['Default'],
  profMenu: false,
  profCreating: false,
  profLen: 0,
};

export type DemoState = typeof INIT;

export const SCENES: Scene[] = [
  {
    title: 'Open the editor',
    body: 'Click the icon, or press {keys}.',
    dur: 4600,
    acts: [
      [
        0,
        {
          caption: 'Click the Stylebot icon, then Style this page.',
          cur: 'sbicon',
        },
      ],
      [1100, { click: 1, popOpen: true }],
      [1900, { cur: 'style-btn', popHover: true }],
      [
        2900,
        {
          click: 1,
          popOpen: false,
          popHover: false,
          editorOpen: true,
          inspecting: true,
          caption: 'Or press {keys} to open it directly.',
        },
      ],
    ],
  },
  {
    title: 'Pick an element',
    body: 'Click to select. Fields show its current styles.',
    dur: 5000,
    acts: [
      [
        0,
        {
          inspecting: true,
          caption: 'Hover to see what can be styled.',
          cur: 'header',
        },
      ],
      [600, { hover: 'header' }],
      [1300, { cur: 'h1' }],
      [1700, { hover: 'h1' }],
      [
        2500,
        {
          click: 1,
          sel: 'h1',
          hover: null,
          inspecting: false,
          caption: 'Click to select. The selector fills in for you.',
        },
      ],
      [
        3500,
        {
          cur: 'font-field',
          caption: 'Each field shows the element’s current computed value.',
        },
      ],
    ],
  },
  {
    title: 'Style it',
    body: 'Use the Basic controls or write CSS.',
    dur: 13800,
    acts: [
      [0, { caption: 'Set the size…', cur: 'size' }],
      [800, { click: 1, focus: 'size' }],
      [1200, { h1Size: 36 }],
      [1450, { h1Size: 40 }],
      [1700, { h1Size: 44 }],
      [2400, { cur: 'color', caption: '…and the color.' }],
      [3200, { click: 1, focus: 'color' }],
      [3600, { h1Color: '#b0303a' }],
      [
        4400,
        {
          focus: null,
          cur: 'tab-code',
          caption: 'Every change is plain CSS, saved for this site.',
        },
      ],
      [5200, { click: 1, tab: 'code' }],
      [6200, { caption: 'Or write CSS by hand.', cur: 'code' }],
      [7000, { click: 1, qType: true }],
      [10400, { cur: 'quote', caption: 'The page updates as you type.' }],
    ],
  },
  {
    title: 'Profiles',
    body: 'Save different looks for the same site.',
    dur: 10000,
    acts: [
      [
        0,
        {
          caption: 'Save different looks for the same site.',
          cur: 'prof-btn',
        },
      ],
      [800, { click: 1, profMenu: true }],
      [
        1600,
        { cur: 'prof-create', caption: 'Create a profile for a new look.' },
      ],
      [2300, { click: 1, profCreating: true, profType: true }],
      [
        3500,
        {
          profMenu: false,
          profile: NEW_PROFILE,
          lookDone: false,
          lookStep: 0,
          caption: 'Newspaper starts clean. Default is still saved.',
        },
      ],
      [
        3900,
        {
          profCreating: false,
          profLen: 0,
          profiles: ['Default', NEW_PROFILE],
        },
      ],
      [4600, { lookStep: 1, caption: 'Give it a newspaper look.' }],
      [4900, { lookStep: 2 }],
      [5200, { lookStep: 3 }],
      [5500, { lookStep: 4 }],
      [5800, { lookStep: 5 }],
      [6100, { lookDone: true }],
      [6800, { cur: 'prof-btn', caption: 'Switch between them anytime.' }],
      [7400, { click: 1, profMenu: true }],
      [8000, { cur: 'prof-Default' }],
      [
        8500,
        {
          click: 1,
          profMenu: false,
          profile: 'Default',
          caption: 'Back to Default. One site, two looks.',
        },
      ],
    ],
  },
];

/**
 * How many steps the look lands in: page and text, then the header and fonts,
 * the headline, secondary text, and the quote.
 */
export const LOOK_STEPS = 5;

export const QUOTE_CSS = [
  { k: 'font', txt: 'font-family: Lora, serif;' },
  { k: 'size', txt: 'font: italic 20px/1.45;' },
  { k: 'bg', txt: 'background: #faf4ee;' },
  { k: 'pad', txt: 'padding: 18px 20px;' },
  { k: 'radius', txt: 'border-radius: 8px;' },
  { k: 'border', txt: 'border-left: 3px solid #c2410c;' },
];

export const QUOTE_TOTAL = QUOTE_CSS.reduce((a, q) => a + q.txt.length, 0);

type Look = {
  serif: boolean;
  css: [string, [string, string][]][];
  colors: {
    bg: string;
    panel: string;
    ink: string;
    head: string;
    muted: string;
    acc: string;
    line: string;
    avatar: string;
  };
};

/**
 * The look the Profiles scene gives the new profile: a morning newspaper on a
 * light site, a warm dark theme on a dark one, so it suits the page.
 */
export const LOOKS: Record<'light' | 'dark', Look> = {
  light: {
    serif: true,
    css: [
      [
        'body',
        [
          ['background', '#f4ecdb'],
          ['color', '#161513'],
          ['font-family', 'Newsreader, Georgia, serif'],
        ],
      ],
      [
        '.site-header',
        [
          ['background', '#ebe1cc'],
          ['border-bottom', '1px solid #161513'],
          ['color', '#161513'],
        ],
      ],
      ['.kicker', [['color', '#161513']]],
      [
        'article h1',
        [
          ['font-weight', '600'],
          ['color', '#161513'],
        ],
      ],
      ['.dek, .byline', [['color', '#6b6458']]],
      ['.avatar', [['background', '#3d3a33']]],
      ['article p', [['color', '#2b2924']]],
      [
        'blockquote',
        [
          ['background', '#ebe1cc'],
          ['border-left-color', '#161513'],
        ],
      ],
      ['hr, section + section', [['border-top', '1px solid #b9b09c']]],
      [
        'a',
        [
          ['color', '#161513'],
          ['text-decoration', 'underline'],
        ],
      ],
      ['::selection', [['background', '#e0d4b8']]],
    ],
    colors: {
      bg: '#f4ecdb',
      panel: '#ebe1cc',
      ink: '#161513',
      head: '#161513',
      muted: '#6b6458',
      acc: '#161513',
      line: '#161513',
      avatar: '#3d3a33',
    },
  },
  dark: {
    serif: false,
    css: [
      [
        'body',
        [
          ['background', '#1a1512'],
          ['color', '#e8dfcf'],
        ],
      ],
      [
        '.site-header',
        [
          ['background', '#251e19'],
          ['border-bottom', '1px solid #3a3029'],
          ['color', '#e8dfcf'],
        ],
      ],
      ['.kicker', [['color', '#e0a44a']]],
      [
        'article h1',
        [
          ['font-weight', '600'],
          ['color', '#f1e9da'],
        ],
      ],
      ['.dek, .byline', [['color', '#a39886']]],
      ['.avatar', [['background', '#8a6a3a']]],
      ['article p', [['color', '#d9cfbe']]],
      ['img, .photo', [['filter', 'brightness(.85)']]],
      [
        'blockquote',
        [
          ['background', '#251e19'],
          ['border-left-color', '#e0a44a'],
        ],
      ],
      ['hr, section + section', [['border-top', '1px solid #3a3029']]],
      [
        'a',
        [
          ['color', '#e0a44a'],
          ['text-decoration', 'underline'],
        ],
      ],
      ['::selection', [['background', '#4a3b22']]],
    ],
    colors: {
      bg: '#1a1512',
      panel: '#251e19',
      ink: '#d9cfbe',
      head: '#f1e9da',
      muted: '#a39886',
      acc: '#e0a44a',
      line: '#3a3029',
      avatar: '#8a6a3a',
    },
  },
};

export const PIN_SCENE: Scene = {
  title: 'Pin it to the toolbar',
  body: 'Keep Stylebot one click away.',
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
