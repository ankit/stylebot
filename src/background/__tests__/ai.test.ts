import 'jest-fetch-mock';

jest.mock('../options');

import { generateCss, getErrorCode } from '../ai';
import * as optionsModule from '../options';

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
      generateCss({ prompt: 'make it dark', css: '', url: 'example.com' })
    ).rejects.toThrow();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends the prompt, existing css, and url to the Claude API and returns the generated css', async () => {
    (optionsModule.get as jest.Mock).mockResolvedValue('sk-ant-test');

    fetchMock.mockResponse(() =>
      Promise.resolve({
        status: 200,
        body: JSON.stringify({
          content: [{ type: 'text', text: 'a { color: red; }' }],
        }),
      })
    );

    const css = await generateCss({
      prompt: 'make links red',
      css: 'body { margin: 0; }',
      url: 'https://example.com',
    });

    expect(css).toBe('a { color: red; }');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({ method: 'POST' })
    );

    const [, options] = fetchMock.mock.calls[0];
    const headers = options?.headers as Headers;
    expect(headers.get('x-api-key')).toBe('sk-ant-test');

    const body = JSON.parse(options?.body as string);
    expect(body.model).toBe('claude-opus-4-8');
    expect(body.messages[0].content).toContain('make links red');
    expect(body.messages[0].content).toContain('body { margin: 0; }');
    expect(body.messages[0].content).toContain('https://example.com');
  });

  it('strips a markdown code fence if the model adds one', async () => {
    (optionsModule.get as jest.Mock).mockResolvedValue('sk-ant-test');

    fetchMock.mockResponse(() =>
      Promise.resolve({
        status: 200,
        body: JSON.stringify({
          content: [{ type: 'text', text: '```css\na { color: red; }\n```' }],
        }),
      })
    );

    const css = await generateCss({ prompt: 'x', css: '', url: 'example.com' });
    expect(css).toBe('a { color: red; }');
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
      generateCss({ prompt: 'x', css: '', url: 'example.com' })
    ).rejects.toThrow();
  });
});

describe('getErrorCode', () => {
  it('maps a missing api key error', async () => {
    (optionsModule.get as jest.Mock).mockResolvedValue('');

    let error: unknown;
    try {
      await generateCss({ prompt: 'x', css: '', url: 'example.com' });
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
      await generateCss({ prompt: 'x', css: '', url: 'example.com' });
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
      await generateCss({ prompt: 'x', css: '', url: 'example.com' });
    } catch (e) {
      error = e;
    }

    expect(getErrorCode(error)).toBe('rate_limited');
  });

  it('returns unknown_error for a plain Error', () => {
    expect(getErrorCode(new Error('boom'))).toBe('unknown_error');
  });
});
