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
import type { Canvas } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Editor/Chat',
  tags: ['test'],
  component: TheChat,
  parameters: { padded: false },
};

export default meta;

const messageField = (canvas: Canvas) =>
  canvas.findByRole('textbox', { name: /Describe a change/ });

const openModelMenu = async (canvas: Canvas): Promise<HTMLElement> => {
  await user.click(
    await canvas.findByRole('button', { name: /Choose a model/ })
  );
  return findOpenMenu(canvas);
};

// The latest reply's card.
const replyCard = async (canvas: Canvas): Promise<Canvas> =>
  within(
    (await canvas.findByText(/^(Added|Removed) 4 lines$/)).closest(
      '.chat-change'
    ) as HTMLElement
  );

const send = async (canvas: Canvas, text: string): Promise<void> => {
  await user.type(await messageField(canvas), `${text}{Enter}`);
};

export const ConnectsWithAKey: StoryObj = {
  ...chat(),
  name: 'Connect waits for a key, refuses another provider’s, and opens the chat once one works',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const connect = await canvas.findByRole('button', {
      name: 'Connect Claude',
    });
    const field = canvas.getByLabelText('API key');

    await step('Connect is off until a key is typed', async () => {
      await expect(connect).toBeDisabled();
      await user.type(field, 'sk-proj-abcdefghijklmnop');
      await expect(connect).toBeEnabled();
    });

    await step('another provider’s key is refused in place', async () => {
      await user.click(connect);
      await canvas.findByText(/different provider/);
      await expect(field).toHaveAttribute('aria-invalid', 'true');
    });

    await step('a working key opens the conversation', async () => {
      await user.clear(field);
      await user.type(field, 'sk-ant-api03-abcdefghijklmnop');
      await user.click(connect);
      await messageField(canvas);
    });
  },
};

export const RepliesAndApplies: StoryObj = {
  ...chat({ connected: ['anthropic'] }),
  name: 'a message streams a reply whose CSS lands in the stylesheet, with a line counting its CSS',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await send(canvas, 'Make the text easier to read');

    await canvas.findByText('Make the text easier to read');
    await canvas.findByText(/Bumped the article text up a size/);
    await canvas.findByRole('button', { name: 'Added 4 lines' });
    await expect(store.state.css).toContain('font-size: 18px');
    await expect(store.state.css).toContain('line-height: 1.8');
  },
};

export const UndoesAndReapplies: StoryObj = {
  ...chatWithThread(),
  name: 'Undo takes the latest reply’s CSS back out, and Reapply puts it back',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    const card = await replyCard(canvas);

    await user.click(card.getByRole('button', { name: 'Undo' }));
    await card.findByRole('button', { name: 'Reapply' });
    await expect(
      canvas.getByText('Removed 4 lines').closest('.chat-change')
    ).toHaveClass('undone');
    await waitFor(() => expect(store.state.css).not.toContain('18px'));

    await user.click(card.getByRole('button', { name: 'Reapply' }));
    await card.findByRole('button', { name: 'Undo' });
    await waitFor(() => expect(store.state.css).toContain('font-size: 18px'));
  },
};

export const StopsAReply: StoryObj = {
  ...chat({ connected: ['anthropic'], hold: true }),
  name: 'Stop ends a reply midway, keeping what came in and changing nothing',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await send(canvas, 'Give the page a dark theme');
    await canvas.findByText(/Switched the page/);

    await user.click(canvas.getByRole('button', { name: 'Stop' }));
    await canvas.findByText('(Stopped)');
    await expect(chatStateOf(canvasElement).pending).toBeNull();
    await expect(store.state.css).toBe('');
  },
};

export const RetriesAFailure: StoryObj = {
  ...chat({
    connected: ['anthropic'],
    error: { type: 'error', errorKey: 'chat_error_rate_limited' },
  }),
  name: 'a failed reply says why, and Try again sends the message once more',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await send(canvas, 'Give the page a dark theme');
    await canvas.findByText(/reached your rate limit/);

    await user.click(canvas.getByRole('button', { name: 'Try again' }));
    await canvas.findByText(/reached your rate limit/);
    await expect(
      canvas.getAllByText('Give the page a dark theme')
    ).toHaveLength(1);
  },
};

export const SwitchesModels: StoryObj = {
  ...chat({ connected: ['anthropic'] }),
  name: 'the model menu switches the model the next reply uses',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const menu = await openModelMenu(canvas);

    await user.click(within(menu).getByText('Claude Opus 5'));

    await waitFor(() =>
      expect(chatStateOf(canvasElement).status?.model).toBe('claude-opus-5')
    );
    await canvas.findByRole('button', { name: /Claude Opus 5/ });
  },
};

export const RendersMarkdown: StoryObj = {
  ...chatWithThread({
    threads: {
      'example.com': [
        ASK,
        {
          ...REPLY,
          text: '1. **Bold** and `code`\n2. <b>tags</b> stay text',
        },
      ],
    },
  }),
  name: 'a reply’s markdown renders as a list with bold and code, and HTML stays text',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const list = await canvas.findByRole('list');
    await expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    // No stray spaces where code and bold meet the text around them.
    await expect(within(list).getAllByRole('listitem')[0]).toHaveTextContent(
      /^Bold and code$/
    );
    await expect(
      within(list).getByText('Bold').closest('strong')
    ).not.toBeNull();
    await expect(within(list).getByText('code').tagName).toBe('CODE');
    await expect(
      within(list).getByText(/<b>tags<\/b> stay text/)
    ).toBeVisible();
    await expect(list.querySelector('b')).toBeNull();
  },
};

export const ShowsTokenUsage: StoryObj = {
  ...chatWithThread(),
  name: 'the composer counts the chat’s tokens, breaks them into input and output, and estimates the cost',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await user.click(
      await canvas.findByRole('button', { name: '44.6K tokens' })
    );
    const usage = await canvas.findByRole('dialog', { name: 'This chat' });

    await expect(usage).toHaveTextContent(/Input\s*44.4K/);
    await expect(usage).toHaveTextContent(/Output\s*214/);
    await expect(usage).toHaveTextContent(/Est. cost\s*\$0.02/);
    await expect(
      within(usage).getByRole('link', { name: /Claude usage/ })
    ).toHaveAttribute('href', 'https://console.anthropic.com/settings/usage');
  },
};

export const ClearsTheChat: StoryObj = {
  ...chatWithThread(),
  name: 'New chat in the tab bar asks first, then clears the conversation but keeps its CSS',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await user.click(await canvas.findByRole('button', { name: 'New chat' }));
    const confirm = await canvas.findByRole('alertdialog');

    await user.click(within(confirm).getByRole('button', { name: 'Cancel' }));
    await expect(chatStateOf(canvasElement).turns).toHaveLength(2);

    await user.click(canvas.getByRole('button', { name: 'New chat' }));
    await user.click(
      within(await canvas.findByRole('alertdialog')).getByRole('button', {
        name: 'Clear chat',
      })
    );

    await waitFor(() =>
      expect(chatStateOf(canvasElement).turns).toHaveLength(0)
    );
    await expect(store.state.css).toContain('font-size: 18px');
    await expect(
      canvas.getByRole('button', { name: 'New chat' })
    ).toBeDisabled();
  },
};

const openProviders = async (canvas: Canvas): Promise<void> => {
  await user.click(
    within(await openModelMenu(canvas)).getByText('Manage providers')
  );
  await canvas.findByText('Back to chat');
};

const cardOf = (canvas: Canvas, name: string): Canvas =>
  within(canvas.getByText(name).closest('.chat-provider-card') as HTMLElement);

export const AddsAnotherProvider: StoryObj = {
  ...chatWithThread(),
  name: 'a second provider’s key keeps replies on the first, and its models open from the menu',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Add key on the Providers screen connects OpenAI', async () => {
      await openProviders(canvas);
      await user.click(
        cardOf(canvas, 'OpenAI').getByRole('button', { name: 'Add key' })
      );
      await user.type(
        canvas.getByLabelText('API key'),
        'sk-proj-abcdefghijklmnop{Enter}'
      );

      await waitFor(() =>
        expect(chatStateOf(canvasElement).status?.providers).toContainEqual(
          expect.objectContaining({ id: 'openai', connected: true })
        )
      );
      await expect(chatStateOf(canvasElement).status?.provider).toBe(
        'anthropic'
      );
    });

    await step('its models open in place from the menu', async () => {
      await user.click(canvas.getByRole('button', { name: /Back to chat/ }));
      const menu = await openModelMenu(canvas);

      await user.click(within(menu).getByText('OpenAI'));
      await user.click(await within(menu).findByText('GPT-5.6 Luna'));

      await waitFor(() =>
        expect(chatStateOf(canvasElement).status).toMatchObject({
          provider: 'openai',
          model: 'gpt-5.6-luna',
        })
      );
    });
  },
};

export const RemovesAProvider: StoryObj = {
  ...chatWithThread({ connected: ['anthropic', 'openai'] }),
  name: 'removing the provider in use moves replies to another, and removing the last turns Chat off',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await openProviders(canvas);
    await user.click(
      cardOf(canvas, 'Claude').getByRole('button', { name: 'Remove' })
    );

    await waitFor(() =>
      expect(chatStateOf(canvasElement).status?.provider).toBe('openai')
    );

    await user.click(
      cardOf(canvas, 'OpenAI').getByRole('button', { name: 'Remove' })
    );
    await canvas.findByRole('button', { name: 'Connect Claude' });
  },
};

export const SendsThePickedElement: StoryObj = {
  ...chat({ connected: ['anthropic'] }, { activeSelector: 'h1' }),
  name: 'a message sent with an element picked shows its selector',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await send(canvas, 'Make this bigger');

    await waitFor(() =>
      expect(chatStateOf(canvasElement).turns[0]).toMatchObject({
        text: 'Make this bigger',
        scope: 'h1',
      })
    );
    await waitFor(() =>
      expect(canvasElement.querySelector('.chat-user-scope')).toHaveTextContent(
        'h1'
      )
    );
  },
};

export const AttachesAnImage: StoryObj = {
  ...chat({ connected: ['anthropic'] }),
  name: 'an image picked from disk shows above the text, goes with the message, and can be removed',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const png = await (await fetch(SCREENSHOT.dataUrl)).blob();
    const file = new File([png], 'mock.png', { type: 'image/png' });
    const input = canvasElement.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    await step('picking attaches it, and remove takes it off', async () => {
      await user.upload(input, file);
      await canvas.findByText('mock.png');
      await user.click(canvas.getByRole('button', { name: 'Remove' }));
      await waitFor(() =>
        expect(canvas.queryByText('mock.png')).not.toBeInTheDocument()
      );
    });

    await step('an attached image goes out with the message', async () => {
      await user.upload(input, file);
      await canvas.findByText('mock.png');
      await send(canvas, 'Match this');

      await waitFor(() =>
        expect(chatStateOf(canvasElement).turns[0]).toMatchObject({
          image: { name: 'mock.png' },
        })
      );
      await canvas.findByAltText('mock.png');
      await expect(chatStateOf(canvasElement).draftImage).toBeNull();
    });
  },
};

export const ShowsTheCode: StoryObj = {
  ...chatWithThread(),
  name: 'clicking a reply’s change row opens the Code tab without changing the picked element',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    const card = await replyCard(canvas);
    await user.click(card.getByRole('button', { name: 'Added 4 lines' }));

    await waitFor(() => expect(store.state.options.mode).toBe('code'));
    await expect(store.state.activeSelector).toBe('');
    await expect(store.state.codeHighlight).toEqual([
      { startLine: 1, endLine: 4 },
    ]);
  },
};
