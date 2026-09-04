import { CachedState, readCache, writeCache } from '../cache';

const CACHE_KEY = 'stylebot-cache';

const sampleState: CachedState = {
  styles: [{ url: 'https://example.com', css: 'a{color:red}', enabled: true }],
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

    it('returns the parsed cache when present', () => {
      localStorage.setItem(CACHE_KEY, JSON.stringify(sampleState));

      expect(readCache()).toEqual(sampleState);
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
    it('persists the state as JSON', () => {
      writeCache(sampleState);

      expect(JSON.parse(localStorage.getItem(CACHE_KEY) as string)).toEqual(
        sampleState
      );
    });

    it('does not throw if localStorage.setItem fails', () => {
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota exceeded');
      });

      expect(() => writeCache(sampleState)).not.toThrow();
    });
  });
});
