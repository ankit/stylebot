/* eslint-disable @typescript-eslint/no-explicit-any */

import { fetchImportCss, pruneImportCache } from '../import-cache';

global.chrome = {
  runtime: {
    sendMessage: () => Promise.resolve(''),
  },
} as unknown as typeof chrome;

describe('import-cache', () => {
  afterEach(() => {
    localStorage.clear();
  });

  describe('fetchImportCss', () => {
    const originalSendMessage = global.chrome.runtime.sendMessage;

    afterEach(() => {
      global.chrome.runtime.sendMessage = originalSendMessage;
    });

    it('fetches and caches the response when nothing is cached', async () => {
      const sendMessage = jest.fn((_message: any) =>
        Promise.resolve('.a{color:red}')
      );
      global.chrome.runtime.sendMessage = sendMessage as any;

      const result = await fetchImportCss('https://example.com/a.css');

      expect(result).toBe('.a{color:red}');
      expect(sendMessage).toHaveBeenCalledTimes(1);
      expect(
        localStorage.getItem('stylebot-import-cache:https://example.com/a.css')
      ).toBe('.a{color:red}');
    });

    it('resolves from the cache without waiting on the fetch to complete', async () => {
      localStorage.setItem(
        'stylebot-import-cache:https://example.com/a.css',
        '.cached{}'
      );

      let deliver: (response: string) => void = () => undefined;
      const sendMessage = jest.fn(
        (_message: any) =>
          new Promise<string>(resolve => {
            deliver = resolve;
          })
      );
      global.chrome.runtime.sendMessage = sendMessage as any;

      const result = await fetchImportCss('https://example.com/a.css');

      expect(result).toBe('.cached{}');
      // still refreshes the cache in the background
      expect(sendMessage).toHaveBeenCalledTimes(1);

      deliver('.fresh{}');
    });

    it('resolves empty and does not cache if the background is unreachable', async () => {
      const sendMessage = jest.fn((_message: any) =>
        Promise.reject(new Error('Could not establish connection.'))
      );
      global.chrome.runtime.sendMessage = sendMessage as any;

      const result = await fetchImportCss('https://example.com/down.css');

      expect(result).toBe('');
      expect(
        localStorage.getItem(
          'stylebot-import-cache:https://example.com/down.css'
        )
      ).toBeNull();
    });

    it('does not cache an empty response', async () => {
      const sendMessage = jest.fn((_message: any) => Promise.resolve(''));
      global.chrome.runtime.sendMessage = sendMessage as any;

      await fetchImportCss('https://example.com/missing.css');

      expect(
        localStorage.getItem(
          'stylebot-import-cache:https://example.com/missing.css'
        )
      ).toBeNull();
    });
  });

  describe('pruneImportCache', () => {
    it('removes cache entries for urls that are no longer live', () => {
      localStorage.setItem(
        'stylebot-import-cache:https://example.com/still-used.css',
        '.a{}'
      );
      localStorage.setItem(
        'stylebot-import-cache:https://example.com/removed.css',
        '.b{}'
      );

      pruneImportCache(new Set(['https://example.com/still-used.css']));

      expect(
        localStorage.getItem(
          'stylebot-import-cache:https://example.com/still-used.css'
        )
      ).toBe('.a{}');
      expect(
        localStorage.getItem(
          'stylebot-import-cache:https://example.com/removed.css'
        )
      ).toBeNull();
    });

    it('leaves unrelated localStorage keys alone', () => {
      localStorage.setItem('some-other-key', 'value');

      pruneImportCache(new Set());

      expect(localStorage.getItem('some-other-key')).toBe('value');
    });
  });
});
