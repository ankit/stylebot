jest.mock('./default-shortcut-update', () => jest.fn(async () => undefined));
jest.mock('./commands-to-browser', () => jest.fn(async () => undefined));
jest.mock('./styles-metadata-update', () => jest.fn(async () => undefined));
jest.mock('./styles-modified-time-update', () =>
  jest.fn(async () => undefined)
);
jest.mock('./sync-storage-update', () => jest.fn(async () => undefined));
jest.mock('./chat-removal', () => jest.fn(async () => undefined));

import { MIGRATION_ERRORS_KEY, completionKey } from './index';

/**
 * A fresh copy of the module and its migrations, since runMigrations runs
 * once per load.
 */
const load = (): typeof import('./index') => {
  let loaded: typeof import('./index') | undefined;

  jest.isolateModules(() => {
    loaded = require('./index');
  });

  return loaded as typeof import('./index');
};

const runOf = (
  { migrations }: typeof import('./index'),
  name: string
): jest.Mock =>
  jest.mocked(migrations.find(migration => migration.name === name)!.run);

let stored: Record<string, unknown>;
const get = jest.fn(async (keys: Array<string>) =>
  Object.fromEntries(
    keys.filter(key => key in stored).map(key => [key, stored[key]])
  )
);
const set = jest.fn(async (_items: Record<string, unknown>) => undefined);
const remove = jest.fn(async () => undefined);

describe('runMigrations', () => {
  beforeEach(() => {
    stored = {};
    global.chrome = {
      storage: { local: { get, set, remove } },
    } as unknown as typeof chrome;
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('runs every migration in order', async () => {
    const { migrations, runMigrations } = load();
    const order: Array<string> = [];
    migrations.forEach(migration => {
      jest.mocked(migration.run).mockImplementationOnce(async () => {
        order.push(migration.name);
      });
    });

    await runMigrations();

    expect(order).toEqual(migrations.map(migration => migration.name));
  });

  it('runs the rest when one fails, and records the failure', async () => {
    const loaded = load();
    runOf(loaded, 'styles-metadata-update').mockRejectedValueOnce(
      new Error('quota')
    );

    await expect(loaded.runMigrations()).resolves.toBeUndefined();

    loaded.migrations.forEach(migration => expect(migration.run).toBeCalled());
    expect(set).toBeCalledWith({
      [MIGRATION_ERRORS_KEY]: { 'styles-metadata-update': 'quota' },
    });
  });

  it('clears recorded failures once every migration succeeds', async () => {
    await load().runMigrations();

    expect(remove).toBeCalledWith(MIGRATION_ERRORS_KEY);
    expect(set).not.toBeCalledWith(
      expect.objectContaining({ [MIGRATION_ERRORS_KEY]: expect.anything() })
    );
  });

  it('records each migration that succeeds, except those run every start', async () => {
    const loaded = load();
    runOf(loaded, 'chat-removal').mockRejectedValueOnce(new Error('quota'));

    await loaded.runMigrations();

    expect(set).toBeCalledWith({
      [completionKey('default-shortcut-update')]: true,
      [completionKey('commands-to-browser')]: true,
      [completionKey('sync-storage-update')]: true,
    });
  });

  it('skips a migration once it is done, but not one run every start', async () => {
    stored[completionKey('chat-removal')] = true;
    stored[completionKey('styles-metadata-update')] = true;
    const loaded = load();

    await loaded.runMigrations();

    expect(runOf(loaded, 'chat-removal')).not.toBeCalled();
    expect(runOf(loaded, 'styles-metadata-update')).toBeCalled();
    expect(runOf(loaded, 'commands-to-browser')).toBeCalled();
  });

  it('runs them all when the completed ones cannot be read', async () => {
    get.mockRejectedValueOnce(new Error('quota'));
    const { migrations, runMigrations } = load();

    await expect(runMigrations()).resolves.toBeUndefined();

    migrations.forEach(migration => expect(migration.run).toBeCalled());
  });

  it('resolves even when the failures cannot be recorded', async () => {
    const loaded = load();
    runOf(loaded, 'styles-metadata-update').mockRejectedValueOnce(
      new Error('quota')
    );
    set.mockRejectedValueOnce(new Error('quota'));

    await expect(loaded.runMigrations()).resolves.toBeUndefined();
  });

  it('runs once per start, however many callers wait on it', async () => {
    const { migrations, runMigrations } = load();

    await Promise.all([runMigrations(), runMigrations()]);
    await runMigrations();

    migrations.forEach(migration => expect(migration.run).toBeCalledTimes(1));
  });
});
