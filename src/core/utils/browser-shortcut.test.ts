import { fromBrowserShortcut, toBrowserShortcut } from './browser-shortcut';

describe('fromBrowserShortcut', () => {
  it('reads a browser shortcut into a combo, modifiers in combo order', () => {
    expect(fromBrowserShortcut('Alt+Shift+M', false)).toBe('alt+shift+m');
    expect(fromBrowserShortcut('Shift+Ctrl+Y', false)).toBe('ctrl+shift+y');
    expect(fromBrowserShortcut('Ctrl+Comma', false)).toBe('ctrl+,');
    expect(fromBrowserShortcut('Alt+PageUp', false)).toBe('alt+pageup');
  });

  it('reads Chrome’s macOS symbols', () => {
    expect(fromBrowserShortcut('⌥⇧M', true)).toBe('alt+shift+m');
    expect(fromBrowserShortcut('⇧⌘Y', true)).toBe('shift+command+y');
    expect(fromBrowserShortcut('⌃⌥↑', true)).toBe('ctrl+alt+up');
  });

  it('takes Ctrl as the Command key and MacCtrl as Control on macOS', () => {
    expect(fromBrowserShortcut('Ctrl+Shift+Y', true)).toBe('shift+command+y');
    expect(fromBrowserShortcut('MacCtrl+Shift+Y', true)).toBe('ctrl+shift+y');
  });

  it('reads no shortcut as an empty combo', () => {
    expect(fromBrowserShortcut('', false)).toBe('');
  });
});

describe('toBrowserShortcut', () => {
  it('writes a combo as a browser shortcut, Shift after the other modifier', () => {
    expect(toBrowserShortcut('alt+shift+m', false)).toBe('Alt+Shift+M');
    expect(toBrowserShortcut('ctrl+shift+1', false)).toBe('Ctrl+Shift+1');
    expect(toBrowserShortcut('alt+,', false)).toBe('Alt+Comma');
    expect(toBrowserShortcut('ctrl+f5', false)).toBe('Ctrl+F5');
    expect(toBrowserShortcut('alt+pagedown', false)).toBe('Alt+PageDown');
  });

  it('writes the Command and Control keys for macOS', () => {
    expect(toBrowserShortcut('shift+command+y', true)).toBe('Command+Shift+Y');
    expect(toBrowserShortcut('ctrl+shift+y', true)).toBe('MacCtrl+Shift+Y');
  });

  it('round-trips with fromBrowserShortcut', () => {
    for (const combo of ['alt+shift+m', 'ctrl+.', 'alt+space']) {
      const shortcut = toBrowserShortcut(combo, false) as string;
      expect(fromBrowserShortcut(shortcut, false)).toBe(combo);
    }
  });

  it('rejects keys and modifiers the browser can’t name', () => {
    expect(toBrowserShortcut('alt+é', false)).toBeNull();
    expect(toBrowserShortcut('command+y', false)).toBeNull();
  });

  it('clears the shortcut for an empty combo', () => {
    expect(toBrowserShortcut('', false)).toBe('');
  });
});
