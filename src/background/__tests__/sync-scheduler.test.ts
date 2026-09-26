import {
  isSyncAlarm,
  updatePeriodicSync,
  scheduleSyncAfterEdit,
} from '../sync-scheduler';
import { SYNC_PERIOD_MINUTES } from '@stylebot/sync';

let store: Record<string, unknown>;

beforeEach(() => {
  store = {};

  global.chrome = {
    storage: {
      local: {
        get: jest.fn(async (key: string) => ({ [key]: store[key] })),
      },
    },
    alarms: {
      get: jest.fn(async () => undefined),
      create: jest.fn(),
      clear: jest.fn(),
    },
  } as unknown as typeof chrome;
});

describe('updatePeriodicSync', () => {
  it('creates the periodic alarm when sync is enabled', async () => {
    store['google-drive-sync-enabled'] = true;

    await updatePeriodicSync();

    expect(chrome.alarms.create).toBeCalledWith('google-drive-sync', {
      periodInMinutes: SYNC_PERIOD_MINUTES,
    });
    expect(chrome.alarms.clear).not.toBeCalled();
  });

  it('leaves an existing periodic alarm alone so a worker restart does not reset it', async () => {
    store['google-drive-sync-enabled'] = true;
    (chrome.alarms.get as jest.Mock).mockResolvedValue({
      name: 'google-drive-sync',
      scheduledTime: 1,
    });

    await updatePeriodicSync();

    expect(chrome.alarms.create).not.toBeCalled();
  });

  it('clears every sync alarm when sync is disabled', async () => {
    await updatePeriodicSync();

    expect(chrome.alarms.create).not.toBeCalled();
    expect(chrome.alarms.clear).toBeCalledWith('google-drive-sync');
    expect(chrome.alarms.clear).toBeCalledWith('google-drive-sync-after-edit');
  });
});

describe('scheduleSyncAfterEdit', () => {
  it('pushes a one-shot alarm out with every edit', async () => {
    store['google-drive-sync-enabled'] = true;
    jest.spyOn(Date, 'now').mockReturnValue(1_000_000);

    await scheduleSyncAfterEdit();
    await scheduleSyncAfterEdit();

    expect(chrome.alarms.create).toBeCalledTimes(2);
    expect(chrome.alarms.create).toBeCalledWith(
      'google-drive-sync-after-edit',
      { when: 1_030_000 }
    );
  });

  it('does nothing when sync is disabled', async () => {
    await scheduleSyncAfterEdit();

    expect(chrome.alarms.create).not.toBeCalled();
  });
});

describe('isSyncAlarm', () => {
  it('recognises both sync alarms and nothing else', () => {
    expect(isSyncAlarm('google-drive-sync')).toBe(true);
    expect(isSyncAlarm('google-drive-sync-after-edit')).toBe(true);
    expect(isSyncAlarm('something-else')).toBe(false);
  });
});
