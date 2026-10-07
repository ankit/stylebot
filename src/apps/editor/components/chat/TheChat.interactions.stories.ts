import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import TheChat from './TheChat.vue';
import {
  CREATIVE_SUGGESTIONS,
  getPracticalSuggestions,
  TERMINAL_THEMES,
} from '@stylebot/chat';
import { t } from '@stylebot/i18n';
import {
  ASK,
  chat,
  chatStateOf,
  chatWithChange,
  chatWithThread,
  MIXED_EDITS,
  REPLY,
  SCREENSHOT,
} from '@stylebot/storybook/fixtures/chat';
import {
  findOpenMenu,
  hoverPage,
  pick,
  storeOf,
  user,
} from '@stylebot/storybook/story-helpers';
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

// The latest reply's change row.
const replyCard = async (canvas: Canvas): Promise<Canvas> =>
  within(
    (await canvas.findByText(/^(Updated styles|Styles undone)$/)).closest(
      '.chat-change'
    ) as HTMLElement
  );

// The latest reply's label and diff count.
const summary = (root: HTMLElement): string =>
  Array.from(
    root.querySelectorAll(
      '.chat-change-label, .chat-change-added, .chat-change-removed'
    )
  )
    .map(part => (part.textContent ?? '').replace(/\s+/g, ' ').trim())
    .join(' ');

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
  name: 'a message streams a reply whose CSS lands in the stylesheet, with a row counting what it changed',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await send(canvas, 'Make the text easier to read');

    await canvas.findByText('Make the text easier to read');
    await canvas.findByText(/Bumped the article text up a size/);
    await waitFor(() =>
      expect(summary(canvasElement)).toBe('Updated styles +2')
    );
    await expect(store.state.css).toContain('font-size: 18px');
    await expect(store.state.css).toContain('line-height: 1.8');
  },
};

export const StabilizesHashedClasses: StoryObj = {
  ...chat({ connected: ['anthropic'] }),
  name: 'a reply naming a build-hashed class lands in the stylesheet by the class’s stable part',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await send(canvas, 'Put a border around the page');

    await canvas.findByText(/Framed the page/);
    await waitFor(() =>
      expect(store.state.css).toContain('div[class*="Page_root__"]')
    );
    await expect(store.state.css).not.toContain('a1B2c');
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
      canvas.getByText('Styles undone').closest('.chat-change')
    ).toHaveClass('undone');
    await waitFor(() => expect(store.state.css).not.toContain('18px'));

    await user.click(card.getByRole('button', { name: 'Reapply' }));
    await card.findByRole('button', { name: 'Undo' });
    await waitFor(() => expect(store.state.css).toContain('font-size: 18px'));
  },
};

export const HeaderUndoMarksTheReply: StoryObj = {
  ...chat({ connected: ['anthropic'] }),
  name: 'the header’s Undo takes a reply back out and its row reads Styles undone, and Redo puts both back',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await send(canvas, 'Make the text easier to read');
    await waitFor(() =>
      expect(summary(canvasElement)).toBe('Updated styles +2')
    );
    const header = within(
      canvasElement.querySelector('.header') as HTMLElement
    );

    await step('Undo', async () => {
      await user.click(header.getByRole('button', { name: 'Undo' }));

      await waitFor(() => expect(store.state.css).not.toContain('18px'));
      await (
        await replyCard(canvas)
      ).findByRole('button', {
        name: 'Reapply',
      });
    });

    await step('Redo', async () => {
      await user.click(header.getByRole('button', { name: 'Redo' }));

      await waitFor(() => expect(store.state.css).toContain('font-size: 18px'));
      await (await replyCard(canvas)).findByRole('button', { name: 'Undo' });
    });
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

export const AppliesAsItStreams: StoryObj = {
  ...chat({ connected: ['anthropic'], hold: 'edits' }),
  name: 'a reply’s CSS lands while it streams, its change row waiting for it to finish, and Stop keeps it as one reply to undo',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await step('the first rule lands while the reply streams', async () => {
      await send(canvas, 'Give the page a dark theme');
      await waitFor(() => expect(store.state.css).toContain('#16181c'));
      await expect(chatStateOf(canvasElement).pending).not.toBeNull();
      await expect(store.state.undoStack.past).toHaveLength(1);
    });

    await step('its change row waits for the reply to finish', async () => {
      await expect(
        canvas.queryByText('Updated styles')
      ).not.toBeInTheDocument();
    });

    await step('Stop keeps it, and Undo takes it back out', async () => {
      await user.click(canvas.getByRole('button', { name: 'Stop' }));
      await canvas.findByText('(Stopped)');
      await expect(store.state.css).toContain('#16181c');

      const card = await replyCard(canvas);
      await user.click(card.getByRole('button', { name: 'Undo' }));
      await waitFor(() => expect(store.state.css).not.toContain('#16181c'));
    });
  },
};

export const RollsBackAFailureMidway: StoryObj = {
  ...chat({
    connected: ['anthropic'],
    hold: 'edits',
    error: { type: 'error', errorKey: 'chat_error_network' },
  }),
  name: 'a reply that fails after its first rule landed takes it back out, and offers to try again',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await send(canvas, 'Give the page a dark theme');
    await canvas.findByRole('button', { name: 'Try again' });
    await expect(store.state.css).not.toContain('#16181c');
    await expect(store.state.undoStack.past).toHaveLength(0);
  },
};

export const RepliesAsOneUndoStep: StoryObj = {
  ...chat({ connected: ['anthropic'] }),
  name: 'a reply whose rules stream in one by one is a single step to undo',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await send(canvas, 'Give the page a dark theme');
    await waitFor(() =>
      expect(summary(canvasElement)).toBe('Updated styles +3')
    );
    await expect(store.state.css).toContain('#8ab4f8');
    await expect(store.state.undoStack.past).toHaveLength(1);
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

    await user.click(within(menu).getByText('Claude Opus 5.5'));

    await waitFor(() =>
      expect(chatStateOf(canvasElement).status?.model).toBe('claude-opus-5-5')
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
      await user.click(await within(menu).findByText('GPT-6 Luna'));

      await waitFor(() =>
        expect(chatStateOf(canvasElement).status).toMatchObject({
          provider: 'openai',
          model: 'gpt-6-luna',
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

const pickedElement = (canvas: Canvas) =>
  canvas.queryByRole('group', { name: 'Picked element' });

const overlayHints = () =>
  document.querySelectorAll('#stylebot-overlay .stylebot-overlay-hint');

export const ShowsThePickedElement: StoryObj = {
  ...chat({ connected: ['anthropic'] }),
  name: 'a pick shows above the field with its match count, and focus goes back to the field',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await user.click(
      await canvas.findByRole('button', {
        name: 'Select an element in the page to style it',
      })
    );
    await expect(store.state.inspecting).toBe(true);

    await pick(canvas.getByRole('heading', { level: 1 }));

    await waitFor(() => expect(pickedElement(canvas)).not.toBeNull());
    const chip = pickedElement(canvas) as HTMLElement;
    await expect(chip).toHaveTextContent(store.state.activeSelector);
    await within(chip).findByText('1 match');
    await waitFor(async () => expect(await messageField(canvas)).toHaveFocus());
  },
};

export const FocusesTheFieldOnReopen: StoryObj = {
  ...chat({ connected: ['anthropic'] }),
  name: 'reopening the editor on the Chat tab focuses the message field',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await waitFor(async () => expect(await messageField(canvas)).toHaveFocus());

    store.commit('setVisible', false);
    await waitFor(() =>
      expect(
        canvas.queryByRole('textbox', { name: /Describe a change/ })
      ).toBeNull()
    );
    store.commit('setVisible', true);

    await waitFor(async () => expect(await messageField(canvas)).toHaveFocus());
  },
};

export const RemovesThePickedElement: StoryObj = {
  ...chat({ connected: ['anthropic'] }, { activeSelector: 'h1' }),
  name: 'removing the picked element in the composer clears it in the header too',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const header = canvasElement.querySelector(
      '.selector-autocomplete'
    ) as HTMLElement;

    await waitFor(() => expect(header).toHaveTextContent('h1'));
    await user.click(
      await canvas.findByRole('button', { name: 'Remove picked element' })
    );

    await expect(store.state.activeSelector).toBe('');
    await waitFor(() => expect(pickedElement(canvas)).toBeNull());
    await waitFor(() => expect(header).not.toHaveTextContent('h1'));
  },
};

export const BackspaceRemovesAttachments: StoryObj = {
  ...chat({ connected: ['anthropic'] }, { activeSelector: 'h1' }),
  name: 'Backspace in the empty field takes off the image first, then the picked element',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const field = await messageField(canvas);

    await waitFor(() =>
      expect(chatStateOf(canvasElement).status).not.toBeNull()
    );
    store.commit('chat/setDraftImage', SCREENSHOT);
    await canvas.findByText('Screenshot');

    await user.type(field, 'ab{Backspace}{Backspace}');
    await expect(chatStateOf(canvasElement).draftImage).not.toBeNull();

    await user.type(field, '{Backspace}');
    await waitFor(() =>
      expect(chatStateOf(canvasElement).draftImage).toBeNull()
    );
    await expect(store.state.activeSelector).toBe('h1');

    await user.type(field, '{Backspace}');
    await expect(store.state.activeSelector).toBe('');
    await waitFor(() => expect(pickedElement(canvas)).toBeNull());
  },
};

export const KeepsThePickedElement: StoryObj = {
  ...chat({ connected: ['anthropic'] }, { activeSelector: 'h1' }),
  name: 'the picked element stays above the field after a message goes out with it',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await send(canvas, 'Give this more room');
    await canvas.findByText('Gave the heading more room below it.');

    await expect(store.state.activeSelector).toBe('h1');
    await expect(pickedElement(canvas)).toHaveTextContent('h1');
  },
};

export const HighlightsThePickedElement: StoryObj = {
  ...chat({ connected: ['anthropic'] }, { activeSelector: '.article-body' }),
  name: 'hovering the picked element highlights its matches on the page until the pointer leaves',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() => expect(pickedElement(canvas)).not.toBeNull());
    const chip = pickedElement(canvas) as HTMLElement;
    await within(chip).findByText('2 matches');

    await hoverPage(chip);
    await waitFor(() => expect(overlayHints()).toHaveLength(2));

    await user.unhover(chip);
    await waitFor(() => expect(overlayHints()).toHaveLength(0));
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
  name: 'View switches to the Code tab with the reply’s lines marked, keeping the picked element',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    const card = await replyCard(canvas);
    await user.click(card.getByRole('button', { name: 'View code' }));

    await waitFor(() => expect(store.state.options.mode).toBe('code'));
    await expect(store.state.activeSelector).toBe('');
    await expect(store.state.codeHighlight).toEqual([
      { startLine: 1, endLine: 4 },
    ]);
  },
};

export const SumsUpTheChange: StoryObj = {
  ...chatWithChange(MIXED_EDITS),
  name: 'a reply’s change row counts what it added and removed',
  play: async ({ canvasElement }) => {
    await within(canvasElement).findByText('Updated styles');
    await expect(summary(canvasElement)).toMatch(/^Updated styles \+4 −2$/);
  },
};

export const OpensAnOlderChange: StoryObj = {
  ...chatWithThread({
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
  }),
  name: 'an older reply’s row has no buttons, and clicking it or pressing Enter on it opens the Code tab',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);
    const older = await canvas.findByRole('button', {
      name: /^Updated styles/,
    });

    await step('it has no View or Undo of its own', async () => {
      await expect(within(older).queryAllByRole('button')).toHaveLength(0);
    });

    await step('clicking the row opens its lines in Code', async () => {
      await user.click(within(older).getByText('Updated styles'));
      await waitFor(() => expect(store.state.options.mode).toBe('code'));
      await expect(store.state.codeHighlight).toEqual([
        { startLine: 1, endLine: 4 },
      ]);
    });

    await step('Enter on the row does the same', async () => {
      await store.dispatch('setMode', 'chat');
      const row = await canvas.findByRole('button', {
        name: /^Updated styles/,
      });
      row.focus();
      await user.keyboard('{Enter}');
      await waitFor(() => expect(store.state.options.mode).toBe('code'));
    });
  },
};

export const KeepsUndoOnTheLastChange: StoryObj = {
  ...chatWithThread({
    threads: {
      'example.com': [
        ASK,
        REPLY,
        { ...ASK, id: 'u2', text: 'Why is it easier to read?' },
        {
          ...REPLY,
          id: 'a2',
          text: 'Bigger text and more space between lines.',
          edits: [],
          previous: [],
          applied: false,
        },
      ],
    },
  }),
  name: 'Undo stays on the last reply that changed styles, under replies that only answered',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const store = storeOf(canvasElement);

    await canvas.findByText('Bigger text and more space between lines.');
    const card = await replyCard(canvas);

    await user.click(card.getByRole('button', { name: 'Undo' }));
    await waitFor(() => expect(store.state.css).not.toContain('18px'));
  },
};

export const UndoUpdatesTheSummary: StoryObj = {
  ...chatWithChange(MIXED_EDITS),
  name: 'Undo turns the row’s label into Styles undone, and Reapply brings the diff back',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const card = await replyCard(canvas);

    await user.click(card.getByRole('button', { name: 'Undo' }));
    await card.findByRole('button', { name: 'Reapply' });
    await expect(summary(canvasElement)).toMatch(/^Styles undone$/);

    await user.click(card.getByRole('button', { name: 'Reapply' }));
    await card.findByRole('button', { name: 'Undo' });
    await expect(summary(canvasElement)).toMatch(/^Updated styles \+4 −2$/);
  },
};

const suggestions = async (canvas: Canvas): Promise<Canvas> =>
  within(
    await canvas.findByRole('group', {
      name: 'What should this site look like?',
    })
  );

export const SendsASuggestion: StoryObj = {
  ...chat({ connected: ['anthropic'] }),
  name: 'clicking a suggestion sends its full request as a message, and the suggestions go once the chat has one',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const request = getPracticalSuggestions({
      signals: null,
      article: false,
    })[0].request;

    await user.click(
      (await suggestions(canvas)).getByRole('button', { name: 'Dark mode' })
    );

    await waitFor(() =>
      expect(chatStateOf(canvasElement).turns[0]).toMatchObject({
        role: 'user',
        text: request,
      })
    );
    await canvas.findByText(request);
    await canvas.findByText(/Switched the page/);
    await expect(
      canvas.queryByRole('group', { name: 'What should this site look like?' })
    ).not.toBeInTheDocument();
  },
};

// A card's label, without the characters its preview draws with.
const labelOf = (card: HTMLElement): string =>
  card.lastElementChild?.textContent?.trim() ?? '';

const isCreative = (card: HTMLElement): boolean => {
  const label = labelOf(card);

  return (
    CREATIVE_SUGGESTIONS.some(item => t(item.label) === label) ||
    TERMINAL_THEMES.some(name => t('terminal_theme', [name]) === label)
  );
};

export const SuggestsSomethingCreative: StoryObj = {
  ...chat({ connected: ['anthropic'] }),
  name: 'the last card is a creative look, and More ideas swaps in three other looks',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const cards = async (): Promise<Array<HTMLElement>> =>
      (await suggestions(canvas)).getAllByRole('button');

    await step('two page suggestions, then a creative look', async () => {
      const first = await cards();

      await expect(first).toHaveLength(3);
      await expect(isCreative(first[0])).toBe(false);
      await expect(isCreative(first[2])).toBe(true);
    });

    await step('More ideas shows three looks', async () => {
      const before = (await cards()).map(labelOf);

      await user.click(canvas.getByRole('button', { name: 'More ideas' }));

      await waitFor(async () => {
        const after = await cards();
        await expect(after).toHaveLength(3);
        await expect(after.every(isCreative)).toBe(true);
        await expect(after.map(labelOf)).not.toEqual(before);
      });
    });
  },
};

export const FillsASuggestion: StoryObj = {
  ...chat({ connected: ['anthropic'] }),
  name: 'Shift-clicking a suggestion puts its request in the message field to edit, without sending it',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const chip = (await suggestions(canvas)).getByRole('button', {
      name: 'Easier to read',
    });

    await user.keyboard('{Shift>}');
    await user.click(chip);
    await user.keyboard('{/Shift}');

    await expect(await messageField(canvas)).toHaveValue(
      getPracticalSuggestions({ signals: null, article: false })[1].request
    );
    await expect(await messageField(canvas)).toHaveFocus();
    await expect(chatStateOf(canvasElement).turns).toHaveLength(0);
  },
};

export const HidesSuggestionsInAConversation: StoryObj = {
  ...chatWithThread(),
  name: 'a chat that already has messages shows no suggestions',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await canvas.findByText(ASK.text);
    await expect(
      canvas.queryByRole('group', { name: 'What should this site look like?' })
    ).not.toBeInTheDocument();
  },
};
