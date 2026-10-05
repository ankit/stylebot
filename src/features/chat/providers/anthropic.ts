import type {
  ChatModel,
  ChatProviderInfo,
  ChatStreamEvent,
  ChatTurn,
  ChatUsage,
} from '@stylebot/types';

import type { ChatProvider, ChatStreamArgs } from '../types';

import { readEventStream } from '../read-event-stream';
import { ChatProviderError } from './ChatProviderError';
import { providerFetch, runStream } from './request';
import {
  TOOL_NAME,
  TOOL_DESCRIPTION,
  TOOL_SCHEMA,
  toolResultFor,
  roundCallId,
  roundsOf,
} from '../apply-css-tool';
import type { EditStream } from '../apply-css-tool';
import { finishEdits, startEdits } from './edits';
import { userMessageText } from '../prompt';

export const anthropic: ChatProviderInfo = {
  id: 'anthropic',
  name: 'Claude',
  company: 'Anthropic',
  keyPlaceholder: 'sk-ant-…',
  keyUrl: 'https://console.anthropic.com/settings/keys',
  usageUrl: 'https://console.anthropic.com/settings/usage',
  keyPrefix: 'sk-ant-',
  defaultModel: 'claude-sonnet-5-5',
  models: [
    {
      id: 'claude-sonnet-5-5',
      name: 'Claude Sonnet 5.5',
      shortName: 'Sonnet 5.5',
      tier: 'balanced',
      pricing: { input: 2, output: 10, cacheRead: 0.2, cacheWrite: 2.5 },
      requestOptions: { output_config: { effort: 'low' } },
    },
    {
      id: 'claude-haiku-4-5',
      name: 'Claude Haiku 4.5',
      shortName: 'Haiku 4.5',
      tier: 'fastest',
      pricing: { input: 1, output: 5, cacheRead: 0.1, cacheWrite: 1.25 },
    },
    {
      id: 'claude-opus-5-5',
      name: 'Claude Opus 5.5',
      shortName: 'Opus 5.5',
      tier: 'best',
      pricing: { input: 4, output: 20, cacheRead: 0.2, cacheWrite: 5 },
      requestOptions: { output_config: { effort: 'medium' } },
    },
  ],
};

const API = 'https://api.anthropic.com/v1';
const MAX_TOKENS = 16000;

type ContentBlock =
  | { type: 'text'; text: string }
  | {
      type: 'image';
      source: { type: 'base64'; media_type: string; data: string };
    }
  | { type: 'tool_use'; id: string; name: string; input: unknown }
  | { type: 'tool_result'; tool_use_id: string; content: string };

type Message = { role: 'user' | 'assistant'; content: Array<ContentBlock> };

// Without it the API refuses requests from a browser origin (CORS).
const headers = (key: string): Record<string, string> => ({
  'content-type': 'application/json',
  'x-api-key': key,
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-access': 'true',
});

/**
 * Replays the thread as Messages API turns. Each apply_css call a reply
 * made becomes a tool call, answered in the next user turn with what it
 * came to, so the model knows what the page looks like now. A thread that
 * ends on a call is answered too, for the model to follow up on.
 */
export const toAnthropicMessages = (turns: Array<ChatTurn>): Array<Message> => {
  const messages: Array<Message> = [];
  let pendingResult: ContentBlock | null = null;

  const flushResult = () => {
    if (pendingResult) {
      messages.push({ role: 'user', content: [pendingResult] });
      pendingResult = null;
    }
  };

  turns.forEach(turn => {
    if (turn.role === 'user') {
      messages.push({
        role: 'user',
        content: [
          ...(pendingResult ? [pendingResult] : []),
          ...(turn.image
            ? [
                {
                  type: 'image' as const,
                  source: {
                    type: 'base64' as const,
                    media_type: turn.image.mediaType,
                    data: turn.image.dataUrl.slice(
                      turn.image.dataUrl.indexOf(',') + 1
                    ),
                  },
                },
              ]
            : []),
          { type: 'text', text: userMessageText(turn) },
        ],
      });
      pendingResult = null;
      return;
    }

    roundsOf(turn).forEach((round, index) => {
      const content: Array<ContentBlock> = [];

      if (round.text) {
        content.push({ type: 'text', text: round.text });
      }

      const id = round.edits.length
        ? roundCallId('toolu', turn.id, index)
        : null;

      if (id) {
        content.push({
          type: 'tool_use',
          id,
          name: TOOL_NAME,
          input: { edits: round.edits },
        });
      }

      if (content.length) {
        flushResult();
        messages.push({ role: 'assistant', content });
      }

      if (id) {
        pendingResult = {
          type: 'tool_result',
          tool_use_id: id,
          content: toolResultFor(turn, round),
        };
      }
    });
  });

  flushResult();
  return messages;
};

const requestBody = (
  model: ChatModel,
  system: string,
  turns: Array<ChatTurn>
) => ({
  model: model.id,
  max_tokens: MAX_TOKENS,
  stream: true,
  cache_control: { type: 'ephemeral' },
  system,
  messages: toAnthropicMessages(turns),
  tools: [
    {
      name: TOOL_NAME,
      description: TOOL_DESCRIPTION,
      input_schema: TOOL_SCHEMA,
      strict: true,
      /* Otherwise the API holds back the edits list until it's whole, and
       * edits can't apply as they stream; each is still checked here. */
      eager_input_streaming: true,
    },
  ],
  ...model.requestOptions,
});

/**
 * What's gathered while a reply streams in.
 */
type StreamState = {
  usage: ChatUsage;
  // The apply_css call's input so far, by content block index.
  toolInputs: Map<number, EditStream>;
  stopReason: string;
};

type OnEvent = (event: ChatStreamEvent) => void;

/**
 * The fields read from Messages API stream events; everything is optional
 * since it's the provider's JSON.
 */
type StreamEvent = {
  type?: string;
  index?: number;
  message?: {
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
      cache_read_input_tokens?: number;
      cache_creation_input_tokens?: number;
    };
  };
  content_block?: { type?: string; name?: string };
  delta?: {
    type?: string;
    text?: string;
    partial_json?: string;
    stop_reason?: string;
  };
  usage?: { output_tokens?: number };
  error?: { type?: string; message?: string };
};

const readStartUsage = (
  state: StreamState,
  message: StreamEvent['message']
) => {
  const start = message?.usage ?? {};
  state.usage.inputTokens = start.input_tokens ?? 0;
  state.usage.cacheReadTokens = start.cache_read_input_tokens ?? 0;
  state.usage.cacheWriteTokens = start.cache_creation_input_tokens ?? 0;
  state.usage.outputTokens = start.output_tokens ?? 0;
};

const startBlock = (
  state: StreamState,
  { content_block: block, index }: StreamEvent,
  onEvent: OnEvent
) => {
  if (
    block?.type === 'tool_use' &&
    block.name === TOOL_NAME &&
    index !== undefined
  ) {
    state.toolInputs.set(index, startEdits(onEvent));
    onEvent({ type: 'edits-start' });
  }
};

const addDelta = (
  state: StreamState,
  { delta, index }: StreamEvent,
  onEvent: OnEvent
) => {
  if (delta?.type === 'text_delta') {
    onEvent({ type: 'text', delta: delta.text ?? '' });
    return;
  }

  const input = index !== undefined ? state.toolInputs.get(index) : undefined;

  if (delta?.type === 'input_json_delta') {
    input?.write(delta.partial_json ?? '');
  }
};

const endMessage = (state: StreamState, { delta, usage }: StreamEvent) => {
  state.stopReason = delta?.stop_reason ?? state.stopReason;
  state.usage.outputTokens = usage?.output_tokens ?? 0;
};

const streamError = (error: StreamEvent['error']): ChatProviderError =>
  new ChatProviderError(
    error?.type === 'overloaded_error'
      ? 'chat_error_rate_limited'
      : 'chat_error_provider',
    error?.message
  );

const handleEvent = (
  state: StreamState,
  event: StreamEvent,
  onEvent: OnEvent
) => {
  switch (event.type) {
    case 'message_start':
      readStartUsage(state, event.message);
      break;
    case 'content_block_start':
      startBlock(state, event, onEvent);
      break;
    case 'content_block_delta':
      addDelta(state, event, onEvent);
      break;
    case 'message_delta':
      endMessage(state, event);
      break;
    case 'error':
      throw streamError(event.error);
  }
};

/**
 * Reports what the reply came to once the stream ends: its usage, then any
 * edits not yet reported, or why there are none.
 */
const finishReply = (state: StreamState, onEvent: OnEvent) => {
  onEvent({ type: 'usage', usage: state.usage });

  if (state.stopReason === 'refusal') {
    throw new ChatProviderError('chat_error_declined');
  }

  const count = finishEdits(state.toolInputs.values());

  if (!count && state.stopReason === 'max_tokens') {
    throw new ChatProviderError('chat_error_incomplete');
  }

  onEvent({ type: 'done' });
};

export const anthropicProvider: ChatProvider = {
  async validateKey(key: string): Promise<void> {
    await providerFetch(`${API}/models?limit=1`, { headers: headers(key) });
  },

  stream({
    key,
    model,
    system,
    turns,
    signal,
    onEvent,
  }: ChatStreamArgs): Promise<void> {
    return runStream(signal, onEvent, async () => {
      const response = await providerFetch(`${API}/messages`, {
        method: 'POST',
        headers: headers(key),
        signal,
        body: JSON.stringify(requestBody(model, system, turns)),
      });

      if (!response.body) {
        throw new ChatProviderError('chat_error_provider');
      }

      const state: StreamState = {
        usage: { inputTokens: 0, outputTokens: 0 },
        toolInputs: new Map(),
        stopReason: '',
      };

      await readEventStream(response.body, ({ data }) => {
        let event: StreamEvent;

        try {
          event = JSON.parse(data);
        } catch {
          return;
        }

        handleEvent(state, event, onEvent);
      });

      finishReply(state, onEvent);
    });
  },
};
