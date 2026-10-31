import type { CliModeAction, CliModeState } from '@stylebot/types';

import { applyStylesToAllTabs, getAll, set } from '../../styles';
import { sendToTerminal } from './terminal';

jest.mock('../../styles', () => ({
  applyStylesToAllTabs: jest.fn(async () => undefined),
  getAll: jest.fn(async () => ({})),
  set: jest.fn(async () => undefined),
}));
jest.mock('./terminal', () => ({
  sendToTerminal: jest.fn(async () => null),
}));
jest.mock('@stylebot/settings', () => ({
  getCliConnected: jest.fn(async () => true),
  onCliConnectedChange: jest.fn(),
}));

type Mode = typeof import('./index');
type Listener = (...args: Array<unknown>) => unknown;

const TAB = 7;
const OTHER_TAB = 8;
const URL = 'https://example.com/';

let mode: Mode;
let listeners: Record<string, Listener>;
let activeTab: number;

const listen = (name: string) => ({
  addListener: (listener: Listener) => (listeners[name] = listener),
});

new Promise(resolve => jest.requireActual('timers').setImmediate(resolve));

/**
 * What the terminal on a tab was last told to show.
 */
const lastState = (tabId = TAB): CliModeState | undefined => {
  const actions = (sendToTerminal as jest.Mock).mock.calls
    .filter(([id]) => id === tabId)
    .map(([, action]) => action as CliModeAction);

  for (const action of actions.reverse()) {
    if (action.kind === 'on' || action.kind === 'state') {
      return action.state;
    }

    if (action.kind === 'off') {
      return undefined;
    }
  }

  return undefined;
};

/**
 * Sends a page event from a tab's terminal, as the background hears it.
 */
const fromTerminal = async (tabId: number, event: unknown) => {
  const done = new Promise(resolve =>
    listeners.message(
      { name: 'CliModeEvent', event },
      { tab: { id: tabId } },
      resolve
    )
  );
  await done;
};

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  listeners = {};
  activeTab = TAB;

  global.chrome = {
    runtime: { onMessage: listen('message') },
    tabs: {
      get: jest.fn(async (id: number) => ({ id, url: URL, windowId: 1 })),
      query: jest.fn(async () => [{ id: activeTab, url: URL }]),
      update: jest.fn(async (id: number) => ({ id, windowId: 1 })),
      onUpdated: listen('updated'),
      onRemoved: listen('removed'),
    },
    windows: { update: jest.fn(async () => undefined) },
  } as unknown as typeof chrome;

  jest.isolateModules(() => {
    mode = require('./index');
  });
  mode.initCliMode();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('mode', () => {
  it('connects a tab, bringing it to the front with the thread open', async () => {
    expect(await mode.modeCommands.mode({ tab: String(TAB) })).toEqual({
      tab: TAB,
      on: true,
    });

    expect(mode.isInCliMode(TAB)).toBe(true);
    expect(chrome.tabs.update).toHaveBeenCalledWith(TAB, { active: true });
    expect(chrome.windows.update).toHaveBeenCalledWith(1, { focused: true });
    expect(sendToTerminal).toHaveBeenCalledWith(TAB, {
      kind: 'on',
      open: true,
      state: { thread: [], agent: 'awaited', activity: null },
    });
  });

  it('moves the session to another tab, taking the terminal off the first', async () => {
    await mode.modeCommands.mode({ tab: String(TAB) });
    await mode.modeCommands.mode({ tab: String(OTHER_TAB) });

    expect(mode.isInCliMode(TAB)).toBe(false);
    expect(mode.isInCliMode(OTHER_TAB)).toBe(true);
    expect(sendToTerminal).toHaveBeenCalledWith(TAB, { kind: 'off' });
  });

  it('disconnects with --off', async () => {
    await mode.modeCommands.mode({ tab: String(TAB) });
    await mode.modeCommands.mode({ tab: String(TAB), on: false });

    expect(mode.isInCliMode(TAB)).toBe(false);
    expect(lastState()).toBeUndefined();
  });

  it("refuses a tab Stylebot can't run in", async () => {
    (chrome.tabs.get as jest.Mock).mockResolvedValueOnce({
      id: TAB,
      url: 'chrome://settings',
    });

    await expect(mode.modeCommands.mode({ tab: String(TAB) })).rejects.toThrow(
      "Stylebot can't run in tab 7"
    );
  });

  it('needs a tab', async () => {
    await expect(mode.modeCommands.mode({})).rejects.toThrow('Name the tab');
  });
});

describe('the session', () => {
  it('toggles for the shortcut', async () => {
    await mode.toggleCliMode(TAB);
    expect(mode.isInCliMode(TAB)).toBe(true);
    expect(chrome.tabs.update).not.toHaveBeenCalled();

    await mode.toggleCliMode(TAB);
    expect(mode.isInCliMode(TAB)).toBe(false);
  });

  it("ends when the terminal's close is pressed", async () => {
    await mode.toggleCliMode(TAB);
    await fromTerminal(TAB, { type: 'off' });

    expect(mode.isInCliMode(TAB)).toBe(false);
  });

  it('ignores events from a tab that is not connected', async () => {
    await mode.toggleCliMode(TAB);
    await fromTerminal(OTHER_TAB, { type: 'off' });

    expect(mode.isInCliMode(TAB)).toBe(true);
  });

  it('ends when its tab closes', async () => {
    await mode.toggleCliMode(TAB);
    listeners.removed(TAB);

    expect(mode.isInCliMode(TAB)).toBe(false);
  });

  it('shows the terminal again once its tab has loaded', async () => {
    await mode.toggleCliMode(TAB);
    (sendToTerminal as jest.Mock).mockClear();

    listeners.updated(TAB, { status: 'loading' });
    expect(sendToTerminal).not.toHaveBeenCalled();

    listeners.updated(TAB, { status: 'complete' });
    listeners.updated(OTHER_TAB, { status: 'complete' });
    expect(sendToTerminal).toHaveBeenCalledTimes(1);
    expect(sendToTerminal).toHaveBeenCalledWith(TAB, {
      kind: 'on',
      state: { thread: [], agent: 'awaited', activity: null },
    });
  });
});

describe('agent activity', () => {
  beforeEach(async () => {
    await mode.toggleCliMode(TAB);
  });

  it('folds the commands the agent runs in one go into one turn', async () => {
    await mode.noteCliActivity('outline', { tab: String(TAB) });
    await mode.noteCliActivity('pageRules', {
      tab: String(TAB),
      selector: 'h1',
    });

    expect(lastState()).toEqual({
      agent: 'connected',
      activity: 'page-rules h1',
      thread: [
        {
          kind: 'turn',
          id: expect.any(Number),
          steps: [
            { kind: 'command', id: expect.any(Number), text: 'outline' },
            { kind: 'command', id: expect.any(Number), text: 'page-rules h1' },
          ],
        },
      ],
    });
  });

  it('starts a new turn once the agent has paused', async () => {
    await mode.noteCliActivity('outline', { tab: String(TAB) });
    jest.advanceTimersByTime(mode.ACTIVITY_MS);

    expect(lastState()?.activity).toBeNull();

    await mode.noteCliActivity('suggestions', { tab: String(TAB) });

    expect(lastState()?.thread.map(turn => turn.steps.length)).toEqual([1, 1]);
  });

  it('counts commands on the active tab when they name none', async () => {
    await mode.noteCliActivity('outline', {});
    expect(lastState()?.thread).toHaveLength(1);
  });

  it('leaves out commands on other tabs and ones off the page', async () => {
    await mode.noteCliActivity('outline', { tab: String(OTHER_TAB) });
    await mode.noteCliActivity('tabs', {});

    expect(lastState()).toEqual({
      thread: [],
      agent: 'awaited',
      activity: null,
    });
  });
});

describe('saves', () => {
  const saved = {
    url: 'example.com',
    readability: false,
    before: 'h1 { color: red; }',
  };

  beforeEach(async () => {
    (getAll as jest.Mock).mockResolvedValue({
      'example.com': { css: '', enabled: true, readability: false },
    });
    await mode.toggleCliMode(TAB);
    await mode.noteCliActivity('setCss', { target: 'example.com' });
  });

  it('joins the turn of the command that saved', async () => {
    await mode.onCliSave(saved);

    expect(lastState()?.thread[0].steps).toEqual([
      { kind: 'command', id: expect.any(Number), text: 'css set' },
      {
        kind: 'save',
        id: expect.any(Number),
        url: 'example.com',
        undone: false,
      },
    ]);
  });

  it("leaves out saves of a style the tab doesn't show", async () => {
    await mode.onCliSave({ ...saved, url: 'other.com' });
    expect(lastState()?.thread[0].steps).toHaveLength(1);
  });

  it('restores the version before a save on undo', async () => {
    await mode.onCliSave({ ...saved, profileId: 'dark' });
    const save = lastState()!.thread[0].steps[1];

    await fromTerminal(TAB, { type: 'undo', id: save.id });

    expect(set).toHaveBeenCalledWith(
      'example.com',
      'h1 { color: red; }',
      false,
      undefined,
      'dark'
    );
    expect(applyStylesToAllTabs).toHaveBeenCalled();
    expect(lastState()?.thread[0].steps[1]).toMatchObject({ undone: true });

    (set as jest.Mock).mockClear();
    await fromTerminal(TAB, { type: 'undo', id: save.id });
    expect(set).not.toHaveBeenCalled();
  });
});
