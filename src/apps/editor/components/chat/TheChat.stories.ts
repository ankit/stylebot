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
} from '@stylebot/storybook/fixtures/chat';
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

export const Empty = chat({ connected: ['anthropic'] });

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
  ...chat({ connected: ['anthropic'], hold: true }),
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
    connected: ['anthropic'],
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
  ...chat({ connected: ['anthropic'] }),
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);
    await waitFor(() =>
      expect(chatStateOf(canvasElement).status).not.toBeNull()
    );
    store.commit('chat/setDraftImage', SCREENSHOT);
  },
};

const ALL_PROVIDERS = {
  connected: ['anthropic' as const, 'openai' as const, 'gemini' as const],
};

export const ModelMenu: StoryObj = {
  ...chatWithThread(ALL_PROVIDERS),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await user.click(
      await canvas.findByRole('button', { name: /Choose a model/ })
    );
    await findOpenMenu(canvas);
  },
};

export const ModelMenuOtherProvider: StoryObj = {
  ...chatWithThread(ALL_PROVIDERS),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await user.click(
      await canvas.findByRole('button', { name: /Choose a model/ })
    );
    const menu = await findOpenMenu(canvas);
    await user.click(within(menu).getByText('OpenAI'));
    await within(menu).findByText('GPT-5.6 Luna');
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

const openProviders = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  await user.click(
    await canvas.findByRole('button', { name: /Choose a model/ })
  );
  const menu = await findOpenMenu(canvas);
  await user.click(within(menu).getByText('Providers'));
  await canvas.findByText('Back to chat');
};

export const Providers: StoryObj = {
  ...chatWithThread({ connected: ['anthropic', 'gemini'] }),
  play: ({ canvasElement }) => openProviders(canvasElement),
};

export const ProvidersAddingKey: StoryObj = {
  ...chatWithThread({ connected: ['anthropic', 'gemini'] }),
  play: async ({ canvasElement }) => {
    await openProviders(canvasElement);
    await user.click(
      within(canvasElement).getByRole('button', { name: 'Add key' })
    );
  },
};
