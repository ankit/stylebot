import type { StyleWithoutUrl } from '@stylebot/types';

import {
  activateProfile,
  addProfile,
  expandProfiles,
  hasAnyCss,
  listProfiles,
  normalizeProfiles,
  removeProfile,
  renameProfile,
  setProfileCss,
} from './profiles';
import { isStyleMap, sanitizeStyleMap } from './style-map';
import { getStylesForPage } from './page';

const style = (rest: Partial<StyleWithoutUrl> = {}): StyleWithoutUrl => ({
  css: 'a { color: red; }',
  enabled: true,
  readability: false,
  modifiedTime: '2024-01-01T00:00:00.000Z',
  ...rest,
});

const withTwo = () =>
  addProfile(style(), {
    id: 'dark',
    name: 'Dark',
    css: 'a { color: white; }',
    activate: false,
  });

describe('profiles', () => {
  it('reads a style without profiles as one unnamed default profile', () => {
    expect(listProfiles(style())).toEqual([
      { id: 'default', name: '', active: true },
    ]);
  });

  it('turns the existing css into the default profile when adding one', () => {
    expect(withTwo()).toMatchObject({
      css: 'a { color: red; }',
      activeProfile: 'default',
      profiles: {
        default: { name: '' },
        dark: { name: 'Dark', css: 'a { color: white; }' },
      },
    });
  });

  it('swaps css in and out when switching profiles', () => {
    const switched = activateProfile(withTwo(), 'dark');

    expect(switched.css).toBe('a { color: white; }');
    expect(switched.activeProfile).toBe('dark');
    expect(switched.profiles).toEqual({
      default: { name: '', css: 'a { color: red; }' },
      dark: { name: 'Dark' },
    });
  });

  it('round-trips through expand after a switch', () => {
    const { sheets } = expandProfiles(activateProfile(withTwo(), 'dark'));

    expect(sheets.default.css).toBe('a { color: red; }');
    expect(sheets.dark.css).toBe('a { color: white; }');
  });

  it('writes an inactive profile without touching the applied css', () => {
    const edited = setProfileCss(withTwo(), 'dark', 'a { color: gray; }');

    expect(edited.css).toBe('a { color: red; }');
    expect(edited.profiles?.dark.css).toBe('a { color: gray; }');
  });

  it('writes the active profile into the style css', () => {
    expect(setProfileCss(withTwo(), 'default', 'b {}').css).toBe('b {}');
  });

  it('never removes the last profile', () => {
    const single = style();

    expect(removeProfile(single, 'default')).toBe(single);
  });

  it('activates the next profile when the active one is removed', () => {
    const removed = removeProfile(withTwo(), 'default');

    expect(removed.css).toBe('a { color: white; }');
    expect(removed.activeProfile).toBe('dark');
    expect(removed.profiles).toEqual({ dark: { name: 'Dark' } });
  });

  it('renames a profile', () => {
    expect(renameProfile(withTwo(), 'dark', 'Night').profiles?.dark.name).toBe(
      'Night'
    );
  });

  it('counts inactive css as css', () => {
    const blankActive = setProfileCss(withTwo(), 'default', '');

    expect(hasAnyCss(blankActive)).toBe(true);
    expect(hasAnyCss(style({ css: '' }))).toBe(false);
  });
});

describe('getStylesForPage', () => {
  it('lists a style whose active profile is blank but another is not', () => {
    const blankActive = activateProfile(
      addProfile(style(), { id: 'b', name: 'B', css: '', activate: false }),
      'b'
    );

    expect(
      getStylesForPage('https://a.com/', { 'a.com': blankActive }).styles
    ).toHaveLength(1);
  });
});

describe('normalizeProfiles', () => {
  it('leaves a well-formed style as it is', () => {
    const two = withTwo();

    expect(normalizeProfiles(two)).toEqual(two);
  });

  it('drops profiles that are not objects with a name', () => {
    const broken = style({
      profiles: { a: { name: 'A' }, b: 5 as never },
      activeProfile: 'a',
    });

    expect(normalizeProfiles(broken).profiles).toEqual({ a: { name: 'A' } });
  });

  it('picks the profile without css when the active id is unknown', () => {
    const broken = style({
      profiles: { a: { name: 'A', css: 'x {}' }, b: { name: 'B' } },
      activeProfile: 'missing',
    });

    expect(normalizeProfiles(broken).activeProfile).toBe('b');
  });

  it('drops an active id with no profiles', () => {
    const normalized = normalizeProfiles(style({ activeProfile: 'a' }));

    expect(normalized).not.toHaveProperty('activeProfile');
    expect(normalized).not.toHaveProperty('profiles');
  });
});

describe('isStyleMap', () => {
  it('accepts a map of styles and rejects anything else', () => {
    expect(isStyleMap({ 'a.com': style() })).toBe(true);
    expect(isStyleMap([style()])).toBe(false);
    expect(isStyleMap({ 'a.com': { enabled: true } })).toBe(false);
  });

  it('repairs profiles when sanitizing', () => {
    const map = sanitizeStyleMap({ 'a.com': style({ activeProfile: 'x' }) });

    expect(map['a.com']).not.toHaveProperty('activeProfile');
  });
});

describe('profile order', () => {
  it('lists the default profile first, then by name, whatever the stored order', () => {
    const stored = style({
      profiles: {
        zeta: { name: 'Night', css: '' },
        default: { name: '' },
        alpha: { name: 'Print', css: '' },
        beta: { name: 'Dark', css: '' },
      },
      activeProfile: 'default',
    });

    expect(listProfiles(stored).map(profile => profile.name)).toEqual([
      '',
      'Dark',
      'Night',
      'Print',
    ]);
  });
});
