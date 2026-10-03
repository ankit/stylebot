export type ThemeKey = 'light' | 'dark' | 'stylebot' | 'newsprint';

type Theme = { label: string } & Record<string, string>;

const geist = "'Geist',system-ui,sans-serif";
const geistMono = "'Geist Mono',ui-monospace,monospace";

const lightCode = {
  csel: '#b8406c',
  cbr: '#8b919c',
  cprop: '#2a7f99',
  cval: '#9a6a1f',
  cnum: '#9a6a1f',
  ccom: '#8b919c',
};

export const THEMES: Record<ThemeKey, Theme> = {
  light: {
    label: 'Light',
    ui: geist,
    display: geist,
    mono: geistMono,
    surface: '#ffffff',
    sunken: '#f7f8fa',
    fill: '#f5f6f8',
    hover: '#f2f3f6',
    track: '#eceef2',
    border: '#e6e8ec',
    strong: '#d3d6dd',
    ink: '#191b1f',
    ink2: '#3f4550',
    muted: '#5f6672',
    faint: '#8b919c',
    acc: '#2563eb',
    acctint: '#f2f6fe',
    accline: '#dfe8fc',
    ...lightCode,
  },
  dark: {
    label: 'Dark',
    ui: geist,
    display: geist,
    mono: geistMono,
    surface: '#1c1e22',
    sunken: '#15171a',
    fill: '#212429',
    hover: '#26292e',
    track: '#2a2d33',
    border: '#2c2f35',
    strong: '#3a3f47',
    ink: '#e8eaee',
    ink2: '#c9ced6',
    muted: '#a3aab6',
    faint: '#7d8593',
    acc: '#5b8cf5',
    acctint: '#1f2330',
    accline: '#2b3140',
    csel: '#f4a3bf',
    cbr: '#8b919c',
    cprop: '#93d3e6',
    cval: '#f0d38a',
    cnum: '#f0d38a',
    ccom: '#7d8593',
  },
  stylebot: {
    label: 'Stylebot',
    ui: geist,
    display: "'Gabarito','Geist',system-ui,sans-serif",
    mono: geistMono,
    link: '#e8ad2a',
    surface: '#1b1917',
    sunken: '#131210',
    fill: '#201e1b',
    hover: '#272421',
    track: '#2d2a26',
    border: '#2f2c28',
    strong: '#3e3a35',
    ink: '#f5f1ea',
    ink2: '#d6d0c6',
    muted: '#a8a196',
    faint: '#7d776d',
    acc: '#ef5f93',
    acctint: '#2c1e23',
    accline: '#4a2b36',
    csel: '#ef5f93',
    cbr: '#8f887d',
    cprop: '#3cb6dc',
    cval: '#e8ad2a',
    cnum: '#e8ad2a',
    ccom: '#7d776d',
  },
  newsprint: {
    label: 'Newsprint',
    ui: geist,
    display: "'Newsreader',Georgia,serif",
    mono: geistMono,
    surface: '#fbfaf6',
    sunken: '#f1efe8',
    fill: '#ebe8de',
    hover: '#e6e2d6',
    track: '#e1ddcf',
    border: '#dcd7c8',
    strong: '#c7c0ac',
    ink: '#161512',
    ink2: '#33312b',
    muted: '#5d5a50',
    faint: '#8d897c',
    acc: '#0f7391',
    acctint: '#e3f0f3',
    accline: '#bfdde5',
    ...lightCode,
  },
};

export const THEME_KEYS = Object.keys(THEMES) as ThemeKey[];

export const DARK_THEMES: ThemeKey[] = ['dark', 'stylebot'];

export const STORAGE_KEY = 'stylebot-site-theme';

/**
 * Whether a theme has a dark page, which also switches the product mocks
 * to the dark editor palette.
 */
export function isDarkTheme(key: string): boolean {
  return DARK_THEMES.includes(key as ThemeKey);
}

function vars(theme: Theme): string {
  return Object.entries(theme)
    .filter(([name]) => name !== 'label')
    .map(([name, value]) => `--${name}:${value}`)
    .join(';');
}

/**
 * Builds the stylesheet that maps each `data-theme` on <html> to its tokens.
 * Product mocks (`[data-ed]`) always use the light or dark editor palette.
 */
export function themeStylesheet(): string {
  const rules = [
    `:root{${vars(THEMES.light)}}`,
    ...THEME_KEYS.map(
      (key) => `:root[data-theme="${key}"]{${vars(THEMES[key])}}`,
    ),
    `[data-ed]{${vars(THEMES.light)}}`,
    `${DARK_THEMES.map((key) => `:root[data-theme="${key}"] [data-ed]`).join(',')}{${vars(THEMES.dark)}}`,
  ];
  return rules.join('\n');
}
