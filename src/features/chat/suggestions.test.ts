import type { ChatPageSignals } from '@stylebot/types';

import {
  CREATIVE_SUGGESTIONS,
  getCreativeSuggestions,
  getPracticalSuggestions,
} from './suggestions';
import type { ChatSuggestionContext } from './suggestions';

const PLAIN: ChatPageSignals = {
  dark: false,
  list: false,
  sidebar: false,
  pinnedHeader: false,
  ads: false,
};

const ids = (overrides: Partial<ChatSuggestionContext>) =>
  getPracticalSuggestions({
    signals: PLAIN,
    article: false,
    ...overrides,
  }).map(item => item.id);

describe('getPracticalSuggestions', () => {
  it('offers the opposite theme and easier reading on a plain page', () => {
    expect(ids({})).toEqual(['dark-mode', 'easier-to-read']);
    expect(ids({ signals: { ...PLAIN, dark: true } })).toEqual([
      'light-mode',
      'easier-to-read',
    ]);
  });

  it('falls back to a dark mode and easier reading when the page is unread', () => {
    expect(ids({ signals: null })).toEqual(['dark-mode', 'easier-to-read']);
  });

  it('suits an article: a book, or focus mode beside a sidebar', () => {
    expect(ids({ article: true })).toEqual(['book', 'dark-mode']);
    expect(
      ids({ article: true, signals: { ...PLAIN, sidebar: true } })
    ).toEqual(['focus', 'dark-mode']);
  });

  it('ranks a pinned header over the sidebar, and the sidebar over a list', () => {
    expect(
      ids({
        signals: { ...PLAIN, pinnedHeader: true, sidebar: true, list: true },
      })
    ).toEqual(['unpin-header', 'hide-sidebar']);
    expect(ids({ signals: { ...PLAIN, list: true, sidebar: true } })).toEqual([
      'hide-sidebar',
      'compact',
    ]);
  });

  it('offers to hide distractions on a page with ads, after the article', () => {
    expect(ids({ signals: { ...PLAIN, ads: true, list: true } })).toEqual([
      'hide-distractions',
      'compact',
    ]);
    expect(ids({ article: true, signals: { ...PLAIN, ads: true } })).toEqual([
      'book',
      'hide-distractions',
    ]);
  });

  it('gives each suggestion its label key and full request', () => {
    const [suggestion] = getPracticalSuggestions({
      signals: PLAIN,
      article: true,
    });

    expect(suggestion).toMatchObject({
      id: 'book',
      label: 'read_like_a_book',
      request: expect.stringMatching(/^Make the article read like a book:/),
    });
  });
});

describe('getCreativeSuggestions', () => {
  const ids = (start: number, count: number) =>
    getCreativeSuggestions(start, count).map(item => item.id);

  it('takes the looks in order from a position, wrapping round the set', () => {
    expect(ids(0, 3)).toEqual(['paper-and-ink', 'wabi-sabi', 'terminal']);
    expect(ids(CREATIVE_SUGGESTIONS.length - 1, 2)).toEqual([
      'surprise-me',
      'paper-and-ink',
    ]);
  });

  it('takes Terminal through its palettes, one each time round the set', () => {
    const index = CREATIVE_SUGGESTIONS.findIndex(
      item => item.id === 'terminal'
    );
    const [green, dracula, everforest, again] = [0, 1, 2, 3].map(
      round =>
        getCreativeSuggestions(
          index + round * CREATIVE_SUGGESTIONS.length,
          1
        )[0]
    );

    expect(green).toMatchObject({ label: 'terminal' });
    expect(green.request).toMatch(/phosphor green/);
    expect(dracula).toMatchObject({
      label: 'terminal_theme',
      substitutions: ['Dracula'],
      request: expect.stringMatching(/^Terminal, in Dracula:/),
    });
    expect(everforest.substitutions).toEqual(['Everforest']);
    expect(again).toEqual(green);
  });
});
