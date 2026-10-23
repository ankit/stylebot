import type { GalleryStyle } from '@stylebot/types';

export const style: GalleryStyle = {
  id: 42,
  site: 'github.com',
  slug: 'tokyo-night',
  name: 'Tokyo Night',
  description: 'The Tokyo Night palette',
  author: { id: 'b7Rr2KdQ0z', username: 'maya' },
  version: 2,
  installs: 120,
  createdAt: 1791849600000,
  updatedAt: 1792022400000,
  screenshot: '/screenshots/42/2',
};

/**
 * An in-memory storage area, kept in store.
 */
const mockStorageArea = (store: Record<string, unknown>) => ({
  get: jest.fn(async (key: string) => ({ [key]: store[key] })),
  set: jest.fn(async (items: Record<string, unknown>) => {
    Object.assign(store, items);
  }),
  remove: jest.fn(async (key: string) => {
    delete store[key];
  }),
});

/**
 * In-memory chrome.storage.local and session areas, enough for the gallery's
 * own keys, returning what local holds.
 */
export const mockStorage = (
  initial: Record<string, unknown> = {}
): Record<string, unknown> => {
  const store: Record<string, unknown> = { ...initial };

  global.chrome = {
    storage: { local: mockStorageArea(store), session: mockStorageArea({}) },
  } as unknown as typeof chrome;

  return store;
};
