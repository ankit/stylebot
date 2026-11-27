import { handleSiteRequest } from './handlers';

const sendMessage = jest.fn();

const clicked = (isActive: boolean) =>
  Object.defineProperty(navigator, 'userActivation', {
    configurable: true,
    value: { isActive },
  });

beforeEach(() => {
  sendMessage.mockReset();
  global.chrome = { runtime: { sendMessage } } as unknown as typeof chrome;
});

describe('site bridge', () => {
  it('publishes a style’s edits right after a click', async () => {
    clicked(true);
    sendMessage.mockResolvedValue({ ok: true });

    expect(
      await handleSiteRequest({ type: 'stylebot:publish', id: 8 })
    ).toEqual({ type: 'stylebot:publish:result', id: 8, ok: true });
    expect(sendMessage).toHaveBeenCalledWith({
      name: 'PublishGalleryStyleUpdate',
      styleId: 8,
    });
  });

  it('turns down a publish without a click, or that the background refuses', async () => {
    clicked(false);
    expect(
      await handleSiteRequest({ type: 'stylebot:publish', id: 8 })
    ).toEqual({ type: 'stylebot:publish:result', id: 8, ok: false });
    expect(sendMessage).not.toHaveBeenCalled();

    clicked(true);
    sendMessage.mockRejectedValue(new Error('No receiver'));
    expect(
      await handleSiteRequest({ type: 'stylebot:publish', id: 8 })
    ).toEqual({ type: 'stylebot:publish:result', id: 8, ok: false });
  });

  it('passes on which styles were published from here', async () => {
    sendMessage.mockResolvedValue({
      installed: { 8: 'Mine' },
      published: { 8: { version: 2, changed: true } },
    });

    expect(
      await handleSiteRequest({
        type: 'stylebot:status',
        id: 'status',
        styleIds: [8],
      })
    ).toEqual({
      type: 'stylebot:status:result',
      id: 'status',
      installed: { 8: 'Mine' },
      published: { 8: { version: 2, changed: true } },
    });
  });

  it('publishes a profile saved here right after a click, by its url and id', async () => {
    clicked(true);
    sendMessage.mockResolvedValue({ ok: true });

    expect(
      await handleSiteRequest({
        type: 'stylebot:publish',
        id: 'p',
        url: 'github.com',
        profileId: 'night',
      })
    ).toEqual({ type: 'stylebot:publish:result', id: 'p', ok: true });
    expect(sendMessage).toHaveBeenCalledWith({
      name: 'PublishGalleryProfile',
      url: 'github.com',
      profileId: 'night',
    });

    clicked(false);
    sendMessage.mockClear();
    expect(
      await handleSiteRequest({
        type: 'stylebot:publish',
        id: 'p',
        url: 'github.com',
        profileId: 'night',
      })
    ).toEqual({ type: 'stylebot:publish:result', id: 'p', ok: false });
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('lists the styles saved here, or none when the background can’t say', async () => {
    const styles = [
      {
        url: 'github.com',
        profileId: 'default',
        profileName: '',
        modifiedTime: '5',
        gallery: null,
      },
    ];
    sendMessage.mockResolvedValue({ profiles: styles });

    expect(
      await handleSiteRequest({ type: 'stylebot:styles', id: 's' })
    ).toEqual({ type: 'stylebot:styles:result', id: 's', styles });
    expect(sendMessage).toHaveBeenCalledWith({
      name: 'GetGallerySavedProfiles',
    });

    sendMessage.mockRejectedValue(new Error('No receiver'));
    expect(
      await handleSiteRequest({ type: 'stylebot:styles', id: 's' })
    ).toEqual({ type: 'stylebot:styles:result', id: 's', styles: [] });
  });
});
