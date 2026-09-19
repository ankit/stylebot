import type Vue from 'vue';
import type { Meta, StoryObj } from '@storybook/vue';

import TheStylebotApp from './TheStylebotApp.vue';
import { getCssAfterApplyingFilterEffectToPage } from '@stylebot/css';
import {
  createEditorStore,
  EditorStateOverrides,
} from '../../../.storybook/mocks/editor-store';
import { nextFrame } from '../../../.storybook/story-helpers';

const meta: Meta = {
  title: 'Editor/Panel',
  component: TheStylebotApp,
  parameters: { padded: false },
};

export default meta;

const RULE_CSS = `h1 {
  color: #2a5fd6;
  font-size: 32px;
  font-family: Merriweather;
  text-align: center;
  padding: 12px 24px;
  border: 1px solid #dcdfe5;
  opacity: 0.9;
  letter-spacing: 1px;
}

.article-body {
  line-height: 1.6;
}`;

/* A stand-in page behind the docked panel, so its edge and shadow are
   captured against real content rather than a blank canvas. */
const PAGE = `
  <div class="sb-page">
    <h1>Stylebot lets you restyle any website</h1>
    <p class="article-body">
      Change fonts, colors, layout and more with a visual editor, or write
      CSS directly. Styles are saved per site and applied on every visit.
    </p>
    <p class="article-body">
      Pick an element to start, then adjust its properties in Basic mode.
    </p>
  </div>
`;

const editor = (
  overrides: EditorStateOverrides = {},
  play?: StoryObj['play']
): StoryObj => ({
  render: (_args, { globals }) => ({
    components: { TheStylebotApp },
    store: createEditorStore({
      ...overrides,
      options: { appearance: globals.theme, ...overrides.options },
    }),
    template: `<div>${PAGE}<the-stylebot-app /></div>`,
  }),
  play,
});

export const BasicEmpty = editor();

export const BasicWithRule = editor({
  css: RULE_CSS,
  activeSelector: 'h1',
});

/* Picking an element auto-opens the sections it has declarations in, so
   collapsing has to happen through the headers, as a user would. */
export const BasicSectionsCollapsed = editor(
  { css: RULE_CSS, activeSelector: 'h1' },
  async ({ canvasElement }) => {
    canvasElement
      .querySelectorAll<HTMLElement>('.property-card')
      .forEach(card => {
        if (!card.querySelector('.property-card-collapse.collapsed')) {
          card.querySelector<HTMLElement>('.property-card-header')?.click();
        }
      });
    await nextFrame();
  }
);

export const Magic = editor({ options: { mode: 'magic' } });

/* The grayscale preset targets the page's top-level elements by generated
   selector, so it's applied once the DOM has settled — as the toggle would. */
export const MagicGrayscaleApplied = editor(
  { options: { mode: 'magic' } },
  async ({ canvasElement }) => {
    const app = canvasElement.querySelector<HTMLElement & { __vue__: Vue }>(
      '.stylebot-app'
    );
    app?.__vue__.$store.dispatch('applyCss', {
      css: getCssAfterApplyingFilterEffectToPage('grayscale', '', '100'),
    });
    await nextFrame();
  }
);

export const Code = editor({
  css: RULE_CSS,
  activeSelector: 'h1',
  options: { mode: 'code' },
});
