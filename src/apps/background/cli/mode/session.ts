import { getCliConnected, onCliConnectedChange } from '@stylebot/settings';
import type {
  CliAgentStatus,
  CliMark,
  CliModeState,
  CliThreadEntry,
} from '@stylebot/types';

import { sendToTerminal } from './terminal';

// The style as it was before a save the agent made, which undo restores.
export type SavedVersion = {
  url: string;
  profileId?: string;
  readability: boolean;
  before: string;
};

// How long after its last command the agent stops counting as working on a
// note it hasn't answered.
export const THINKING_MS = 3 * 60_000;

// A note as `selection` hands it on: its text, its marks as they were, and a
// screenshot of the area around them with their badges.
export type NoteRead = {
  id: number;
  text: string;
  marks: Array<CliMark>;
  image?: string;
};

/*
 * CLI mode's one session: the tab connected to the agent and what the agent
 * did there. The agent connects a tab with `stylebot mode`; connecting
 * another tab moves the session there.
 */
export type Session = {
  tabId: number;
  thread: Array<CliThreadEntry>;
  // The agent's saves, by the id of their step in the thread.
  saves: Map<number, SavedVersion>;
  // An agent has run a command on the tab since it was connected.
  agentSeen: boolean;
  activity: string | null;
  activityTimer?: ReturnType<typeof setTimeout>;
  // Marks on the tab the agent hasn't read with `stylebot selection`.
  unreadMarks: Set<number>;
  // The number the next mark takes, kept across reloads of the tab.
  nextMark: number;
  // Notes the agent hasn't read with `stylebot selection`.
  unreadNotes: Array<NoteRead>;
  // The user's last note isn't answered with `stylebot say` yet.
  awaitingReply: boolean;
  // When the agent last ran a command on the tab or waited for the user.
  lastCommandAt: number;
  thinkingTimer?: ReturnType<typeof setTimeout>;
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

/**
 * Whether the agent is working on the user's note: it hasn't answered, and
 * ran a command lately.
 */
const isThinking = (current: Session): boolean =>
  current.awaitingReply && Date.now() - current.lastCommandAt < THINKING_MS;

export const getState = (current: Session): CliModeState => ({
  thread: current.thread,
  agent: getAgentStatus(current),
  thinking: isThinking(current),
  activity: current.activity,
  nextMark: current.nextMark,
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
 * Shows the terminal the agent stopped working once it has run no command
 * for a while, unless it answers first.
 */
export const scheduleThinkingEnd = (current: Session): void => {
  clearTimeout(current.thinkingTimer);

  if (isThinking(current)) {
    current.thinkingTimer = setTimeout(
      pushState,
      current.lastCommandAt + THINKING_MS - Date.now()
    );
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
  clearTimeout(session?.thinkingTimer);
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

    // The marks stay on the tab the session left.
    if (previous !== tabId) {
      session.unreadMarks.clear();
    }
  } else {
    session = {
      tabId,
      thread: [],
      saves: new Map(),
      agentSeen: false,
      activity: null,
      unreadMarks: new Set(),
      nextMark: 1,
      unreadNotes: [],
      awaitingReply: false,
      lastCommandAt: 0,
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
 * Rejects a tab a command named that isn't the connected one.
 */
export const checkTab = (session: Session, named: unknown): void => {
  if (named !== undefined && named !== '' && Number(named) !== session.tabId) {
    throw new Error(
      `CLI mode is on in tab ${session.tabId}, not tab ${named}. Use tab ${session.tabId}, or run: stylebot mode ${named}`
    );
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
