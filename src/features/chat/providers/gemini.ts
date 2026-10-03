import type {
  ChatCssEdit,
  ChatModel,
  ChatProviderInfo,
  ChatStreamEvent,
  ChatTurn,
  ChatUsage,
} from '@stylebot/types';

import type { ChatProvider, ChatStreamArgs } from '../types';

import { readEventStream } from '../read-event-stream';
import { ChatProviderError } from './ChatProviderError';
import type { ClassifyError } from './request';
import { providerFetch, runStream } from './request';
import {
  TOOL_NAME,
  TOOL_DESCRIPTION,
  TOOL_SCHEMA,
  toolResultFor,
  parseEdits,
} from '../apply-css-tool';
import { userMessageText } from '../prompt';

export const gemini: ChatProviderInfo = {
  id: 'gemini',
  name: 'Gemini',
  company: 'Google',
  keyUrl: 'https://aistudio.google.com/api-keys',
  usageUrl: 'https://aistudio.google.com/usage',
  defaultModel: 'gemini-3.8-flash',
  models: [
    {
      id: 'gemini-3.8-flash',
      name: 'Gemini 3.8 Flash',
      shortName: '3.8 Flash',
      tier: 'balanced',
      // Rises to 1.5 / 7.5 / 0.15 on 2027-01-01.
      pricing: { input: 0.75, output: 3.75, cacheRead: 0.075 },
      requestOptions: { generation_config: { thinking_level: 'low' } },
    },
    {
      id: 'gemini-3.5-flash-lite',
      name: 'Gemini 3.5 Flash-Lite',
      shortName: '3.5 Flash-Lite',
      tier: 'fastest',
      pricing: { input: 0.3, output: 2.5, cacheRead: 0.03 },
    },
    {
      id: 'gemini-3.1-pro-preview',
      name: 'Gemini 3.1 Pro',
      shortName: '3.1 Pro',
      tier: 'best',
      // For prompts up to 200k tokens; longer ones cost more.
      pricing: { input: 2, output: 12, cacheRead: 0.2 },
      requestOptions: { generation_config: { thinking_level: 'low' } },
    },
  ],
};

const API = 'https://generativelanguage.googleapis.com/v1beta';

type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image'; data: string; mime_type: string };

type InputStep =
  | { type: 'user_input'; content: Array<ContentPart> }
  | { type: 'model_output'; content: Array<ContentPart> }
  | { type: 'function_call'; id: string; name: string; arguments: unknown }
  | {
      type: 'function_result';
      call_id: string;
      name: string;
      result: Array<ContentPart>;
    };

// Keys go in Google's own header: the newer auth keys (`AQ.…`) are refused
// as bearer tokens.
const headers = (key: string): Record<string, string> => ({
  'content-type': 'application/json',
  'x-goog-api-key': key,
});

// A bad key comes back as a 400 rather than a 401.
const classifyError: ClassifyError = (status, detail) =>
  status === 400 && /api key|auth key/i.test(detail ?? '')
    ? 'chat_error_invalid_key'
    : undefined;

// Gemini's function schemas don't take additionalProperties.
const TOOL_PARAMETERS = JSON.parse(
  JSON.stringify(TOOL_SCHEMA, (key, value) =>
    key === 'additionalProperties' ? undefined : value
  )
);

const callId = (turnId: string): string => `call_${turnId}`;

/**
 * Replays the thread as Interactions API steps; a reply that changed the
 * page becomes a function call followed by its result.
 */
export const toInteractionSteps = (turns: Array<ChatTurn>): Array<InputStep> =>
  turns.flatMap((turn): Array<InputStep> => {
    if (turn.role === 'user') {
      return [
        {
          type: 'user_input',
          content: [
            ...(turn.image
              ? [
                  {
                    type: 'image' as const,
                    data: turn.image.dataUrl.slice(
                      turn.image.dataUrl.indexOf(',') + 1
                    ),
                    mime_type: turn.image.mediaType,
                  },
                ]
              : []),
            { type: 'text', text: userMessageText(turn) },
          ],
        },
      ];
    }

    const result = (id: string): InputStep => ({
      type: 'function_result',
      call_id: id,
      name: TOOL_NAME,
      result: [
        {
          type: 'text',
          text: toolResultFor(turn),
        },
      ],
    });

    // A Gemini reply goes back exactly as it came, thoughts and all.
    if (turn.replay?.length) {
      const call = turn.replay.find(
        (step): step is { type: 'function_call'; id: string } =>
          (step as { type?: string }).type === 'function_call'
      );

      return [
        ...(turn.replay as Array<InputStep>),
        ...(call && turn.edits.length ? [result(call.id)] : []),
      ];
    }

    const steps: Array<InputStep> = [];

    if (turn.text) {
      steps.push({
        type: 'model_output',
        content: [{ type: 'text', text: turn.text }],
      });
    }

    if (turn.edits.length) {
      steps.push(
        {
          type: 'function_call',
          id: callId(turn.id),
          name: TOOL_NAME,
          arguments: { edits: turn.edits },
        },
        {
          type: 'function_result',
          call_id: callId(turn.id),
          name: TOOL_NAME,
          result: [
            {
              type: 'text',
              text: toolResultFor(turn),
            },
          ],
        }
      );
    }

    return steps;
  });

const requestBody = (
  model: ChatModel,
  system: string,
  turns: Array<ChatTurn>
) => ({
  model: model.id,
  stream: true,
  store: false,
  system_instruction: system,
  input: toInteractionSteps(turns),
  tools: [
    {
      type: 'function',
      name: TOOL_NAME,
      description: TOOL_DESCRIPTION,
      parameters: TOOL_PARAMETERS,
    },
  ],
  ...model.requestOptions,
});

type Step = Record<string, unknown>;

/**
 * What's gathered while a reply streams in.
 */
type StreamState = {
  usage: ChatUsage;
  // The apply_css call's arguments so far, by step index.
  toolInputs: Map<number, string>;
  // Every output step as streamed, to send back verbatim next time.
  steps: Map<number, Step>;
  status: string;
};

type OnEvent = (event: ChatStreamEvent) => void;

/**
 * The fields read from Interactions API stream events; everything is
 * optional since it's the provider's JSON.
 */
type StreamEvent = {
  event_type?: string;
  index?: number;
  step?: Step & { type?: string; name?: string; arguments?: object };
  delta?: {
    type?: string;
    text?: string;
    arguments?: string;
    signature?: string;
    content?: { text?: string };
  };
  interaction?: {
    status?: string;
    usage?: {
      total_input_tokens?: number;
      total_output_tokens?: number;
      total_cached_tokens?: number;
    };
  };
  error?: { message?: string };
};

/**
 * Adds streamed text to a step's text parts, extending the last one.
 */
const appendText = (step: Step, field: 'content' | 'summary', text: string) => {
  const parts = (step[field] as Array<{ type: string; text?: string }>) ?? [];
  const last = parts[parts.length - 1];

  if (last?.type === 'text') {
    last.text = (last.text ?? '') + text;
  } else {
    parts.push({ type: 'text', text });
  }
  step[field] = parts;
};

const startStep = (
  state: StreamState,
  { index, step }: StreamEvent,
  onEvent: OnEvent
) => {
  if (index === undefined || !step) {
    return;
  }

  state.steps.set(index, { ...step });

  if (step.type === 'function_call' && step.name === TOOL_NAME) {
    const args = step.arguments;
    // Arguments may arrive whole on the start step instead of as deltas.
    state.toolInputs.set(
      index,
      args && Object.keys(args).length ? JSON.stringify(args) : ''
    );
    onEvent({ type: 'edits-start' });
  }
};

const addDelta = (
  state: StreamState,
  { index, delta }: StreamEvent,
  onEvent: OnEvent
) => {
  const step = index !== undefined ? state.steps.get(index) : undefined;

  if (!step || !delta) {
    return;
  }

  switch (delta.type) {
    case 'text':
      appendText(step, 'content', delta.text ?? '');
      onEvent({ type: 'text', delta: delta.text ?? '' });
      break;
    case 'thought_summary':
      appendText(step, 'summary', delta.content?.text ?? delta.text ?? '');
      break;
    case 'thought_signature':
      step.signature = delta.signature;
      break;
    case 'arguments_delta': {
      const input = state.toolInputs.get(index as number);

      if (input !== undefined) {
        state.toolInputs.set(index as number, input + (delta.arguments ?? ''));
      }
      break;
    }
  }
};

// A finished step may come whole; it's then the one to keep.
const stopStep = (state: StreamState, { index, step }: StreamEvent) => {
  if (index !== undefined && step) {
    state.steps.set(index, { ...step });
  }
};

const endInteraction = (state: StreamState, { interaction }: StreamEvent) => {
  const total = interaction?.usage ?? {};
  const cached = total.total_cached_tokens ?? 0;

  state.usage.inputTokens = (total.total_input_tokens ?? 0) - cached;
  state.usage.cacheReadTokens = cached;
  state.usage.outputTokens = total.total_output_tokens ?? 0;
  state.status = interaction?.status ?? '';
};

const handleEvent = (
  state: StreamState,
  event: StreamEvent,
  onEvent: OnEvent
) => {
  switch (event.event_type) {
    case 'step.start':
      startStep(state, event, onEvent);
      break;
    case 'step.delta':
      addDelta(state, event, onEvent);
      break;
    case 'step.stop':
      stopStep(state, event);
      break;
    case 'interaction.completed':
      endInteraction(state, event);
      break;
    case 'error':
      throw new ChatProviderError('chat_error_provider', event.error?.message);
  }
};

/**
 * The model's steps in order, as Gemini needs them back: its thoughts,
 * text and call, with the call's arguments whole.
 */
const replaySteps = (state: StreamState): Array<Step> => {
  state.toolInputs.forEach((json, index) => {
    const step = state.steps.get(index);

    if (step && json) {
      try {
        step.arguments = JSON.parse(json);
      } catch {
        // Reported as incomplete when the edits are parsed.
      }
    }
  });

  return Array.from(state.steps.entries())
    .sort(([a], [b]) => a - b)
    .map(([, step]) => step)
    .filter(step =>
      ['thought', 'model_output', 'function_call'].includes(step.type as string)
    );
};

/**
 * Reports what the reply came to once the stream ends: its usage and
 * steps, then its edits, or why there are none.
 */
const finishReply = (state: StreamState, onEvent: OnEvent) => {
  onEvent({ type: 'usage', usage: state.usage });

  if (state.status === 'failed') {
    throw new ChatProviderError('chat_error_provider');
  }

  const edits: Array<ChatCssEdit> = [];

  for (const json of state.toolInputs.values()) {
    const parsed = parseEdits(json);

    if (!parsed) {
      throw new ChatProviderError('chat_error_incomplete');
    }
    edits.push(...parsed);
  }

  onEvent({ type: 'replay', steps: replaySteps(state) });

  if (edits.length) {
    onEvent({ type: 'edits', edits });
  } else if (state.status === 'incomplete') {
    throw new ChatProviderError('chat_error_incomplete');
  }

  onEvent({ type: 'done' });
};

/**
 * Gemini through the Interactions API, Google's recommended API for new
 * apps. Nothing is stored on Google's side.
 */
export const geminiProvider: ChatProvider = {
  /**
   * Counts the tokens of a word on the default model: free, and unlike
   * listing models it accepts the newer auth keys, which are only honoured
   * on calls to a current model.
   */
  async validateKey(key: string): Promise<void> {
    await providerFetch(
      `${API}/models/${gemini.defaultModel}:countTokens`,
      {
        method: 'POST',
        headers: headers(key),
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Hi' }] }] }),
      },
      classifyError
    );
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
      const response = await providerFetch(
        `${API}/interactions`,
        {
          method: 'POST',
          headers: headers(key),
          signal,
          body: JSON.stringify(requestBody(model, system, turns)),
        },
        classifyError
      );

      if (!response.body) {
        throw new ChatProviderError('chat_error_provider');
      }

      const state: StreamState = {
        usage: { inputTokens: 0, outputTokens: 0 },
        toolInputs: new Map(),
        steps: new Map(),
        status: '',
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
