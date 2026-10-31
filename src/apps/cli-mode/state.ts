import Vue from 'vue';
import type { CliModeState } from '@stylebot/types';

export type TerminalState = CliModeState & {
  // The panel with the thread is open, rather than the pill.
  expanded: boolean;
  // Where the user dragged the terminal, from the viewport's right and bottom.
  position: { right: number; bottom: number };
};

/**
 * The terminal's state, shared by its keys and its Vue component.
 */
export const createTerminalState = (): TerminalState =>
  Vue.observable({
    thread: [],
    agent: 'awaited',
    activity: null,
    expanded: false,
    position: { right: 16, bottom: 16 },
  });
