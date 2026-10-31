import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import {
  CONVERSATION,
  MARKS,
  TURNS,
  cliTerminal,
  save,
  shown,
  turn,
  command,
  note,
  reply,
} from '@stylebot/storybook/fixtures/cli-terminal';
import { user } from '@stylebot/storybook/story-helpers';

import CliModeTerminal from './CliModeTerminal.vue';

const meta: Meta = {
  title: 'Tests/CLI Mode/Terminal',
  tags: ['test'],
  component: CliModeTerminal,
};

export default meta;

/**
 * Waits for an element to show, once the terminal's rise animation is over.
 */
const shows = (element: HTMLElement) =>
  waitFor(() => expect(element).toBeVisible());

/**
 * The chip for a marked area, by the size it shows.
 */
const chip = (canvasElement: HTMLElement, size: string) =>
  within(canvasElement).getByText(size).closest('li') as HTMLElement;

export const PillOpens: StoryObj = {
  ...cliTerminal({ agent: 'connected', thread: TURNS }),
  name: 'the pill counts saves made while collapsed, and opens the terminal',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await shows(canvas.getByText('agent connected'));
    await shows(canvas.getByRole('button', { name: '[.] open' }));

    shown.state.thread = [
      ...TURNS,
      turn(11, [command(12, 'css add'), save(13)]),
    ];
    await user.click(await canvas.findByRole('button', { name: '[.] 1 new' }));

    await shows(canvas.getByText('stylebot'));
    await shows(canvas.getByText('ran 3 commands'));
    await shows(canvas.getByText('ran 3 commands · saved 2 times'));
    await shows(canvas.getByText('ran 1 command · saved 1 time'));

    await user.click(canvas.getByTitle('Minimize'));
    await shows(canvas.getByRole('button', { name: '[.] open' }));
  },
};

export const AgentStatus: StoryObj = {
  ...cliTerminal({ agent: 'left', thread: TURNS, expanded: true }),
  name: 'the status says when the agent stops watching and comes back',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await shows(canvas.getByText('agent disconnected'));

    await user.click(canvas.getByTitle('Minimize'));
    await shows(canvas.getByText('agent left'));

    shown.state.agent = 'connected';
    await shows(await canvas.findByText('agent connected'));
    await expect(canvas.queryByText('agent left')).toBeNull();
  },
};

export const TurnExpands: StoryObj = {
  ...cliTerminal({ agent: 'connected', thread: TURNS, expanded: true }),
  name: 'a turn opens to list each command and save',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const turnLine = canvas.getByRole('button', {
      name: /ran 3 commands · saved 2 times/,
    });

    await step('Open the turn', async () => {
      await user.click(turnLine);
      await expect(turnLine).toHaveAttribute('aria-expanded', 'true');
      await shows(canvas.getByText('stylebot css set'));
      await expect(
        canvas.getAllByText('saved the style for news.ycombinator.com')
      ).toHaveLength(2);
    });

    await step('Undo the first save', async () => {
      await user.click(canvas.getAllByRole('button', { name: '[undo]' })[0]);
      await expect(shown.events).toEqual([{ name: 'undo', value: 7 }]);
    });
  },
};

export const UndoLastSave: StoryObj = {
  ...cliTerminal({
    agent: 'connected',
    expanded: true,
    thread: [turn(1, [command(2, 'css set'), save(3), save(4, true)])],
  }),
  name: "a closed turn's undo restores its last save not yet undone",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await user.click(canvas.getByTitle('Undo the last save'));
    await expect(shown.events).toEqual([{ name: 'undo', value: 3 }]);
  },
};

export const RunningTurn: StoryObj = {
  ...cliTerminal({
    agent: 'connected',
    expanded: true,
    thread: TURNS,
    activity: 'screenshot',
  }),
  name: 'while the agent runs, the turn shows its command and the footer still shows the agent',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await shows(canvas.getByText('stylebot screenshot'));
    await expect(canvas.getByText('agent connected')).toBeVisible();
  },
};

export const Close: StoryObj = {
  ...cliTerminal(),
  name: 'the close button turns CLI mode off',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await shows(canvas.getByText('queued'));
    await user.click(canvas.getByTitle('Turn off CLI mode'));
    await waitFor(() => expect(shown.events).toEqual([{ name: 'close' }]));
  },
};

export const MarkChips: StoryObj = {
  ...cliTerminal({ agent: 'connected', marks: MARKS, expanded: true }),
  name: 'mark chips outline their area while hovered, and remove it',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Hover a chip', async () => {
      await shows(canvas.getByText('320×180'));
      await user.hover(chip(canvasElement, '320×180'));
      await waitFor(() => expect(shown.state.highlighted).toBe(1));
      await user.unhover(chip(canvasElement, '320×180'));
      await waitFor(() => expect(shown.state.highlighted).toBeNull());
    });

    await step('Remove the hovered chip', async () => {
      await user.hover(chip(canvasElement, '96×40'));
      await waitFor(() => expect(shown.state.highlighted).toBe(3));
      await user.click(canvas.getByRole('button', { name: 'Remove mark 3' }));
      await expect(shown.events).toEqual([{ name: 'unmark', value: 3 }]);
      await expect(canvas.queryByText('96×40')).toBeNull();
      await expect(shown.state.highlighted).toBeNull();
    });

    await step('Remove the last chip', async () => {
      await user.click(canvas.getByRole('button', { name: 'Remove mark 1' }));
      await shows(canvas.getByText('[drag]'));
    });
  },
};

export const InviteConnects: StoryObj = {
  ...cliTerminal({ invite: { connectedTo: null } }),
  name: 'an invite connects the tab, or hides on this page',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await shows(canvas.getByText('agent waiting'));
    await user.click(canvas.getByRole('button', { name: '[connect]' }));
    await user.click(canvas.getByTitle('Hide on this page'));
    await expect(shown.events).toEqual([
      { name: 'connect' },
      { name: 'dismiss' },
    ]);
  },
};

export const InviteMovesHere: StoryObj = {
  ...cliTerminal({ invite: { connectedTo: 'news.ycombinator.com' } }),
  name: 'with another tab connected, an invite moves CLI mode here',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await shows(canvas.getByText('agent on news.ycombinator.com'));
    await user.click(canvas.getByRole('button', { name: '[move here]' }));
    await expect(shown.events).toEqual([{ name: 'connect' }]);
  },
};

export const NoteField: StoryObj = {
  ...cliTerminal({ agent: 'connected', marks: MARKS, expanded: true }),
  name: 'the note field names the marks, sends on Enter and keeps its keys',
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const field = canvas.getByRole('textbox', { name: 'Note to your agent' });
    const heard: Array<string> = [];
    const listen = (event: KeyboardEvent) => heard.push(event.key);

    await shows(field);
    await expect(field).toHaveAttribute(
      'placeholder',
      'what should change about 1, 3?'
    );

    await step('Write two lines and send them', async () => {
      document.addEventListener('keydown', listen);
      await user.type(field, 'bigger{Shift>}{Enter}{/Shift}and blue{Enter}');
      document.removeEventListener('keydown', listen);

      await expect(shown.events).toEqual([
        { name: 'note', value: 'bigger\nand blue' },
      ]);
      await expect(field).toHaveValue('');
      await expect(heard).toEqual([]);
    });

    await step('Esc hands the keyboard back to the page', async () => {
      await user.keyboard('{Escape}');
      await expect(field).not.toHaveFocus();
    });

    await step('An empty note is not sent', async () => {
      await user.type(field, '   {Enter}');
      await expect(shown.events).toHaveLength(1);
    });

    await step('Without marks, it asks what to change', async () => {
      shown.state.marks = [];
      await waitFor(() =>
        expect(field).toHaveAttribute(
          'placeholder',
          'tell your agent what to change'
        )
      );
    });
  },
};

export const NotesAndReplies: StoryObj = {
  ...cliTerminal({ agent: 'connected', thread: CONVERSATION, expanded: true }),
  name: "notes show as prompts with their marks, and the agent's replies under them",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await shows(canvas.getByText('make these titles stand out more'));
    const refs = canvas.getByText('make these titles stand out more')
      .nextElementSibling as HTMLElement;

    await expect(refs).toHaveTextContent('12');
    await expect(
      canvas.getByText(
        'Made the titles bolder and teal, with more room between rows.'
      )
    ).toBeVisible();
    await expect(
      canvas.getByText('ran 3 commands · saved 1 time')
    ).toBeVisible();
    await expect(canvas.getByText('and hide the footer')).toBeVisible();
  },
};

export const ThinkingLine: StoryObj = {
  ...cliTerminal({
    agent: 'connected',
    thread: CONVERSATION,
    thinking: true,
    expanded: true,
  }),
  name: 'while the agent works on a note, the thread says thinking and the footer still shows the agent',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await shows(canvas.getByText('thinking'));
    await expect(canvas.getByText('agent connected')).toBeVisible();

    shown.state.activity = 'outline';
    shown.state.thread = [...CONVERSATION, turn(9, [command(10, 'outline')])];
    await shows(await canvas.findByText('stylebot outline'));
    await expect(canvas.queryByText('thinking')).toBeNull();

    shown.state.thinking = false;
    shown.state.activity = null;
    await shows(await canvas.findByText('agent connected'));
  },
};

export const ReplyOpens: StoryObj = {
  ...cliTerminal({
    agent: 'connected',
    thread: [note(1, 'make it bigger')],
    thinking: true,
  }),
  name: 'the pill shows the agent thinking, and a reply opens the terminal',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await shows(canvas.getByText('thinking'));

    shown.state.thinking = false;
    shown.state.thread = [note(1, 'make it bigger'), reply(2, 'Done.')];
    await shows(await canvas.findByText('Done.'));
    await expect(shown.state.expanded).toBe(true);

    await user.click(canvas.getByTitle('Minimize'));
    shown.state.thread = [
      ...shown.state.thread,
      turn(3, [command(4, 'css add'), save(5)]),
      reply(6, 'Also fixed the footer.'),
    ];
    await waitFor(() => expect(shown.state.expanded).toBe(true));
    await user.click(canvas.getByTitle('Minimize'));
    shown.state.thread = [
      ...shown.state.thread,
      turn(7, [command(8, 'css add'), save(9)]),
    ];
    await shows(await canvas.findByRole('button', { name: '[.] 1 new' }));
  },
};

export const Resize: StoryObj = {
  ...cliTerminal({ agent: 'connected', thread: TURNS, expanded: true }),
  name: 'dragging a corner resizes the open terminal, which the page remembers',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const panel = canvas.getByRole('region');
    const corner = panel.querySelector('.handle.nw') as HTMLElement;
    const { x, y } = corner.getBoundingClientRect();

    await shows(panel);
    await user.pointer([
      { keys: '[MouseLeft>]', target: corner, coords: { x, y } },
      { coords: { x: x - 100, y: y - 50 } },
    ]);
    await expect(getComputedStyle(panel).cursor).toBe('nwse-resize');

    await user.pointer({ keys: '[/MouseLeft]' });
    await expect(shown.state.size).toEqual({ width: 540, height: 470 });
    await expect(panel.getBoundingClientRect().width).toBe(540);
    await expect(shown.events.map(event => event.name)).toContain('move');
  },
};

export const DragCursor: StoryObj = {
  ...cliTerminal({ expanded: true }),
  name: 'the cursor grabs while the user drags the terminal',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByTitle('Drag to move');

    await shows(bar);
    await user.pointer({ keys: '[MouseLeft>]', target: bar });
    await expect(getComputedStyle(bar).cursor).toBe('grabbing');

    await user.pointer({ keys: '[/MouseLeft]' });
    await expect(getComputedStyle(bar).cursor).toBe('grab');
  },
};
