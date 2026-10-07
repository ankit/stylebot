import type { StoryObj } from '@storybook/vue';

import App from '@/apps/options/App.vue';
import TheCliAccess from '@/apps/options/components/basics/TheCliAccess.vue';
import { createRouter } from '@/apps/options/router';
import type { OptionsState, OptionsStateOverrides } from './options-store';
import { createOptionsStore } from './options-store';
import type { Store } from 'vuex';
import { expect, waitFor } from '@storybook/test';
import { user } from '../story-helpers';

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
  'reader.example.org': {
    ...style('body { max-width: 680px; }', true, '2026-01-05T12:00:00Z'),
    profiles: {
      default: { name: '' },
      night: { name: 'Night', css: 'body { background: #111; }' },
    },
    activeProfile: 'default',
  },
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
  tab: 'Basics' | 'Styles' | 'Version history' | 'Sync',
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
    const button = buttons.find(el => el.textContent?.trim() === tab);
    await user.click(button as HTMLElement);
    await waitFor(() => expect(button).toHaveClass('active'));
    await afterNavigate?.(canvasElement);
  },
});

/**
 * Renders the CLI access card on its own, since the Basics tab shows it only
 * in development builds. The play gets the store, to read what was saved.
 */
export const cliAccessCard = (
  overrides: OptionsStateOverrides = {},
  play?: (root: HTMLElement, store: Store<OptionsState>) => Promise<void>
): StoryObj => {
  let store: Store<OptionsState>;

  return {
    render: () => {
      store = createOptionsStore(overrides);

      return {
        components: { TheCliAccess },
        store,
        template: '<the-cli-access />',
      };
    },
    play: async ({ canvasElement }) => {
      await play?.(canvasElement, store);
    },
  };
};
