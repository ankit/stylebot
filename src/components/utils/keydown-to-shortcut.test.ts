import {
  keydownToShortcut,
  modifiersFromEvent,
  MODIFIER_KEYS,
} from './keydown-to-shortcut';

describe('modifiersFromEvent', () => {
  it('returns held modifiers in hotkeys-js word order', () => {
    const event = new KeyboardEvent('keydown', {
      ctrlKey: true,
      altKey: true,
      shiftKey: true,
      metaKey: true,
    });

    expect(modifiersFromEvent(event)).toEqual(['ctrl', 'alt', 'shift', 'command']);
  });

  it('returns an empty array when no modifier is held', () => {
    expect(modifiersFromEvent(new KeyboardEvent('keydown'))).toEqual([]);
  });
});

describe('keydownToShortcut', () => {
  it('returns null while only a modifier key is held', () => {
    const event = new KeyboardEvent('keydown', { key: 'Shift' });
    expect(keydownToShortcut(event)).toBeNull();
  });

  it('serializes a plain letter with no modifiers', () => {
    const event = new KeyboardEvent('keydown', { key: 'r', code: 'KeyR' });
    expect(keydownToShortcut(event)).toBe('r');
  });

  it('reads the letter from event.code, not the Option-remapped event.key', () => {
    // Holding Option on macOS turns "R" into a different character in
    // event.key (e.g. "‰"), so the physical key must come from event.code.
    const event = new KeyboardEvent('keydown', {
      key: '‰',
      code: 'KeyR',
      altKey: true,
      shiftKey: true,
    });
    expect(keydownToShortcut(event)).toBe('alt+shift+r');
  });

  it('serializes a digit key with a modifier', () => {
    const event = new KeyboardEvent('keydown', {
      key: '5',
      code: 'Digit5',
      ctrlKey: true,
    });
    expect(keydownToShortcut(event)).toBe('ctrl+5');
  });

  it('maps the space key to "space"', () => {
    const event = new KeyboardEvent('keydown', {
      key: ' ',
      code: 'Space',
      shiftKey: true,
    });
    expect(keydownToShortcut(event)).toBe('shift+space');
  });

  it('falls back to event.key for keys with no code mapping', () => {
    const event = new KeyboardEvent('keydown', { key: 'ArrowUp', code: 'ArrowUp' });
    expect(keydownToShortcut(event)).toBe('arrowup');
  });
});

describe('MODIFIER_KEYS', () => {
  it('includes every modifier key.key value', () => {
    ['Shift', 'Control', 'Alt', 'Meta', 'OS', 'AltGraph'].forEach(key => {
      expect(MODIFIER_KEYS.has(key)).toBe(true);
    });
  });
});
