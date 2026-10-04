import { getPageSupport, isWebPageUrl } from './page-support';

const tab = (url: string) => ({ id: 1, url } as chrome.tabs.Tab);

const answer = (response?: boolean, lastError?: { message: string }) => {
  global.chrome = {
    runtime: { lastError },
    tabs: {
      sendMessage: jest.fn((_tabId, _message, callback) => callback(response)),
    },
  } as unknown as typeof chrome;
};

describe('isWebPageUrl', () => {
  it('is true for web pages and local files, whatever their path', () => {
    expect(isWebPageUrl('https://example.com/report.pdf')).toBe(true);
    expect(isWebPageUrl('http://example.com')).toBe(true);
    expect(isWebPageUrl('file:///Users/me/page.html')).toBe(true);
  });

  it('is false for browser and extension pages', () => {
    expect(isWebPageUrl('chrome://extensions')).toBe(false);
    expect(isWebPageUrl('chrome-extension://abc/options.html')).toBe(false);
    expect(isWebPageUrl('about:blank')).toBe(false);
    expect(isWebPageUrl('view-source:https://example.com')).toBe(false);
  });
});

describe('getPageSupport', () => {
  it('is supported when the page script says it can style the page', async () => {
    answer(true);
    await expect(getPageSupport(tab('https://example.com'))).resolves.toBe(
      'supported'
    );
  });

  it('is unsupported when the page script runs but cannot style the page', async () => {
    answer(false);
    await expect(
      getPageSupport(tab('https://example.com/report.pdf'))
    ).resolves.toBe('unsupported');
  });

  it('is unreachable when no page script answers', async () => {
    answer(undefined, { message: 'Receiving end does not exist.' });
    await expect(getPageSupport(tab('https://example.com'))).resolves.toBe(
      'unreachable'
    );
  });

  it('does not ask a browser page, which has no page script', async () => {
    answer(true);

    await expect(getPageSupport(tab('chrome://settings'))).resolves.toBe(
      'unreachable'
    );
    expect(chrome.tabs.sendMessage).not.toBeCalled();
  });
});
