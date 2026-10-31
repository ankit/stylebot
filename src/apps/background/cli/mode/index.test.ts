import type { CliModeAction, CliModeState } from '@stylebot/types';

import { applyStylesToAllTabs, getAll, set } from '../../styles';
import { renderCapture } from '../screenshot';
import { captureWithTerminal, sendToTerminal } from './terminal';

jest.mock('../../styles', () => ({
  applyStylesToAllTabs: jest.fn(async () => undefined),
  getAll: jest.fn(async () => ({})),
  set: jest.fn(async () => undefined),
}));
jest.mock('./terminal', () => ({
  sendToTerminal: jest.fn(async () => null),
  captureWithTerminal: jest.fn(async (_tabId, capture) => ({
    capture: await capture(),
    covered: null,
  })),
}));
jest.mock('../pointer', () => ({ getSavedCss: jest.fn(async () => '') }));
jest.mock('../../capture-tab', () => ({
  captureTab: jest.fn(async () => 'data:image/png;base64,shot'),
}));
jest.mock('../screenshot', () => ({
  SCROLL_PAINT_DELAY_MS: 0,
  getViewport: jest.fn(async () => ({ width: 1000, height: 800 })),
  renderCapture: jest.fn(async () => ({
    dataUrl: 'data:image/png;base64,crop',
    width: 1,
    height: 1,
  })),
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
      onActivated: listen('activated'),
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
      state: { thread: [], agent: 'awaited', activity: null, nextMark: 1 },
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
  it("ends when the terminal's close is pressed", async () => {
    await mode.modeCommands.mode({ tab: String(TAB) });
    await fromTerminal(TAB, { type: 'off' });

    expect(mode.isInCliMode(TAB)).toBe(false);
  });

  it('ignores events from a tab that is not connected', async () => {
    await mode.modeCommands.mode({ tab: String(TAB) });
    await fromTerminal(OTHER_TAB, { type: 'off' });

    expect(mode.isInCliMode(TAB)).toBe(true);
  });

  it('ends when its tab closes', async () => {
    await mode.modeCommands.mode({ tab: String(TAB) });
    listeners.removed(TAB);

    expect(mode.isInCliMode(TAB)).toBe(false);
  });

  it('shows the terminal again once its tab has loaded', async () => {
    await mode.modeCommands.mode({ tab: String(TAB) });
    (sendToTerminal as jest.Mock).mockClear();

    listeners.updated(TAB, { status: 'loading' }, { id: TAB });
    expect(sendToTerminal).not.toHaveBeenCalled();

    listeners.updated(TAB, { status: 'complete' }, { id: TAB });
    listeners.updated(OTHER_TAB, { status: 'complete' }, { id: OTHER_TAB });
    expect(sendToTerminal).toHaveBeenCalledTimes(1);
    expect(sendToTerminal).toHaveBeenCalledWith(TAB, {
      kind: 'on',
      state: { thread: [], agent: 'awaited', activity: null, nextMark: 1 },
    });
  });
});

describe('agent activity', () => {
  beforeEach(async () => {
    await mode.modeCommands.mode({ tab: String(TAB) });
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
      nextMark: 1,
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
      nextMark: 1,
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
    await mode.modeCommands.mode({ tab: String(TAB) });
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

const MARK = {
  n: 1,
  rect: { x: 10, y: 20, width: 300, height: 100 },
  elements: [{ selector: '.card', matches: 1 }],
  whole: true,
  more: 0,
};

/**
 * Answers the terminal's actions as a page with one mark would.
 */
const answerWithMarks = () =>
  (sendToTerminal as jest.Mock).mockImplementation(
    async (_tabId: number, action: CliModeAction) => {
      switch (action.kind) {
        case 'selection':
          return [MARK];
        case 'frameMark':
          return { rect: MARK.rect, scrolled: true };
        default:
          return null;
      }
    }
  );

const actionsSent = (kind: string) =>
  (sendToTerminal as jest.Mock).mock.calls.filter(
    ([, action]) => action.kind === kind
  );

describe('marks', () => {
  beforeEach(async () => {
    await mode.modeCommands.mode({ tab: String(TAB) });
  });

  it('counts marks as unread until selection reads them', async () => {
    expect(mode.getUnreadNotice()).toBeUndefined();

    await fromTerminal(TAB, { type: 'mark', n: 1 });
    expect(mode.getUnreadNotice()).toBe(
      '1 new mark on tab 7 (run stylebot selection)'
    );

    await fromTerminal(TAB, { type: 'mark', n: 2 });
    await fromTerminal(TAB, { type: 'mark', n: 3 });
    await fromTerminal(TAB, { type: 'unmark', n: 3 });
    expect(mode.getUnreadNotice()).toBe(
      '2 new marks on tab 7 (run stylebot selection)'
    );

    answerWithMarks();
    await mode.modeCommands.selection({});
    expect(mode.getUnreadNotice()).toBeUndefined();
  });

  it('ignores marks from a tab that is not connected', async () => {
    await fromTerminal(OTHER_TAB, { type: 'mark', n: 1 });
    expect(mode.getUnreadNotice()).toBeUndefined();
  });

  it('forgets unread marks once the page reloads, but not their numbers', async () => {
    await fromTerminal(TAB, { type: 'mark', n: 4 });
    listeners.updated(TAB, { status: 'loading' }, { id: TAB });

    expect(mode.getUnreadNotice()).toBeUndefined();

    await mode.noteCliActivity('outline', { tab: String(TAB) });
    expect(lastState()?.nextMark).toBe(5);
  });
});

describe('selection', () => {
  it('lists the marks the page has, with the saved css to prefer', async () => {
    await mode.modeCommands.mode({ tab: String(TAB) });
    answerWithMarks();

    expect(await mode.modeCommands.selection({})).toEqual({
      tab: TAB,
      waiting: false,
      marks: [MARK],
    });
    expect(sendToTerminal).toHaveBeenCalledWith(TAB, {
      kind: 'selection',
      css: '',
    });
  });

  it('names the connected tab when another is named', async () => {
    await mode.modeCommands.mode({ tab: String(TAB) });

    await expect(
      mode.modeCommands.selection({ tab: String(OTHER_TAB) })
    ).rejects.toThrow('CLI mode is on in tab 7, not tab 8');
  });

  it('says how to connect a tab when none is', async () => {
    await expect(mode.modeCommands.selection({})).rejects.toThrow(
      'No tab is in CLI mode'
    );
  });

  it('crops each area, with the marks there hidden, and scrolls back', async () => {
    await mode.modeCommands.mode({ tab: String(TAB) });
    answerWithMarks();

    const { marks } = (await mode.modeCommands.selection({
      crop: true,
    })) as { marks: Array<{ dataUrl?: string }> };

    expect(marks[0].dataUrl).toBe('data:image/png;base64,crop');
    expect(sendToTerminal).toHaveBeenCalledWith(TAB, {
      kind: 'frameMark',
      n: 1,
    });
    expect(captureWithTerminal).toHaveBeenCalledTimes(1);
    expect(renderCapture).toHaveBeenCalledWith(
      'data:image/png;base64,shot',
      { width: 1000, height: 800 },
      { x: 6, y: 16, width: 308, height: 108 },
      1
    );
    expect(actionsSent('restoreScroll')).toHaveLength(1);
  });
});

describe('selection --wait', () => {
  const waitFor = (args: Record<string, unknown> = {}) =>
    mode.modeCommands.selection({ wait: true, timeout: 60_000, ...args });

  it('answers a moment after the user stops marking', async () => {
    await mode.modeCommands.mode({ tab: String(TAB) });
    answerWithMarks();

    let result: unknown;
    const waiting = waitFor().then(value => (result = value));

    await fromTerminal(TAB, { type: 'mark', n: 1 });
    await jest.advanceTimersByTimeAsync(2000);
    await fromTerminal(TAB, { type: 'mark', n: 2 });
    await jest.advanceTimersByTimeAsync(2000);
    expect(result).toBeUndefined();

    await jest.advanceTimersByTimeAsync(1000);
    await waiting;
    expect(result).toMatchObject({ tab: TAB, waiting: false });
    expect(mode.getUnreadNotice()).toBeUndefined();
  });

  it('answers at once while marks are unread', async () => {
    await mode.modeCommands.mode({ tab: String(TAB) });
    await fromTerminal(TAB, { type: 'mark', n: 1 });
    answerWithMarks();

    expect(await waitFor()).toMatchObject({ waiting: false, marks: [MARK] });
  });

  it('says it is still waiting once the timeout passes', async () => {
    await mode.modeCommands.mode({ tab: String(TAB) });

    const waiting = waitFor({ timeout: 5000 });

    await jest.advanceTimersByTimeAsync(5000);
    expect(await waiting).toEqual({ tab: TAB, waiting: true, marks: [] });
  });

  it('stops when the CLI goes away', async () => {
    await mode.modeCommands.mode({ tab: String(TAB) });
    const controller = new AbortController();
    const waiting = mode.modeCommands.selection(
      { wait: true },
      controller.signal
    );

    controller.abort();
    expect(await waiting).toMatchObject({ waiting: true });
  });

  it('invites the user to connect a tab while none is, then waits for marks', async () => {
    const waiting = waitFor();

    await jest.advanceTimersByTimeAsync(0);
    expect(sendToTerminal).toHaveBeenCalledWith(TAB, {
      kind: 'invite',
      connectedTo: null,
    });

    await fromTerminal(TAB, { type: 'connect' });
    expect(mode.isInCliMode(TAB)).toBe(true);

    answerWithMarks();
    await fromTerminal(TAB, { type: 'mark', n: 1 });
    await jest.advanceTimersByTimeAsync(3000);

    expect(await waiting).toMatchObject({ tab: TAB, waiting: false });
    // No agent waits now, so the invites go.
    expect(lastState(OTHER_TAB)).toBeUndefined();
  });

  it('invites the active tab to take CLI mode from the connected one', async () => {
    await mode.modeCommands.mode({ tab: String(TAB) });
    activeTab = OTHER_TAB;

    const waiting = waitFor({ timeout: 5000 });

    await jest.advanceTimersByTimeAsync(0);
    expect(sendToTerminal).toHaveBeenCalledWith(OTHER_TAB, {
      kind: 'invite',
      connectedTo: 'example.com',
    });
    expect(actionsSent('invite').map(([tabId]) => tabId)).not.toContain(TAB);

    await jest.advanceTimersByTimeAsync(5000);
    await waiting;
    expect(sendToTerminal).toHaveBeenCalledWith(OTHER_TAB, { kind: 'off' });
  });
});
