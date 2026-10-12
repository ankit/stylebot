import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import TheChat from './TheChat.vue';
import { emptyPageSnapshot } from '@stylebot/page-bridge';
import {
  ADDED_EDITS,
  ASK,
  chat,
  chatStateOf,
  chatWithChange,
  chatWithThread,
  DARK_PAGE,
  DARK_PAGE_BACKGROUND,
  LIST_PAGE,
  MANY_EDITS,
  MIXED_EDITS,
  REMOVED_EDITS,
  REPLY,
  SCREENSHOT,
  SIDEBAR_PAGE,
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

const CONNECTED = { connected: ['anthropic' as const] };

export const EmptyDarkPage: StoryObj = {
  ...chat(CONNECTED, {}, { page: DARK_PAGE }),
  parameters: {
    ...chat(CONNECTED).parameters,
    pageBackground: DARK_PAGE_BACKGROUND,
  },
};

export const EmptyArticle = chat(CONNECTED, {
  page: { ...emptyPageSnapshot(), readerable: true },
});

export const EmptyList = chat(CONNECTED, {}, { page: LIST_PAGE });

export const EmptySidebarAndStickyHeader = chat(
  CONNECTED,
  {},
  { page: SIDEBAR_PAGE }
);

export const EmptyPageNotRead: StoryObj = {
  ...chat(CONNECTED),
  parameters: {
    ...chat(CONNECTED).parameters,
    pageBridge: { getPageSignals: () => Promise.reject(new Error()) },
  },
};

export const Conversation = chatWithThread();

export const ChangeAddedOnly = chatWithChange(ADDED_EDITS);

export const ChangeAddedAndRemoved = chatWithChange(MIXED_EDITS);

export const ChangeRemovedOnly = chatWithChange(REMOVED_EDITS);

export const ChangeOneRule = chatWithChange([MIXED_EDITS[0]]);

export const ChangeManyRules = chatWithChange(MANY_EDITS);

export const Undone = chatWithChange(MIXED_EDITS, { applied: false });

export const ChangeOlderRows = chatWithThread({
  threads: {
    'example.com': [
      ASK,
      REPLY,
      { ...ASK, id: 'u2', text: 'Darken the heading' },
      {
        ...REPLY,
        id: 'a2',
        text: 'Darkened the heading.',
        edits: [
          {
            selector: 'h1',
            declarations: [{ property: 'color', value: '#111' }],
          },
        ],
        previous: [{ selector: 'h1', property: 'color', value: null }],
      },
    ],
  },
});

export const MarkdownReply = chatWithThread({
  threads: {
    'example.com': [
      ASK,
      {
        ...REPLY,
        text: [
          'A few things would help:',
          '',
          '1. **Screenshots after each change** - especially of the broken areas.',
          '2. **Specific element names** - like `a.WwrzSb`, so I can target it _precisely_.',
          '3. **Avoid blanket overrides on `div`** - they hit every card.',
          '',
          '```css',
          '.card {',
          '  background: #1f2026;',
          '}',
          '```',
          '',
          'If you want, I can do a more careful audit.',
        ].join('\n'),
      },
    ],
  },
});

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

export const PickedElement = chat(
  { connected: ['anthropic'] },
  { activeSelector: '.article-body' }
);

export const PickedElementAndImage: StoryObj = {
  ...chat({ connected: ['anthropic'] }, { activeSelector: '.article-body' }),
  play: async ({ canvasElement }) => {
    const store = storeOf(canvasElement);
    await waitFor(() =>
      expect(chatStateOf(canvasElement).status).not.toBeNull()
    );
    store.commit('chat/setDraftImage', SCREENSHOT);
  },
};

export const PickedElementNoMatches = chat(
  { connected: ['anthropic'] },
  { activeSelector: '.sidebar-promo' }
);

export const PickedElementLongSelector = chat(
  { connected: ['anthropic'] },
  {
    activeSelector:
      'div.Page_root__a1B2c > p.article-body:nth-of-type(2):not(:first-child)',
  }
);

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
    await within(menu).findByText('GPT-6 Luna');
  },
};

export const ClearConfirmation: StoryObj = {
  ...chatWithThread(),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await user.click(await canvas.findByRole('button', { name: 'New chat' }));
    await canvas.findByRole('alertdialog');
  },
};

const openProviders = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  await user.click(
    await canvas.findByRole('button', { name: /Choose a model/ })
  );
  const menu = await findOpenMenu(canvas);
  await user.click(within(menu).getByText('Manage providers'));
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
