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
};

// What the background asks of a tab's CLI mode terminal.
export type CliModeAction =
  // Shows the terminal, with its thread open when asked.
  | { kind: 'on'; state: CliModeState; open?: boolean }
  | { kind: 'off' }
  | { kind: 'state'; state: CliModeState }
  // Answers where the terminal covers the viewport, or null without one.
  | { kind: 'locate' };

export type CliModeMessage = {
  name: 'CliMode';
  action: CliModeAction;
};

// What the terminal tells the background the user did.
export type CliModePageEvent = { type: 'undo'; id: number } | { type: 'off' };

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
