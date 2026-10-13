import { updateBadge } from './badge';
import { hasSyncIssue } from '@stylebot/sync';

jest.mock('@stylebot/sync', () => ({
  hasSyncIssue: jest.fn(),
}));

describe('updateBadge', () => {
  beforeEach(() => {
    global.chrome = {
      action: { setBadgeText: jest.fn(), setBadgeBackgroundColor: jest.fn() },
    } as unknown as typeof chrome;
  });

  it('leaves the icon without a badge', async () => {
    (hasSyncIssue as jest.Mock).mockResolvedValue(false);

    await updateBadge();

    expect(chrome.action.setBadgeText).toBeCalledWith({ text: '' });
  });

  it('flags a sync issue', async () => {
    (hasSyncIssue as jest.Mock).mockResolvedValue(true);

    await updateBadge();

    expect(chrome.action.setBadgeText).toBeCalledWith({ text: '!' });
    expect(chrome.action.setBadgeBackgroundColor).toBeCalledWith({
      color: '#ef4444',
    });
  });
});
