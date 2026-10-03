import type { StoryObj } from '@storybook/vue';

import type {
  ChatAssistantTurn,
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
  model: 'claude-sonnet-5',
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
  overrides: EditorStateOverrides = {}
): StoryObj => ({
  ...editor({ ...overrides, options: { mode: 'chat', ...overrides.options } }),
  parameters: { chrome: { chat: chatOptions } },
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

/* A small page-like screenshot: a pink bar over a sidebar and body. */
export const SCREENSHOT = {
  dataUrl:
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAgCAIAAADbtmxLAAAAPElEQVR42u3OsQkAIAwAwSzoWk5rq9jFGSwEIff8ABej9a8OICCgcqC59tX5OCAgICAgICAgICAgoGKgA/Ep6uLmRf/gAAAAAElFTkSuQmCC',
  mediaType: 'image/png' as const,
  name: '',
  size: 117,
};
