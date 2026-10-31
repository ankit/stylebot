import type {
  CliModeAction,
  CliModeState,
  CliThreadEntry,
  CliTurn,
  StyleMap,
} from '@stylebot/types';

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

const EMPTY_STATE: CliModeState = {
  thread: [],
  agent: 'awaited',
  thinking: false,
  activity: null,
  nextMark: 1,
};

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
 * The turn at an index of a thread.
 */
const turnAt = (thread: Array<CliThreadEntry> | undefined, index: number) =>
  thread?.[index] as CliTurn;

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
      state: EMPTY_STATE,
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
      state: EMPTY_STATE,
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
      thinking: false,
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

    expect(
      lastState()?.thread.map(entry => (entry as CliTurn).steps.length)
    ).toEqual([1, 1]);
  });

  it('counts commands on the active tab when they name none', async () => {
    await mode.noteCliActivity('outline', {});
    expect(lastState()?.thread).toHaveLength(1);
  });

  it('leaves out commands on other tabs and ones off the page', async () => {
    await mode.noteCliActivity('outline', { tab: String(OTHER_TAB) });
    await mode.noteCliActivity('tabs', {});

    expect(lastState()).toEqual(EMPTY_STATE);
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

    expect(turnAt(lastState()?.thread, 0).steps).toEqual([
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
    expect(turnAt(lastState()?.thread, 0).steps).toHaveLength(1);
  });

  it('restores the version before a save on undo', async () => {
    await mode.onCliSave({ ...saved, profileId: 'dark' });
    const save = turnAt(lastState()?.thread, 0).steps[1];

    await fromTerminal(TAB, { type: 'undo', id: save.id });

    expect(set).toHaveBeenCalledWith(
      'example.com',
      'h1 { color: red; }',
      false,
      undefined,
      'dark'
    );
    expect(applyStylesToAllTabs).toHaveBeenCalled();
    expect(turnAt(lastState()?.thread, 0).steps[1]).toMatchObject({
      undone: true,
    });

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
      notes: [],
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
    expect(await waiting).toEqual({
      tab: TAB,
      waiting: true,
      notes: [],
      marks: [],
    });
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

describe('notes', () => {
  const note = (text: string, marks: Array<number>) =>
    fromTerminal(TAB, { type: 'note', text, marks });

  beforeEach(async () => {
    await mode.modeCommands.mode({ tab: String(TAB) });
    answerWithMarks();
  });

  it('adds a note to the thread with the numbers of its marks', async () => {
    await note('make it bigger', [1]);

    expect(lastState()?.thread).toEqual([
      {
        kind: 'note',
        id: expect.any(Number),
        text: 'make it bigger',
        marks: [1],
      },
    ]);
  });

  it('counts a note as unread, and its marks no longer on their own', async () => {
    await fromTerminal(TAB, { type: 'mark', n: 1 });
    await fromTerminal(TAB, { type: 'mark', n: 2 });
    await note('make it bigger', [1]);

    expect(mode.getUnreadNotice()).toBe(
      '1 new note and 1 new mark on tab 7 (run stylebot selection)'
    );

    await fromTerminal(TAB, { type: 'unmark', n: 2 });
    expect(mode.getUnreadNotice()).toBe(
      '1 new note on tab 7 (run stylebot selection)'
    );
  });

  it('keeps its marks as they were, with a screenshot of the area around them', async () => {
    await note('make it bigger', [1]);

    expect(renderCapture).toHaveBeenCalledWith(
      'data:image/png;base64,shot',
      { width: 1000, height: 800 },
      { x: 0, y: 0, width: 334, height: 144 },
      1
    );
    // The badges are in the screenshot, so the marks aren't hidden for it.
    expect(captureWithTerminal).not.toHaveBeenCalled();

    expect(await mode.modeCommands.selection({})).toEqual({
      tab: TAB,
      waiting: false,
      notes: [
        {
          id: expect.any(Number),
          text: 'make it bigger',
          marks: [MARK],
          image: 'data:image/png;base64,crop',
        },
      ],
      // Mark 1 is still on the page until the note is captured, but it
      // went with the note.
      marks: [],
    });
    expect(mode.getUnreadNotice()).toBeUndefined();
    expect(
      ((await mode.modeCommands.selection({})) as { notes: [] }).notes
    ).toEqual([]);
  });

  it('has no screenshot when none of its marks is in view', async () => {
    (sendToTerminal as jest.Mock).mockImplementation(async (_tabId, action) =>
      action.kind === 'selection'
        ? [{ ...MARK, rect: { x: 10, y: 2000, width: 300, height: 100 } }]
        : null
    );
    await note('make it bigger', [1]);

    const { notes } = (await mode.modeCommands.selection({})) as {
      notes: Array<{ image?: string }>;
    };

    expect(renderCapture).not.toHaveBeenCalled();
    expect(notes[0].image).toBeUndefined();
  });

  it('answers selection --wait as soon as it comes', async () => {
    let result: unknown;
    const waiting = mode.modeCommands
      .selection({ wait: true, timeout: 60_000 })
      .then(value => (result = value));

    await note('make it bigger', []);
    await jest.advanceTimersByTimeAsync(0);
    await waiting;

    expect(result).toMatchObject({
      waiting: false,
      notes: [{ text: 'make it bigger', marks: [] }],
    });
  });

  it('answers selection --wait at once while a note is unread', async () => {
    await note('make it bigger', []);

    expect(
      await mode.modeCommands.selection({ wait: true, timeout: 60_000 })
    ).toMatchObject({ waiting: false, notes: [{ text: 'make it bigger' }] });
  });
});

describe('say', () => {
  it("adds the agent's reply to the thread", async () => {
    await mode.modeCommands.mode({ tab: String(TAB) });

    expect(
      await mode.modeCommands.say({ message: '  made it bigger ' })
    ).toEqual({ tab: TAB });
    expect(lastState()?.thread).toEqual([
      { kind: 'reply', id: expect.any(Number), text: 'made it bigger' },
    ]);
    expect(lastState()?.agent).toBe('connected');
  });

  it('checks the tab it names is the connected one', async () => {
    await mode.modeCommands.mode({ tab: String(TAB) });

    await expect(
      mode.modeCommands.say({ tab: String(OTHER_TAB), message: 'hi' })
    ).rejects.toThrow('CLI mode is on in tab 7, not tab 8');
    await expect(
      mode.modeCommands.say({ tab: String(TAB), message: 'hi' })
    ).resolves.toEqual({ tab: TAB });
  });

  it('needs a message and a connected tab', async () => {
    await expect(mode.modeCommands.say({ message: 'hi' })).rejects.toThrow(
      'No tab is in CLI mode'
    );

    await mode.modeCommands.mode({ tab: String(TAB) });
    await expect(mode.modeCommands.say({ message: ' ' })).rejects.toThrow(
      'say needs a message'
    );
  });
});

describe('thinking', () => {
  const note = () =>
    fromTerminal(TAB, { type: 'note', text: 'make it bigger', marks: [] });

  beforeEach(async () => {
    await mode.modeCommands.mode({ tab: String(TAB) });
  });

  it('starts with a note while the agent has run a command lately', async () => {
    await mode.noteCliActivity('outline', { tab: String(TAB) });
    expect(lastState()?.thinking).toBe(false);

    await note();
    expect(lastState()?.thinking).toBe(true);
  });

  it('waits for a command after a note when the agent has been away', async () => {
    await note();
    expect(lastState()?.thinking).toBe(false);

    await mode.noteCliActivity('outline', { tab: String(TAB) });
    expect(lastState()?.thinking).toBe(true);
  });

  it('starts with a note while the agent waits for one', async () => {
    const waiting = mode.modeCommands.selection({ wait: true });

    await note();
    await waiting;
    expect(lastState()?.thinking).toBe(true);
  });

  it('ends once the agent answers with say', async () => {
    await mode.noteCliActivity('outline', { tab: String(TAB) });
    await note();
    await mode.modeCommands.say({ message: 'done' });

    expect(lastState()?.thinking).toBe(false);
  });

  it('ends once the agent has run no command for 3 minutes', async () => {
    await note();
    await mode.noteCliActivity('outline', { tab: String(TAB) });
    await jest.advanceTimersByTimeAsync(2 * 60_000);
    await mode.noteCliActivity('outline', { tab: String(TAB) });

    await jest.advanceTimersByTimeAsync(3 * 60_000 - 1);
    expect(lastState()?.thinking).toBe(true);

    await jest.advanceTimersByTimeAsync(1);
    expect(lastState()?.thinking).toBe(false);
  });

  it('starts a new turn for commands after a note', async () => {
    await mode.noteCliActivity('outline', { tab: String(TAB) });
    await note();
    await mode.noteCliActivity('screenshot', { tab: String(TAB) });

    expect(lastState()?.thread.map(entry => entry.kind)).toEqual([
      'turn',
      'note',
      'turn',
    ]);
  });
});

describe('watch', () => {
  const AREA = { x: 0, y: 0, width: 200, height: 40 };

  /**
   * Opens a watch, collecting the events it prints.
   */
  const watch = (args: Record<string, unknown> = {}) => {
    const events: Array<unknown> = [];
    const controller = new AbortController();
    const state = { ended: false };
    const done = mode.watchStreams
      .watch(args, event => events.push(event), controller.signal)
      .then(result => {
        state.ended = true;
        return result;
      });

    return { events, controller, done, state };
  };

  const flush = () => jest.advanceTimersByTimeAsync(0);

  it('waits for a tab, inviting the user to connect one, then follows it', async () => {
    const { events } = watch();

    await flush();
    expect(events).toEqual([{ type: 'waiting' }]);
    expect(sendToTerminal).toHaveBeenCalledWith(TAB, {
      kind: 'invite',
      connectedTo: null,
    });

    await fromTerminal(TAB, { type: 'connect' });
    await flush();

    expect(events).toEqual([
      { type: 'waiting' },
      { type: 'attached', tab: TAB, url: URL },
    ]);
    expect(lastState()?.agent).toBe('connected');
    // With a tab to follow, the watch doesn't invite others.
    expect(sendToTerminal).toHaveBeenLastCalledWith(TAB, {
      kind: 'on',
      open: true,
      state: expect.anything(),
    });
  });

  it('follows the tab connected now, and the next one the user moves to', async () => {
    await mode.modeCommands.mode({ tab: String(TAB) });
    const { events } = watch();

    await flush();
    expect(events).toEqual([{ type: 'attached', tab: TAB, url: URL }]);

    await fromTerminal(OTHER_TAB, { type: 'connect' });
    expect(events).toEqual([
      { type: 'attached', tab: TAB, url: URL },
      { type: 'attached', tab: OTHER_TAB, url: URL },
    ]);
  });

  it('prints what the user does on the tab, and where it goes', async () => {
    await mode.modeCommands.mode({ tab: String(TAB) });
    answerWithMarks();
    const { events } = watch();

    await flush();
    events.length = 0;

    await fromTerminal(TAB, { type: 'mark', n: 1, area: AREA });
    await fromTerminal(TAB, { type: 'unmark', n: 1 });
    await fromTerminal(TAB, { type: 'note', text: 'bigger', marks: [1] });
    listeners.updated(
      TAB,
      { status: 'loading', url: 'https://example.com/next' },
      { id: TAB, status: 'loading', url: 'https://example.com/next' }
    );
    // The url coming again while the page loads isn't another navigation.
    listeners.updated(
      TAB,
      { url: 'https://example.com/next' },
      { id: TAB, status: 'loading', url: 'https://example.com/next' }
    );
    listeners.updated(
      TAB,
      { url: 'https://example.com/next#top' },
      { id: TAB, status: 'complete', url: 'https://example.com/next#top' }
    );
    listeners.updated(OTHER_TAB, { status: 'loading' }, { id: OTHER_TAB });

    expect(events).toEqual([
      { type: 'mark', n: 1, width: 200, height: 40 },
      { type: 'unmark', n: 1 },
      {
        type: 'note',
        tab: TAB,
        id: expect.any(Number),
        text: 'bigger',
        marks: [1],
        image: 'data:image/png;base64,crop',
      },
      { type: 'navigated', url: 'https://example.com/next' },
      { type: 'navigated', url: 'https://example.com/next#top' },
    ]);
  });

  it('keeps running across disconnects, waiting for the next tab', async () => {
    await mode.modeCommands.mode({ tab: String(TAB) });
    const { events, state } = watch();

    await flush();
    await fromTerminal(TAB, { type: 'off' });
    await mode.modeCommands.mode({ tab: String(OTHER_TAB) });
    listeners.removed(OTHER_TAB);

    expect(events).toEqual([
      { type: 'attached', tab: TAB, url: URL },
      { type: 'off' },
      { type: 'waiting' },
      { type: 'attached', tab: OTHER_TAB, url: URL },
      { type: 'closed' },
      { type: 'waiting' },
    ]);
    expect(state.ended).toBe(false);
  });

  it('connects the tab it names, and ends once that tab disconnects', async () => {
    const { events, done } = watch({ tab: String(TAB) });

    await flush();
    expect(mode.isInCliMode(TAB)).toBe(true);
    expect(events).toEqual([{ type: 'attached', tab: TAB, url: URL }]);

    await mode.modeCommands.mode({ tab: String(TAB), on: false });

    expect(await done).toEqual({ tab: TAB });
    expect(events).toEqual([
      { type: 'attached', tab: TAB, url: URL },
      { type: 'off' },
    ]);
  });

  it('ends a watch that named a tab once CLI mode moves to another', async () => {
    const pinned = watch({ tab: String(TAB) });

    await flush();
    const following = watch();

    await flush();
    await mode.modeCommands.mode({ tab: String(OTHER_TAB) });

    expect(await pinned.done).toEqual({ tab: TAB });
    expect(pinned.events).toEqual([
      { type: 'attached', tab: TAB, url: URL },
      { type: 'off' },
    ]);
    expect(following.state.ended).toBe(false);
    expect(following.events).toEqual([
      { type: 'attached', tab: TAB, url: URL },
      { type: 'attached', tab: OTHER_TAB, url: URL },
    ]);
  });

  it('stops when the CLI goes away, and the terminal shows the agent left', async () => {
    await mode.modeCommands.mode({ tab: String(TAB) });
    const { controller, done } = watch();

    await flush();
    expect(lastState()?.agent).toBe('connected');

    controller.abort();
    expect(await done).toEqual({ tab: null });
    expect(lastState()?.agent).toBe('left');

    // An agent that runs a command again is back.
    await mode.noteCliActivity('outline', { tab: String(TAB) });
    expect(lastState()?.agent).toBe('connected');
  });

  it("leaves out the unmarks of a note's marks, which went with it", async () => {
    await mode.modeCommands.mode({ tab: String(TAB) });
    answerWithMarks();
    const { events } = watch();

    await flush();
    await fromTerminal(TAB, { type: 'mark', n: 1, area: AREA });
    await fromTerminal(TAB, { type: 'note', text: 'bigger', marks: [1] });
    await fromTerminal(TAB, { type: 'unmark', n: 1 });

    expect(events.map(event => (event as { type: string }).type)).toEqual([
      'attached',
      'mark',
      'note',
    ]);
  });

  it('counts what it prints as read', async () => {
    await mode.modeCommands.mode({ tab: String(TAB) });
    answerWithMarks();
    watch();
    await flush();

    await fromTerminal(TAB, { type: 'mark', n: 1, area: AREA });
    await fromTerminal(TAB, { type: 'note', text: 'bigger', marks: [] });

    expect(mode.getUnreadNotice()).toBeUndefined();
    expect(
      ((await mode.modeCommands.selection({})) as { notes: [] }).notes
    ).toEqual([]);
  });

  it('keeps the session for the next tab while it runs, and ends it after', async () => {
    await mode.modeCommands.mode({ tab: String(TAB) });
    await mode.modeCommands.say({ message: 'hello' });
    const { controller, done } = watch();

    await flush();
    await fromTerminal(TAB, { type: 'off' });
    await mode.modeCommands.mode({ tab: String(OTHER_TAB) });

    expect(lastState(OTHER_TAB)?.thread).toHaveLength(1);

    await fromTerminal(OTHER_TAB, { type: 'off' });
    controller.abort();
    await done;
    await mode.modeCommands.mode({ tab: String(TAB) });

    expect(lastState()?.thread).toEqual([]);
  });

  it('counts the agent as working on a note it watches for 3 minutes', async () => {
    await mode.modeCommands.mode({ tab: String(TAB) });
    const { controller, done } = watch();

    await flush();
    await fromTerminal(TAB, { type: 'note', text: 'bigger', marks: [] });
    await jest.advanceTimersByTimeAsync(3 * 60_000 - 1);
    expect(lastState()?.thinking).toBe(true);

    await jest.advanceTimersByTimeAsync(1);
    expect(lastState()?.thinking).toBe(false);

    controller.abort();
    await done;
  });

  it('stops counting the agent as working once it answers while it watches', async () => {
    await mode.modeCommands.mode({ tab: String(TAB) });
    const { controller, done } = watch();

    await flush();
    await fromTerminal(TAB, { type: 'note', text: 'bigger', marks: [] });
    await mode.modeCommands.say({ message: 'done' });
    expect(lastState()?.thinking).toBe(false);

    controller.abort();
    await done;
  });

  describe('style edits', () => {
    const style = (css: string) =>
      ({ css, enabled: true, readability: false } as StyleMap[string]);

    beforeEach(async () => {
      (getAll as jest.Mock).mockResolvedValue({
        'example.com': style('a {}'),
      });
      await mode.modeCommands.mode({ tab: String(TAB) });
    });

    /**
     * Sends a save as the editor or Options does, answering whether CLI
     * mode's listener answered it.
     */
    const save = async (message: unknown) => {
      const answers = listeners.message(message, {}, () => undefined);

      await flush();
      return answers;
    };

    const setStyle = (url: string) =>
      save({ name: 'SetStyle', url, css: 'a {}', readability: false });

    it('does nothing while no watch is open, and leaves saves unanswered', async () => {
      (getAll as jest.Mock).mockClear();

      expect(await setStyle('example.com')).toBe(false);
      expect(
        await save({
          name: 'SetAllStyles',
          styles: { 'example.com': style('b {}') },
        })
      ).toBe(false);
      expect(getAll).not.toHaveBeenCalled();
    });

    it("prints a style's first save", async () => {
      (getAll as jest.Mock).mockResolvedValue({});
      const { events } = watch();

      await flush();
      events.length = 0;

      await setStyle('example.com');
      await jest.advanceTimersByTimeAsync(mode.STYLE_EDITED_MS);
      expect(events).toEqual([{ type: 'style-edited', url: 'example.com' }]);
    });

    it("prints one line for a burst of saves to the tab's style", async () => {
      const { events } = watch();

      await flush();
      events.length = 0;

      await setStyle('example.com');
      await jest.advanceTimersByTimeAsync(mode.STYLE_EDITED_MS - 1);
      await setStyle('example.com');
      await setStyle('other.com');
      await jest.advanceTimersByTimeAsync(mode.STYLE_EDITED_MS - 1);
      expect(events).toEqual([]);

      await jest.advanceTimersByTimeAsync(1);
      expect(events).toEqual([{ type: 'style-edited', url: 'example.com' }]);
    });

    it("prints when Options changes the tab's style, and not other styles", async () => {
      const { events } = watch();

      await flush();
      events.length = 0;

      await save({
        name: 'SetAllStyles',
        styles: { 'example.com': style('a {}'), 'other.com': style('b {}') },
      });
      await jest.advanceTimersByTimeAsync(mode.STYLE_EDITED_MS);
      expect(events).toEqual([]);

      await save({
        name: 'SetAllStyles',
        styles: { 'example.com': style('a { color: red }') },
      });
      await jest.advanceTimersByTimeAsync(mode.STYLE_EDITED_MS);
      expect(events).toEqual([{ type: 'style-edited', url: 'example.com' }]);
    });

    it('prints an undo from the terminal', async () => {
      await mode.noteCliActivity('setCss', { target: 'example.com' });
      await mode.onCliSave({
        url: 'example.com',
        readability: false,
        before: '',
      });
      const { events } = watch();

      await flush();
      events.length = 0;

      const step = turnAt(lastState()?.thread, 0).steps[1];
      await fromTerminal(TAB, { type: 'undo', id: step.id });
      await jest.advanceTimersByTimeAsync(mode.STYLE_EDITED_MS);

      expect(events).toEqual([{ type: 'style-edited', url: 'example.com' }]);
    });
  });
});
