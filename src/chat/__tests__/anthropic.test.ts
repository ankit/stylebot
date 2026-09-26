import type { ChatStreamEvent, ChatTurn } from '@stylebot/types';

import { anthropicProvider, toAnthropicMessages } from '../providers/anthropic';
import { getModel } from '../providers';
import { sse, streamResponse } from '../__fixtures__/stream';

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

const run = async (response: Response, turns: Array<ChatTurn> = []) => {
  fetchMock.mockResolvedValue(response);
  const events: Array<ChatStreamEvent> = [];

  await anthropicProvider.stream({
    key: 'sk-ant-test',
    model: getModel('anthropic', 'claude-sonnet-5'),
    system: 'system prompt',
    turns,
    signal: new AbortController().signal,
    onEvent: event => events.push(event),
  });

  return events;
};

const edits = [
  {
    selector: '.title',
    declarations: [{ property: 'font-size', value: '18px' }],
  },
];

describe('anthropicProvider.stream', () => {
  it('streams text, then the tool call as edits, usage and done', async () => {
    const input = JSON.stringify({ edits });
    const events = await run(
      streamResponse([
        sse([
          {
            type: 'message_start',
            message: {
              usage: {
                input_tokens: 100,
                cache_read_input_tokens: 50,
                cache_creation_input_tokens: 10,
                output_tokens: 1,
              },
            },
          },
          {
            type: 'content_block_start',
            index: 0,
            content_block: { type: 'text', text: '' },
          },
          {
            type: 'content_block_delta',
            index: 0,
            delta: { type: 'text_delta', text: 'Made titles ' },
          },
          {
            type: 'content_block_delta',
            index: 0,
            delta: { type: 'text_delta', text: 'larger.' },
          },
          {
            type: 'content_block_start',
            index: 1,
            content_block: { type: 'tool_use', id: 't', name: 'apply_css' },
          },
          {
            type: 'content_block_delta',
            index: 1,
            delta: {
              type: 'input_json_delta',
              partial_json: input.slice(0, 9),
            },
          },
          {
            type: 'content_block_delta',
            index: 1,
            delta: { type: 'input_json_delta', partial_json: input.slice(9) },
          },
          {
            type: 'message_delta',
            delta: { stop_reason: 'tool_use' },
            usage: { output_tokens: 40 },
          },
          { type: 'message_stop' },
        ]),
      ])
    );

    expect(events).toEqual([
      { type: 'text', delta: 'Made titles ' },
      { type: 'text', delta: 'larger.' },
      { type: 'edits-start' },
      {
        type: 'usage',
        usage: {
          inputTokens: 100,
          outputTokens: 40,
          cacheReadTokens: 50,
          cacheWriteTokens: 10,
        },
      },
      { type: 'edits', edits },
      { type: 'done' },
    ]);

    const [url, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);

    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect(init.headers['x-api-key']).toBe('sk-ant-test');
    expect(init.headers['anthropic-dangerous-direct-browser-access']).toBe(
      'true'
    );
    expect(body.model).toBe('claude-sonnet-5');
    expect(body.stream).toBe(true);
    expect(body.system).toBe('system prompt');
    expect(body.tools[0].name).toBe('apply_css');
    expect(body.output_config).toEqual({ effort: 'low' });
  });

  it('reports a rejected key as invalid', async () => {
    const events = await run(
      new Response(
        JSON.stringify({ error: { message: 'invalid x-api-key' } }),
        {
          status: 401,
        }
      )
    );

    expect(events).toEqual([
      {
        type: 'error',
        errorKey: 'chat_error_invalid_key',
        detail: 'invalid x-api-key',
      },
    ]);
  });

  it('reports a network failure', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const events: Array<ChatStreamEvent> = [];

    await anthropicProvider.stream({
      key: 'sk-ant-test',
      model: getModel('anthropic', 'claude-sonnet-5'),
      system: '',
      turns: [],
      signal: new AbortController().signal,
      onEvent: event => events.push(event),
    });

    expect(events).toEqual([
      {
        type: 'error',
        errorKey: 'chat_error_network',
        detail: 'Failed to fetch',
      },
    ]);
  });

  it('reports a tool call cut off by max_tokens as incomplete', async () => {
    const events = await run(
      streamResponse([
        sse([
          {
            type: 'content_block_start',
            index: 0,
            content_block: { type: 'tool_use', id: 't', name: 'apply_css' },
          },
          {
            type: 'content_block_delta',
            index: 0,
            delta: {
              type: 'input_json_delta',
              partial_json: '{"edits":[{"sel',
            },
          },
          {
            type: 'message_delta',
            delta: { stop_reason: 'max_tokens' },
            usage: { output_tokens: 16000 },
          },
        ]),
      ])
    );

    expect(events[events.length - 1]).toEqual({
      type: 'error',
      errorKey: 'chat_error_incomplete',
    });
  });
});

describe('toAnthropicMessages', () => {
  it('replays applied replies as tool calls answered by the next user turn', () => {
    const turns: Array<ChatTurn> = [
      { role: 'user', id: 'u1', text: 'Bigger titles' },
      {
        role: 'assistant',
        id: 'a1',
        text: 'Done.',
        edits,
        previous: [],
        applied: false,
        model: 'claude-sonnet-5',
      },
      { role: 'user', id: 'u2', text: 'Now blue' },
    ];

    expect(toAnthropicMessages(turns)).toEqual([
      { role: 'user', content: [{ type: 'text', text: 'Bigger titles' }] },
      {
        role: 'assistant',
        content: [
          { type: 'text', text: 'Done.' },
          {
            type: 'tool_use',
            id: 'toolu_a1',
            name: 'apply_css',
            input: { edits },
          },
        ],
      },
      {
        role: 'user',
        content: [
          {
            type: 'tool_result',
            tool_use_id: 'toolu_a1',
            content: 'Applied, then undone by the user.',
          },
          { type: 'text', text: 'Now blue' },
        ],
      },
    ]);
  });
});

describe('toAnthropicMessages with an image', () => {
  it('sends the image as a base64 block before the text', () => {
    const [message] = toAnthropicMessages([
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
    ]);

    expect(message.content).toEqual([
      {
        type: 'image',
        source: { type: 'base64', media_type: 'image/png', data: 'AAAA' },
      },
      { type: 'text', text: 'Match this' },
    ]);
  });
});
