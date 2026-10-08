jest.mock('./default-shortcut-update', () => jest.fn(async () => undefined));
jest.mock('./commands-to-browser', () => jest.fn(async () => undefined));
jest.mock('./styles-metadata-update', () => jest.fn(async () => undefined));
jest.mock('./styles-modified-time-update', () =>
  jest.fn(async () => undefined)
);
jest.mock('./sync-storage-update', () => jest.fn(async () => undefined));

import StylesMetadataUpdate from './styles-metadata-update';
import { MIGRATION_ERRORS_KEY, migrations, runMigrations } from './index';

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
    jest.mocked(StylesMetadataUpdate).mockRejectedValueOnce(new Error('quota'));

    await expect(runMigrations()).resolves.toBeUndefined();

    migrations.forEach(migration => expect(migration.run).toBeCalled());
    expect(set).toBeCalledWith({
      [MIGRATION_ERRORS_KEY]: { 'styles-metadata-update': 'quota' },
    });
  });

  it('clears recorded failures once every migration succeeds', async () => {
    await runMigrations();

    expect(remove).toBeCalledWith(MIGRATION_ERRORS_KEY);
    expect(set).not.toBeCalled();
  });

  it('resolves even when the failures cannot be recorded', async () => {
    jest.mocked(StylesMetadataUpdate).mockRejectedValueOnce(new Error('quota'));
    set.mockRejectedValueOnce(new Error('quota'));

    await expect(runMigrations()).resolves.toBeUndefined();
  });
});
