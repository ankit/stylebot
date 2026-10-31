import { getCliConnected, onCliConnectedChange } from '@stylebot/settings';
import type { CliAgentStatus, CliModeState, CliTurn } from '@stylebot/types';

import { sendToTerminal } from './terminal';

// The style as it was before a save the agent made, which undo restores.
export type SavedVersion = {
  url: string;
  profileId?: string;
  readability: boolean;
  before: string;
};

/*
 * CLI mode's one session: the tab connected to the agent and what the agent
 * did there. The agent connects a tab with `stylebot mode`; connecting
 * another tab moves the session there.
 */
export type Session = {
  tabId: number;
  thread: Array<CliTurn>;
  // The agent's saves, by the id of their step in the thread.
  saves: Map<number, SavedVersion>;
  // An agent has run a command on the tab since it was connected.
  agentSeen: boolean;
  activity: string | null;
  activityTimer?: ReturnType<typeof setTimeout>;
};

let session: Session | null = null;
let nextId = 1;
let hostConnected = false;

export const getSession = (): Session | null => session;

/**
 * An id for an entry in the thread, unique across sessions.
 */
export const takeId = (): number => nextId++;

const getAgentStatus = (current: Session): CliAgentStatus => {
  if (!current.agentSeen) {
    return 'awaited';
  }

  return hostConnected ? 'connected' : 'left';
};

export const getState = (current: Session): CliModeState => ({
  thread: current.thread,
  agent: getAgentStatus(current),
  activity: current.activity,
});

/**
 * Shows the connected tab's terminal what changed.
 */
export const pushState = (): void => {
  if (session) {
    sendToTerminal(session.tabId, {
      kind: 'state',
      state: getState(session),
    }).catch(() => undefined);
  }
};

/**
 * Shows a tab in front, in a focused window, for the user to work in.
 */
const bringToFront = async (tabId: number): Promise<void> => {
  const tab = await chrome.tabs.update(tabId, { active: true });

  if (tab?.windowId !== undefined) {
    await chrome.windows.update(tab.windowId, { focused: true });
  }
};

/**
 * Ends the session, once its tab's terminal is gone or going.
 */
export const endSession = (): void => {
  clearTimeout(session?.activityTimer);
  session = null;
};

/**
 * Connects a tab to the session, moving it from the tab it was on, and shows
 * the terminal there, open when asked.
 */
export const connectTab = async (
  tabId: number,
  { open = false, front = false } = {}
): Promise<void> => {
  const previous = session?.tabId;

  if (session) {
    session.tabId = tabId;
  } else {
    session = {
      tabId,
      thread: [],
      saves: new Map(),
      agentSeen: false,
      activity: null,
    };
  }

  if (previous !== undefined && previous !== tabId) {
    await sendToTerminal(previous, { kind: 'off' }).catch(() => undefined);
  }

  if (front) {
    await bringToFront(tabId);
  }

  await sendToTerminal(tabId, { kind: 'on', state: getState(session), open });
};

/**
 * Disconnects the session's tab: the user or the agent turned CLI mode off.
 */
export const disconnect = (): void => {
  const tabId = session?.tabId;

  endSession();

  if (tabId !== undefined) {
    sendToTerminal(tabId, { kind: 'off' }).catch(() => undefined);
  }
};

/**
 * Whether a tab is the one connected to CLI mode.
 */
export const isInCliMode = (tabId: number | undefined): boolean =>
  tabId !== undefined && session?.tabId === tabId;

/**
 * The tab connected to CLI mode, if any.
 */
export const getCliModeTab = async (): Promise<chrome.tabs.Tab | undefined> =>
  session ? chrome.tabs.get(session.tabId).catch(() => undefined) : undefined;

/**
 * Shows the terminal again on the connected tab, once it has loaded a page.
 */
export const showAgain = (tabId: number): void => {
  if (session && isInCliMode(tabId)) {
    sendToTerminal(tabId, { kind: 'on', state: getState(session) }).catch(
      () => undefined
    );
  }
};

/**
 * Keeps the agent's status in step with the CLI's connection to Stylebot.
 */
export const followCliConnection = (): void => {
  getCliConnected().then(connected => {
    hostConnected = connected;
  });

  onCliConnectedChange(connected => {
    hostConnected = connected;
    pushState();
  });
};
