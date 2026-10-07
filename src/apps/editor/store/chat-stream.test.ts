import type { ChatStreamEvent, ChatStreamRequest } from '@stylebot/types';

import { streamReply } from './chat-stream';
import type { ChatStreamHandlers } from './chat-stream';

type Listener<T> = (value: T) => void;

const fakePort = () => {
  const messages: Array<Listener<ChatStreamEvent>> = [];
  const disconnects: Array<Listener<void>> = [];

  return {
    name: 'stylebot-chat',
    postMessage: jest.fn(),
    disconnect: jest.fn(),
    onMessage: {
      addListener: (fn: Listener<ChatStreamEvent>) => messages.push(fn),
    },
    onDisconnect: { addListener: (fn: Listener<void>) => disconnects.push(fn) },
    emit: (event: ChatStreamEvent) => messages.forEach(fn => fn(event)),
    drop: () => disconnects.forEach(fn => fn()),
  };
};

const request: ChatStreamRequest = {
  type: 'send',
  system: 'sys',
  context: 'page',
  turns: [],
};

const edit = {
  selector: 'a',
  declarations: [{ property: 'color', value: 'blue' }],
};

let port: ReturnType<typeof fakePort>;
let handlers: jest.Mocked<ChatStreamHandlers>;

const flush = () => new Promise(resolve => setTimeout(resolve));

beforeEach(() => {
  port = fakePort();
  global.chrome = {
    runtime: { connect: jest.fn(() => port) },
  } as unknown as typeof chrome;

  handlers = {
    onText: jest.fn(),
    onEditsStart: jest.fn(),
    onEdit: jest.fn(),
    onDone: jest.fn(),
    onError: jest.fn(),
  };
});

describe('streamReply', () => {
  it('sends the request and reports the reply as it streams', async () => {
    streamReply(request, handlers);

    expect(chrome.runtime.connect).toHaveBeenCalledWith({
      name: 'stylebot-chat',
    });
    expect(port.postMessage).toHaveBeenCalledWith(request);

    port.emit({ type: 'text', delta: 'Done' });
    port.emit({ type: 'edits-start' });
    port.emit({ type: 'edit', edit });
    port.emit({ type: 'edit', edit: { ...edit, selector: 'b' } });
    port.emit({
      type: 'usage',
      usage: { inputTokens: 10, outputTokens: 2 },
    });
    port.emit({ type: 'replay', steps: ['step'] });
    port.emit({ type: 'done' });
    await flush();

    expect(handlers.onText).toHaveBeenCalledWith('Done');
    expect(handlers.onEditsStart).toHaveBeenCalled();
    expect(handlers.onEdit.mock.calls).toEqual([
      [edit],
      [{ ...edit, selector: 'b' }],
    ]);
    expect(handlers.onDone).toHaveBeenCalledWith({
      usage: { inputTokens: 10, outputTokens: 2 },
      replay: ['step'],
    });
    expect(port.disconnect).toHaveBeenCalled();
  });

  it('passes on an error from the provider', () => {
    streamReply(request, handlers);
    port.emit({
      type: 'error',
      errorKey: 'chat_error_rate_limited',
      detail: 'slow down',
    });

    expect(handlers.onError).toHaveBeenCalledWith({
      key: 'chat_error_rate_limited',
      detail: 'slow down',
    });
    expect(port.disconnect).toHaveBeenCalled();
  });

  it('treats a dropped port as a network error', () => {
    streamReply(request, handlers);
    port.drop();

    expect(handlers.onError).toHaveBeenCalledWith({
      key: 'chat_error_network',
    });
  });

  it('reports nothing once stopped', async () => {
    const stop = streamReply(request, handlers);
    stop();

    port.emit({ type: 'text', delta: 'late' });
    port.emit({ type: 'done' });
    port.drop();
    await flush();

    expect(port.disconnect).toHaveBeenCalledTimes(1);
    expect(handlers.onText).not.toHaveBeenCalled();
    expect(handlers.onDone).not.toHaveBeenCalled();
    expect(handlers.onError).not.toHaveBeenCalled();
  });

  it('passes on no edits once stopped mid-call', () => {
    const stop = streamReply(request, handlers);
    port.emit({ type: 'edit', edit });
    stop();
    port.emit({ type: 'edit', edit });

    expect(handlers.onEdit).toHaveBeenCalledTimes(1);
  });
});
