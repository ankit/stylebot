import fetchMock from 'jest-fetch-mock';
import { GALLERY_API_URL, hashCss } from '@stylebot/gallery';

import {
  mockStorage,
  publishedStyle,
  session,
  style,
} from '../../features/gallery/gallery.fixtures';
import { captureTab } from './capture-tab';
import {
  CaptureGalleryScreenshot,
  GetGalleryScreenshot,
  GetMyGalleryStyles,
  GetPublishedGalleryStyle,
  PublishToGallery,
  UnpublishFromGallery,
} from './gallery';

jest.mock('@stylebot/sync', () => ({
  getGoogleAccessToken: jest.fn(async () => 'ya29.token'),
  clearGoogleAccessToken: jest.fn(async () => undefined),
}));
jest.mock('./capture-tab', () => ({ captureTab: jest.fn() }));

const SCREENSHOT = 'data:image/png;base64,iVBORw0KGgo=';

const publishMessage = {
  name: 'PublishToGallery' as const,
  site: 'www.github.com',
  url: 'github.com',
  profileId: 'default',
  title: 'Tokyo Night',
  description: '',
  notes: '',
  css: 'body { color: red; }',
  screenshot: SCREENSHOT,
};

const respond = <T>(
  handler: (sendResponse: (response: T) => void) => Promise<void>
): Promise<T> =>
  new Promise(resolve => {
    handler(resolve);
  });

beforeEach(() => {
  // Failures are logged for debugging; the tests check what's sent back.
  jest.spyOn(console, 'error').mockImplementation(() => undefined);
  fetchMock.resetMocks();
  mockStorage({ 'gallery-session': session });
});

describe('gallery messages', () => {
  it("publishes a new style and remembers it for the style's profile", async () => {
    fetchMock
      .mockResponseOnce(JSON.stringify(publishedStyle), { status: 201 })
      .mockResponseOnce(JSON.stringify({ styles: [style] }));

    const published = await respond(send =>
      PublishToGallery(publishMessage, send)
    );

    expect(published).toEqual({ ok: true, style: publishedStyle });
    expect(fetchMock.mock.calls[0][0]).toBe(`${GALLERY_API_URL}/styles`);

    const mine = await respond(send =>
      GetMyGalleryStyles(
        {
          name: 'GetMyGalleryStyles',
          site: 'www.github.com',
          url: 'github.com',
          profileId: 'default',
        },
        send
      )
    );

    expect(mine).toEqual({ ok: true, styles: [style], publishedId: style.id });
  });

  it('publishes a new version of the chosen style', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(publishedStyle));

    await respond(send =>
      PublishToGallery({ ...publishMessage, styleId: style.id }, send)
    );

    expect(fetchMock.mock.calls[0][0]).toBe(
      `${GALLERY_API_URL}/styles/${style.id}/versions`
    );
  });

  it('lists only styles for this site', async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({
        styles: [style, { ...style, id: 'other', site: 'example.com' }],
      })
    );

    const mine = await respond(send =>
      GetMyGalleryStyles(
        {
          name: 'GetMyGalleryStyles',
          site: 'github.com',
          url: 'github.com',
          profileId: 'default',
        },
        send
      )
    );

    expect(mine).toEqual({ ok: true, styles: [style], publishedId: null });
  });

  it("passes on the gallery's reason for turning a style down", async () => {
    fetchMock.mockResponseOnce(
      JSON.stringify({ error: 'The CSS is empty once sanitized.' }),
      { status: 400 }
    );

    expect(
      await respond(send => PublishToGallery(publishMessage, send))
    ).toMatchObject({
      ok: false,
      errorKey: 'gallery_error_invalid',
      errorDetail: 'The CSS is empty once sanitized.',
    });
  });

  it("remembers what was published from the style's profile", async () => {
    fetchMock.mockResponseOnce(JSON.stringify(publishedStyle), {
      status: 201,
    });

    await respond(send => PublishToGallery(publishMessage, send));

    expect(
      await respond(send =>
        GetPublishedGalleryStyle(
          {
            name: 'GetPublishedGalleryStyle',
            url: 'github.com',
            profileId: 'default',
          },
          send
        )
      )
    ).toEqual({
      published: {
        styleId: style.id,
        version: style.version,
        cssHash: hashCss(publishMessage.css),
        group: style.group,
        slug: style.slug,
      },
    });
  });

  it('forgets an unpublished style', async () => {
    fetchMock
      .mockResponseOnce(JSON.stringify(publishedStyle), { status: 201 })
      .mockResponseOnce('', { status: 204 })
      .mockResponseOnce(JSON.stringify({ styles: [style] }));

    await respond(send => PublishToGallery(publishMessage, send));
    expect(
      await respond(send =>
        UnpublishFromGallery(
          { name: 'UnpublishFromGallery', id: style.id },
          send
        )
      )
    ).toEqual({ ok: true });

    const mine = await respond(send =>
      GetMyGalleryStyles(
        {
          name: 'GetMyGalleryStyles',
          site: 'github.com',
          url: 'github.com',
          profileId: 'default',
        },
        send
      )
    );

    expect(mine).toMatchObject({ publishedId: null });
  });

  it('captures the tab the message came from', async () => {
    const tab = { id: 4, windowId: 1, active: true } as chrome.tabs.Tab;
    (captureTab as jest.Mock).mockRejectedValueOnce(new Error('No access'));

    const response = await respond(send =>
      CaptureGalleryScreenshot(
        { name: 'CaptureGalleryScreenshot' },
        { tab },
        send
      )
    );

    expect(captureTab).toHaveBeenCalledWith(tab);
    expect(response).toMatchObject({
      ok: false,
      errorKey: 'gallery_error_screenshot',
    });
  });

  it('fetches the screenshot the gallery shows', async () => {
    // jsdom's FileReader only reads its own Blobs, not node-fetch's.
    fetchMock.mockImplementationOnce(
      async () =>
        ({
          ok: true,
          blob: async () => new Blob(['webp'], { type: 'image/webp' }),
        } as Response)
    );

    const response = await respond(send =>
      GetGalleryScreenshot(
        { name: 'GetGalleryScreenshot', path: style.screenshot },
        send
      )
    );

    expect(fetchMock.mock.calls[0][0]).toBe(
      new URL(style.screenshot, GALLERY_API_URL).href
    );
    expect(response).toEqual({
      ok: true,
      screenshot: 'data:image/webp;base64,d2VicA==',
    });
  });

  it("fails as a screenshot error when the gallery's is gone", async () => {
    fetchMock.mockResponseOnce('', { status: 404 });

    const response = await respond(send =>
      GetGalleryScreenshot(
        { name: 'GetGalleryScreenshot', path: style.screenshot },
        send
      )
    );

    expect(response).toMatchObject({
      ok: false,
      errorKey: 'gallery_error_screenshot',
    });
  });
});
