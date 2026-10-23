import fetchMock from 'jest-fetch-mock';

import { style } from '../../features/gallery/gallery.fixtures';
import { hashCss } from '@stylebot/gallery';
import type { GalleryListing, StyleMap } from '@stylebot/types';

import {
  scheduleGalleryUpdates,
  updateGalleryInstalls,
} from './gallery-updates';
import { applyStylesToAllTabs, getAll, updateGalleryProfile } from './styles';

jest.mock('./styles', () => ({
  getAll: jest.fn(async () => ({})),
  updateGalleryProfile: jest.fn(async () => undefined),
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

  it('leaves an edited install without asking the gallery', async () => {
    installed(1, 'a {}', 'a { color: red; }');

    await updateGalleryInstalls();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(updateGalleryProfile).not.toHaveBeenCalled();
  });

  it('leaves an install already at the latest version', async () => {
    installed(style.version, 'a {}', 'a {}');
    fetchMock.mockResponseOnce(JSON.stringify({ ...style, css: 'a {}' }));

    await updateGalleryInstalls();

    expect(updateGalleryProfile).not.toHaveBeenCalled();
    expect(applyStylesToAllTabs).not.toHaveBeenCalled();
  });

  it('leaves an install the gallery no longer has', async () => {
    installed(1, 'a {}', 'a {}');
    fetchMock.mockResponseOnce(JSON.stringify({ error: 'Not found' }), {
      status: 404,
    });

    await updateGalleryInstalls();

    expect(updateGalleryProfile).not.toHaveBeenCalled();
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
