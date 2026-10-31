import type { StoryObj } from '@storybook/vue';
import type { CliTurn, CliTurnStep } from '@stylebot/types';

import CliModeTerminal from '@/apps/cli-mode/components/CliModeTerminal.vue';
import { createTerminalState, type TerminalState } from '@/apps/cli-mode/state';

export const command = (id: number, text: string): CliTurnStep => ({
  kind: 'command',
  id,
  text,
});

export const save = (id: number, undone = false): CliTurnStep => ({
  kind: 'save',
  id,
  url: 'news.ycombinator.com',
  undone,
});

export const turn = (id: number, steps: Array<CliTurnStep>): CliTurn => ({
  kind: 'turn',
  id,
  steps,
});

// An agent's first look at a page, then a restyle it saved twice.
export const TURNS: Array<CliTurn> = [
  turn(1, [
    command(2, 'outline'),
    command(3, 'screenshot'),
    command(4, "page-rules '.titleline > a'"),
  ]),
  turn(5, [
    command(6, 'css set'),
    save(7),
    command(8, "css rule '.titleline > a' --set color=#4fb6b0"),
    save(9),
    command(10, 'screenshot'),
  ]),
];

export type TerminalEvent = { name: string; value?: unknown };

// The terminal on screen: its state, and what it told the page.
export const shown: { state: TerminalState; events: Array<TerminalEvent> } = {
  state: createTerminalState(),
  events: [],
};

/**
 * Renders CLI mode's terminal with its state, wired as the page wires it,
 * and records what it tells the page in `shown.events`.
 */
export const cliTerminal = (
  overrides: Partial<TerminalState> = {}
): StoryObj => ({
  render: () => {
    const state = Object.assign(createTerminalState(), overrides);
    const events: Array<TerminalEvent> = [];

    shown.state = state;
    shown.events = events;

    return {
      components: { CliModeTerminal },
      data: () => ({ state, events }),
      template: `
        <cli-mode-terminal
          :state="state"
          @expand="state.expanded = $event"
          @place="state.position = $event"
          @undo="events.push({ name: 'undo', value: $event })"
          @move="events.push({ name: 'move', value: $event })"
          @close="events.push({ name: 'close' })"
        />`,
    };
  },
});
