import type { StyleMap } from '@stylebot/types';

import { assertKeepsStyles } from './keeps-styles';

const before: StyleMap = {
  'example.com': {
    css: 'a { color: red; }',
    enabled: true,
    readability: false,
    profiles: { default: { name: '' }, dark: { name: 'Dark' } },
    activeProfile: 'default',
    modifiedTime: '2026-09-01T10:00:00.000Z',
  },
};

describe('assertKeepsStyles', () => {
  it('accepts a rewrite that only adds to a style', () => {
    expect(() =>
      assertKeepsStyles(before, {
        'example.com': { ...before['example.com'], forceImportant: false },
      })
    ).not.toThrow();
  });

  it('rejects a rewrite that drops a style', () => {
    expect(() => assertKeepsStyles(before, {})).toThrow('example.com');
  });

  it('rejects a rewrite that clears css', () => {
    expect(() =>
      assertKeepsStyles(before, {
        'example.com': { ...before['example.com'], css: '' },
      })
    ).toThrow('css');
  });

  it('rejects a rewrite that drops a profile', () => {
    expect(() =>
      assertKeepsStyles(before, {
        'example.com': {
          ...before['example.com'],
          profiles: { default: { name: '' } },
        },
      })
    ).toThrow('dark');
  });
});
