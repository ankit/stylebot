jest.mock('./default-shortcut-update', () => jest.fn(async () => undefined));
jest.mock('./commands-to-browser', () => jest.fn(async () => undefined));
jest.mock('./styles-metadata-update', () => jest.fn(async () => undefined));
jest.mock('./styles-modified-time-update', () =>
  jest.fn(async () => undefined)
);
jest.mock('./sync-storage-update', () => jest.fn(async () => undefined));

import { MIGRATION_ERRORS_KEY } from './index';

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

const set = jest.fn(async () => undefined);
const remove = jest.fn(async () => undefined);

describe('runMigrations', () => {
  beforeEach(() => {
    global.chrome = {
      storage: { local: { set, remove } },
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
    expect(set).not.toBeCalled();
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
