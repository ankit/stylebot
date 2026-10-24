import fetchMock from 'jest-fetch-mock';

import { style } from '../../features/gallery/gallery.fixtures';
import { hashCss } from '@stylebot/gallery';
import type { GalleryListing, StyleMap } from '@stylebot/types';

import {
  scheduleGalleryUpdates,
  updateGalleryInstalls,
} from './gallery-updates';
import {
  applyStylesToAllTabs,
  getAll,
  removeStyleGalleryListings,
  setGalleryListing,
  updateGalleryProfile,
} from './styles';

jest.mock('./styles', () => ({
  getAll: jest.fn(async () => ({})),
  updateGalleryProfile: jest.fn(async () => undefined),
  setGalleryListing: jest.fn(async () => undefined),
  removeStyleGalleryListings: jest.fn(async () => undefined),
  applyStylesToAllTabs: jest.fn(async () => undefined),
}));

const listing = (version: number, css: string): GalleryListing => ({
  styleId: style.id,
  slug: style.slug,
  version,
  cssHash: hashCss(css),
  published: false,
});

/**
 * A style for github.com with one profile, listed as installed from the
 * gallery at a version, with the css it has now.
 */
const installed = (version: number, installedCss: string, css: string) =>
  (getAll as jest.Mock).mockResolvedValue({
    'github.com': {
      css: '',
      enabled: true,
      readability: false,
      modifiedTime: '1',
      activeProfile: 'default',
      profiles: {
        default: { name: '' },
        night: {
          name: 'Tokyo Night',
          css,
          galleryListing: listing(version, installedCss),
        },
      },
    },
  } as StyleMap);

beforeEach(() => {
  jest.clearAllMocks();
  fetchMock.resetMocks();
});

describe('gallery updates', () => {
  it('updates an unedited install to the latest version and applies it', async () => {
    installed(1, 'a {}', 'a {}');
    fetchMock.mockResponseOnce(JSON.stringify({ ...style, css: 'b {}' }));

    await updateGalleryInstalls();

    expect(updateGalleryProfile).toHaveBeenCalledWith(
      'github.com',
      'night',
      'b {}',
      listing(style.version, 'b {}')
    );
    expect(applyStylesToAllTabs).toHaveBeenCalled();
  });

  it('leaves an edited install at its version', async () => {
    installed(1, 'a {}', 'a { color: red; }');
    fetchMock.mockResponseOnce(JSON.stringify({ ...style, css: 'b {}' }));

    await updateGalleryInstalls();

    expect(updateGalleryProfile).not.toHaveBeenCalled();
    expect(removeStyleGalleryListings).not.toHaveBeenCalled();
  });

  it('leaves an install already at the latest version', async () => {
    installed(style.version, 'a {}', 'a {}');
    fetchMock.mockResponseOnce(JSON.stringify({ ...style, css: 'a {}' }));

    await updateGalleryInstalls();

    expect(updateGalleryProfile).not.toHaveBeenCalled();
    expect(setGalleryListing).not.toHaveBeenCalled();
    expect(applyStylesToAllTabs).not.toHaveBeenCalled();
  });

  it('drops the listings of a style the gallery no longer has', async () => {
    installed(1, 'a {}', 'a { color: red; }');
    fetchMock.mockResponseOnce(JSON.stringify({ error: 'Not found' }), {
      status: 404,
    });

    await updateGalleryInstalls();

    expect(removeStyleGalleryListings).toHaveBeenCalledWith(style.id);
    expect(updateGalleryProfile).not.toHaveBeenCalled();
    expect(applyStylesToAllTabs).not.toHaveBeenCalled();
  });

  it('drops the listings when the gallery has an older version, so the id names another style', async () => {
    installed(style.version + 1, 'a {}', 'a {}');
    fetchMock.mockResponseOnce(JSON.stringify({ ...style, css: 'b {}' }));

    await updateGalleryInstalls();

    expect(removeStyleGalleryListings).toHaveBeenCalledWith(style.id);
    expect(updateGalleryProfile).not.toHaveBeenCalled();
  });

  it.each([
    ['a server error', () => fetchMock.mockResponseOnce('', { status: 500 })],
    ['a network error', () => fetchMock.mockRejectOnce(new Error('offline'))],
  ])('keeps the listings after %s', async (_, respond) => {
    installed(1, 'a {}', 'a {}');
    respond();

    await updateGalleryInstalls();

    expect(removeStyleGalleryListings).not.toHaveBeenCalled();
    expect(updateGalleryProfile).not.toHaveBeenCalled();
  });

  it("gives an edited install of a renamed style the style's new slug", async () => {
    installed(1, 'a {}', 'a { color: red; }');
    fetchMock.mockResponseOnce(
      JSON.stringify({ ...style, slug: 'renamed', css: 'b {}' })
    );

    await updateGalleryInstalls();

    expect(setGalleryListing).toHaveBeenCalledWith('github.com', 'night', {
      ...listing(1, 'a {}'),
      slug: 'renamed',
    });
    expect(removeStyleGalleryListings).not.toHaveBeenCalled();
  });

  it('updates an unedited install of a renamed style with its new slug', async () => {
    installed(1, 'a {}', 'a {}');
    fetchMock.mockResponseOnce(
      JSON.stringify({ ...style, slug: 'renamed', css: 'b {}' })
    );

    await updateGalleryInstalls();

    expect(updateGalleryProfile).toHaveBeenCalledWith(
      'github.com',
      'night',
      'b {}',
      { ...listing(style.version, 'b {}'), slug: 'renamed' }
    );
    expect(setGalleryListing).not.toHaveBeenCalled();
  });

  it('schedules the daily check once, keeping an existing alarm', async () => {
    const alarms = { get: jest.fn(), create: jest.fn() };
    global.chrome = { alarms } as unknown as typeof chrome;

    alarms.get.mockResolvedValueOnce(undefined);
    await scheduleGalleryUpdates();
    expect(alarms.create).toHaveBeenCalledWith('gallery-updates', {
      delayInMinutes: 1,
      periodInMinutes: 24 * 60,
    });

    alarms.get.mockResolvedValueOnce({ name: 'gallery-updates' });
    await scheduleGalleryUpdates();
    expect(alarms.create).toHaveBeenCalledTimes(1);
  });
});
