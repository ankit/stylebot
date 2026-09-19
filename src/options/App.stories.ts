import type { Meta, StoryObj } from '@storybook/vue';

import App from './App.vue';
import {
  createOptionsStore,
  OptionsStateOverrides,
} from '@sb/mocks/options-store';
import { nextFrame } from '@sb/story-helpers';

const meta: Meta = {
  title: 'Options',
  component: App,
  parameters: { padded: false },
};

export default meta;

const style = (css: string, enabled: boolean, modifiedTime: string) => ({
  css,
  enabled,
  readability: false,
  modifiedTime,
});

const seededStyles = {
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

/* Each render builds its own store so the toolbar theme lands in options
   without state leaking between stories. */
const options = (
  overrides: OptionsStateOverrides = {},
  play?: StoryObj['play']
): StoryObj => ({
  render: (_args, { globals }) => ({
    components: { App },
    store: createOptionsStore({
      ...overrides,
      options: { appearance: globals.theme, ...overrides.options },
    }),
    template: '<app />',
  }),
  play,
});

const clickNavTab = async (root: HTMLElement, label: string) => {
  const buttons = Array.from(root.querySelectorAll<HTMLElement>('.nav-item'));
  buttons.find(button => button.textContent?.trim() === label)?.click();
  await nextFrame();
};

export const Basics = options();

export const Styles = options({ styles: seededStyles }, ({ canvasElement }) =>
  clickNavTab(canvasElement, 'Styles')
);

export const StylesEmpty = options({}, ({ canvasElement }) =>
  clickNavTab(canvasElement, 'Styles')
);

export const StyleEditor = options(
  { styles: seededStyles },
  async ({ canvasElement }) => {
    await clickNavTab(canvasElement, 'Styles');
    const edit = Array.from(
      canvasElement.querySelectorAll<HTMLElement>('.row button')
    ).find(button => button.textContent?.trim() === 'Edit');
    edit?.click();
    await nextFrame();
  }
);

export const Sync = options({}, ({ canvasElement }) =>
  clickNavTab(canvasElement, 'Sync')
);
