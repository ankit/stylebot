import type { StyleMap } from '@stylebot/types';

import {
  getHistory,
  getStylesAtEachVersion,
  recordStyleChange,
  getStylesBeforeChange,
  removeNewestEntry,
} from './store';

const style = (css: string, overrides: Record<string, unknown> = {}) => ({
  css,
  enabled: true,
  readability: false,
  modifiedTime: '2026-09-01T10:00:00.000Z',
  ...overrides,
});

const map = (styles: Record<string, ReturnType<typeof style>>): StyleMap =>
  styles;

const edit = (previous: StyleMap, next: StyleMap) =>
  recordStyleChange(previous, next, { fromSync: false });

describe('style history', () => {
  let store: Record<string, unknown>;

  beforeEach(async () => {
    store = {};

    global.chrome = {
      storage: {
        local: {
          // Deep-cloned on the way out, as real storage hands back a copy.
          get: jest.fn(async (keys: string | Array<string>) => {
            const items: Record<string, unknown> = {};

            (Array.isArray(keys) ? keys : [keys]).forEach(key => {
              items[key] =
                store[key] === undefined
                  ? undefined
                  : JSON.parse(JSON.stringify(store[key]));
            });

            return items;
          }),
          set: jest.fn(async (items: Record<string, unknown>) => {
            Object.assign(store, items);
          }),
          remove: jest.fn(async (keys: string | Array<string>) => {
            (Array.isArray(keys) ? keys : [keys]).forEach(key => {
              delete store[key];
            });
          }),
        },
      },
    } as unknown as typeof chrome;

    jest.restoreAllMocks();
  });

  it('records only the styles a write touched', async () => {
    await edit(
      map({ 'a.com': style('a {}'), 'b.com': style('b {}') }),
      map({ 'a.com': style('a { color: red; }'), 'b.com': style('b {}') })
    );

    const entries = await getHistory();

    expect(Object.keys(entries[0].before)).toEqual(['a.com']);
    expect(entries[0].before['a.com']?.css).toBe('a {}');
  });

  it('records a style that did not exist as nothing', async () => {
    await edit(map({}), map({ 'new.com': style('n {}') }));

    expect((await getHistory())[0].before).toEqual({ 'new.com': null });
  });

  it('ignores a write that changed nothing but the time', async () => {
    await edit(
      map({ 'a.com': style('a {}') }),
      map({ 'a.com': style('a {}', { modifiedTime: '2026-09-02T10:00:00Z' }) })
    );

    expect(await getHistory()).toEqual([]);
  });

  it('counts switching a style off as a change', async () => {
    await edit(
      map({ 'a.com': style('a {}') }),
      map({ 'a.com': style('a {}', { enabled: false }) })
    );

    expect(await getHistory()).toHaveLength(1);
  });

  it('does not count switching which profile is active as a change', async () => {
    const profiles = {
      default: { name: '' },
      dark: { name: 'Dark', css: 'b {}' },
    };
    const switched = {
      default: { name: '', css: 'a {}' },
      dark: { name: 'Dark' },
    };

    await edit(
      map({
        'a.com': style('a {}', { activeProfile: 'default', profiles }),
      }),
      map({
        'a.com': style('b {}', { activeProfile: 'dark', profiles: switched }),
      })
    );

    expect(await getHistory()).toEqual([]);
  });

  it('drops the newest entry and starts the next edit afresh', async () => {
    await edit(map({ 'a.com': style('a {}') }), map({ 'a.com': style('a1') }));
    const [entry] = await getHistory();

    expect(await removeNewestEntry('elsewhere')).toBeNull();
    expect(await removeNewestEntry(entry.id)).toEqual(entry);
    expect(await getHistory()).toEqual([]);

    await edit(map({ 'a.com': style('a1') }), map({ 'a.com': style('a2') }));
    expect(await getHistory()).toHaveLength(1);
  });

  describe('coalescing', () => {
    it('starts afresh after switching profiles', async () => {
      const inProfile = (active: string, dark: string, light: string) =>
        style(active === 'dark' ? dark : light, {
          activeProfile: active,
          profiles: {
            dark: { name: 'Dark', ...(active === 'dark' ? {} : { css: dark }) },
            light: {
              name: 'Light',
              ...(active === 'light' ? {} : { css: light }),
            },
          },
        });

      await edit(
        map({ 'a.com': inProfile('dark', 'd {}', 'l {}') }),
        map({ 'a.com': inProfile('dark', 'd1', 'l {}') })
      );
      await edit(
        map({ 'a.com': inProfile('dark', 'd1', 'l {}') }),
        map({ 'a.com': inProfile('light', 'd1', 'l {}') })
      );
      await edit(
        map({ 'a.com': inProfile('light', 'd1', 'l {}') }),
        map({ 'a.com': inProfile('light', 'd1', 'l1') })
      );

      expect(await getHistory()).toHaveLength(2);
    });

    it('keeps renaming a profile apart from the edits around it', async () => {
      const named = (name: string, css: string) =>
        style(css, {
          activeProfile: 'default',
          profiles: { default: { name: '' }, dark: { name, css: 'b {}' } },
        });

      await edit(
        map({ 'a.com': named('Night', 'a {}') }),
        map({ 'a.com': named('Night', 'a1') })
      );
      await edit(
        map({ 'a.com': named('Night', 'a1') }),
        map({ 'a.com': named('Dark', 'a1') })
      );
      await edit(
        map({ 'a.com': named('Dark', 'a1') }),
        map({ 'a.com': named('Dark', 'a2') })
      );

      expect(await getHistory()).toHaveLength(3);
    });

    it('folds a run of writes to the same style into one entry', async () => {
      await edit(
        map({ 'a.com': style('a {}') }),
        map({ 'a.com': style('a1') })
      );
      await edit(map({ 'a.com': style('a1') }), map({ 'a.com': style('a2') }));
      await edit(map({ 'a.com': style('a2') }), map({ 'a.com': style('a3') }));

      const entries = await getHistory();

      expect(entries).toHaveLength(1);
      expect(entries[0].before['a.com']?.css).toBe('a {}');
    });

    it('starts a new entry for a different style', async () => {
      await edit(
        map({ 'a.com': style('a {}') }),
        map({ 'a.com': style('a1') })
      );
      await edit(map({ 'a.com': style('a1') }), map({ 'b.com': style('b1') }));

      expect(await getHistory()).toHaveLength(2);
    });

    it('starts a new entry once the run has gone quiet', async () => {
      await edit(
        map({ 'a.com': style('a {}') }),
        map({ 'a.com': style('a1') })
      );

      const sixMinutes = 6 * 60 * 1000;
      const now = Date.now();
      jest.spyOn(Date, 'now').mockReturnValue(now + sixMinutes);

      await edit(map({ 'a.com': style('a1') }), map({ 'a.com': style('a2') }));

      expect(await getHistory()).toHaveLength(2);
    });

    it('keeps a local edit and a sync apart', async () => {
      await edit(
        map({ 'a.com': style('a {}') }),
        map({ 'a.com': style('a1') })
      );
      await recordStyleChange(
        map({ 'a.com': style('a1') }),
        map({ 'a.com': style('a2') }),
        { fromSync: true }
      );

      const entries = await getHistory();

      expect(entries).toHaveLength(2);
      expect(entries.map(entry => entry.source)).toEqual(['local', 'sync']);
    });
  });

  describe('a version of its own', () => {
    const edit = (previous: StyleMap, next: StyleMap) =>
      recordStyleChange(previous, next, { fromSync: false });

    it('records a restore that lands inside an editing session', async () => {
      const before = map({ 'a.com': style('a {}') });
      const edited = map({ 'a.com': style('a1') });

      await edit(before, edited);
      await recordStyleChange(edited, before, {
        fromSync: false,
        restoredFrom: '2026-09-24T10:00:00.000Z',
      });

      const entries = await getHistory();

      expect(entries).toHaveLength(2);
      expect(entries[1].before['a.com']?.css).toBe('a1');
      expect(entries[1].restoredFrom).toBe('2026-09-24T10:00:00.000Z');
    });

    it('leaves no session behind, so the next edit is its own entry too', async () => {
      const before = map({ 'a.com': style('a {}') });
      const edited = map({ 'a.com': style('a1') });

      await edit(before, edited);
      await recordStyleChange(edited, before, {
        fromSync: false,
        restoredFrom: '2026-09-24T10:00:00.000Z',
      });
      await edit(before, map({ 'a.com': style('a2') }));

      expect(await getHistory()).toHaveLength(3);
    });
  });

  describe('getStylesAtEachVersion', () => {
    it('gives the styles as they were at each entry, newest first', async () => {
      await edit(map({}), map({ 'a.com': style('a1') }));
      const current = map({ 'a.com': style('a1'), 'b.com': style('b1') });
      await recordStyleChange(map({ 'a.com': style('a1') }), current, {
        fromSync: true,
      });

      const states = getStylesAtEachVersion(current, await getHistory());

      expect(Object.keys(states[0].styles)).toEqual(['a.com', 'b.com']);
      expect(Object.keys(states[1].styles)).toEqual(['a.com']);
    });

    it('reaches the state from before the oldest entry by rolling it back', async () => {
      const before = map({ 'gone.com': style('g {}') });
      const current = map({ 'kept.com': style('k {}') });
      await edit(before, current);

      const states = getStylesAtEachVersion(current, await getHistory());
      const oldest = states[states.length - 1];

      expect(getStylesBeforeChange(oldest.styles, oldest.entry)).toEqual(
        before
      );
    });

    it('has nothing to say with no history', () => {
      expect(
        getStylesAtEachVersion(map({ 'a.com': style('a {}') }), [])
      ).toEqual([]);
    });
  });
});
