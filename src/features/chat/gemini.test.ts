import type { ChatStreamEvent, ChatTurn } from '@stylebot/types';

import { geminiProvider, toInteractionSteps } from './providers/gemini';
import { getModel } from './providers';
import { ChatProviderError } from './providers/ChatProviderError';
import { streamResponse } from './stream.fixtures';

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

const event = (value: Record<string, unknown>) =>
  `data: ${JSON.stringify(value)}\n\n`;

const edits = [
  { selector: 'h1', declarations: [{ property: 'color', value: 'red' }] },
];

describe('geminiProvider (Interactions API)', () => {
  it('reads a 400 about the API key as an invalid key', async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: 400,
            message: 'API key not valid. Please pass a valid API key.',
          },
        }),
        { status: 400 }
      )
    );

    await expect(geminiProvider.validateKey('AQ.bad')).rejects.toEqual(
      new ChatProviderError(
        'chat_error_invalid_key',
        'API key not valid. Please pass a valid API key.'
      )
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:countTokens'
    );
    expect(init.method).toBe('POST');
    expect(init.headers['x-goog-api-key']).toBe('AQ.bad');
  });

  it('streams text and function-call steps, then usage', async () => {
    const args = JSON.stringify({ edits });

    fetchMock.mockResolvedValue(
      streamResponse([
        event({ event_type: 'interaction.created', interaction: { id: 'i1' } }),
        event({
          event_type: 'step.start',
          index: 0,
          step: { type: 'model_output' },
        }),
        event({
          event_type: 'step.delta',
          index: 0,
          delta: { type: 'text', text: 'Made it ' },
        }),
        event({
          event_type: 'step.delta',
          index: 0,
          delta: { type: 'text', text: 'red.' },
        }),
        event({
          event_type: 'step.start',
          index: 1,
          step: {
            type: 'function_call',
            id: 'x',
            name: 'apply_css',
            arguments: {},
          },
        }),
        event({
          event_type: 'step.delta',
          index: 1,
          delta: { type: 'arguments_delta', arguments: args.slice(0, 6) },
        }),
        event({
          event_type: 'step.delta',
          index: 1,
          delta: { type: 'arguments_delta', arguments: args.slice(6) },
        }),
        event({
          event_type: 'interaction.completed',
          interaction: {
            status: 'completed',
            usage: {
              total_input_tokens: 500,
              total_output_tokens: 30,
              total_cached_tokens: 200,
            },
          },
        }),
      ])
    );

    const events: Array<ChatStreamEvent> = [];

    await geminiProvider.stream({
      key: 'AQ.good',
      model: getModel('gemini', 'gemini-3.8-flash'),
      system: 'sys',
      turns: [{ role: 'user', id: 'u1', text: 'Red title' }],
      signal: new AbortController().signal,
      onEvent: e => events.push(e),
    });

    expect(events).toEqual([
      { type: 'text', delta: 'Made it ' },
      { type: 'text', delta: 'red.' },
      { type: 'edits-start' },
      { type: 'edit', edit: edits[0] },
      {
        type: 'usage',
        usage: { inputTokens: 300, outputTokens: 30, cacheReadTokens: 200 },
      },
      {
        type: 'replay',
        steps: [
          {
            type: 'model_output',
            content: [{ type: 'text', text: 'Made it red.' }],
          },
          {
            type: 'function_call',
            id: 'x',
            name: 'apply_css',
            arguments: { edits },
          },
        ],
      },
      { type: 'done' },
    ]);

    const [url, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);

    expect(url).toBe(
      'https://generativelanguage.googleapis.com/v1beta/interactions'
    );
    expect(init.headers['x-goog-api-key']).toBe('AQ.good');
    expect(body).toMatchObject({
      model: 'gemini-3.8-flash',
      stream: true,
      store: false,
      system_instruction: 'sys',
      generation_config: { thinking_level: 'low' },
    });
    expect(JSON.stringify(body.tools)).not.toContain('additionalProperties');
  });

  it('takes arguments that arrive whole on the start step', async () => {
    fetchMock.mockResolvedValue(
      streamResponse([
        event({
          event_type: 'step.start',
          index: 0,
          step: {
            type: 'function_call',
            id: 'x',
            name: 'apply_css',
            arguments: { edits },
          },
        }),
        event({
          event_type: 'interaction.completed',
          interaction: { status: 'completed' },
        }),
      ])
    );

    const events: Array<ChatStreamEvent> = [];

    await geminiProvider.stream({
      key: 'AQ.good',
      model: getModel('gemini', 'gemini-3.8-flash'),
      system: '',
      turns: [],
      signal: new AbortController().signal,
      onEvent: e => events.push(e),
    });

    expect(events).toContainEqual({ type: 'edit', edit: edits[0] });
  });
});

describe('toInteractionSteps', () => {
  it('replays images, replies and their function calls', () => {
    const turns: Array<ChatTurn> = [
      {
        role: 'user',
        id: 'u1',
        text: 'Match this',
        image: {
          dataUrl: 'data:image/png;base64,AAAA',
          mediaType: 'image/png',
          name: '',
          size: 3,
        },
      },
      {
        role: 'assistant',
        id: 'a1',
        text: 'Done.',
        edits,
        previous: [],
        applied: true,
        model: 'gemini-3.8-flash',
      },
    ];

    expect(toInteractionSteps(turns)).toEqual([
      {
        type: 'user_input',
        content: [
          { type: 'image', data: 'AAAA', mime_type: 'image/png' },
          { type: 'text', text: 'Match this' },
        ],
      },
      { type: 'model_output', content: [{ type: 'text', text: 'Done.' }] },
      {
        type: 'function_call',
        id: 'call_a1',
        name: 'apply_css',
        arguments: { edits },
      },
      {
        type: 'function_result',
        call_id: 'call_a1',
        name: 'apply_css',
        result: [{ type: 'text', text: 'Applied to the page.' }],
      },
    ]);
  });
});

describe('thought steps', () => {
  it('keeps thoughts with their signature and sends them back unchanged', async () => {
    fetchMock.mockResolvedValue(
      streamResponse([
        event({
          event_type: 'step.start',
          index: 0,
          step: { type: 'thought' },
        }),
        event({
          event_type: 'step.delta',
          index: 0,
          delta: { type: 'thought_signature', signature: 'SIG123' },
        }),
        event({
          event_type: 'step.start',
          index: 1,
          step: {
            type: 'function_call',
            id: 'fc1',
            name: 'apply_css',
            arguments: { edits },
          },
        }),
        event({
          event_type: 'interaction.completed',
          interaction: { status: 'completed' },
        }),
      ])
    );

    const events: Array<ChatStreamEvent> = [];

    await geminiProvider.stream({
      key: 'AQ.good',
      model: getModel('gemini', 'gemini-3.8-flash'),
      system: '',
      turns: [],
      signal: new AbortController().signal,
      onEvent: e => events.push(e),
    });

    const replay = events.find(
      (e): e is Extract<ChatStreamEvent, { type: 'replay' }> =>
        e.type === 'replay'
    )?.steps;

    expect(replay).toEqual([
      { type: 'thought', signature: 'SIG123' },
      {
        type: 'function_call',
        id: 'fc1',
        name: 'apply_css',
        arguments: { edits },
      },
    ]);

    expect(
      toInteractionSteps([
        {
          role: 'assistant',
          id: 'a1',
          text: '',
          edits,
          previous: [],
          applied: true,
          model: 'gemini-3.8-flash',
          replay,
        },
      ])
    ).toEqual([
      { type: 'thought', signature: 'SIG123' },
      {
        type: 'function_call',
        id: 'fc1',
        name: 'apply_css',
        arguments: { edits },
      },
      {
        type: 'function_result',
        call_id: 'fc1',
        name: 'apply_css',
        result: [{ type: 'text', text: 'Applied to the page.' }],
      },
    ]);
  });
});
