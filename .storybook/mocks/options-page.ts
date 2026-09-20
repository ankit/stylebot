import type { StoryObj } from '@storybook/vue';

import App from '../../src/options/App.vue';
import { createRouter } from '../../src/options/router';
import { createOptionsStore, OptionsStateOverrides } from './options-store';
import { nextFrame } from '../story-helpers';

const style = (css: string, enabled: boolean, modifiedTime: string) => ({
  css,
  enabled,
  readability: false,
  modifiedTime,
});

export const seededStyles = {
  'example.com': style('h1 { color: red; }', true, '2026-01-10T09:30:00Z'),
  'news.example.com/**': style(
    'body { font-family: Merriweather; }',
    false,
    '2025-12-24T18:00:00Z'
  ),
  '*.wikipedia.org': style(
    '#content { max-width: 720px; }',
    true,
    '2025-06-01T08:15:00Z'
  ),
};

/**
 * Renders the whole options page on a seeded store and lands on the
 * given tab, so each tab's stories still exercise the real navigation.
 */
export const optionsPage = (
  tab: 'Basics' | 'Styles' | 'Sync',
  overrides: OptionsStateOverrides = {},
  afterNavigate?: (root: HTMLElement) => Promise<void>
): StoryObj => ({
  render: (_args, { globals }) => {
    const router = createRouter('abstract');
    router.replace('/basics');

    return {
      components: { App },
      router,
      store: createOptionsStore({
        ...overrides,
        options: { appearance: globals.theme, ...overrides.options },
      }),
      template: '<app />',
    };
  },
  play: async ({ canvasElement }) => {
    const buttons = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('.nav-item')
    );
    buttons.find(button => button.textContent?.trim() === tab)?.click();
    await nextFrame();
    await afterNavigate?.(canvasElement);
  },
});
