import type { GalleryListing, StyleMap } from '@stylebot/types';

import {
  getListedProfileNames,
  getListedProfiles,
  getListedStyleIds,
  getProfileGalleryListing,
} from './profile-listings';

const listing = (styleId: string, version = 1): GalleryListing => ({
  styleId,
  group: 'github.com',
  slug: styleId,
  version,
  cssHash: 'abc',
  authorId: 'someone',
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
      p2: { name: 'Mine', css: 'b {}', galleryListing: listing('mine') },
      p3: { name: 'Mine 2', css: 'c {}', galleryListing: listing('mine', 2) },
    },
  },
};

describe('profile listings', () => {
  it('lists the profiles a style is listed as, with their css, latest version first', () => {
    expect(getListedProfiles(styles, 'night')).toEqual([
      {
        url: 'github.com',
        profileId: 'p1',
        name: 'Night',
        css: 'a { color: navy; }',
        galleryListing: listing('night'),
      },
    ]);
    expect(
      getListedProfiles(styles, 'mine').map(({ profileId }) => profileId)
    ).toEqual(['p3', 'p2']);
    expect(getListedProfiles(styles, 'unknown')).toEqual([]);
  });

  it('lists the styles installed or published here, and their profile names', () => {
    expect(getListedStyleIds(styles)).toEqual(new Set(['night', 'mine']));
    expect(getListedProfileNames(styles, ['night', 'mine', 'unknown'])).toEqual(
      { night: 'Night', mine: 'Mine 2' }
    );
  });

  it('reads one profile’s listing', () => {
    expect(getProfileGalleryListing(styles, 'github.com', 'p2')).toEqual(
      listing('mine')
    );
    expect(
      getProfileGalleryListing(styles, 'github.com', 'default')
    ).toBeNull();
    expect(getProfileGalleryListing(styles, 'other.com', 'p1')).toBeNull();
  });
});
