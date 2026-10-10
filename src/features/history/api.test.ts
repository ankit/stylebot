import type { StyleStorage } from '@stylebot/types';

jest.mock('./store', () => ({
  ...jest.requireActual('./store'),
  getHistory: jest.fn().mockResolvedValue([]),
  removeNewestEntry: jest.fn().mockResolvedValue(null),
}));

import { restoreVersion, scanVersionHistory, undoRestore } from './api';
import { getHistory, removeNewestEntry } from './store';

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
    expect(scan).toEqual({ versions: [], hasMore: false, sites: [] });
  });

  it('writes nothing to the storage for a version that is not in the history', async () => {
    const storage = fakeStorage();

    expect(await restoreVersion(storage, 'missing')).toEqual({ ok: false });
    expect(storage.setAll).not.toHaveBeenCalled();
    expect(storage.applyStylesToAllTabs).not.toHaveBeenCalled();
  });

  it('restores a deleted site as it was just before the deletion', async () => {
    const style = {
      css: 'a { color: red; }',
      enabled: true,
      readability: false,
      modifiedTime: '2026-10-08T20:00:00.000Z',
    };

    (getHistory as jest.Mock).mockResolvedValueOnce([
      {
        id: 'added',
        modifiedTime: '2026-10-08T20:00:00.000Z',
        source: 'local',
        before: { 'old.reddit.com': null },
      },
      {
        id: 'elsewhere',
        modifiedTime: '2026-10-08T20:30:00.000Z',
        source: 'local',
        before: { 'other.com': null },
      },
      {
        id: 'deleted',
        modifiedTime: '2026-10-08T21:00:00.000Z',
        source: 'local',
        before: { 'old.reddit.com': style },
      },
    ]);

    const storage = fakeStorage();

    expect(
      await restoreVersion(storage, 'deleted', {
        urls: ['old.reddit.com'],
        before: true,
      })
    ).toMatchObject({ ok: true });
    expect(storage.setAll).toHaveBeenCalledWith(
      { 'old.reddit.com': style },
      expect.objectContaining({ restoredFrom: '2026-10-08T20:00:00.000Z' })
    );
  });

  describe('reading part of the history', () => {
    const style = (css: string) => ({
      css,
      enabled: true,
      readability: false,
      modifiedTime: '2026-10-09T12:00:00.000Z',
    });

    const entry = (id: string, hour: number, url: string) => ({
      id,
      modifiedTime: `2026-10-09T${String(hour).padStart(2, '0')}:00:00.000Z`,
      source: 'local' as const,
      before: { [url]: style(`${id} {}`) },
    });

    const history = [
      entry('1', 1, 'a.com'),
      entry('2', 2, 'b.com'),
      entry('3', 3, 'a.com'),
      entry('4', 4, 'c.com'),
    ];

    const scan = (options: { limit?: number; site?: string }) => {
      (getHistory as jest.Mock).mockResolvedValueOnce(history);
      const storage = fakeStorage();
      (storage.getAll as jest.Mock).mockResolvedValue({
        'a.com': style('a'),
        'b.com': style('b'),
        'c.com': style('c'),
      });

      return scanVersionHistory(storage, options);
    };

    it('stops at the limit and says more are kept', async () => {
      const { versions, hasMore } = await scan({ limit: 2 });

      expect(versions.map(({ id }) => id)).toEqual(['4', '3']);
      expect(hasMore).toBe(true);
    });

    it('reads only the versions that touched a site', async () => {
      const { versions, hasMore } = await scan({ limit: 2, site: 'a.com' });

      expect(versions.map(({ id }) => id)).toEqual(['3', '1']);
      expect(hasMore).toBe(false);
    });

    it('lists every site by its last edit, past the limit', async () => {
      const { sites } = await scan({ limit: 1 });

      expect(sites).toEqual([
        { url: 'c.com', modifiedTime: '2026-10-09T04:00:00.000Z' },
        { url: 'a.com', modifiedTime: '2026-10-09T03:00:00.000Z' },
        { url: 'b.com', modifiedTime: '2026-10-09T02:00:00.000Z' },
      ]);
    });
  });

  it('leaves out a version that changed no css', async () => {
    const style = (css: string, enabled = true) => ({
      css,
      enabled,
      readability: false,
      modifiedTime: '2026-10-09T12:00:00.000Z',
    });

    (getHistory as jest.Mock).mockResolvedValueOnce([
      {
        id: 'edit',
        modifiedTime: '2026-10-09T10:00:00.000Z',
        source: 'local',
        before: { 'a.com': style('a {}') },
      },
      {
        id: 'toggle',
        modifiedTime: '2026-10-09T11:00:00.000Z',
        source: 'local',
        before: { 'a.com': style('b {}', false) },
      },
    ]);

    const storage = fakeStorage();
    (storage.getAll as jest.Mock).mockResolvedValue({ 'a.com': style('b {}') });

    const { versions } = await scanVersionHistory(storage);

    expect(versions.map(({ id }) => id)).toEqual(['edit']);
  });

  describe('undoing a restore', () => {
    const style = (css: string) => ({
      css,
      enabled: true,
      readability: false,
      modifiedTime: '2026-10-09T12:00:00.000Z',
    });

    const restore = {
      id: 'restore',
      modifiedTime: '2026-10-09T12:00:00.000Z',
      source: 'local' as const,
      before: { 'a.com': style('before {}') },
      restoredFrom: '2026-10-09T10:00:00.000Z',
    };

    it('puts the styles back without recording it, and drops the entry', async () => {
      (getHistory as jest.Mock).mockResolvedValueOnce([restore]);
      (removeNewestEntry as jest.Mock).mockResolvedValueOnce(restore);
      const storage = fakeStorage();
      (storage.getAll as jest.Mock).mockResolvedValue({
        'a.com': style('restored {}'),
      });

      expect(await undoRestore(storage, 'restore')).toBe(true);
      expect(removeNewestEntry).toHaveBeenCalledWith('restore');
      expect(storage.setAll).toHaveBeenCalledWith(
        { 'a.com': style('before {}') },
        { skipHistory: true }
      );
    });

    it('restores to before it once something has changed since', async () => {
      (removeNewestEntry as jest.Mock).mockClear();
      const history = [restore, { ...restore, id: 'later', before: {} }];
      (getHistory as jest.Mock)
        .mockResolvedValueOnce(history)
        .mockResolvedValueOnce(history);
      const storage = fakeStorage();
      (storage.getAll as jest.Mock).mockResolvedValue({
        'a.com': style('restored {}'),
      });

      expect(await undoRestore(storage, 'restore')).toBe(true);
      expect(removeNewestEntry).not.toHaveBeenCalled();
      expect(storage.setAll).toHaveBeenCalledWith(
        { 'a.com': style('before {}') },
        expect.objectContaining({ restoredFrom: restore.modifiedTime })
      );
    });
  });

  it('restores a site with one profile whole, without adding profiles', async () => {
    const style = (css: string) => ({
      css,
      enabled: true,
      readability: false,
      modifiedTime: '2026-10-09T12:00:00.000Z',
    });

    (getHistory as jest.Mock).mockResolvedValueOnce([
      {
        id: 'old',
        modifiedTime: '2026-10-09T10:00:00.000Z',
        source: 'local',
        before: { 'a.com': null },
      },
      {
        id: 'new',
        modifiedTime: '2026-10-09T11:00:00.000Z',
        source: 'local',
        before: { 'a.com': style('a {}') },
      },
    ]);

    const storage = fakeStorage();
    (storage.getAll as jest.Mock).mockResolvedValue({ 'a.com': style('b {}') });

    await restoreVersion(storage, 'old', {
      urls: ['a.com'],
      profileId: 'default',
    });

    expect(storage.setAll).toHaveBeenCalledWith(
      { 'a.com': style('a {}') },
      expect.anything()
    );
  });

  describe('whether each change still matches now', () => {
    const withProfiles = (
      active: string,
      sheets: Record<string, { name: string; css: string }>
    ) => ({
      css: sheets[active].css,
      enabled: true,
      readability: false,
      modifiedTime: '2026-10-09T12:00:00.000Z',
      activeProfile: active,
      profiles: Object.fromEntries(
        Object.entries(sheets).map(([id, { name, css }]) => [
          id,
          id === active ? { name } : { name, css },
        ])
      ),
    });

    const scan = async (
      history: Array<object>,
      current: Record<string, ReturnType<typeof withProfiles>>
    ) => {
      (getHistory as jest.Mock).mockResolvedValueOnce(history);
      const storage = fakeStorage();
      (storage.getAll as jest.Mock).mockResolvedValue(current);

      const { versions } = await scanVersionHistory(storage);
      return Object.fromEntries(
        versions.map(({ id, css }) => [id, css['a.com']])
      );
    };

    const dark = { name: 'Dark', css: 'dark {}' };
    const light = { name: 'Light', css: 'light {}' };

    it('keeps one profile matching while another is edited', async () => {
      const css = await scan(
        [
          {
            id: 'dark',
            modifiedTime: '2026-10-09T10:00:00.000Z',
            source: 'local',
            before: {
              'a.com': withProfiles('dark', {
                dark: { ...dark, css: 'old {}' },
                light,
              }),
            },
          },
          {
            id: 'light',
            modifiedTime: '2026-10-09T11:00:00.000Z',
            source: 'local',
            before: { 'a.com': withProfiles('light', { dark, light }) },
          },
        ],
        {
          'a.com': withProfiles('light', {
            dark,
            light: { ...light, css: 'new {}' },
          }),
        }
      );

      expect(css.dark).toMatchObject({
        profile: { id: 'dark' },
        before: 'old {}',
        after: 'dark {}',
        matchesNow: true,
      });
      expect(css.light).toMatchObject({ after: 'new {}', matchesNow: true });
    });

    it('reads a deleted profile as matching while it stays deleted', async () => {
      const css = await scan(
        [
          {
            id: 'deleted',
            modifiedTime: '2026-10-09T10:00:00.000Z',
            source: 'local',
            before: { 'a.com': withProfiles('dark', { dark, light }) },
          },
        ],
        { 'a.com': withProfiles('light', { light }) }
      );

      expect(css.deleted).toMatchObject({
        profile: { id: 'dark', name: 'Dark' },
        profileAction: { kind: 'deleted', id: 'dark' },
        before: 'dark {}',
        after: null,
        matchesNow: true,
      });
    });
  });

  it('removes a profile when restoring to before it existed', async () => {
    const withProfiles = (active: string, ids: Array<string>) => ({
      css: `${active} {}`,
      enabled: true,
      readability: false,
      modifiedTime: '2026-10-09T12:00:00.000Z',
      activeProfile: active,
      profiles: Object.fromEntries(
        ids.map(id => [
          id,
          id === active ? { name: id } : { name: id, css: `${id} {}` },
        ])
      ),
    });

    (getHistory as jest.Mock).mockResolvedValueOnce([
      {
        id: 'added',
        modifiedTime: '2026-10-09T10:00:00.000Z',
        source: 'local',
        before: { 'a.com': withProfiles('light', ['light']) },
      },
    ]);

    const storage = fakeStorage();
    (storage.getAll as jest.Mock).mockResolvedValue({
      'a.com': withProfiles('dark', ['light', 'dark']),
    });

    await restoreVersion(storage, 'added', {
      urls: ['a.com'],
      before: true,
      profileId: 'dark',
    });

    const [[restored]] = (storage.setAll as jest.Mock).mock.calls;
    expect(Object.keys(restored['a.com'].profiles)).toEqual(['light']);
  });
});
