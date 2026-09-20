import { RemotePageBridge } from '../RemotePageBridge';
import {
  RemotePageBridgeHandlers,
  RemotePageBridgeMessageToWindow,
} from '../types';
import { emptyPageSnapshot } from '../../utils';

type Listener<T> = (arg: T) => void;

class FakePort {
  name: string;
  postMessage = jest.fn();
  disconnect = jest.fn();
  private messageListeners: Array<Listener<RemotePageBridgeMessageToWindow>> =
    [];
  private disconnectListeners: Array<() => void> = [];

  onMessage = {
    addListener: (fn: Listener<RemotePageBridgeMessageToWindow>) =>
      this.messageListeners.push(fn),
  };
  onDisconnect = {
    addListener: (fn: () => void) => this.disconnectListeners.push(fn),
  };

  constructor(name: string) {
    this.name = name;
  }

  receive(message: RemotePageBridgeMessageToWindow): void {
    this.messageListeners.forEach(fn => fn(message));
  }

  drop(): void {
    this.disconnectListeners.forEach(fn => fn());
  }
}

const connectedMessage = (
  overrides: Partial<RemotePageBridgeMessageToWindow> = {}
) =>
  ({
    type: 'connected',
    state: {
      url: 'example.com',
      css: 'a {}',
      enabled: true,
      readability: false,
    },
    snapshot: { ...emptyPageSnapshot(), domain: 'example.com' },
    activeSelector: '',
    ...overrides,
  } as RemotePageBridgeMessageToWindow);

describe('RemotePageBridge', () => {
  let ports: Array<FakePort>;
  let tabUpdated: Array<
    (tabId: number, changeInfo: chrome.tabs.TabChangeInfo) => void
  >;
  let handlers: jest.Mocked<RemotePageBridgeHandlers>;

  beforeEach(() => {
    jest.useFakeTimers();
    ports = [];
    tabUpdated = [];
    handlers = {
      onStateChanged: jest.fn(),
      onSnapshotChanged: jest.fn(),
      onContextMenuSelector: jest.fn(),
      onInspectingStopped: jest.fn(),
    };

    global.chrome = {
      runtime: { lastError: undefined },
      tabs: {
        connect: jest.fn((_tabId: number, info: { name: string }) => {
          const port = new FakePort(info.name);
          ports.push(port);
          return port;
        }),
        onUpdated: {
          addListener: (fn: (typeof tabUpdated)[number]) => tabUpdated.push(fn),
        },
      },
    } as unknown as typeof chrome;
  });

  afterEach(() => {
    // Bridges from earlier tests keep retrying; don't let them leak in.
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('connects on the named port and resolves once the page reports it is connected', async () => {
    const bridge = new RemotePageBridge(7, handlers);
    const connection = jest.fn();
    bridge.on('connection', connection);

    const connected = bridge.connect();
    expect(chrome.tabs.connect).toBeCalledWith(7, {
      name: 'stylebot-editor-window',
    });

    ports[0].receive(connectedMessage());
    await connected;

    expect(handlers.onStateChanged).toBeCalledWith(
      expect.objectContaining({ css: 'a {}' })
    );
    expect(handlers.onSnapshotChanged).toBeCalledWith(
      expect.objectContaining({ domain: 'example.com' })
    );
    expect(connection).toBeCalledWith(true);
    expect(bridge.isConnected()).toBe(true);
  });

  it('correlates responses to requests and rejects pending ones on disconnect', async () => {
    const bridge = new RemotePageBridge(7, handlers);
    bridge.connect();
    ports[0].receive(connectedMessage());

    const colors = bridge.getPageColors();
    const snapshot = bridge.getSnapshot();
    const requests = ports[0].postMessage.mock.calls.map(([m]) => m);
    expect(requests).toEqual([
      { type: 'request', id: 1, method: 'getPageColors' },
      { type: 'request', id: 2, method: 'getSnapshot' },
    ]);

    ports[0].receive({
      type: 'response',
      id: 1,
      result: { text: ['red'], surface: [], total: 1 },
    });
    await expect(colors).resolves.toEqual({
      text: ['red'],
      surface: [],
      total: 1,
    });

    ports[0].drop();
    await expect(snapshot).rejects.toThrow('Page disconnected');
  });

  it('retries with backoff after a disconnect and reports the connection state', () => {
    const bridge = new RemotePageBridge(7, handlers);
    const connection = jest.fn();
    bridge.on('connection', connection);
    bridge.connect();
    ports[0].receive(connectedMessage());

    ports[0].drop();
    expect(connection).toHaveBeenLastCalledWith(false);
    expect(ports).toHaveLength(1);

    jest.advanceTimersByTime(250);
    expect(ports).toHaveLength(2);

    ports[1].drop();
    jest.advanceTimersByTime(374);
    expect(ports).toHaveLength(2);
    jest.advanceTimersByTime(1);
    expect(ports).toHaveLength(3);

    ports[2].receive(connectedMessage());
    expect(connection).toHaveBeenLastCalledWith(true);
  });

  it('reconnects as soon as the tab finishes loading', () => {
    const bridge = new RemotePageBridge(7, handlers);
    bridge.connect();
    ports[0].receive(connectedMessage());
    ports[0].drop();

    tabUpdated.forEach(fn => fn(7, { status: 'complete' }));
    expect(ports).toHaveLength(2);

    tabUpdated.forEach(fn => fn(8, { status: 'complete' }));
    expect(ports).toHaveLength(2);
  });

  it('routes inspector picks to select and context-menu picks to the handler', () => {
    const bridge = new RemotePageBridge(7, handlers);
    const select = jest.fn();
    bridge.on('select', select);
    bridge.connect();
    ports[0].receive(connectedMessage({ activeSelector: 'nav' } as never));
    expect(handlers.onContextMenuSelector).toBeCalledWith('nav');

    ports[0].receive({
      type: 'selectorChosen',
      selector: 'h1',
      source: 'inspector',
    });
    expect(select).toBeCalledWith('h1');

    ports[0].receive({
      type: 'selectorChosen',
      selector: 'p',
      source: 'contextMenu',
    });
    expect(handlers.onContextMenuSelector).toBeCalledWith('p');

    ports[0].receive({ type: 'inspectingStopped' });
    expect(handlers.onInspectingStopped).toBeCalled();
  });

  it('brings the tab and its window to the front', async () => {
    const update = jest.fn();
    const windowsUpdate = jest.fn();
    (chrome.tabs as unknown as { get: unknown; update: unknown }).get = () =>
      Promise.resolve({ windowId: 4 });
    (chrome.tabs as unknown as { update: unknown }).update = update;
    global.chrome.windows = { update: windowsUpdate } as never;

    new RemotePageBridge(7, handlers).focusPage();
    await Promise.resolve();
    await Promise.resolve();

    expect(update).toBeCalledWith(7, { active: true });
    expect(windowsUpdate).toBeCalledWith(4, { focused: true });
  });

  it('sends page operations over the port', () => {
    const bridge = new RemotePageBridge(7, handlers);
    bridge.connect();
    ports[0].receive(connectedMessage());
    ports[0].postMessage.mockClear();

    bridge.applyCss({ url: 'example.com', css: 'b {}', enabled: true });
    bridge.setPreviewCss(null);
    bridge.applyReadability(true);
    bridge.startInspecting();
    bridge.highlight('h1');
    bridge.unhighlight();
    bridge.stopInspecting();
    bridge.openInPage();

    expect(ports[0].postMessage.mock.calls.map(([m]) => m)).toEqual([
      { type: 'applyCss', css: 'b {}' },
      { type: 'previewCss', css: null },
      { type: 'applyReadability', value: true },
      { type: 'startInspecting' },
      { type: 'highlight', selector: 'h1' },
      { type: 'unhighlight' },
      { type: 'stopInspecting' },
      { type: 'openInPage' },
    ]);
  });
});
