import type {
  ChatAssistantTurn,
  ChatStreamEvent,
  ChatTurn,
} from '@stylebot/types';

import {
  anthropicProvider,
  toAnthropicMessages,
  withPageContext,
} from './providers/anthropic';
import { getModel } from './providers';
import { sse, streamResponse } from './stream.fixtures';

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
    model: getModel('anthropic', 'claude-sonnet-5-5'),
    system: 'system prompt',
    context: 'page context',
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
  it('streams text, then the tool call as edits, then usage and done', async () => {
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
      { type: 'edit', edit: edits[0] },
      {
        type: 'usage',
        usage: {
          inputTokens: 100,
          outputTokens: 40,
          cacheReadTokens: 50,
          cacheWriteTokens: 10,
        },
      },
      { type: 'done' },
    ]);

    const [url, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);

    expect(url).toBe('https://api.anthropic.com/v1/messages');
    expect(init.headers['x-api-key']).toBe('sk-ant-test');
    expect(init.headers['anthropic-dangerous-direct-browser-access']).toBe(
      'true'
    );
    expect(body.model).toBe('claude-sonnet-5-5');
    expect(body.stream).toBe(true);
    expect(body.system).toEqual([
      {
        type: 'text',
        text: 'system prompt',
        cache_control: { type: 'ephemeral' },
      },
    ]);
    expect(body.tools[0].name).toBe('apply_css');
    expect(body.tools[0].eager_input_streaming).toBe(true);
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
      model: getModel('anthropic', 'claude-sonnet-5-5'),
      system: '',
      context: 'page context',
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

  it('reports each edit as soon as its entry closes, while the call still streams', async () => {
    const two = [
      ...edits,
      {
        selector: '[class*="a,b"] > p:not(.x)',
        declarations: [{ property: 'content', value: '"}],\\""' }],
      },
    ];
    const input = JSON.stringify({ edits: two });
    const cut = input.indexOf('},{') + 4;
    const log: Array<string> = [];

    fetchMock.mockResolvedValue(
      streamResponse(
        [
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
                partial_json: input.slice(0, cut),
              },
            },
          ]),
          sse([
            {
              type: 'content_block_delta',
              index: 0,
              delta: {
                type: 'input_json_delta',
                partial_json: input.slice(cut),
              },
            },
            { type: 'message_delta', delta: { stop_reason: 'tool_use' } },
          ]),
        ],
        index => log.push(`read ${index}`)
      )
    );

    const events: Array<ChatStreamEvent> = [];

    await anthropicProvider.stream({
      key: 'sk-ant-test',
      model: getModel('anthropic', 'claude-sonnet-5-5'),
      system: '',
      context: 'page context',
      turns: [],
      signal: new AbortController().signal,
      onEvent: event => {
        events.push(event);
        log.push(event.type === 'edit' ? event.edit.selector : event.type);
      },
    });

    expect(log).toEqual([
      'read 0',
      'edits-start',
      '.title',
      'read 1',
      '[class*="a,b"] > p:not(.x)',
      'usage',
      'done',
    ]);
    expect(events.filter(event => event.type === 'edit')).toEqual(
      two.map(edit => ({ type: 'edit', edit }))
    );
  });

  it('reports the edits of every apply_css call in the reply', async () => {
    const second = {
      selector: 'h1',
      declarations: [{ property: 'color', value: 'red' }],
    };
    const events = await run(
      streamResponse([
        sse(
          [edits, [second]].flatMap((callEdits, index) => [
            {
              type: 'content_block_start',
              index,
              content_block: {
                type: 'tool_use',
                id: `t${index}`,
                name: 'apply_css',
              },
            },
            {
              type: 'content_block_delta',
              index,
              delta: {
                type: 'input_json_delta',
                partial_json: JSON.stringify({ edits: callEdits }),
              },
            },
          ])
        ),
      ])
    );

    expect(events.filter(event => event.type === 'edit')).toEqual([
      { type: 'edit', edit: edits[0] },
      { type: 'edit', edit: second },
    ]);
  });

  it('keeps the edits reported before a call was cut off, then reports it incomplete', async () => {
    const input = JSON.stringify({ edits: [...edits, ...edits] });
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
              partial_json: input.slice(0, input.length - 12),
            },
          },
          {
            type: 'message_delta',
            delta: { stop_reason: 'max_tokens' },
          },
        ]),
      ])
    );

    expect(events.map(event => event.type)).toEqual([
      'edits-start',
      'edit',
      'usage',
      'error',
    ]);
    expect(events[events.length - 1]).toEqual({
      type: 'error',
      errorKey: 'chat_error_incomplete',
    });
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
        model: 'claude-sonnet-5-5',
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

describe('toAnthropicMessages with a fix round', () => {
  const problem = {
    type: 'missed-surface' as const,
    selector: '.card',
    count: 1,
    background: '#ffffff',
    page: 'dark' as const,
  };
  const fix = [{ selector: '.card', declarations: [] }];
  const turns: Array<ChatTurn> = [
    { role: 'user', id: 'u1', text: 'Dark mode' },
    {
      role: 'assistant',
      id: 'a1',
      text: 'Made it dark.',
      edits,
      previous: [],
      applied: true,
      model: 'claude-sonnet-5',
      rounds: [{ text: 'Made it dark.', edits, problems: [problem] }],
    },
  ];

  it('answers a thread that ends on a call, with what the check found', () => {
    const messages = toAnthropicMessages(turns);

    expect(messages).toHaveLength(3);
    expect(messages[2]).toEqual({
      role: 'user',
      content: [
        {
          type: 'tool_result',
          tool_use_id: 'toolu_a1',
          content: expect.stringContaining('Still light on a now dark page'),
        },
      ],
    });
  });

  it('replays each round as its own call, answered before the next', () => {
    const [, first, result, second] = toAnthropicMessages([
      turns[0],
      {
        ...(turns[1] as ChatAssistantTurn),
        rounds: [
          { text: 'Made it dark.', edits, problems: [problem] },
          { text: 'Fixed the card.', edits: fix, matches: [1] },
        ],
      },
    ]);

    expect(first.role).toBe('assistant');
    expect(result.content[0]).toMatchObject({
      type: 'tool_result',
      tool_use_id: 'toolu_a1',
    });
    expect(second.content).toEqual([
      { type: 'text', text: 'Fixed the card.' },
      {
        type: 'tool_use',
        id: 'toolu_a1_1',
        name: 'apply_css',
        input: { edits: fix },
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

describe('withPageContext', () => {
  const cached = { cache_control: { type: 'ephemeral' } };

  it('marks the thread for the cache and adds the page after the mark', () => {
    const messages = withPageContext(
      toAnthropicMessages([{ role: 'user', id: 'u1', text: 'Dark mode' }]),
      '<page>'
    );

    expect(messages).toEqual([
      {
        role: 'user',
        content: [
          { type: 'text', text: 'Dark mode', ...cached },
          { type: 'text', text: '<page>' },
        ],
      },
    ]);
  });

  it('leaves the page out of earlier messages, so they stay cached', () => {
    const first = withPageContext(
      toAnthropicMessages([{ role: 'user', id: 'u1', text: 'Dark mode' }]),
      '<page v1>'
    );
    const second = withPageContext(
      toAnthropicMessages([
        { role: 'user', id: 'u1', text: 'Dark mode' },
        {
          role: 'assistant',
          id: 'a1',
          text: 'Done.',
          edits,
          previous: [],
          applied: true,
          model: 'claude-sonnet-5-5',
        },
        { role: 'user', id: 'u2', text: 'Bigger titles' },
      ]),
      '<page v2>'
    );

    expect(second[0].content[0]).toEqual({ type: 'text', text: 'Dark mode' });
    expect(first[0].content[0]).toMatchObject({ text: 'Dark mode' });
    expect(JSON.stringify(second.slice(0, -1))).not.toContain('<page');
    expect(second[2].content.slice(-1)).toEqual([
      { type: 'text', text: '<page v2>' },
    ]);
  });
});
