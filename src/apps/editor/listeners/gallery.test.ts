import Vue from 'vue';
import Vuex, { Store } from 'vuex';

import type { State } from 'apps/editor/store';
import type { GalleryListing, StyleMap } from '@stylebot/types';
import mockState from '../store/state.fixtures';
import initGalleryListener from './gallery';

Vue.use(Vuex);

const listing: GalleryListing = {
  styleId: 7,
  slug: 'night',
  version: 1,
  cssHash: 'abc',
  published: true,
};

const styles = (css: string, galleryListing?: GalleryListing): StyleMap => ({
  'example.com': {
    css,
    enabled: true,
    readability: false,
    modifiedTime: '',
    profiles: { default: { name: '', galleryListing } },
    activeProfile: 'default',
  },
});

describe('initGalleryListener', () => {
  let onChangedListener: (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string
  ) => void;
  let loadPublished: jest.Mock;

  beforeEach(() => {
    global.chrome = {
      storage: {
        onChanged: {
          addListener: jest.fn(listener => {
            onChangedListener = listener;
          }),
        },
      },
    } as unknown as typeof chrome;

    loadPublished = jest.fn();
    initGalleryListener(
      new Store<State>({
        state: { ...mockState, url: 'example.com', activeProfile: 'default' },
        actions: { loadPublishedGalleryStyle: loadPublished },
      })
    );
  });

  it("reloads what was published when the profile's listing changes", () => {
    onChangedListener(
      {
        styles: {
          oldValue: styles('a {}'),
          newValue: styles('a {}', listing),
        },
      },
      'local'
    );

    expect(loadPublished).toHaveBeenCalledTimes(1);
  });

  it('leaves it alone when a save changes only the CSS', () => {
    onChangedListener(
      {
        styles: {
          oldValue: styles('a {}', listing),
          newValue: styles('a { color: red; }', listing),
        },
      },
      'local'
    );

    expect(loadPublished).not.toHaveBeenCalled();
  });
});
