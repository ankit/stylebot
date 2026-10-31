import Vue from 'vue';
import type { CliModeState, ViewportRect } from '@stylebot/types';

import type { PageArea } from './areas';

// An area the user marked on the page, numbered by its badge.
export type PageMark = { n: number; area: PageArea };

export type TerminalState = CliModeState & {
  // The panel with the thread is open, rather than the pill.
  expanded: boolean;
  // Where the user dragged the terminal, from the viewport's right and bottom.
  position: { right: number; bottom: number };
  marks: Array<PageMark>;
  // The mark whose chip the pointer is over, outlined on the page.
  highlighted: number | null;
  // The area being dragged out, in the viewport.
  drag: ViewportRect | null;
  // The marks are hidden for a capture.
  capturing: boolean;
  // Shown instead of the terminal, on a tab while an agent waits for one.
  invite: { connectedTo: string | null } | null;
};

/**
 * The terminal's state, shared by its keys, its marks and its Vue component.
 */
export const createTerminalState = (): TerminalState =>
  Vue.observable({
    thread: [],
    agent: 'awaited',
    activity: null,
    nextMark: 1,
    expanded: false,
    position: { right: 16, bottom: 16 },
    marks: [],
    highlighted: null,
    drag: null,
    capturing: false,
    invite: null,
  });
