import Vue from 'vue';
import Vuex, { Store } from 'vuex';

import type { State } from 'editor/store';
import mockState from '../../store/__mocks__/state';
import mutations from '../../store/mutations';
import type { PageBridge, PageBridgeEvents } from '@stylebot/page-bridge';
import type {
  RemotePageBridgeMessageToWindow,
  RemotePageBridgeMessageToPage,
} from '@stylebot/page-bridge';

Vue.use(Vuex);

jest.mock('postcss', () => ({ parse: () => ({ walkRules: jest.fn() }) }));
jest.mock('../../utils/init-editor', () => ({ initEditor: jest.fn() }));
jest.mock('../../utils/chrome', () => ({ closeEditorWindow: jest.fn() }));

const selectListeners: Array<PageBridgeEvents['select']> = [];

const bridge = {
  getSnapshot: jest.fn(),
  applyCss: jest.fn(),
  setPreviewCss: jest.fn(),
  applyReadability: jest.fn(),
  startInspecting: jest.fn(),
  stopInspecting: jest.fn(),
  highlight: jest.fn(),
  unhighlight: jest.fn(),
  getPageColors: jest.fn(),
  getComputedStyles: jest.fn(),
  openInPage: jest.fn(),
  focusPage: jest.fn(),
  on: jest.fn((event: string, listener: PageBridgeEvents['select']) => {
    if (event === 'select') {
      selectListeners.push(listener);
    }
    return () => undefined;
  }),
} as unknown as jest.Mocked<PageBridge>;

jest.mock('@stylebot/page-bridge', () => ({
  ...(jest.requireActual(
    '../../../page-bridge/remote-page-bridge/constants'
  ) as Record<string, unknown>),
  ...(jest.requireActual('../../../page-bridge/utils') as Record<
    string,
    unknown
  >),
  getPageBridge: () => bridge,
}));

class FakePort {
  name = 'stylebot-editor-window';
  postMessage = jest.fn();
  disconnect = jest.fn();
  private messageListeners: Array<(m: RemotePageBridgeMessageToPage) => void> =
    [];
  private disconnectListeners: Array<() => void> = [];
  onMessage = {
    addListener: (fn: (m: RemotePageBridgeMessageToPage) => void) =>
      this.messageListeners.push(fn),
  };
  onDisconnect = {
    addListener: (fn: () => void) => this.disconnectListeners.push(fn),
  };

  send(message: RemotePageBridgeMessageToPage): void {
    this.messageListeners.forEach(fn => fn(message));
  }

  drop(): void {
    this.disconnectListeners.forEach(fn => fn());
  }

  sent(): Array<RemotePageBridgeMessageToWindow> {
    return this.postMessage.mock.calls.map(([m]) => m);
  }
}

describe('createEditorWindowHandler', () => {
  let store: Store<State>;
  let onConnect: (port: FakePort) => void;
  let applyCss: jest.Mock;
  let applyReadability: jest.Mock;
  let openStylebot: jest.Mock;

  const connect = () => {
    const port = new FakePort();
    onConnect(port);
    return port;
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    selectListeners.length = 0;

    applyCss = jest.fn(({ commit }, { css }) => commit('setCss', css));
    applyReadability = jest.fn(({ commit }, value) =>
      commit('setReadability', value)
    );
    openStylebot = jest.fn();

    store = new Store<State>({
      state: {
        ...mockState,
        url: 'example.com',
        css: 'a { color: red; }',
        page: { ...mockState.page, domain: 'example.com' },
      },
      mutations,
      actions: { applyCss, applyReadability, openStylebot },
    });

    const { createEditorWindowHandler } = await import('../editor-window');
    onConnect = createEditorWindowHandler(store) as unknown as (
      port: FakePort
    ) => void;
  });

  it('greets the window with the page state and marks it connected', () => {
    const port = connect();

    expect(store.state.windowConnected).toBe(true);
    expect(port.sent()[0]).toEqual({
      type: 'connected',
      state: {
        url: 'example.com',
        css: 'a { color: red; }',
        enabled: true,
        readability: false,
        forceImportant: true,
      },
      snapshot: store.state.page,
      activeSelector: '',
    });
  });

  it('applies css from the window without echoing it back', () => {
    const port = connect();
    port.postMessage.mockClear();

    port.send({
      type: 'applyCss',
      css: 'b { color: blue; }',
      forceImportant: false,
    });

    expect(applyCss).toBeCalledWith(expect.anything(), {
      css: 'b { color: blue; }',
      source: 'window',
    });
    expect(store.state.css).toBe('b { color: blue; }');
    expect(store.state.forceImportant).toBe(false);
    expect(port.sent()).toEqual([]);
  });

  it('forwards state changed by anything else', () => {
    const port = connect();
    port.postMessage.mockClear();

    store.commit('setCss', 'c {}');
    store.commit('setEnabled', false);

    expect(port.sent()).toEqual([
      { type: 'stateChanged', state: { css: 'c {}' } },
      { type: 'stateChanged', state: { enabled: false } },
    ]);
  });

  it('forwards an inspector pick and a context-menu selector', () => {
    const port = connect();
    port.postMessage.mockClear();

    selectListeners.forEach(fn => fn('h1'));
    store.commit('setActiveSelector', 'nav');

    expect(port.sent()).toEqual([
      { type: 'selectorChosen', selector: 'h1', source: 'inspector' },
      { type: 'selectorChosen', selector: 'nav', source: 'contextMenu' },
    ]);
    expect(store.state.activeSelector).toBe('');
  });

  it('answers requests through the bridge', async () => {
    const port = connect();
    port.postMessage.mockClear();
    bridge.getPageColors.mockResolvedValue({
      text: ['red'],
      surface: [],
      total: 1,
    });

    bridge.getComputedStyles.mockResolvedValue({ 'font-size': '16px' });

    port.send({ type: 'request', id: 3, method: 'getPageColors', args: [] });
    port.send({
      type: 'request',
      id: 4,
      method: 'getComputedStyles',
      args: ['h1', ['font-size']],
    });
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(bridge.getComputedStyles).toBeCalledWith('h1', ['font-size']);
    expect(port.sent()).toEqual([
      {
        type: 'response',
        id: 3,
        result: { text: ['red'], surface: [], total: 1 },
      },
      { type: 'response', id: 4, result: { 'font-size': '16px' } },
    ]);
  });

  it('drives inspecting and highlighting on the page', () => {
    const port = connect();

    port.send({ type: 'startInspecting' });
    expect(store.state.inspecting).toBe(true);
    expect(bridge.startInspecting).toBeCalled();

    port.send({ type: 'highlight', selector: 'h1' });
    expect(bridge.highlight).toBeCalledWith('h1');

    const preview = {
      css: 'h1 { font-family: Inter; }',
      forceImportant: false,
    };
    port.send({ type: 'previewCss', preview });
    expect(bridge.setPreviewCss).toBeCalledWith(preview);

    port.send({ type: 'stopInspecting' });
    expect(store.state.inspecting).toBe(false);
    expect(bridge.stopInspecting).toBeCalled();
  });

  it('cleans up when the window goes away', () => {
    const port = connect();
    port.send({ type: 'startInspecting' });
    jest.clearAllMocks();

    port.drop();

    expect(store.state.inspecting).toBe(false);
    expect(store.state.windowConnected).toBe(false);
    expect(bridge.stopInspecting).toBeCalled();
    expect(bridge.unhighlight).toBeCalled();
  });

  it('shows the panel again and closes the window when asked to dock back', async () => {
    const port = connect();
    const { closeEditorWindow } = jest.requireMock('../../utils/chrome');

    port.send({ type: 'openInPage' });

    expect(openStylebot).toBeCalledWith(expect.anything(), { inspect: false });
    expect(closeEditorWindow).toBeCalled();

    // Handed off: the page panel's own selector edits are no longer
    // forwarded or wiped.
    port.postMessage.mockClear();
    store.commit('setActiveSelector', 'h1');
    expect(port.sent()).toEqual([]);
    expect(store.state.activeSelector).toBe('h1');
    expect(store.state.windowConnected).toBe(false);
  });

  it('tears down the first connection when a second window connects', () => {
    const first = connect();
    const second = connect();
    first.postMessage.mockClear();
    second.postMessage.mockClear();

    store.commit('setCss', 'c {}');

    expect(first.sent()).toEqual([]);
    expect(second.sent()).toEqual([
      { type: 'stateChanged', state: { css: 'c {}' } },
    ]);
  });

  it('survives a post to a port whose other end is already gone', () => {
    const port = connect();
    port.postMessage.mockImplementation(() => {
      throw new Error('Attempting to use a disconnected port object');
    });

    expect(() => store.commit('setCss', 'c {}')).not.toThrow();
    expect(store.state.css).toBe('c {}');
  });
});
