import 'jest-fetch-mock';

jest.mock('../options');

import { generateCss, getErrorCode } from '../ai';
import * as optionsModule from '../options';

const mockClaudeResponse = (
  message: string,
  css: string,
  usage?: { input_tokens: number; output_tokens: number }
) =>
  Promise.resolve({
    status: 200,
    body: JSON.stringify({
      content: [{ type: 'text', text: JSON.stringify({ message, css }) }],
      usage,
    }),
  });

describe('generateCss', () => {
  beforeEach(() => {
    // jest.resetAllMocks() would also wipe jest-fetch-mock's own internal
    // mock implementation (it's a module-scoped jest.fn() set up once at
    // require time) — clearAllMocks only drops call history, not that.
    jest.clearAllMocks();
  });

  it('throws when no api key is configured', async () => {
    (optionsModule.get as jest.Mock).mockResolvedValue('');

    await expect(
      generateCss({
        prompt: 'make it dark',
        css: '',
        url: 'example.com',
        dom: '',
        history: [],
        model: 'claude-opus-4-8',
      })
    ).rejects.toThrow();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('trims whitespace from a stored api key before sending it', async () => {
    (optionsModule.get as jest.Mock).mockResolvedValue('  sk-ant-test\n');

    fetchMock.mockResponse(() => mockClaudeResponse('done', 'a { color: red; }'));

    await generateCss({
      prompt: 'x',
      css: '',
      url: 'example.com',
      dom: '',
      history: [],
      model: 'claude-opus-4-8',
    });

    const [, options] = fetchMock.mock.calls[0];
    const headers = options?.headers as Headers;
    expect(headers.get('x-api-key')).toBe('sk-ant-test');
  });

  it('sends the prompt, existing css, dom outline, and url to the Claude API and returns the generated css and message', async () => {
    (optionsModule.get as jest.Mock).mockResolvedValue('sk-ant-test');

    fetchMock.mockResponse(() =>
      mockClaudeResponse('Made links red.', 'a { color: red; }')
    );

    const result = await generateCss({
      prompt: 'make links red',
      css: 'body { margin: 0; }',
      url: 'https://example.com',
      dom: 'body\n  a.link',
      history: [],
      model: 'claude-opus-4-8',
    });

    expect(result.css).toBe('a { color: red; }');
    expect(result.message).toBe('Made links red.');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({ method: 'POST' })
    );

    const [, options] = fetchMock.mock.calls[0];
    const headers = options?.headers as Headers;
    expect(headers.get('x-api-key')).toBe('sk-ant-test');
    expect(headers.get('anthropic-dangerous-direct-browser-access')).toBe(
      'true'
    );

    const body = JSON.parse(options?.body as string);
    expect(body.model).toBe('claude-opus-4-8');
    expect(body.output_config.format.type).toBe('json_schema');
    expect(body.messages).toHaveLength(1);
    expect(body.messages[0].content).toContain('make links red');
    expect(body.messages[0].content).toContain('body { margin: 0; }');
    expect(body.messages[0].content).toContain('https://example.com');
    expect(body.messages[0].content).toContain('body\n  a.link');

    expect(result.userContent).toBe(body.messages[0].content);
    expect(result.assistantContent).toBe(
      JSON.stringify({ message: 'Made links red.', css: 'a { color: red; }' })
    );
  });

  it('sends prior conversation turns ahead of the new user turn', async () => {
    (optionsModule.get as jest.Mock).mockResolvedValue('sk-ant-test');

    fetchMock.mockResponse(() =>
      mockClaudeResponse('Made it bigger too.', 'a { color: red; font-size: 2em; }')
    );

    await generateCss({
      prompt: 'now make it bigger',
      css: 'a { color: red; }',
      url: 'https://example.com',
      dom: '',
      history: [
        { role: 'user', content: 'Page: https://example.com\n\nRequest: make links red' },
        { role: 'assistant', content: '{"message":"Made links red.","css":"a { color: red; }"}' },
      ],
      model: 'claude-opus-4-8',
    });

    const [, options] = fetchMock.mock.calls[0];
    const body = JSON.parse(options?.body as string);

    expect(body.messages).toHaveLength(3);
    expect(body.messages[0].role).toBe('user');
    expect(body.messages[1].role).toBe('assistant');
    expect(body.messages[2].role).toBe('user');
    expect(body.messages[2].content).toContain('now make it bigger');
  });

  it('tells the model the dom is unchanged when none is provided', async () => {
    (optionsModule.get as jest.Mock).mockResolvedValue('sk-ant-test');

    fetchMock.mockResponse(() => mockClaudeResponse('done', 'a { color: red; }'));

    await generateCss({
      prompt: 'x',
      css: '',
      url: 'example.com',
      dom: '',
      history: [],
      model: 'claude-opus-4-8',
    });

    const [, options] = fetchMock.mock.calls[0];
    const body = JSON.parse(options?.body as string);
    expect(body.messages[0].content).toContain('unchanged from earlier in this conversation');
  });

  it('sends adaptive thinking for models that support it', async () => {
    (optionsModule.get as jest.Mock).mockResolvedValue('sk-ant-test');
    fetchMock.mockResponse(() => mockClaudeResponse('done', 'a { color: red; }'));

    await generateCss({
      prompt: 'x',
      css: '',
      url: 'example.com',
      dom: '',
      history: [],
      model: 'claude-sonnet-5',
    });

    const [, options] = fetchMock.mock.calls[0];
    const body = JSON.parse(options?.body as string);
    expect(body.thinking).toEqual({ type: 'adaptive' });
  });

  it('omits thinking for haiku, which does not support adaptive thinking', async () => {
    (optionsModule.get as jest.Mock).mockResolvedValue('sk-ant-test');
    fetchMock.mockResponse(() => mockClaudeResponse('done', 'a { color: red; }'));

    await generateCss({
      prompt: 'x',
      css: '',
      url: 'example.com',
      dom: '',
      history: [],
      model: 'claude-haiku-4-5',
    });

    const [, options] = fetchMock.mock.calls[0];
    const body = JSON.parse(options?.body as string);
    expect(body.model).toBe('claude-haiku-4-5');
    expect(body.thinking).toBeUndefined();
  });

  it('calculates cost from token usage using the requested model rates', async () => {
    (optionsModule.get as jest.Mock).mockResolvedValue('sk-ant-test');
    fetchMock.mockResponse(() =>
      mockClaudeResponse('done', 'a { color: red; }', {
        input_tokens: 1_000_000,
        output_tokens: 1_000_000,
      })
    );

    const result = await generateCss({
      prompt: 'x',
      css: '',
      url: 'example.com',
      dom: '',
      history: [],
      model: 'claude-haiku-4-5',
    });

    // Haiku 4.5: $1/1M input + $5/1M output
    expect(result.cost).toBeCloseTo(6, 5);
  });

  it('throws if the response text is not valid json', async () => {
    (optionsModule.get as jest.Mock).mockResolvedValue('sk-ant-test');

    fetchMock.mockResponse(() =>
      Promise.resolve({
        status: 200,
        body: JSON.stringify({
          content: [{ type: 'text', text: 'not json' }],
        }),
      })
    );

    await expect(
      generateCss({
        prompt: 'x',
        css: '',
        url: 'example.com',
        dom: '',
        history: [],
        model: 'claude-opus-4-8',
      })
    ).rejects.toThrow();
  });

  it('throws on a non-ok response', async () => {
    (optionsModule.get as jest.Mock).mockResolvedValue('sk-ant-test');

    fetchMock.mockResponse(() =>
      Promise.resolve({
        status: 401,
        body: JSON.stringify({
          error: { type: 'authentication_error', message: 'invalid x-api-key' },
        }),
      })
    );

    await expect(
      generateCss({
        prompt: 'x',
        css: '',
        url: 'example.com',
        dom: '',
        history: [],
        model: 'claude-opus-4-8',
      })
    ).rejects.toThrow();
  });
});

describe('getErrorCode', () => {
  it('maps a missing api key error', async () => {
    (optionsModule.get as jest.Mock).mockResolvedValue('');

    let error: unknown;
    try {
      await generateCss({
        prompt: 'x',
        css: '',
        url: 'example.com',
        dom: '',
        history: [],
        model: 'claude-opus-4-8',
      });
    } catch (e) {
      error = e;
    }

    expect(getErrorCode(error)).toBe('missing_api_key');
  });

  it('maps a 401 to invalid_api_key', async () => {
    (optionsModule.get as jest.Mock).mockResolvedValue('sk-ant-test');
    fetchMock.mockResponse(() =>
      Promise.resolve({
        status: 401,
        body: JSON.stringify({ error: { type: 'authentication_error' } }),
      })
    );

    let error: unknown;
    try {
      await generateCss({
        prompt: 'x',
        css: '',
        url: 'example.com',
        dom: '',
        history: [],
        model: 'claude-opus-4-8',
      });
    } catch (e) {
      error = e;
    }

    expect(getErrorCode(error)).toBe('invalid_api_key');
  });

  it('maps a 429 to rate_limited', async () => {
    (optionsModule.get as jest.Mock).mockResolvedValue('sk-ant-test');
    fetchMock.mockResponse(() =>
      Promise.resolve({
        status: 429,
        body: JSON.stringify({ error: { type: 'rate_limit_error' } }),
      })
    );

    let error: unknown;
    try {
      await generateCss({
        prompt: 'x',
        css: '',
        url: 'example.com',
        dom: '',
        history: [],
        model: 'claude-opus-4-8',
      });
    } catch (e) {
      error = e;
    }

    expect(getErrorCode(error)).toBe('rate_limited');
  });

  it('returns unknown_error for a plain Error', () => {
    expect(getErrorCode(new Error('boom'))).toBe('unknown_error');
  });
});
