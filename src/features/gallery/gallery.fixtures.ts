import type {
  GalleryAccount,
  GalleryPublishedStyle,
  GalleryStyle,
} from '@stylebot/types';

import type { GallerySession } from './api';

export const account: GalleryAccount = {
  id: 'b7Rr2KdQ0z',
  username: 'maya',
  usernameConfirmed: true,
};

export const session: GallerySession = {
  session: 'b7Rr2KdQ0z.1794614400000.secret',
  expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
  account,
};

export const style: GalleryStyle = {
  id: 'Xk3p9QaL2m',
  site: 'github.com',
  group: 'github.com',
  slug: 'tokyo-night',
  name: 'Tokyo Night',
  description: 'The Tokyo Night palette',
  author: { id: account.id, username: account.username },
  version: 2,
  installs: 120,
  createdAt: 1791849600000,
  updatedAt: 1792022400000,
  screenshot: '/screenshots/Xk3p9QaL2m/2',
  status: 'live',
};

export const publishedStyle: GalleryPublishedStyle = {
  ...style,
  removed: ['@import url(https://example.com/theme.css);'],
};

/**
 * An in-memory chrome.storage.local, enough for the gallery's own keys.
 */
export const mockStorage = (
  initial: Record<string, unknown> = {}
): Record<string, unknown> => {
  const store: Record<string, unknown> = { ...initial };

  global.chrome = {
    storage: {
      local: {
        get: jest.fn(async (key: string) => ({ [key]: store[key] })),
        set: jest.fn(async (items: Record<string, unknown>) => {
          Object.assign(store, items);
        }),
        remove: jest.fn(async (key: string) => {
          delete store[key];
        }),
      },
    },
  } as unknown as typeof chrome;

  return store;
};
