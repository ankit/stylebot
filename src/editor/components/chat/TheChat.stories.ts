import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import TheChat from './TheChat.vue';
import {
  ASK,
  chat,
  chatStateOf,
  chatWithThread,
  REPLY,
  SCREENSHOT,
} from '@stylebot/storybook/chat-story';
import { findOpenMenu, storeOf, user } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Editor/Chat',
  component: TheChat,
  parameters: { padded: false },
};

export default meta;

export const Setup = chat();

export const SetupKeyRejected: StoryObj = {
  ...chat(),
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);
    await waitFor(() =>
      expect(chatStateOf(canvasElement).status).not.toBeNull()
    );
    store.commit('chat/setConnectError', { key: 'chat_error_invalid_key' });
  },
};

export const Empty = chat({ connected: true });

export const Conversation = chatWithThread();

export const Undone = chatWithThread(
  {
    threads: {
      'example.com': [ASK, { ...REPLY, applied: false }],
    },
  },
  { css: '' }
);

export const PickedElementAndScreenshot = chatWithThread({
  threads: {
    'example.com': [
      {
        role: 'user',
        id: 'u1',
        text: 'Make this heading match the screenshot',
        scope: 'h1',
        image: SCREENSHOT,
      },
    ],
  },
});

/* Streams half the reply and holds there, so the status line and caret
   stay up. */
export const Replying: StoryObj = {
  ...chat({ connected: true, hold: true }),
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);
    await waitFor(() =>
      expect(chatStateOf(canvasElement).status).not.toBeNull()
    );
    store.dispatch('chat/send', { text: 'Make the article easier to read' });
    await waitFor(() =>
      expect(chatStateOf(canvasElement).pending?.text).toBeTruthy()
    );
  },
};

export const Failed: StoryObj = {
  ...chat({
    connected: true,
    error: {
      type: 'error',
      errorKey: 'chat_error_rate_limited',
      detail: 'Rate limit reached for requests',
    },
  }),
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);
    await waitFor(() =>
      expect(chatStateOf(canvasElement).status).not.toBeNull()
    );
    await store.dispatch('chat/send', { text: 'Give the page a dark theme' });
    await waitFor(() =>
      expect(chatStateOf(canvasElement).error).not.toBeNull()
    );
  },
};

export const ImageAttached: StoryObj = {
  ...chat({ connected: true }),
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);
    await waitFor(() =>
      expect(chatStateOf(canvasElement).status).not.toBeNull()
    );
    store.commit('chat/setDraftImage', SCREENSHOT);
  },
};

export const ModelMenu: StoryObj = {
  ...chatWithThread(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await user.click(
      await canvas.findByRole('button', { name: /Choose a model/ })
    );
    await findOpenMenu(canvas);
  },
};

export const ClearConfirmation: StoryObj = {
  ...chatWithThread(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await user.click(
      await canvas.findByRole('button', { name: /Choose a model/ })
    );
    const menu = await findOpenMenu(canvas);
    await user.click(within(menu).getByText('New chat'));
    await canvas.findByRole('alertdialog');
  },
};

export const ChangeKey: StoryObj = {
  ...chatWithThread(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await user.click(
      await canvas.findByRole('button', { name: /Choose a model/ })
    );
    const menu = await findOpenMenu(canvas);
    await user.click(within(menu).getByText('Change API key'));
    await canvas.findByText('Back to chat');
  },
};
