import { formatShortcut } from './format-shortcut';

describe('formatShortcut', () => {
  it('renders compact symbols with no separator on macOS', () => {
    expect(formatShortcut('alt+shift+r', true)).toEqual({
      parts: ['⌥', '⇧', 'R'],
      joiner: '',
    });
  });

  it('renders words joined by "+" on non-Mac platforms', () => {
    expect(formatShortcut('alt+shift+r', false)).toEqual({
      parts: ['Alt', 'Shift', 'R'],
      joiner: '+',
    });
  });

  it('labels command/meta as the Windows key off Mac, not ⌘', () => {
    expect(formatShortcut('command+1', false)).toEqual({
      parts: ['Win', '1'],
      joiner: '+',
    });
  });

  it('labels command/meta as ⌘ on Mac', () => {
    expect(formatShortcut('command+1', true)).toEqual({
      parts: ['⌘', '1'],
      joiner: '',
    });
  });

  it('uppercases parts it has no symbol/word for', () => {
    expect(formatShortcut('x', true)).toEqual({ parts: ['X'], joiner: '' });
    expect(formatShortcut('x', false)).toEqual({ parts: ['X'], joiner: '+' });
  });

  it('returns no parts for an empty combo', () => {
    expect(formatShortcut('', true)).toEqual({ parts: [], joiner: '' });
  });
});
