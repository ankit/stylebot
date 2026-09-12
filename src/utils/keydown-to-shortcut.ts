export const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'Meta', 'OS', 'AltGraph']);

// event.key is layout-remapped (Option turns "R" into "‰" on macOS), so
// letters/digits are read from event.code instead.
const codeToKey = (code: string): string | null => {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3).toLowerCase();
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);
  return null;
};

/**
 * Reads which modifiers are currently held from a keyboard event, in the
 * hotkeys-js word order (e.g. ["ctrl", "shift"]).
 */
export const modifiersFromEvent = (event: KeyboardEvent): string[] => {
  const parts: string[] = [];
  if (event.ctrlKey) parts.push('ctrl');
  if (event.altKey) parts.push('alt');
  if (event.shiftKey) parts.push('shift');
  if (event.metaKey) parts.push('command');
  return parts;
};

/**
 * Serializes a keydown event into the hotkeys-js combo format (e.g. "alt+shift+r"),
 * or null while only a modifier key is held down.
 */
export const keydownToShortcut = (event: KeyboardEvent): string | null => {
  if (MODIFIER_KEYS.has(event.key)) {
    return null;
  }

  const key = event.key === ' ' ? 'space' : codeToKey(event.code) ?? event.key.toLowerCase();

  return [...modifiersFromEvent(event), key].join('+');
};
