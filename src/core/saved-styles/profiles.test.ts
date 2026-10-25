import type { StyleWithoutUrl } from '@stylebot/types';

import {
  activateProfile,
  addProfile,
  expandProfiles,
  getProfileSheet,
  hasAnyCss,
  listProfiles,
  normalizeProfiles,
  removeProfile,
  renameProfile,
  setProfileCss,
  setProfileGalleryListing,
  removeProfileGalleryListing,
  removeGalleryListings,
  isProfileNameTaken,
  freeProfileName,
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

const GALLERY_LISTING = {
  styleId: 7,
  slug: 'night',
  version: 1,
  cssHash: 'abc',
  published: false,
};

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
      dark: { name: 'Dark', createdAt: expect.any(String) },
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
    expect(removed.profiles).toEqual({
      dark: { name: 'Dark', createdAt: expect.any(String) },
    });
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

describe('getProfileSheet', () => {
  it('finds a profile with its css, active or not', () => {
    const two = withTwo();

    expect(getProfileSheet(two, 'default')).toEqual({
      name: '',
      css: 'a { color: red; }',
    });
    expect(getProfileSheet(two, 'dark')).toEqual({
      name: 'Dark',
      css: 'a { color: white; }',
      createdAt: expect.any(String),
    });
  });

  it('finds nothing for a missing style or profile', () => {
    expect(getProfileSheet(undefined, 'default')).toBeUndefined();
    expect(getProfileSheet(withTwo(), 'missing')).toBeUndefined();
  });
});

describe('gallery listings', () => {
  it('keeps a profile’s listing through switching, and drops an invalid one', () => {
    const listed = addProfile(style(), {
      id: 'night',
      name: 'Night',
      css: 'a { color: navy; }',
      galleryListing: GALLERY_LISTING,
      activate: false,
    });

    expect(activateProfile(listed, 'night').profiles).toEqual({
      default: { name: '', css: 'a { color: red; }' },
      night: {
        name: 'Night',
        galleryListing: GALLERY_LISTING,
        createdAt: expect.any(String),
      },
    });

    const broken = style({
      profiles: { a: { name: 'A', galleryListing: { styleId: 5 } as never } },
      activeProfile: 'a',
    });

    expect(normalizeProfiles(broken).profiles).toEqual({ a: { name: 'A' } });

    // Gallery styles were once ids of random letters, which it no longer has.
    const lettered = style({
      profiles: {
        a: {
          name: 'A',
          galleryListing: {
            ...GALLERY_LISTING,
            styleId: 'Xk3p9QaL2m',
          } as never,
        },
      },
      activeProfile: 'a',
    });

    expect(normalizeProfiles(lettered).profiles).toEqual({ a: { name: 'A' } });

    const padded = style({
      profiles: {
        a: {
          name: 'A',
          galleryListing: { ...GALLERY_LISTING, extra: 1 } as never,
        },
      },
      activeProfile: 'a',
    });

    expect(normalizeProfiles(padded).profiles).toEqual({
      a: { name: 'A', galleryListing: GALLERY_LISTING },
    });
  });

  it('removes only the listings that match, returning the style itself when none do', () => {
    const listed = setProfileGalleryListing(
      setProfileGalleryListing(withTwo(), 'default', GALLERY_LISTING),
      'dark',
      { ...GALLERY_LISTING, styleId: 10 }
    );
    const isNight = ({ styleId }: { styleId: number }) => styleId === 7;

    const removed = removeGalleryListings(listed, isNight);

    expect(removed.profiles?.default?.galleryListing).toBeUndefined();
    expect(removed.profiles?.dark?.galleryListing).toMatchObject({
      styleId: 10,
    });
    expect(removeGalleryListings(removed, isNight)).toBe(removed);
  });

  it('sets and removes a profile’s listing, returning the style itself when nothing changes', () => {
    const two = withTwo();
    const withListing = setProfileGalleryListing(two, 'dark', GALLERY_LISTING);

    expect(withListing.profiles?.dark).toEqual({
      name: 'Dark',
      css: 'a { color: white; }',
      galleryListing: GALLERY_LISTING,
      createdAt: expect.any(String),
    });
    expect(
      setProfileGalleryListing(withListing, 'dark', { ...GALLERY_LISTING })
    ).toBe(withListing);
    expect(
      removeProfileGalleryListing(withListing, 'dark').profiles?.dark
    ).toEqual({
      name: 'Dark',
      css: 'a { color: white; }',
      createdAt: expect.any(String),
    });
    expect(setProfileGalleryListing(two, 'missing', GALLERY_LISTING)).toBe(two);
  });
});

describe('fields a newer version adds', () => {
  const tint = { color: 'navy', strength: [1, 2] };
  const future = (rest: object = {}) =>
    style({
      css: 'a { color: navy; }',
      profiles: {
        default: { name: '', css: 'a { color: red; }' },
        night: { name: 'Night', tint, ...rest } as never,
      },
      activeProfile: 'night',
    });

  it('keeps them through repair, while still dropping what is invalid', () => {
    const repaired = normalizeProfiles(
      future({ css: 'stale {}', galleryListing: { styleId: 5 } })
    );

    expect(repaired.profiles?.night).toEqual({ name: 'Night', tint });
    expect(
      normalizeProfiles(
        style({
          profiles: {
            a: { name: 'A' },
            b: { name: 'B', css: 5, tint } as never,
          },
          activeProfile: 'a',
        })
      ).profiles
    ).toEqual({ a: { name: 'A' } });
    expect(sanitizeStyleMap({ 'a.com': future() })['a.com']).toEqual(future());
  });

  it('keeps them through switching profiles, either way', () => {
    const away = activateProfile(future(), 'default');

    expect(away.profiles?.night).toEqual({
      name: 'Night',
      css: 'a { color: navy; }',
      tint,
    });
    expect(activateProfile(away, 'night')).toEqual(future());
  });

  it('keeps them when the profile is edited', () => {
    const edited = removeProfileGalleryListing(
      setProfileCss(
        renameProfile(
          activateProfile(future(), 'default'),
          'night',
          'Midnight'
        ),
        'night',
        'b {}'
      ),
      'night'
    );

    expect(edited.profiles?.night).toEqual({
      name: 'Midnight',
      css: 'b {}',
      tint,
    });
    expect(expandProfiles(edited).sheets.night).toMatchObject({ tint });
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

    // Gallery styles were once ids of random letters, which it no longer has.
    const lettered = style({
      profiles: {
        a: {
          name: 'A',
          galleryListing: {
            ...GALLERY_LISTING,
            styleId: 'Xk3p9QaL2m',
          } as never,
        },
      },
      activeProfile: 'a',
    });

    expect(normalizeProfiles(lettered).profiles).toEqual({ a: { name: 'A' } });
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

  it('lists profiles in the order they were added, so a rename keeps its place', () => {
    const stored = style({
      profiles: {
        default: { name: '' },
        b: {
          name: 'Night',
          css: '',
          createdAt: '2026-10-02T09:00:00.000+00:00',
        },
        a: {
          name: 'Print',
          css: '',
          createdAt: '2026-10-01T09:00:00.000+00:00',
        },
        old: { name: 'Zebra', css: '' },
      },
      activeProfile: 'default',
    });
    const renamed = renameProfile(stored, 'a', 'Zzz');

    expect(listProfiles(renamed).map(profile => profile.id)).toEqual([
      'default',
      'old',
      'a',
      'b',
    ]);
  });

  it('stamps an added profile with when it was added', () => {
    const added = addProfile(style({ css: 'a { color: red; }' }), {
      id: 'dark',
      name: 'Dark',
      css: '',
      activate: false,
    });

    expect(added.profiles?.dark.createdAt).toEqual(expect.any(String));
    expect(listProfiles(added).map(profile => profile.id)).toEqual([
      'default',
      'dark',
    ]);
  });
});

describe('profile names', () => {
  it('treats a name as taken whatever its case or surrounding spaces', () => {
    expect(isProfileNameTaken(' dark ', ['Default', 'Dark'])).toBe(true);
    expect(isProfileNameTaken('Night', ['Default', 'Dark'])).toBe(false);
  });

  it('numbers a name until it is free', () => {
    expect(freeProfileName('Untitled', ['Default'])).toBe('Untitled');
    expect(freeProfileName('Untitled', ['Untitled', 'untitled 2'])).toBe(
      'Untitled 3'
    );
  });
});
