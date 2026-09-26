export type ThemeKey =
  'light' | 'dark' | 'sepia' | 'riso' | 'newsprint' | 'midnight';

type Theme = { label: string } & Record<string, string>;

const publicSans = "'Public Sans',system-ui,sans-serif";
const plexMono = "'IBM Plex Mono',ui-monospace,monospace";

const lightCode = {
  csel: '#800000',
  cbr: '#0000ff',
  cprop: '#e50000',
  cval: '#0451a5',
  cnum: '#098658',
  ccom: '#008000',
};

const darkCode = {
  csel: '#f7768e',
  cbr: '#89ddff',
  cprop: '#7aa2f7',
  cval: '#e0af68',
  cnum: '#ff9e64',
  ccom: '#6b7394',
};

export const THEMES: Record<ThemeKey, Theme> = {
  light: {
    label: 'Light',
    ui: publicSans,
    display: publicSans,
    mono: plexMono,
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
    acc: '#2a5fd6',
    acctint: '#f3f6fd',
    accline: '#e2e9fa',
    ...lightCode,
  },
  dark: {
    label: 'Dark',
    ui: publicSans,
    display: publicSans,
    mono: plexMono,
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
    acc: '#4d80f0',
    acctint: '#1f2330',
    accline: '#2b3140',
    ...darkCode,
  },
  sepia: {
    label: 'Sepia',
    ui: publicSans,
    display: publicSans,
    mono: plexMono,
    surface: '#fbf8f2',
    sunken: '#f4efe5',
    fill: '#efe9dd',
    hover: '#ebe4d6',
    track: '#e6dfd0',
    border: '#e3dccd',
    strong: '#d2c9b6',
    ink: '#2b2620',
    ink2: '#4a4237',
    muted: '#6c6252',
    faint: '#978c79',
    acc: '#a8511d',
    acctint: '#f6eadf',
    accline: '#ecd6c6',
    csel: '#8a2f1a',
    cbr: '#5b4a8a',
    cprop: '#a8511d',
    cval: '#2f5d7c',
    cnum: '#4f7a3a',
    ccom: '#8a8171',
  },
  riso: {
    label: 'Riso',
    ui: "'Bricolage Grotesque',system-ui,sans-serif",
    display: "'Bricolage Grotesque',system-ui,sans-serif",
    mono: "'Space Mono',ui-monospace,monospace",
    surface: '#fffaf0',
    sunken: '#f7efdc',
    fill: '#f3e8cf',
    hover: '#efe2c4',
    track: '#eadbb8',
    border: '#e6d7b3',
    strong: '#d6c294',
    ink: '#1d1a4f',
    ink2: '#2f2b6b',
    muted: '#5a5580',
    faint: '#8e88a8',
    acc: '#ff4f8b',
    acctint: '#ffe6ef',
    accline: '#ffc2d7',
    ...lightCode,
    cprop: '#d2336b',
    cval: '#2f45c4',
  },
  newsprint: {
    label: 'Newsprint',
    ui: "'DM Sans',system-ui,sans-serif",
    display: "'Newsreader',Georgia,serif",
    mono: plexMono,
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
    acc: '#c2261b',
    acctint: '#f8e5e1',
    accline: '#efc4bd',
    ...lightCode,
  },
  midnight: {
    label: 'Midnight',
    ui: "'Space Grotesk',system-ui,sans-serif",
    display: "'Space Grotesk',system-ui,sans-serif",
    mono: "'JetBrains Mono',ui-monospace,monospace",
    surface: '#121630',
    sunken: '#0b0e22',
    fill: '#181d3d',
    hover: '#1d2348',
    track: '#222955',
    border: '#262d5c',
    strong: '#343d78',
    ink: '#eef0ff',
    ink2: '#c9cdf2',
    muted: '#9aa0d0',
    faint: '#6f76a8',
    acc: '#c6ff3d',
    acctint: '#232b3a',
    accline: '#3c4a2a',
    ...darkCode,
  },
};

export const THEME_KEYS = Object.keys(THEMES) as ThemeKey[];

export const STORAGE_KEY = 'stylebot-site-theme';

/**
 * Whether a theme has a dark page, which also switches the product mocks
 * to the dark editor palette.
 */
export function isDarkTheme(key: string): boolean {
  return key === 'dark' || key === 'midnight';
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
    `:root[data-theme="dark"] [data-ed],:root[data-theme="midnight"] [data-ed]{${vars(THEMES.dark)}}`,
  ];
  return rules.join('\n');
}
