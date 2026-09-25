import { diffStyles, getVersionPreview } from '../diff';

const style = (css: string, overrides: Record<string, unknown> = {}) => ({
  css,
  enabled: true,
  readability: false,
  modifiedTime: '2026-09-01T10:00:00.000Z',
  ...overrides,
});

describe('getVersionPreview', () => {
  it('counts the styles the version holds, not the live ones', () => {
    const preview = getVersionPreview(
      { 'a.com': style('a {}'), 'b.com': style('b {}') },
      { 'a.com': style('a {}') }
    );

    expect(preview.styleCount).toBe(1);
  });

  it('lists what the version brings back, which is what you have lost', () => {
    const preview = getVersionPreview(
      { 'a.com': style('a {}') },
      { 'a.com': style('a {}'), 'gone.com': style('g {}') }
    );

    expect(preview.addedUrls).toEqual(['gone.com']);
    expect(preview.removedUrls).toEqual([]);
  });

  it('lists what it would take away, which is what only you have', () => {
    const preview = getVersionPreview(
      { 'a.com': style('a {}'), 'new.com': style('n {}') },
      { 'a.com': style('a {}') }
    );

    expect(preview.removedUrls).toEqual(['new.com']);
    expect(preview.addedUrls).toEqual([]);
  });

  it('reports both directions at once', () => {
    const preview = getVersionPreview(
      { 'kept.com': style('k {}'), 'mine.com': style('m {}') },
      { 'kept.com': style('k {}'), 'theirs.com': style('t {}') }
    );

    expect(preview.addedUrls).toEqual(['theirs.com']);
    expect(preview.removedUrls).toEqual(['mine.com']);
  });

  it('lists a style present on both sides whose css differs', () => {
    const preview = getVersionPreview(
      { 'a.com': style('a { color: red; }') },
      { 'a.com': style('a { color: blue; }') }
    );

    expect(preview.changedUrls).toEqual(['a.com']);
    expect(preview.addedUrls).toEqual([]);
    expect(preview.removedUrls).toEqual([]);
  });

  it('does not count a style that only differs in whitespace', () => {
    const preview = getVersionPreview(
      { 'a.com': style('a {\n  color: red;\n}') },
      { 'a.com': style('a { color: red; }') }
    );

    expect(preview.changedUrls).toEqual([]);
  });

  it('never lists a url in more than one group', () => {
    const preview = getVersionPreview(
      { 'both.com': style('b { color: red; }'), 'mine.com': style('m {}') },
      { 'both.com': style('b { color: blue; }'), 'theirs.com': style('t {}') }
    );

    expect(preview.addedUrls).toEqual(['theirs.com']);
    expect(preview.changedUrls).toEqual(['both.com']);
    expect(preview.removedUrls).toEqual(['mine.com']);
  });

  it('lists a style that only differs by being switched off', () => {
    const preview = getVersionPreview(
      { 'a.com': style('a {}') },
      { 'a.com': style('a {}', { enabled: false }) }
    );

    expect(preview.changedUrls).toEqual(['a.com']);
  });

  it('sorts both lists', () => {
    const preview = getVersionPreview(
      { 'z.com': style('z {}'), 'a.com': style('a {}') },
      { 'y.com': style('y {}'), 'b.com': style('b {}') }
    );

    expect(preview.addedUrls).toEqual(['b.com', 'y.com']);
    expect(preview.removedUrls).toEqual(['a.com', 'z.com']);
  });
});

describe('diffStyles', () => {
  it('reads forwards: what the later map gained, changed and lost', () => {
    const change = diffStyles(
      { 'gone.com': style('g {}'), 'kept.com': style('k { color: red; }') },
      { 'kept.com': style('k { color: blue; }'), 'new.com': style('n {}') }
    );

    expect(change).toEqual({
      addedUrls: ['new.com'],
      changedUrls: ['kept.com'],
      removedUrls: ['gone.com'],
    });
  });

  it('ignores when a style was last written, which every sync rewrites', () => {
    const change = diffStyles(
      { 'a.com': style('a {}', { modifiedTime: '2026-09-01T10:00:00.000Z' }) },
      { 'a.com': style('a {}', { modifiedTime: '2026-09-02T11:00:00.000Z' }) }
    );

    expect(change.changedUrls).toEqual([]);
  });

  it('counts a readability switch as a change', () => {
    const change = diffStyles(
      { 'a.com': style('a {}') },
      { 'a.com': style('a {}', { readability: true }) }
    );

    expect(change.changedUrls).toEqual(['a.com']);
  });

  it('reports nothing for a save that changed nothing', () => {
    const styles = { 'a.com': style('a {}') };

    expect(diffStyles(styles, styles)).toEqual({
      addedUrls: [],
      changedUrls: [],
      removedUrls: [],
    });
  });
});
