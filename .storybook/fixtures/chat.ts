import type { StoryObj } from '@storybook/vue';

import { applyEdits } from '@stylebot/chat';
import type {
  ChatAssistantTurn,
  ChatCssEdit,
  ChatTurn,
  ChatUserTurn,
} from '@stylebot/types';
import type { ChatState } from '@/apps/editor/store/chat';

import { editor } from './editor';
import { storeOf } from '../story-helpers';
import type { ChatShimOptions } from '../mocks/chat';
import type { EditorStateOverrides } from './editor-store';

export const THREAD_CSS = `.article-body {
  font-size: 18px;
  line-height: 1.8;
}`;

export const ASK: ChatUserTurn = {
  role: 'user',
  id: 'u1',
  text: 'Make the article easier to read',
};

/* Its edits are what THREAD_CSS holds, so Undo has something real to
   take back. */
export const REPLY: ChatAssistantTurn = {
  role: 'assistant',
  id: 'a1',
  text: 'Bumped the article text up a size and gave the lines more room.',
  edits: [
    {
      selector: '.article-body',
      declarations: [
        { property: 'font-size', value: '18px' },
        { property: 'line-height', value: '1.8' },
      ],
    },
  ],
  previous: [
    { selector: '.article-body', property: 'font-size', value: null },
    { selector: '.article-body', property: 'line-height', value: null },
  ],
  applied: true,
  model: 'claude-sonnet-5-5',
  usage: {
    inputTokens: 3180,
    outputTokens: 214,
    cacheReadTokens: 41200,
  },
};

export const THREAD: Array<ChatTurn> = [ASK, REPLY];

/**
 * The chat module's state in the story's editor store.
 */
export const chatStateOf = (root: HTMLElement): ChatState =>
  (storeOf(root).state as unknown as { chat: ChatState }).chat;

/**
 * The editor open on its Chat tab over the stand-in page, with the chat
 * background shimmed; stories spread it and add their own `name` and
 * `play`.
 */
export const chat = (
  chatOptions: ChatShimOptions = {},
  overrides: EditorStateOverrides = {},
  page: { page?: string } = {}
): StoryObj => ({
  ...editor(
    { ...overrides, options: { mode: 'chat', ...overrides.options } },
    page
  ),
  parameters: { chrome: { chat: chatOptions } },
});

/**
 * No key yet, with a coding agent connected through the CLI.
 */
export const chatWithTerminal = (): StoryObj => ({
  ...chat(),
  parameters: { chrome: { chat: {}, storage: { 'cli-connected': true } } },
});

/**
 * Connected to Claude, with THREAD as example.com's conversation.
 */
export const chatWithThread = (
  chatOptions: ChatShimOptions = {},
  overrides: EditorStateOverrides = {}
): StoryObj =>
  chat(
    {
      connected: ['anthropic'],
      threads: { 'example.com': THREAD },
      ...chatOptions,
    },
    { css: THREAD_CSS, ...overrides }
  );

export const CHANGE_BEFORE_CSS = `.sb-page {
  color: #1f2328;
}

h1 {
  border: 1px solid #dcdfe5;
  letter-spacing: 1px;
}

.article-body {
  line-height: 1.6;
}`;

/* Over CHANGE_BEFORE_CSS: new declarations, a changed value and a
   removal. */
export const MIXED_EDITS: Array<ChatCssEdit> = [
  {
    selector: '.sb-page',
    declarations: [
      { property: 'background-color', value: '#16181c' },
      { property: 'color', value: '#d8dbe1' },
    ],
  },
  {
    selector: 'h1',
    declarations: [
      { property: 'color', value: '#8ab4f8' },
      { property: 'border', value: '' },
    ],
  },
  {
    selector: '.article-body',
    declarations: [{ property: 'color', value: '#b9bec8' }],
  },
];

export const ADDED_EDITS: Array<ChatCssEdit> = [
  {
    selector: 'h1',
    declarations: [
      { property: 'font-family', value: 'Literata, serif' },
      { property: 'font-weight', value: '600' },
    ],
  },
  {
    selector: '.article-body',
    declarations: [
      { property: 'font-size', value: '18px' },
      { property: 'max-width', value: '62ch' },
    ],
  },
];

export const REMOVED_EDITS: Array<ChatCssEdit> = [
  {
    selector: 'h1',
    declarations: [
      { property: 'border', value: '' },
      { property: 'letter-spacing', value: '' },
    ],
  },
  {
    selector: '.article-body',
    declarations: [{ property: 'line-height', value: '' }],
  },
];

const LONG_SELECTORS = [
  '.sb-page',
  'h1',
  '.article-body',
  'header nav[aria-label="Primary"] > ul.menu-list > li.menu-item > a',
  'main article.post-content > section:first-of-type p:not(.lede)',
  'div.Page_root__a1B2c aside[role="complementary"] .widget-title',
  'footer .site-footer__links a:hover',
  'table.data-table tbody tr:nth-child(even) td',
  'button.btn-primary:not([disabled])',
];

export const MANY_EDITS: Array<ChatCssEdit> = LONG_SELECTORS.map(
  (selector, i) => ({
    selector,
    declarations: [
      { property: 'color', value: '#d8dbe1' },
      ...(i % 3 === 0
        ? [{ property: 'background-color', value: '#16181c' }]
        : []),
      ...(i % 4 === 1 ? [{ property: 'border', value: '' }] : []),
    ],
  })
);

/**
 * Connected, with one exchange whose reply made the edits over the
 * stylesheet before it, so the change row counts them as a real reply's.
 */
export const chatWithChange = (
  edits: Array<ChatCssEdit>,
  reply: Partial<ChatAssistantTurn> = {},
  before = CHANGE_BEFORE_CSS
): StoryObj => {
  const { css, previous } = applyEdits(before, edits);
  const turn = { ...REPLY, edits, previous, ...reply };

  return chatWithThread(
    { threads: { 'example.com': [ASK, turn] } },
    { css: turn.applied ? css : before }
  );
};

/* A small page-like screenshot: a pink bar over a sidebar and body. */
export const SCREENSHOT = {
  dataUrl:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAgCAIAAADbtmxLAAAAPElEQVR42u3OsQkAIAwAwSzoWk5rq9jFGSwEIff8ABej9a8OICCgcqC59tX5OCAgICAgICAgICAgoGKgA/Ep6uLmRf/gAAAAAElFTkSuQmCC',
  mediaType: 'image/png' as const,
  name: '',
  size: 117,
};

export const DARK_PAGE_BACKGROUND = '#15171b';

/* The stand-in page in dark colors; stories pair it with the body
   background, which is what Chat reads. */
export const DARK_PAGE = `
  <div class="sb-page" style="min-height: 100vh; max-width: none; background: ${DARK_PAGE_BACKGROUND}; color: #e6e6e6">
    <h1>Stylebot lets you restyle any website</h1>
    <p>Change fonts, colors, layout and more with a visual editor.</p>
  </div>
`;

/* A page of a dozen alike stories, the run Chat calls a list. */
export const LIST_PAGE = `
  <div class="sb-page">
    <h1>Top stories</h1>
    <ol class="stories">
      ${Array.from(
        { length: 12 },
        (_, i) =>
          `<li class="story"><a href="#">Story number ${
            i + 1
          }</a> <span class="meta">${i + 3} comments</span></li>`
      ).join('')}
    </ol>
  </div>
`;

/* A header that sticks to the top over a page with a sidebar. */
export const SIDEBAR_PAGE = `
  <div>
    <header style="position: sticky; top: 0; width: 100%; height: 48px; background: var(--hover-tint)"></header>
    <div style="display: flex; gap: 24px">
      <aside style="width: 200px; height: 480px; background: var(--tab-surface)"></aside>
      <div class="sb-page">
        <h1>Stylebot lets you restyle any website</h1>
        <p class="article-body">Pick an element to start.</p>
      </div>
    </div>
  </div>
`;
