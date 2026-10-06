jest.mock('../commands', () => ({ set: jest.fn(async () => undefined) }));

import { readFileSync } from 'fs';
import { resolve } from 'path';

import { BACKUP_BEFORE_V4_KEY, isStyleMap } from '@stylebot/saved-styles';

import {
  fakeStorage,
  storageFrom324,
  storageWithoutEditTimes,
} from './migrations.fixtures';

const EPOCH = '1970-01-01T00:00:00.000Z';

const { version } = JSON.parse(
  readFileSync(resolve(__dirname, '../../../../package.json'), 'utf8')
);

/**
 * A fresh copy of the module, since runMigrations runs once per load.
 */
const load = (): typeof import('./index') => {
  let loaded: typeof import('./index') | undefined;

  jest.isolateModules(() => {
    loaded = require('./index');
  });

  return loaded as typeof import('./index');
};

describe('runMigrations', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('backs up storage before any migration rewrites it', async () => {
    const store = fakeStorage(storageFrom324);

    await load().runMigrations();

    expect(store[BACKUP_BEFORE_V4_KEY]).toMatchObject({
      items: {
        styles: storageFrom324.styles,
        'styles-metadata': storageFrom324['styles-metadata'],
        commands: storageFrom324.commands,
        options: storageFrom324.options,
        'google-drive-sync': storageFrom324['google-drive-sync'],
      },
    });
    expect(store['styles-metadata']).toEqual({
      modifiedTime: storageFrom324['styles-metadata'],
    });
  });

  it('upgrades 3.2.4 storage', async () => {
    const store = fakeStorage(storageFrom324);

    await load().runMigrations();

    expect(store.styles).toEqual(storageFrom324.styles);
    expect(store.commands).toBeUndefined();
    expect(store['google-drive-sync-state']).toMatchObject({
      metadata: storageFrom324['google-drive-sync'],
      localRevision: '',
    });
    expect(store.migration_errors).toBeUndefined();
  });

  it('gives styles saved without an edit time the epoch', async () => {
    const store = fakeStorage(storageWithoutEditTimes);

    await load().runMigrations();

    expect(store.styles).toEqual({
      'example.com': {
        ...storageWithoutEditTimes.styles['example.com'],
        modifiedTime: EPOCH,
      },
    });
  });

  it.each([
    ['3.2.4', storageFrom324],
    ['without edit times', storageWithoutEditTimes],
  ])('leaves storage from %s readable as a style map', async (_, items) => {
    const store = fakeStorage(items);

    await load().runMigrations();

    expect(isStyleMap(store.styles)).toBe(true);
  });

  it.each([
    ['3.2.4', storageFrom324],
    ['without edit times', storageWithoutEditTimes],
  ])('changes nothing on a second run (%s)', async (_, items) => {
    const store = fakeStorage(items);

    await load().runMigrations();
    const once = JSON.parse(JSON.stringify(store));
    await load().runMigrations();

    expect(store).toEqual(once);
  });

  it('keeps the first backup on later starts', async () => {
    const store = fakeStorage(storageFrom324);

    await load().runMigrations();
    const backup = store[BACKUP_BEFORE_V4_KEY];
    store.styles = {};
    await load().runMigrations();

    expect(store[BACKUP_BEFORE_V4_KEY]).toEqual(backup);
  });

  it('runs the rest when one migration fails, and records the failure', async () => {
    const store = fakeStorage(storageFrom324);
    const loaded = load();
    const backup = loaded.migrations.find(m => m.name === 'backup-before-v4');
    jest.spyOn(backup!, 'run').mockRejectedValue(new Error('quota'));

    await expect(loaded.runMigrations()).resolves.toBeUndefined();

    expect(store[BACKUP_BEFORE_V4_KEY]).toBeUndefined();
    expect(store['styles-metadata']).toEqual({
      modifiedTime: storageFrom324['styles-metadata'],
    });
    expect(store.migration_errors).toEqual({ 'backup-before-v4': 'quota' });
  });

  it('clears recorded failures once every migration succeeds', async () => {
    const store = fakeStorage({
      ...storageFrom324,
      migration_errors: { 'backup-before-v4': 'quota' },
    });

    await load().runMigrations();

    expect(store.migration_errors).toBeUndefined();
  });

  it('runs once per start, however many callers wait on it', async () => {
    fakeStorage(storageFrom324);
    const loaded = load();

    await Promise.all([loaded.runMigrations(), loaded.runMigrations()]);

    expect(chrome.storage.local.get).toBeCalledWith(BACKUP_BEFORE_V4_KEY);
    expect(
      (chrome.storage.local.get as jest.Mock).mock.calls.filter(
        ([keys]) => keys === BACKUP_BEFORE_V4_KEY
      )
    ).toHaveLength(1);
  });
});

/**
 * Whether `current` is two minor releases past the first release that could
 * carry a migration for data stored up to `oldDataUntil`: the next minor, or
 * the next major's first release.
 */
const isDueForReview = (oldDataUntil: string, current: string): boolean => {
  const [oldMajor, oldMinor] = oldDataUntil.split('.').map(Number);
  const [major, minor] = current.split('.').map(Number);

  if (major > oldMajor + 1) {
    return true;
  }

  return major === oldMajor + 1 ? minor >= 2 : minor >= oldMinor + 3;
};

describe('migrations', () => {
  it.each(load().migrations.map(m => [m.name, m.oldDataUntil]))(
    '%s is still needed in this release',
    (name, oldDataUntil) => {
      if (isDueForReview(oldDataUntil, version)) {
        throw new Error(
          `${name} repairs data stored by ${oldDataUntil} and earlier. ` +
            `Remove it, with any keys it leaves behind, or raise oldDataUntil.`
        );
      }
    }
  );

  it.each([
    ['3.2.4', '4.0.0', false],
    ['3.2.4', '4.1.3', false],
    ['3.2.4', '4.2.0', true],
    ['3.2.4', '5.0.0', true],
    ['4.0.2', '4.2.0', false],
    ['4.0.2', '4.3.0', true],
  ])(
    'treats data until %s as due for review in %s: %s',
    (oldDataUntil, current, due) => {
      expect(isDueForReview(oldDataUntil, current)).toBe(due);
    }
  );
});
