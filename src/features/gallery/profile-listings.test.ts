import type { GalleryListing, StyleMap } from '@stylebot/types';

import {
  getInstalledProfile,
  getListedProfileNames,
  getListedStyleIds,
  getProfileGalleryListing,
  getPublishedProfile,
} from './profile-listings';

const listing = (styleId: string, publishedBy?: string): GalleryListing => ({
  styleId,
  group: 'github.com',
  slug: styleId,
  version: 1,
  cssHash: 'abc',
  ...(publishedBy ? { publishedBy } : {}),
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
      p1: { name: 'Night', galleryListing: listing('night') },
      p2: { name: 'Mine', css: 'b {}', galleryListing: listing('mine', 'me') },
    },
  },
};

describe('profile listings', () => {
  it('finds the profile a style was installed as, with its css', () => {
    expect(getInstalledProfile(styles, 'night')).toEqual({
      url: 'github.com',
      profileId: 'p1',
      name: 'Night',
      css: 'a { color: navy; }',
      galleryListing: listing('night'),
    });
    expect(getInstalledProfile(styles, 'mine')).toBeNull();
  });

  it('finds the profile a style was published from', () => {
    expect(getPublishedProfile(styles, 'mine')).toMatchObject({
      profileId: 'p2',
    });
    expect(getPublishedProfile(styles, 'night')).toBeNull();
  });

  it('lists the styles installed or published here, and their profile names', () => {
    expect(getListedStyleIds(styles)).toEqual(new Set(['night', 'mine']));
    expect(getListedProfileNames(styles, ['night', 'mine', 'unknown'])).toEqual(
      { night: 'Night', mine: 'Mine' }
    );
  });

  it('reads one profile’s listing', () => {
    expect(getProfileGalleryListing(styles, 'github.com', 'p2')).toEqual(
      listing('mine', 'me')
    );
    expect(
      getProfileGalleryListing(styles, 'github.com', 'default')
    ).toBeNull();
    expect(getProfileGalleryListing(styles, 'other.com', 'p1')).toBeNull();
  });
});
