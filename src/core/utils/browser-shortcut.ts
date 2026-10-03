/*
 * Browsers describe a command's shortcut as "Alt+Shift+M", or with symbols
 * ("⌥⇧M") in Chrome on macOS. Stylebot keeps shortcuts in its own combo
 * format ("alt+shift+m"), which the recorder writes and the chips display.
 */

const SYMBOL_MODIFIERS: Record<string, string> = {
  '⌃': 'ctrl',
  '⌥': 'alt',
  '⇧': 'shift',
  '⌘': 'command',
};

const MODIFIER_ORDER = ['ctrl', 'alt', 'shift', 'command'];

// Browsers take Shift last, after the modifier it accompanies.
const BROWSER_MODIFIER_ORDER = ['ctrl', 'alt', 'command', 'shift'];

const BROWSER_KEYS: Record<string, string> = {
  Comma: ',',
  Period: '.',
  PageUp: 'pageup',
  PageDown: 'pagedown',
  '↑': 'up',
  '↓': 'down',
  '←': 'left',
  '→': 'right',
};

const COMBO_KEYS: Record<string, string> = Object.fromEntries(
  Object.entries(BROWSER_KEYS)
    .filter(([browserKey]) => /^[A-Z]/.test(browserKey))
    .map(([browserKey, key]) => [key, browserKey])
);

const NAMED_KEYS = new Set([
  'space',
  'home',
  'end',
  'insert',
  'delete',
  'up',
  'down',
  'left',
  'right',
]);

const toCombo = (modifiers: Array<string>, key: string): string =>
  [
    ...MODIFIER_ORDER.filter(modifier => modifiers.includes(modifier)),
    BROWSER_KEYS[key] ?? key.toLowerCase(),
  ].join('+');

/**
 * Turns a browser's shortcut string into a Stylebot combo. On macOS the
 * browser's "Ctrl" is the Command key and "MacCtrl" the Control key.
 */
export const fromBrowserShortcut = (shortcut: string, mac: boolean): string => {
  if (!shortcut) {
    return '';
  }

  if (!shortcut.includes('+')) {
    const symbols = [...shortcut];
    const modifiers = symbols
      .filter(symbol => SYMBOL_MODIFIERS[symbol])
      .map(symbol => SYMBOL_MODIFIERS[symbol]);
    const key = symbols.filter(symbol => !SYMBOL_MODIFIERS[symbol]).join('');

    return toCombo(modifiers, key);
  }

  const parts = shortcut.split('+');
  const key = parts.pop() ?? '';
  const modifiers = parts.map(part => {
    switch (part) {
      case 'Ctrl':
        return mac ? 'command' : 'ctrl';
      case 'MacCtrl':
        return 'ctrl';
      default:
        return part.toLowerCase();
    }
  });

  return toCombo(modifiers, key);
};

/**
 * Turns a Stylebot combo into the shortcut string commands.update takes, or
 * null for a key the browser has no name for.
 */
export const toBrowserShortcut = (
  combo: string,
  mac: boolean
): string | null => {
  if (!combo) {
    return '';
  }

  const parts = combo.split('+');
  const key = parts.pop() ?? '';

  let browserKey: string | null = null;
  if (/^[a-z0-9]$/.test(key)) {
    browserKey = key.toUpperCase();
  } else if (/^f([1-9]|1[0-2])$/.test(key)) {
    browserKey = key.toUpperCase();
  } else if (COMBO_KEYS[key]) {
    browserKey = COMBO_KEYS[key];
  } else if (NAMED_KEYS.has(key)) {
    browserKey = key[0].toUpperCase() + key.slice(1);
  }

  if (!browserKey) {
    return null;
  }

  const modifiers = BROWSER_MODIFIER_ORDER.filter(modifier =>
    parts.includes(modifier)
  ).map(modifier => {
    switch (modifier) {
      case 'ctrl':
        return mac ? 'MacCtrl' : 'Ctrl';
      case 'command':
        return mac ? 'Command' : null;
      default:
        return modifier[0].toUpperCase() + modifier.slice(1);
    }
  });

  if (modifiers.includes(null)) {
    return null;
  }

  return [...modifiers, browserKey].join('+');
};
