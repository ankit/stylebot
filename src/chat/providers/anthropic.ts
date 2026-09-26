import type {
  ChatCssEdit,
  ChatModel,
  ChatProvider,
  ChatProviderInfo,
  ChatStreamArgs,
  ChatStreamEvent,
  ChatTurn,
  ChatUsage,
} from '@stylebot/types';

import { readEventStream } from '../read-event-stream';
import { ChatProviderError } from './ChatProviderError';
import { providerFetch, runStream } from './request';
import {
  TOOL_NAME,
  TOOL_DESCRIPTION,
  TOOL_SCHEMA,
  TOOL_RESULT_APPLIED,
  TOOL_RESULT_UNDONE,
  parseEdits,
} from '../apply-css-tool';
import { userMessageText } from '../prompt';

export const anthropic: ChatProviderInfo = {
  id: 'anthropic',
  name: 'Claude',
  company: 'Anthropic',
  keyPlaceholder: 'sk-ant-…',
  keyUrl: 'https://console.anthropic.com/settings/keys',
  usageUrl: 'https://console.anthropic.com/settings/usage',
  keyPrefix: 'sk-ant-',
  defaultModel: 'claude-sonnet-5',
  models: [
    {
      id: 'claude-sonnet-5',
      name: 'Claude Sonnet 5',
      tier: 'balanced',
      requestOptions: { output_config: { effort: 'low' } },
    },
    {
      id: 'claude-haiku-4-5',
      name: 'Claude Haiku 4.5',
      tier: 'fastest',
    },
    {
      id: 'claude-opus-5',
      name: 'Claude Opus 5',
      tier: 'best',
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

const toolUseId = (turnId: string): string => `toolu_${turnId}`;

/**
 * Replays the thread as Messages API turns. A reply that changed the page
 * becomes a tool call, answered in the next user turn with whether it's
 * still applied, so the model knows what the page looks like now.
 */
export const toAnthropicMessages = (turns: Array<ChatTurn>): Array<Message> => {
  const messages: Array<Message> = [];
  let pendingResult: ContentBlock | null = null;

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

    const content: Array<ContentBlock> = [];

    if (turn.text) {
      content.push({ type: 'text', text: turn.text });
    }

    if (turn.edits.length) {
      content.push({
        type: 'tool_use',
        id: toolUseId(turn.id),
        name: TOOL_NAME,
        input: { edits: turn.edits },
      });
      pendingResult = {
        type: 'tool_result',
        tool_use_id: toolUseId(turn.id),
        content: turn.applied ? TOOL_RESULT_APPLIED : TOOL_RESULT_UNDONE,
      };
    }

    if (content.length) {
      messages.push({ role: 'assistant', content });
    }
  });

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
  toolInputs: Map<number, string>;
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
    state.toolInputs.set(index, '');
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

  if (delta?.type === 'input_json_delta' && input !== undefined) {
    state.toolInputs.set(index as number, input + (delta.partial_json ?? ''));
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
 * Reports what the reply came to once the stream ends: its usage, then its
 * edits, or why there are none.
 */
const finishReply = (state: StreamState, onEvent: OnEvent) => {
  onEvent({ type: 'usage', usage: state.usage });

  if (state.stopReason === 'refusal') {
    throw new ChatProviderError('chat_error_declined');
  }

  const edits: Array<ChatCssEdit> = [];

  for (const json of state.toolInputs.values()) {
    const parsed = parseEdits(json);

    if (!parsed) {
      throw new ChatProviderError('chat_error_incomplete');
    }
    edits.push(...parsed);
  }

  if (edits.length) {
    onEvent({ type: 'edits', edits });
  } else if (state.stopReason === 'max_tokens') {
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
