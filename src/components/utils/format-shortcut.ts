const isMac = (): boolean =>
  /mac/i.test(navigator.platform || navigator.userAgent);

// Arrow glyphs read the same everywhere — unlike the modifier keys below,
// there's no OS-specific spelling to pick between.
const ARROW_SYMBOLS: Record<string, string> = {
  arrowup: '↑',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
};

// Special keys that read the same everywhere, like the arrows above.
const KEY_LABELS: Record<string, string> = {
  escape: 'Esc',
};

const MAC_SYMBOLS: Record<string, string> = {
  alt: '⌥',
  option: '⌥',
  ctrl: '⌃',
  control: '⌃',
  shift: '⇧',
  command: '⌘',
  meta: '⌘',
  ...ARROW_SYMBOLS,
  ...KEY_LABELS,
};

// Command/Meta on non-Mac keyboards is the Windows/Super key, so label it
// accordingly rather than showing the Mac-only ⌘ symbol.
const WORD_LABELS: Record<string, string> = {
  alt: 'Alt',
  option: 'Alt',
  ctrl: 'Ctrl',
  control: 'Ctrl',
  shift: 'Shift',
  command: 'Win',
  meta: 'Win',
  ...ARROW_SYMBOLS,
  ...KEY_LABELS,
};

// Modifiers get a proper icon glyph on macOS instead of a relying on a
// Unicode symbol, whose look varies a lot across fonts and platforms.
export type ModifierIcon = 'option' | 'shift' | 'command' | 'control';

const MAC_ICONS: Record<string, ModifierIcon> = {
  alt: 'option',
  option: 'option',
  shift: 'shift',
  command: 'command',
  meta: 'command',
  ctrl: 'control',
  control: 'control',
};

export type ShortcutPart = {
  text: string;
  icon?: ModifierIcon;
};

export type FormattedShortcut = {
  parts: Array<ShortcutPart>;
  joiner: string;
};

/**
 * Splits a combo string (e.g. "alt+shift+r") into display parts: an icon
 * per modifier with no separator on macOS (⌥⇧R), or words joined by "+"
 * elsewhere (Alt+Shift+R).
 */
export const formatShortcut = (
  combo: string,
  mac = isMac()
): FormattedShortcut => {
  if (combo === '') {
    return { parts: [{ text: '–' }], joiner: '' };
  }

  const raw = combo.split('+');

  return mac
    ? {
        parts: raw.map(part => {
          const key = part.toLowerCase();
          const icon = MAC_ICONS[key];

          return icon
            ? { text: MAC_SYMBOLS[key], icon }
            : { text: MAC_SYMBOLS[key] ?? part.toUpperCase() };
        }),
        joiner: '',
      }
    : {
        parts: raw.map(part => ({
          text: WORD_LABELS[part.toLowerCase()] ?? part.toUpperCase(),
        })),
        joiner: '+',
      };
};
