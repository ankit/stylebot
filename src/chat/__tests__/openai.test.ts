import type { ChatStreamEvent, ChatTurn } from '@stylebot/types';

import { openAiProvider, toResponsesInput } from '../providers/openai';
import { getModel } from '../providers';
import { streamResponse } from '../__fixtures__/stream';

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

const event = (value: { type: string } & Record<string, unknown>) =>
  `event: ${value.type}\ndata: ${JSON.stringify(value)}\n\n`;

const edits = [
  {
    selector: 'body',
    declarations: [{ property: 'background', value: '#111' }],
  },
];

describe('openAiProvider (Responses API)', () => {
  it('streams text and the function call, then usage', async () => {
    const args = JSON.stringify({ edits });

    fetchMock.mockResolvedValue(
      streamResponse([
        event({ type: 'response.output_text.delta', delta: 'Went ' }),
        event({ type: 'response.output_text.delta', delta: 'dark.' }),
        event({
          type: 'response.output_item.added',
          output_index: 1,
          item: { type: 'function_call', name: 'apply_css', call_id: 'c1' },
        }),
        event({
          type: 'response.function_call_arguments.delta',
          output_index: 1,
          delta: args.slice(0, 7),
        }),
        event({
          type: 'response.function_call_arguments.delta',
          output_index: 1,
          delta: args.slice(7),
        }),
        event({
          type: 'response.completed',
          response: {
            usage: {
              input_tokens: 300,
              output_tokens: 40,
              input_tokens_details: { cached_tokens: 100 },
            },
          },
        }),
      ])
    );

    const events: Array<ChatStreamEvent> = [];

    await openAiProvider.stream({
      key: 'sk-test',
      model: getModel('openai', 'gpt-5.6-luna'),
      system: 'system prompt',
      turns: [{ role: 'user', id: 'u1', text: 'Dark please' }],
      signal: new AbortController().signal,
      onEvent: e => events.push(e),
    });

    expect(events).toEqual([
      { type: 'text', delta: 'Went ' },
      { type: 'text', delta: 'dark.' },
      { type: 'edits-start' },
      {
        type: 'usage',
        usage: { inputTokens: 200, outputTokens: 40, cacheReadTokens: 100 },
      },
      { type: 'edits', edits },
      { type: 'done' },
    ]);

    const [url, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);

    expect(url).toBe('https://api.openai.com/v1/responses');
    expect(body).toMatchObject({
      model: 'gpt-5.6-luna',
      stream: true,
      store: false,
      instructions: 'system prompt',
      reasoning: { effort: 'low' },
    });
    expect(body.tools[0]).toMatchObject({
      type: 'function',
      name: 'apply_css',
      strict: true,
    });
  });

  it('reports a failed response with its message', async () => {
    fetchMock.mockResolvedValue(
      streamResponse([
        event({
          type: 'response.failed',
          response: { error: { message: 'Something broke' } },
        }),
      ])
    );

    const events: Array<ChatStreamEvent> = [];

    await openAiProvider.stream({
      key: 'sk-test',
      model: getModel('openai', 'gpt-5.6-terra'),
      system: '',
      turns: [],
      signal: new AbortController().signal,
      onEvent: e => events.push(e),
    });

    expect(events).toEqual([
      {
        type: 'error',
        errorKey: 'chat_error_provider',
        detail: 'Something broke',
      },
    ]);
  });
});

describe('toResponsesInput', () => {
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
        text: 'Went dark.',
        edits,
        previous: [],
        applied: false,
        model: 'gpt-5.6-terra',
      },
    ];

    expect(toResponsesInput(turns)).toEqual([
      {
        role: 'user',
        content: [
          { type: 'input_text', text: 'Match this' },
          { type: 'input_image', image_url: 'data:image/png;base64,AAAA' },
        ],
      },
      { role: 'assistant', content: 'Went dark.' },
      {
        type: 'function_call',
        call_id: 'call_a1',
        name: 'apply_css',
        arguments: JSON.stringify({ edits }),
      },
      {
        type: 'function_call_output',
        call_id: 'call_a1',
        output: 'Applied, then undone by the user.',
      },
    ]);
  });
});
