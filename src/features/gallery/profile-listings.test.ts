import type { GalleryListing, StyleMap } from '@stylebot/types';

import {
  getListedProfileNames,
  getListedProfiles,
  getListedStyleIds,
  getProfileGalleryListing,
} from './profile-listings';

const NIGHT = 7;
const MINE = 8;

const listing = (styleId: number, version = 1): GalleryListing => ({
  styleId,
  slug: `style-${styleId}`,
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
});
