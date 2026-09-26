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

export const openai: ChatProviderInfo = {
  id: 'openai',
  name: 'OpenAI',
  company: 'OpenAI',
  keyPlaceholder: 'sk-…',
  keyUrl: 'https://platform.openai.com/api-keys',
  usageUrl: 'https://platform.openai.com/usage',
  defaultModel: 'gpt-5.6-terra',
  models: [
    {
      id: 'gpt-5.6-terra',
      name: 'GPT-5.6 Terra',
      tier: 'balanced',
      requestOptions: { reasoning: { effort: 'low' } },
    },
    {
      id: 'gpt-5.6-luna',
      name: 'GPT-5.6 Luna',
      tier: 'fastest',
      requestOptions: { reasoning: { effort: 'low' } },
    },
    {
      id: 'gpt-5.6-sol',
      name: 'GPT-5.6 Sol',
      tier: 'best',
      requestOptions: { reasoning: { effort: 'low' } },
    },
  ],
};

const API = 'https://api.openai.com/v1';
const MAX_OUTPUT_TOKENS = 16000;

type InputItem =
  | {
      role: 'user';
      content: Array<
        | { type: 'input_text'; text: string }
        | { type: 'input_image'; image_url: string }
      >;
    }
  | { role: 'assistant'; content: string }
  | { type: 'function_call'; call_id: string; name: string; arguments: string }
  | { type: 'function_call_output'; call_id: string; output: string };

const headers = (key: string): Record<string, string> => ({
  'content-type': 'application/json',
  authorization: `Bearer ${key}`,
});

const callId = (turnId: string): string => `call_${turnId}`;

/**
 * Replays the thread as Responses API input items; a reply that changed
 * the page becomes a function call followed by its output.
 */
export const toResponsesInput = (turns: Array<ChatTurn>): Array<InputItem> =>
  turns.flatMap((turn): Array<InputItem> => {
    if (turn.role === 'user') {
      return [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: userMessageText(turn) },
            ...(turn.image
              ? [
                  {
                    type: 'input_image' as const,
                    image_url: turn.image.dataUrl,
                  },
                ]
              : []),
          ],
        },
      ];
    }

    const items: Array<InputItem> = [];

    if (turn.text) {
      items.push({ role: 'assistant', content: turn.text });
    }

    if (turn.edits.length) {
      items.push(
        {
          type: 'function_call',
          call_id: callId(turn.id),
          name: TOOL_NAME,
          arguments: JSON.stringify({ edits: turn.edits }),
        },
        {
          type: 'function_call_output',
          call_id: callId(turn.id),
          output: turn.applied ? TOOL_RESULT_APPLIED : TOOL_RESULT_UNDONE,
        }
      );
    }

    return items;
  });

const requestBody = (
  model: ChatModel,
  system: string,
  turns: Array<ChatTurn>
) => ({
  model: model.id,
  stream: true,
  store: false,
  max_output_tokens: MAX_OUTPUT_TOKENS,
  instructions: system,
  input: toResponsesInput(turns),
  tools: [
    {
      type: 'function',
      name: TOOL_NAME,
      description: TOOL_DESCRIPTION,
      parameters: TOOL_SCHEMA,
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
  // The apply_css call's arguments so far, by output index.
  toolInputs: Map<number, string>;
  // Why the response stopped short, if it did.
  incomplete: string;
};

type OnEvent = (event: ChatStreamEvent) => void;

/**
 * The fields read from Responses API stream events; everything is optional
 * since it's the provider's JSON.
 */
type StreamEvent = {
  type?: string;
  delta?: string;
  output_index?: number;
  item?: { type?: string; name?: string };
  response?: {
    usage?: {
      input_tokens?: number;
      output_tokens?: number;
      input_tokens_details?: { cached_tokens?: number };
    };
    incomplete_details?: { reason?: string };
    error?: { message?: string };
  };
  message?: string;
};

const startItem = (
  state: StreamState,
  { item, output_index: index }: StreamEvent,
  onEvent: OnEvent
) => {
  if (
    item?.type === 'function_call' &&
    item.name === TOOL_NAME &&
    index !== undefined
  ) {
    state.toolInputs.set(index, '');
    onEvent({ type: 'edits-start' });
  }
};

const addArguments = (
  state: StreamState,
  { delta, output_index: index }: StreamEvent
) => {
  const input = index !== undefined ? state.toolInputs.get(index) : undefined;

  if (input !== undefined) {
    state.toolInputs.set(index as number, input + (delta ?? ''));
  }
};

const endResponse = (state: StreamState, { response }: StreamEvent) => {
  const total = response?.usage ?? {};
  const cached = total.input_tokens_details?.cached_tokens ?? 0;

  state.usage.inputTokens = (total.input_tokens ?? 0) - cached;
  state.usage.cacheReadTokens = cached;
  state.usage.outputTokens = total.output_tokens ?? 0;
  state.incomplete = response?.incomplete_details?.reason ?? '';
};

const handleEvent = (
  state: StreamState,
  event: StreamEvent,
  onEvent: OnEvent
) => {
  switch (event.type) {
    case 'response.output_text.delta':
      onEvent({ type: 'text', delta: event.delta ?? '' });
      break;
    case 'response.output_item.added':
      startItem(state, event, onEvent);
      break;
    case 'response.function_call_arguments.delta':
      addArguments(state, event);
      break;
    case 'response.completed':
    case 'response.incomplete':
      endResponse(state, event);
      break;
    case 'response.failed':
      throw new ChatProviderError(
        'chat_error_provider',
        event.response?.error?.message
      );
    case 'error':
      throw new ChatProviderError('chat_error_provider', event.message);
  }
};

/**
 * Reports what the reply came to once the stream ends: its usage, then its
 * edits, or why there are none.
 */
const finishReply = (state: StreamState, onEvent: OnEvent) => {
  onEvent({ type: 'usage', usage: state.usage });

  if (state.incomplete === 'content_filter') {
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
  } else if (state.incomplete) {
    throw new ChatProviderError('chat_error_incomplete');
  }

  onEvent({ type: 'done' });
};

/**
 * OpenAI through the Responses API, the one that allows tools while its
 * reasoning models think. Nothing is stored on OpenAI's side.
 */
export const openAiProvider: ChatProvider = {
  async validateKey(key: string): Promise<void> {
    await providerFetch(`${API}/models`, { headers: headers(key) });
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
      const response = await providerFetch(`${API}/responses`, {
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
        incomplete: '',
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
