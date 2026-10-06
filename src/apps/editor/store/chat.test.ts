import type { Store } from 'vuex';

import * as pageBridge from '@stylebot/page-bridge';
import type {
  ChatAssistantTurn,
  ChatCssEdit,
  ChatStatus,
  ChatStyleProblem,
} from '@stylebot/types';

import { createStore } from './';
import type { State } from './';
import type { ChatState } from './chat';
import { streamReply } from './chat-stream';
import type { ChatStreamHandlers } from './chat-stream';
import * as chromeUtils from '../utils/chrome';

jest.mock('./chat-stream');
jest.mock('../utils/chrome');
jest.mock('@stylebot/google-fonts', () => ({
  resolveGoogleFont: jest.fn(() => Promise.resolve(null)),
}));

const status: ChatStatus = {
  connected: true,
  provider: 'anthropic',
  model: 'claude-sonnet-5-5',
  providers: [],
};

const dark: ChatCssEdit = {
  selector: 'body',
  declarations: [{ property: 'background-color', value: '#111' }],
};

const links: ChatCssEdit = {
  selector: 'a',
  declarations: [{ property: 'color', value: '#8ab4f8' }],
};

const flush = () => new Promise(resolve => setTimeout(resolve));

let store: Store<State>;
let handlers: ChatStreamHandlers;
const stopStream = jest.fn();
const startStyleCheck = jest.fn(() => Promise.resolve());
const extendStyleCheck = jest.fn(() => Promise.resolve());
let problems: Array<ChatStyleProblem> = [];

const chat = (): ChatState =>
  (store.state as unknown as { chat: ChatState }).chat;

const lastTurn = () => chat().turns[chat().turns.length - 1];

/**
 * Sends a message and waits until its reply is streaming.
 */
const send = async () => {
  await store.dispatch('chat/send', { text: 'Make it dark' });
};

beforeEach(async () => {
  jest.clearAllMocks();
  problems = [];
  jest.spyOn(pageBridge, 'getPageBridge').mockReturnValue({
    applyCss: jest.fn(),
    getPageOutline: () => Promise.resolve(''),
    getPageCssContext: () => Promise.resolve(''),
    getStableSelectors: (selectors: Array<string>) =>
      Promise.resolve(selectors),
    countMatches: (selectors: Array<string>) =>
      Promise.resolve(selectors.map(() => 1)),
    startStyleCheck: startStyleCheck,
    extendStyleCheck: extendStyleCheck,
    checkStyle: () => Promise.resolve(problems),
  } as unknown as pageBridge.PageBridge);
  jest.mocked(streamReply).mockImplementation((_request, replyHandlers) => {
    handlers = replyHandlers;
    return stopStream;
  });

  store = createStore('page');
  store.commit('setUrl', 'example.com');
  store.commit('chat/setStatus', status);
  store.commit('chat/setThread', { url: 'example.com', turns: [] });
  await send();
});

describe('a reply streaming its edits', () => {
  it('applies each edit as it arrives, as one undo step, saved once at the end', async () => {
    handlers.onEditsStart();
    handlers.onEdit(dark);
    await flush();

    expect(store.state.css).toContain('background-color: #111');
    expect(chat().pending).toMatchObject({ phase: 'applying', lines: 3 });

    handlers.onEdit(links);
    await flush();

    expect(store.state.css).toContain('color: #8ab4f8');
    expect(chat().pending?.lines).toBe(6);
    expect(store.state.undoStack.past).toHaveLength(1);
    expect(chromeUtils.setStyle).not.toHaveBeenCalled();

    handlers.onDone({ usage: { inputTokens: 1, outputTokens: 1 } });
    await flush();

    expect(chromeUtils.setStyle).toHaveBeenCalledTimes(1);
    expect(lastTurn()).toMatchObject({
      role: 'assistant',
      edits: [dark, links],
      applied: true,
      matches: [1, 1],
    });

    store.dispatch('undo');
    expect(store.state.css).toBe('');
  });

  it('applies every edit before finishing, even when done arrives first', async () => {
    handlers.onEdit(dark);
    handlers.onEdit(links);
    handlers.onDone({});
    await flush();
    await flush();

    expect((lastTurn() as ChatAssistantTurn).edits).toEqual([dark, links]);
    expect(chat().pending).toBeNull();
  });

  it('records what each declaration held before the reply, once', async () => {
    store.dispatch('applyCss', { css: 'body {\n  background-color: red;\n}' });

    handlers.onEdit(dark);
    handlers.onEdit({
      ...dark,
      declarations: [{ property: 'background-color', value: '#222' }],
    });
    handlers.onDone({});
    await flush();
    await flush();

    expect((lastTurn() as ChatAssistantTurn).previous).toEqual([
      { selector: 'body', property: 'background-color', value: 'red' },
    ]);

    await store.dispatch('chat/toggleTurn', lastTurn().id);
    expect(store.state.css).toContain('background-color: red');
  });

  it('undoes a group whose member a later edit split out', async () => {
    store.dispatch('applyCss', { css: 'p {\n  margin: 0;\n}' });

    handlers.onEdit({
      selector: 'h1, h2',
      declarations: [{ property: 'color', value: '#111' }],
    });
    await flush();
    handlers.onEdit({
      selector: 'h1',
      declarations: [{ property: 'font-size', value: '40px' }],
    });
    handlers.onDone({});
    await flush();
    await flush();

    await store.dispatch('chat/toggleTurn', lastTurn().id);
    expect(store.state.css).toBe('p {\n  margin: 0;\n}');
  });

  it('keeps the edits applied when stopped, as a stopped reply to undo', async () => {
    handlers.onText('Going dark.');
    handlers.onEdit(dark);
    await flush();

    store.dispatch('chat/stop');

    expect(stopStream).toHaveBeenCalled();
    expect(chromeUtils.setStyle).toHaveBeenCalledTimes(1);
    expect(lastTurn()).toMatchObject({
      text: 'Going dark.',
      edits: [dark],
      applied: true,
      stopped: true,
    });
    expect(chat().pending).toBeNull();

    await store.dispatch('chat/toggleTurn', lastTurn().id);
    expect(store.state.css).not.toContain('#111');
  });

  it('takes its edits back when it fails mid-call, so sending again starts clean', async () => {
    handlers.onEdit(dark);
    await flush();

    handlers.onError({ key: 'chat_error_network' });
    await flush();

    expect(store.state.css).not.toContain('#111');
    expect(store.state.undoStack.past).toHaveLength(0);
    expect(chat().error).toEqual({ key: 'chat_error_network' });
    expect(lastTurn().role).toBe('user');

    await store.dispatch('chat/retry');
    expect(streamReply).toHaveBeenCalledTimes(2);
  });

  it('keeps and saves the edits applied when the chat starts over', async () => {
    handlers.onEdit(dark);
    await flush();

    store.dispatch('chat/newChat');

    expect(store.state.css).toContain('#111');
    expect(chromeUtils.setStyle).toHaveBeenCalledTimes(1);
    expect(chat().turns).toEqual([]);
  });

  it('keeps the edits applied as a stopped reply when the editor closes', async () => {
    handlers.onEdit(dark);
    await flush();

    window.dispatchEvent(new Event('pagehide'));

    expect(chromeUtils.setStyle).toHaveBeenCalledTimes(1);
    expect(lastTurn()).toMatchObject({ edits: [dark], stopped: true });
    expect(chromeUtils.chatSetThread).toHaveBeenLastCalledWith(
      'example.com',
      chat().turns
    );
  });

  it('notes each batch of edits for the page check just before it applies', async () => {
    extendStyleCheck.mockImplementation(() => {
      expect(store.state.css).not.toContain('#8ab4f8');
      return Promise.resolve();
    });

    handlers.onEdit(dark);
    await flush();
    handlers.onEdit(links);
    await flush();

    expect(startStyleCheck.mock.calls).toEqual([[[dark]]]);
    expect(extendStyleCheck.mock.calls).toEqual([[[links]]]);
    expect(store.state.css).toContain('#8ab4f8');
  });

  it('applies the edits that arrived since the last batch together', async () => {
    const third = { ...links, selector: 'h1' };

    handlers.onEdit(dark);
    await flush();
    handlers.onEdit(links);
    handlers.onEdit(third);
    await flush();

    expect(startStyleCheck.mock.calls).toEqual([[[dark]]]);
    expect(extendStyleCheck.mock.calls).toEqual([[[links, third]]]);
    expect(store.state.css).toContain('h1');
    expect(store.state.undoStack.past).toHaveLength(1);
  });
});

describe('a reply that fixes what the page check found', () => {
  const missed: ChatStyleProblem = {
    type: 'missed-surface',
    selector: 'main',
    count: 1,
    background: '#fff',
    page: 'dark',
  };

  /**
   * Streams the first call's edit, with the page check finding a missed
   * surface, until the fix call is streaming.
   */
  const startFix = async () => {
    problems = [missed];
    handlers.onEdit(dark);
    handlers.onDone({});
    await flush();
    await flush();
    problems = [];

    expect(streamReply).toHaveBeenCalledTimes(2);
  };

  it('streams the fix’s edits the same way, all in the reply’s one undo step', async () => {
    await startFix();

    handlers.onEdit(links);
    await flush();

    expect(store.state.css).toContain('#8ab4f8');
    expect(chat().pending?.lines).toBe(6);

    handlers.onDone({});
    await flush();
    await flush();

    expect(lastTurn()).toMatchObject({ edits: [dark, links], applied: true });
    expect((lastTurn() as ChatAssistantTurn).rounds).toHaveLength(2);
    expect(store.state.undoStack.past).toHaveLength(1);

    store.dispatch('undo');
    expect(store.state.css).toBe('');
  });

  it('undoes the first call’s group when the fix splits a member out', async () => {
    problems = [missed];
    handlers.onEdit({
      selector: 'h1, h2',
      declarations: [{ property: 'color', value: '#111' }],
    });
    handlers.onDone({});
    await flush();
    await flush();
    problems = [];

    handlers.onEdit({
      selector: 'h1',
      declarations: [{ property: 'color', value: 'red' }],
    });
    handlers.onDone({});
    await flush();
    await flush();

    await store.dispatch('chat/toggleTurn', lastTurn().id);
    expect(store.state.css).toBe('');
  });

  it('takes back only the fix’s own edits when the fix fails mid-call', async () => {
    await startFix();

    handlers.onEdit(links);
    await flush();
    handlers.onError({ key: 'chat_error_network' });
    await flush();

    expect(store.state.css).toContain('#111');
    expect(store.state.css).not.toContain('#8ab4f8');
    expect(lastTurn()).toMatchObject({ edits: [dark], applied: true });
    expect(store.state.undoStack.past).toHaveLength(1);
    expect(chat().error).toBeNull();
  });

  it('keeps a fix stopped midway with the reply, not as a stopped reply', async () => {
    await startFix();

    handlers.onEdit(links);
    await flush();
    store.dispatch('chat/stop');

    expect(lastTurn()).toMatchObject({ edits: [dark, links] });
    expect(lastTurn()).not.toHaveProperty('stopped');
  });
});
