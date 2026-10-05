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

export const openai: ChatProviderInfo = {
  id: 'openai',
  name: 'OpenAI',
  company: 'OpenAI',
  keyPlaceholder: 'sk-…',
  keyUrl: 'https://platform.openai.com/api-keys',
  usageUrl: 'https://platform.openai.com/usage',
  defaultModel: 'gpt-6.1-sol',
  models: [
    {
      id: 'gpt-6.1-sol',
      name: 'GPT-6.1 Sol',
      shortName: 'GPT-6.1 Sol',
      tier: 'balanced',
      pricing: { input: 2, output: 10, cacheRead: 0.1 },
      requestOptions: { reasoning: { effort: 'low' } },
    },
    {
      id: 'gpt-6-luna',
      name: 'GPT-6 Luna',
      shortName: 'GPT-6 Luna',
      tier: 'fastest',
      pricing: { input: 0.1, output: 0.5, cacheRead: 0.01 },
      requestOptions: { reasoning: { effort: 'low' } },
    },
    {
      id: 'gpt-6-astra',
      name: 'GPT-6 Astra',
      shortName: 'GPT-6 Astra',
      tier: 'best',
      pricing: { input: 10, output: 50, cacheRead: 1 },
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

/**
 * Replays the thread as Responses API input items; each apply_css call a
 * reply made becomes a function call followed by its output.
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

    return roundsOf(turn).flatMap((round, index): Array<InputItem> => {
      const items: Array<InputItem> = [];

      if (round.text) {
        items.push({ role: 'assistant', content: round.text });
      }

      if (round.edits.length) {
        items.push(
          {
            type: 'function_call',
            call_id: roundCallId('call', turn.id, index),
            name: TOOL_NAME,
            arguments: JSON.stringify({ edits: round.edits }),
          },
          {
            type: 'function_call_output',
            call_id: roundCallId('call', turn.id, index),
            output: toolResultFor(turn, round),
          }
        );
      }

      return items;
    });
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
  toolInputs: Map<number, EditStream>;
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
    state.toolInputs.set(index, startEdits(onEvent));
    onEvent({ type: 'edits-start' });
  }
};

const addArguments = (
  state: StreamState,
  { delta, output_index: index }: StreamEvent
) => {
  if (index !== undefined) {
    state.toolInputs.get(index)?.write(delta ?? '');
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
 * Reports what the reply came to once the stream ends: its usage, then any
 * edits not yet reported, or why there are none.
 */
const finishReply = (state: StreamState, onEvent: OnEvent) => {
  onEvent({ type: 'usage', usage: state.usage });

  if (state.incomplete === 'content_filter') {
    throw new ChatProviderError('chat_error_declined');
  }

  const count = finishEdits(state.toolInputs.values());

  if (!count && state.incomplete) {
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
