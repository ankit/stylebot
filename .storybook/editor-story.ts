import type { StoryObj } from '@storybook/vue';

import TheStylebotApp from '../src/editor/components/TheStylebotApp.vue';
import { createEditorStore, EditorStateOverrides } from './mocks/editor-store';

export const RULE_CSS = `h1 {
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
export const PAGE = `
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

/* Three nested levels for the inspector to climb, with a leaf that is
   easy to hover. */
export const INSPECT_PAGE = `
  <div class="sb-page">
    <main>
      <p><a href="#">Learn more</a></p>
    </main>
  </div>
`;

export const IFRAME_PAGE = `
  <div class="sb-page">
    <div class="slot">
      <iframe
        name="ad"
        width="240"
        height="140"
        srcdoc="<a id=ad href=/landing style='display:block;width:200px;height:100px'>Get yours now</a>"
      ></iframe>
    </div>
  </div>
`;

export const PANEL_STATE_PAGE = `
  <div class="sb-page">
    <h1>Stylebot lets you restyle any website</h1>
    <blockquote>Pick an element to start.</blockquote>
  </div>
`;

type EditorStory = {
  page?: string;
  play?: StoryObj['play'];
};

/**
 * Mounts the full editor over a stand-in page with a seeded store, the
 * shape every Editor story takes.
 */
export const editor = (
  overrides: EditorStateOverrides = {},
  { page = PAGE, play }: EditorStory = {}
): StoryObj => ({
  render: (_args, { globals }) => ({
    components: { TheStylebotApp },
    store: createEditorStore({
      ...overrides,
      options: { appearance: globals.theme, ...overrides.options },
    }),
    template: `<div>${page}<the-stylebot-app /></div>`,
  }),
  play,
});
