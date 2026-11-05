jest.mock('@stylebot/utils', () => ({
  ...jest.requireActual('@stylebot/utils'),
  isSafari: jest.fn(() => false),
}));
jest.mock('./options', () => ({ get: jest.fn() }));
jest.mock('./styles', () => ({ getAll: jest.fn() }));

import { isSafari } from '@stylebot/utils';

import { refreshAllBadges, refreshBadge } from './badge';
import { get as getOption } from './options';
import { getAll } from './styles';

const style = {
  css: 'a { color: red; }',
  enabled: true,
  readability: false,
  modifiedTime: '2026-01-01T00:00:00.000Z',
};

const tab = { id: 7, url: 'https://example.com/' } as chrome.tabs.Tab;
const answerReaderShowing = (showing?: boolean) =>
  (chrome.tabs.sendMessage as jest.Mock).mockImplementation(
    (_tabId, _message, respond) => respond(showing)
  );

const badgeTexts = () =>
  (chrome.action.setBadgeText as jest.Mock).mock.calls.map(([call]) => call);

beforeEach(() => {
  global.chrome = {
    action: {
      setBadgeBackgroundColor: jest.fn(async () => undefined),
      setBadgeText: jest.fn(async () => undefined),
    },
    tabs: {
      query: jest.fn(async () => [tab]),
      sendMessage: jest.fn(),
    },
    runtime: {},
  } as unknown as typeof chrome;

  (isSafari as jest.Mock).mockReturnValue(false);
  (getOption as jest.Mock).mockResolvedValue(true);
  (getAll as jest.Mock).mockResolvedValue({ 'example.com': style });
});

describe('refreshBadge', () => {
  it('shows how many styles are active on the page', async () => {
    (getAll as jest.Mock).mockResolvedValue({
      'example.com': style,
      '*': style,
      'example.com/other': style,
    });

    await refreshBadge(tab);

    expect(badgeTexts()).toEqual([{ text: '2', tabId: 7 }]);
  });

  it.each([
    ['is disabled', { ...style, enabled: false }],
    ['has no css', { ...style, css: '' }],
  ])('shows nothing when the style %s', async (_, unstyled) => {
    (getAll as jest.Mock).mockResolvedValue({ 'example.com': unstyled });

    await refreshBadge(tab);

    expect(badgeTexts()).toEqual([{ text: '', tabId: 7 }]);
  });

  it('counts the reader showing on the page', async () => {
    (getAll as jest.Mock).mockResolvedValue({
      'example.com': { ...style, readability: true },
    });
    answerReaderShowing(true);

    await refreshBadge(tab);

    expect(badgeTexts()).toEqual([{ text: '2', tabId: 7 }]);
  });

  it('counts a site with only the reader on', async () => {
    (getAll as jest.Mock).mockResolvedValue({
      'example.com': { ...style, css: '', readability: true },
    });
    answerReaderShowing(true);

    await refreshBadge(tab);

    expect(badgeTexts()).toEqual([{ text: '1', tabId: 7 }]);
  });

  it('leaves out a reader that did not open on the page', async () => {
    (getAll as jest.Mock).mockResolvedValue({
      'example.com': { ...style, readability: true },
    });
    answerReaderShowing(false);

    await refreshBadge(tab);

    expect(badgeTexts()).toEqual([{ text: '1', tabId: 7 }]);
  });

  it('leaves out the reader when the page can not answer', async () => {
    (getAll as jest.Mock).mockResolvedValue({
      'example.com': { ...style, readability: true },
    });
    chrome.runtime.lastError = { message: 'Receiving end does not exist' };
    answerReaderShowing();

    await refreshBadge(tab);

    expect(badgeTexts()).toEqual([{ text: '1', tabId: 7 }]);
  });

  it('only asks pages on sites with the reader on', async () => {
    await refreshBadge(tab);

    expect(chrome.tabs.sendMessage).not.toBeCalled();
  });

  it('shows nothing on a page Stylebot can not style', async () => {
    (getAll as jest.Mock).mockResolvedValue({ '*': style });

    await refreshBadge({
      id: 7,
      url: 'chrome://extensions/',
    } as chrome.tabs.Tab);

    expect(badgeTexts()).toEqual([{ text: '', tabId: 7 }]);
  });

  it('leaves the badge alone while the option is off', async () => {
    (getOption as jest.Mock).mockResolvedValue(false);

    await refreshBadge(tab);

    expect(chrome.action.setBadgeText).not.toBeCalled();
  });

  it('leaves the badge alone on Safari', async () => {
    (isSafari as jest.Mock).mockReturnValue(true);

    await refreshBadge(tab);

    expect(chrome.action.setBadgeText).not.toBeCalled();
  });

  it('ignores a tab that closed meanwhile', async () => {
    (chrome.action.setBadgeText as jest.Mock).mockRejectedValue(
      new Error('No tab with id')
    );

    await expect(refreshBadge(tab)).resolves.toBeUndefined();
  });
});

describe('refreshAllBadges', () => {
  it('updates every tab', async () => {
    (chrome.tabs.query as jest.Mock).mockResolvedValue([
      tab,
      { id: 8, url: 'https://other.com/' },
    ]);

    await refreshAllBadges();

    expect(badgeTexts()).toEqual([
      { text: '1', tabId: 7 },
      { text: '', tabId: 8 },
    ]);
  });

  it('clears every tab when the option is off', async () => {
    (getOption as jest.Mock).mockResolvedValue(false);

    await refreshAllBadges();

    expect(badgeTexts()).toEqual([{ text: '', tabId: 7 }]);
  });
});
