const isMac = (): boolean => /mac/i.test(navigator.platform || navigator.userAgent);

const MAC_SYMBOLS: Record<string, string> = {
  alt: '⌥',
  option: '⌥',
  ctrl: '⌃',
  control: '⌃',
  shift: '⇧',
  command: '⌘',
  meta: '⌘',
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
};

export type FormattedShortcut = {
  parts: string[];
  joiner: string;
};

/**
 * Splits a combo string (e.g. "alt+shift+r") into display parts: compact
 * symbols on macOS (⌥⇧R), or words joined by "+" elsewhere (Alt+Shift+R).
 */
export const formatShortcut = (combo: string, mac = isMac()): FormattedShortcut => {
  const raw = combo === '' ? [] : combo.split('+');

  return mac
    ? { parts: raw.map(part => MAC_SYMBOLS[part] ?? part.toUpperCase()), joiner: '' }
    : { parts: raw.map(part => WORD_LABELS[part] ?? part.toUpperCase()), joiner: '+' };
};
