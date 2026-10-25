import type { GalleryListing, StyleMap } from '@stylebot/types';

import {
  getListedProfileNames,
  getListedProfiles,
  getListedStyleIds,
  getProfileGalleryListing,
  getPublishedProfile,
  getPublishedStatus,
} from './profile-listings';
import { hashCss } from './utils';

const NIGHT = 7;
const MINE = 8;

const listing = (styleId: number, version = 1): GalleryListing => ({
  styleId,
  slug: `style-${styleId}`,
  version,
  cssHash: 'abc',
  published: false,
});

const styles: StyleMap = {
  'github.com': {
    css: 'a { color: navy; }',
    enabled: true,
    readability: false,
    modifiedTime: '',
    activeProfile: 'p1',
    profiles: {
      default: { name: '', css: 'a {}' },
      p1: { name: 'Night', galleryListing: listing(NIGHT) },
      p2: { name: 'Mine', css: 'b {}', galleryListing: listing(MINE) },
      p3: { name: 'Mine 2', css: 'c {}', galleryListing: listing(MINE, 2) },
    },
  },
};

describe('profile listings', () => {
  it('lists the profiles a style is listed as, with their css, latest version first', () => {
    expect(getListedProfiles(styles, NIGHT)).toEqual([
      {
        url: 'github.com',
        profileId: 'p1',
        name: 'Night',
        css: 'a { color: navy; }',
        galleryListing: listing(NIGHT),
      },
    ]);
    expect(
      getListedProfiles(styles, MINE).map(({ profileId }) => profileId)
    ).toEqual(['p3', 'p2']);
    expect(getListedProfiles(styles, 99)).toEqual([]);
  });

  it('lists the styles installed or published here, and their profile names', () => {
    expect(getListedStyleIds(styles)).toEqual(new Set([NIGHT, MINE]));
    expect(getListedProfileNames(styles, [NIGHT, MINE, 99])).toEqual({
      [NIGHT]: 'Night',
      [MINE]: 'Mine 2',
    });
  });

  it('reads one profile’s listing', () => {
    expect(getProfileGalleryListing(styles, 'github.com', 'p2')).toEqual(
      listing(MINE)
    );
    expect(
      getProfileGalleryListing(styles, 'github.com', 'default')
    ).toBeNull();
    expect(getProfileGalleryListing(styles, 'other.com', 'p1')).toBeNull();
  });

  describe('published styles', () => {
    const published = (
      styleId: number,
      css: string,
      version = 1
    ): GalleryListing => ({
      ...listing(styleId, version),
      cssHash: hashCss(css),
      published: true,
    });

    const publishedStyles: StyleMap = {
      'github.com': {
        css: '',
        enabled: true,
        readability: false,
        modifiedTime: '',
        activeProfile: 'default',
        profiles: {
          default: { name: '' },
          p1: {
            name: 'Dim',
            css: 'a { color: gray; }',
            galleryListing: published(1, 'a { color: gray; }', 3),
          },
          p2: {
            name: 'Edited',
            css: 'b { color: red; }',
            galleryListing: published(2, 'b { color: blue; }', 2),
          },
          p3: {
            name: 'Twice',
            css: 'c {}',
            galleryListing: published(3, 'c {}'),
          },
          p4: { name: 'Night', css: 'd {}', galleryListing: listing(4) },
        },
      },
      'example.com': {
        css: '',
        enabled: true,
        readability: false,
        modifiedTime: '',
        activeProfile: 'default',
        profiles: {
          default: { name: '' },
          p1: {
            name: 'Twice',
            css: 'c {}',
            galleryListing: published(3, 'c {}'),
          },
        },
      },
    };

    it('finds the one profile a style was published from', () => {
      expect(getPublishedProfile(publishedStyles, 2)).toMatchObject({
        url: 'github.com',
        profileId: 'p2',
        css: 'b { color: red; }',
      });
    });

    it('finds none for a style installed, published from several profiles, or not here', () => {
      expect(getPublishedProfile(publishedStyles, 4)).toBeNull();
      expect(getPublishedProfile(publishedStyles, 3)).toBeNull();
      expect(getPublishedProfile(publishedStyles, 99)).toBeNull();
    });

    it('gives the published version of each requested style, and whether it was edited since', () => {
      expect(getPublishedStatus(publishedStyles, [1, 2, 3, 4, 99])).toEqual({
        1: { version: 3, changed: false },
        2: { version: 2, changed: true },
      });
    });
  });
});
