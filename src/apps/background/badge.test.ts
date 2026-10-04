import { updateIcon } from './badge';
import { hasSyncIssue } from '@stylebot/sync';

jest.mock('@stylebot/sync', () => ({
  hasSyncIssue: jest.fn(),
}));

jest.mock('@stylebot/utils', () => ({
  isSafari: () => false,
}));

const tab = { id: 7 } as chrome.tabs.Tab;
const style = {
  url: 'example.com',
  css: 'a { color: red; }',
  enabled: true,
  readability: false,
  modifiedTime: '2026-01-01T00:00:00.000Z',
};

const badgeText = () =>
  (chrome.action.setBadgeText as jest.Mock).mock.calls.at(-1)[0].text;

describe('updateIcon', () => {
  beforeEach(() => {
    global.chrome = {
      action: { setBadgeText: jest.fn(), setBadgeBackgroundColor: jest.fn() },
    } as unknown as typeof chrome;
  });

  it('counts the styles applied to the page', async () => {
    (hasSyncIssue as jest.Mock).mockResolvedValue(false);

    await updateIcon(tab, [style], false);

    expect(badgeText()).toBe('1');
  });

  it('flags a sync issue over everything else', async () => {
    (hasSyncIssue as jest.Mock).mockResolvedValue(true);

    await updateIcon(tab, [style], true);

    expect(badgeText()).toBe('!');
    expect(chrome.action.setBadgeBackgroundColor).toBeCalledWith({
      color: '#ef4444',
      tabId: 7,
    });
  });
});
