import type { StoryObj } from '@storybook/vue';

import TheStylebotApp from '@/editor/components/TheStylebotApp.vue';
import type { EditorStateOverrides } from './mocks/editor-store';
import { createEditorStore } from './mocks/editor-store';

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

export const WITH_RULE: EditorStateOverrides = {
  css: RULE_CSS,
  activeSelector: 'h1',
};

const FAVICON =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" rx="4" fill="#e63946"/></svg>'
  );

export const WINDOW_TAB = {
  title: 'Stylebot lets you restyle any website',
  favIconUrl: FAVICON,
  active: true,
};

/**
 * Mounts the editor the way its separate window does: the window host, a
 * seeded tab, and a frame the size the background opens the window at.
 */
export const editorWindow = (
  overrides: EditorStateOverrides = {}
): StoryObj => ({
  render: (_args, { globals }) => ({
    components: { TheStylebotApp },
    store: createEditorStore({
      host: 'window',
      tabId: 7,
      tab: WINDOW_TAB,
      page: {
        domain: 'example.com',
        href: 'https://example.com/article',
        title: WINDOW_TAB.title,
        readerable: true,
        bodyChildSelectors: [],
      },
      ...overrides,
      options: { appearance: globals.theme, ...overrides.options },
    }),
    template: `<div id="stylebot" class="sb-window"><the-stylebot-app /></div>`,
  }),
});

/**
 * Mounts the full editor over a stand-in page with a seeded store, the
 * shape every Editor story takes; stories spread it and add their own
 * `name` and `play`.
 */
export const editor = (
  overrides: EditorStateOverrides = {},
  { page = PAGE }: { page?: string } = {}
): StoryObj => ({
  render: (_args, { globals }) => ({
    components: { TheStylebotApp },
    store: createEditorStore({
      ...overrides,
      options: { appearance: globals.theme, ...overrides.options },
    }),
    // The host id is what the highlighter uses to tell the panel apart
    // from page content.
    template: `<div>${page}<div id="stylebot"><the-stylebot-app /></div></div>`,
  }),
});
