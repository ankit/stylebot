import { shouldRunOnUrl } from './should-run-on-url';

describe('shouldRunOnUrl', () => {
  const originalLocation = window.location;

  const visit = (url: string): void => {
    const { hostname, pathname, protocol } = new URL(url);

    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { pathname, protocol },
    });
    Object.defineProperty(document, 'domain', {
      configurable: true,
      value: hostname,
    });
  };

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
    delete (document as { domain?: string }).domain;
  });

  it('runs on an article', () => {
    visit('https://example.com/2026/11/04/a-long-article-headline');

    expect(shouldRunOnUrl()).toBe(true);
  });

  it.each([
    'https://gemini.google.com/app/1a2b3c4d5e6f',
    'https://chatgpt.com/c/6a1b2c3d-1234-5678-9abc-def012345678',
    'https://claude.ai/chat/6a1b2c3d-1234-5678-9abc-def012345678',
    'https://www.perplexity.ai/search/how-do-tides-work-abc123',
  ])('does not run on the AI chat app at %s', url => {
    visit(url);

    expect(shouldRunOnUrl()).toBe(false);
  });

  it('still runs on other Google subdomains', () => {
    visit('https://blog.google.com/technology/ai/a-long-article-headline');

    expect(shouldRunOnUrl()).toBe(true);
  });
});
