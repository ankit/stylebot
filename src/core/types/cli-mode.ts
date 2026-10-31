import type { ViewportRect } from './TabMessage';

// One step of what the agent did on the connected tab.
export type CliTurnStep =
  // A command it ran, as it typed it, less the tab and --profile.
  | { kind: 'command'; id: number; text: string }
  // A save of the style the tab shows, which can be undone.
  | { kind: 'save'; id: number; url: string; undone: boolean };

// One entry in CLI mode's thread: the commands an agent ran in one go.
export type CliTurn = {
  kind: 'turn';
  id: number;
  steps: Array<CliTurnStep>;
};

// Whether an agent has been at work on the connected tab.
export type CliAgentStatus =
  // None has run a command on the tab since it was connected.
  | 'awaited'
  | 'connected'
  // One was, and the CLI's connection to Stylebot has since gone.
  | 'left';

// What the terminal shows, which the background keeps for the CLI mode session.
export type CliModeState = {
  thread: Array<CliTurn>;
  agent: CliAgentStatus;
  // The command the agent is running on the tab now, if any.
  activity: string | null;
  // The number the next mark takes, so numbers aren't reused after a reload.
  nextMark: number;
};

// An element in a mark's area, as `stylebot selection` lists it.
export type CliMarkedElement = {
  selector: string;
  matches: number | null;
  // A selector for this element alone, when the first matches others too.
  unique?: string;
};

// A mark as `stylebot selection` reports it.
export type CliMark = {
  n: number;
  // Its area now, in css pixels of the viewport.
  rect: ViewportRect;
  // The outermost elements wholly inside the area, or when none is, the
  // element at its middle.
  elements: Array<CliMarkedElement>;
  whole: boolean;
  // Elements wholly inside it that weren't listed.
  more: number;
};

// What the background asks of a tab's CLI mode terminal.
export type CliModeAction =
  // Shows the terminal, with its thread open when asked.
  | { kind: 'on'; state: CliModeState; open?: boolean }
  | { kind: 'off' }
  | { kind: 'state'; state: CliModeState }
  // Before a capture: hides the marks until endCapture, and answers where
  // the terminal covers the viewport, or null without one.
  | { kind: 'startCapture' }
  | { kind: 'endCapture' }
  // Answers each mark as a CliMark, preferring selectors the css has.
  | { kind: 'selection'; css: string }
  // Scrolls a mark into view if it isn't, and answers its ElementFrame, or
  // null without that mark.
  | { kind: 'frameMark'; n: number }
  | { kind: 'restoreScroll' }
  // Invites the user to connect a tab while an agent waits for one,
  // naming the host of the tab connected now, if any.
  | { kind: 'invite'; connectedTo: string | null };

export type CliModeMessage = {
  name: 'CliMode';
  action: CliModeAction;
};

// What the terminal tells the background the user did.
export type CliModePageEvent =
  | { type: 'undo'; id: number }
  | { type: 'off' }
  | { type: 'mark'; n: number }
  | { type: 'unmark'; n: number }
  // From a tab's invite: connect the tab, or hide the invite.
  | { type: 'connect' }
  | { type: 'dismiss' };

export type CliModeEvent = {
  name: 'CliModeEvent';
  event: CliModePageEvent;
};

// What the CLI mode bundle hands the page's listener script.
export type CliModeApp = (action: CliModeAction) => Promise<unknown>;

// The CLI mode bundle sets stylebotCliMode once it has run.
export type CliModeAppWindow = Window & {
  stylebotCliMode?: CliModeApp;
};
