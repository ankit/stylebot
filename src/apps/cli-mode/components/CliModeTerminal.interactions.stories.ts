import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import {
  MARKS,
  TURNS,
  cliTerminal,
  save,
  shown,
  turn,
  command,
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
    await shows(canvas.getByRole('button', { name: '[open]' }));

    shown.state.thread = [
      ...TURNS,
      turn(11, [command(12, 'css add'), save(13)]),
    ];
    await user.click(await canvas.findByRole('button', { name: '[1 new]' }));

    await shows(canvas.getByText('stylebot'));
    await shows(canvas.getByText('ran 3 commands'));
    await shows(canvas.getByText('ran 3 commands · saved 2 times'));
    await shows(canvas.getByText('ran 1 command · saved 1 time'));

    await user.click(canvas.getByTitle('Minimize (.)'));
    await shows(canvas.getByRole('button', { name: '[open]' }));
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

    await user.click(canvas.getByTitle('Undo the last save (Z)'));
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
  name: 'while the agent runs, the turn shows its command and the footer nothing',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await shows(canvas.getByText('stylebot screenshot'));
    await expect(canvas.queryByText('agent connected')).toBeNull();
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
      await shows(canvas.getByText('# drag on the page to mark an area'));
    });
  },
};

export const InviteConnects: StoryObj = {
  ...cliTerminal({ invite: { connectedTo: null } }),
  name: 'an invite connects the tab, or hides on this page',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await shows(canvas.getByText('your agent is waiting for a tab'));
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
