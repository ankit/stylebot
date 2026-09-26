import { CHAT_PORT } from '@stylebot/chat';
import type {
  ChatCssEdit,
  ChatStreamEvent,
  ChatStreamRequest,
  ChatUsage,
} from '@stylebot/types';

import type { ChatError } from './chat';

/**
 * What a reply reports besides its text and edits, once it's done.
 */
export type ChatStreamResult = {
  usage?: ChatUsage;
  replay?: Array<unknown>;
};

export type ChatStreamHandlers = {
  onText: (delta: string) => void;
  onEditsStart: () => void;
  // The reply finishes once the returned promise settles.
  onEdits: (edits: Array<ChatCssEdit>) => Promise<void>;
  onDone: (result: ChatStreamResult) => void;
  onError: (error: ChatError) => void;
};

/**
 * Streams one reply from the background over its own port, and returns a
 * function that stops it. Nothing is reported once it's stopped; a port
 * that drops mid-reply is a network error.
 */
export const streamReply = (
  request: ChatStreamRequest,
  handlers: ChatStreamHandlers
): (() => void) => {
  const port = chrome.runtime.connect({ name: CHAT_PORT });
  const result: ChatStreamResult = {};
  let active = true;
  let applying: Promise<void> = Promise.resolve();

  const stop = () => {
    if (active) {
      active = false;
      port.disconnect();
    }
  };

  const fail = (error: ChatError) => {
    if (active) {
      stop();
      handlers.onError(error);
    }
  };

  const finish = async () => {
    await applying;

    if (active) {
      stop();
      handlers.onDone(result);
    }
  };

  port.onMessage.addListener((event: ChatStreamEvent) => {
    if (!active) {
      return;
    }

    switch (event.type) {
      case 'text':
        handlers.onText(event.delta);
        break;

      case 'edits-start':
        handlers.onEditsStart();
        break;

      case 'edits':
        applying = handlers.onEdits(event.edits);
        break;

      case 'usage':
        result.usage = event.usage;
        break;

      case 'replay':
        result.replay = event.steps;
        break;

      case 'done':
        finish();
        break;

      case 'error':
        fail({ key: event.errorKey, detail: event.detail });
        break;
    }
  });

  port.onDisconnect.addListener(() => fail({ key: 'chat_error_network' }));
  port.postMessage(request);

  return stop;
};
