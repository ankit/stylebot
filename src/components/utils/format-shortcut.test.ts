import { formatShortcut } from './format-shortcut';

describe('formatShortcut', () => {
  it('renders a modifier icon per key with no separator on macOS', () => {
    expect(formatShortcut('alt+shift+r', true)).toEqual({
      parts: [
        { text: '⌥', icon: 'option' },
        { text: '⇧', icon: 'shift' },
        { text: 'R' },
      ],
      joiner: '',
    });
  });

  it('renders words joined by "+" on non-Mac platforms', () => {
    expect(formatShortcut('alt+shift+r', false)).toEqual({
      parts: [{ text: 'Alt' }, { text: 'Shift' }, { text: 'R' }],
      joiner: '+',
    });
  });

  it('labels command/meta as the Windows key off Mac, not ⌘', () => {
    expect(formatShortcut('command+1', false)).toEqual({
      parts: [{ text: 'Win' }, { text: '1' }],
      joiner: '+',
    });
  });

  it('labels command/meta with the command icon on Mac', () => {
    expect(formatShortcut('command+1', true)).toEqual({
      parts: [{ text: '⌘', icon: 'command' }, { text: '1' }],
      joiner: '',
    });
  });

  it('uppercases parts it has no symbol/word for', () => {
    expect(formatShortcut('x', true)).toEqual({
      parts: [{ text: 'X' }],
      joiner: '',
    });
    expect(formatShortcut('x', false)).toEqual({
      parts: [{ text: 'X' }],
      joiner: '+',
    });
  });

  it('renders a dash for an empty combo', () => {
    expect(formatShortcut('', true)).toEqual({
      parts: [{ text: '–' }],
      joiner: '',
    });
    expect(formatShortcut('', false)).toEqual({
      parts: [{ text: '–' }],
      joiner: '',
    });
  });

  it('gives Escape a compact label instead of spelling it out', () => {
    expect(formatShortcut('Escape', true)).toEqual({
      parts: [{ text: 'Esc' }],
      joiner: '',
    });
    expect(formatShortcut('Escape', false)).toEqual({
      parts: [{ text: 'Esc' }],
      joiner: '+',
    });
  });
});
