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
});
