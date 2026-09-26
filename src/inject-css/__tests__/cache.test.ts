import { COMPILED_STYLES_VERSION } from '@stylebot/styles';

import type { CachedState } from '../cache';
import { readCache, writeCache } from '../cache';

const CACHE_KEY = 'stylebot-cache';

const sampleState: CachedState = {
  styles: [
    {
      url: 'https://example.com',
      css: 'a{color:red !important}',
      importUrls: [],
      enabled: true,
    },
  ],
  readability: false,
};

describe('cache', () => {
  afterEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  describe('readCache', () => {
    it('returns null when nothing is cached', () => {
      expect(readCache()).toBeNull();
    });

    it('returns what was written, without the version stamp', () => {
      writeCache(sampleState);

      expect(readCache()).toEqual(sampleState);
    });

    it('returns null for a cache from before styles were compiled, which has no version', () => {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          styles: [{ url: 'https://example.com', css: 'a{}', enabled: true }],
          readability: false,
        })
      );

      expect(readCache()).toBeNull();
    });

    it('returns null for a cache written by another compiler version', () => {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ ...sampleState, version: COMPILED_STYLES_VERSION + 1 })
      );

      expect(readCache()).toBeNull();
    });

    it('returns null for corrupt JSON instead of throwing', () => {
      localStorage.setItem(CACHE_KEY, '{not valid json');

      expect(() => readCache()).not.toThrow();
      expect(readCache()).toBeNull();
    });

    it('returns null if localStorage.getItem throws', () => {
      jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('blocked');
      });

      expect(readCache()).toBeNull();
    });
  });

  describe('writeCache', () => {
    it('persists the state as JSON, stamped with the compiler version', () => {
      writeCache(sampleState);

      expect(JSON.parse(localStorage.getItem(CACHE_KEY) as string)).toEqual({
        version: COMPILED_STYLES_VERSION,
        ...sampleState,
      });
    });

    it('does not throw if localStorage.setItem fails', () => {
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota exceeded');
      });

      expect(() => writeCache(sampleState)).not.toThrow();
    });
  });
});
