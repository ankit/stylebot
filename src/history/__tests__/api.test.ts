import type { StyleStorage } from '@stylebot/types';

jest.mock('../store', () => ({
  ...jest.requireActual('../store'),
  getHistory: jest.fn().mockResolvedValue([]),
}));

import { restoreVersion, scanVersionHistory } from '../api';

const fakeStorage = (): StyleStorage => ({
  getAll: jest.fn().mockResolvedValue({}),
  setAll: jest.fn().mockResolvedValue(undefined),
  setAllIfUnchanged: jest.fn().mockResolvedValue(null),
  applyStylesToAllTabs: jest.fn().mockResolvedValue(undefined),
});

describe('history api', () => {
  it('scans the history against the styles the storage holds now', async () => {
    const storage = fakeStorage();

    const scan = await scanVersionHistory(storage);

    expect(storage.getAll).toHaveBeenCalled();
    expect(scan).toEqual({ versions: [], previews: {}, changes: {}, total: 0 });
  });

  it('writes nothing to the storage for a version that is not in the history', async () => {
    const storage = fakeStorage();

    expect(await restoreVersion(storage, 'missing')).toBe(false);
    expect(storage.setAll).not.toHaveBeenCalled();
    expect(storage.applyStylesToAllTabs).not.toHaveBeenCalled();
  });
});
