import { getModel, getProviderInfo } from '@stylebot/chat';
import type {
  ChatCssEdit,
  ChatProviderId,
  ChatStatus,
  ChatStreamEvent,
  ChatStreamRequest,
  ChatTurn,
} from '@stylebot/types';

export type ChatReplyScript = {
  text: string;
  edits: Array<ChatCssEdit>;
};

export type ChatShimOptions = {
  connected?: boolean;
  provider?: ChatProviderId;
  model?: string;
  // Keyed by site, as the background stores them.
  threads?: Record<string, Array<ChatTurn>>;
  // Streams part of the reply, then waits forever: the reply in progress.
  hold?: boolean;
  // Ms between streamed words; 0 keeps plays fast.
  wordDelay?: number;
  error?: Extract<ChatStreamEvent, { type: 'error' }>;
};

/* Canned replies for the stand-in page, picked by what was asked. */
const REPLIES: Array<[RegExp, ChatReplyScript]> = [
  [
    /dark|night/i,
    {
      text: 'Switched the page to a dark palette, with softer text so it is easy on the eyes.',
      edits: [
        {
          selector: '.sb-page',
          declarations: [
            { property: 'background-color', value: '#16181c' },
            { property: 'color', value: '#d8dbe1' },
          ],
        },
      ],
    },
  ],
  [
    /read|text|font/i,
    {
      text: 'Bumped the article text up a size and gave the lines more room.',
      edits: [
        {
          selector: '.article-body',
          declarations: [
            { property: 'font-size', value: '18px' },
            { property: 'line-height', value: '1.8' },
          ],
        },
      ],
    },
  ],
  [
    /.*/,
    {
      text: 'Gave the heading more room below it.',
      edits: [
        {
          selector: 'h1',
          declarations: [{ property: 'margin-bottom', value: '24px' }],
        },
      ],
    },
  ],
];

const replyFor = (text: string): ChatReplyScript =>
  REPLIES.find(([pattern]) => pattern.test(text))?.[1] ?? REPLIES[0][1];

type Listener<T> = (value: T) => void;

/**
 * The background's chat, in memory: messages answer from a status and
 * per-site threads, and a port streams a canned reply to each request.
 */
export const createChatShim = (options: ChatShimOptions = {}) => {
  const provider = options.provider ?? 'anthropic';
  let status: ChatStatus = {
    connected: !!options.connected,
    provider,
    model: getModel(provider, options.model ?? '').id,
    maskedKey: options.connected ? 'sk-ant-api03-••••••••9fK4' : undefined,
  };
  const threads: Record<string, Array<ChatTurn>> = { ...options.threads };

  const runtimeResponses: Record<
    string,
    (message: {
      name: string;
      provider?: ChatProviderId;
      key?: string;
      model?: string;
      url?: string;
      turns?: Array<ChatTurn>;
    }) => unknown
  > = {
    ChatGetStatus: () => status,

    ChatConnect: ({ provider: id = 'anthropic', key = '' }) => {
      const info = getProviderInfo(id);

      if (info.keyPrefix && !key.startsWith(info.keyPrefix)) {
        return { ok: false, errorKey: 'chat_error_wrong_provider_key' };
      }

      if (key.length < 12) {
        return { ok: false, errorKey: 'chat_error_invalid_key' };
      }

      status = {
        connected: true,
        provider: id,
        model: info.defaultModel,
        maskedKey: `${key.slice(0, 7)}••••••••${key.slice(-4)}`,
      };
      return { ok: true, status };
    },

    ChatDisconnect: () => {
      status = { ...status, connected: false, maskedKey: undefined };
      return status;
    },

    ChatSetModel: ({ model = '' }) => {
      status = { ...status, model: getModel(status.provider, model).id };
      return status;
    },

    ChatGetThread: ({ url = '' }) => threads[url] ?? [],

    ChatSetThread: ({ url = '', turns = [] }) => {
      threads[url] = turns;
    },
  };

  const connect = () => {
    const messageListeners: Array<Listener<ChatStreamEvent>> = [];
    const disconnectListeners: Array<Listener<void>> = [];
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    const wordDelay = options.wordDelay ?? 0;
    let at = 0;

    const emit = (event: ChatStreamEvent, delay = wordDelay) => {
      at += delay;
      timers.push(
        setTimeout(() => {
          messageListeners.forEach(listener => listener(event));
        }, at)
      );
    };

    return {
      name: 'stylebot-chat',
      onMessage: {
        addListener: (listener: Listener<ChatStreamEvent>) =>
          messageListeners.push(listener),
      },
      onDisconnect: {
        addListener: (listener: Listener<void>) =>
          disconnectListeners.push(listener),
      },
      disconnect: () => timers.forEach(clearTimeout),
      postMessage: (request: ChatStreamRequest) => {
        if (options.error) {
          emit(options.error);
          return;
        }

        const last = request.turns[request.turns.length - 1];
        const reply = replyFor(last?.role === 'user' ? last.text : '');
        const words = reply.text.split(' ');
        const shown = options.hold
          ? words.slice(0, Math.ceil(words.length / 2))
          : words;

        shown.forEach((word, index) =>
          emit({ type: 'text', delta: index ? ` ${word}` : word })
        );

        if (options.hold) {
          return;
        }

        emit({ type: 'edits-start' });
        emit({
          type: 'usage',
          usage: { inputTokens: 2400, outputTokens: 180 },
        });
        emit({ type: 'edits', edits: reply.edits });
        emit({ type: 'done' });
      },
    };
  };

  return { runtimeResponses, connect };
};
