import { updateBadge } from './badge';
import { getSyncIssue } from '@stylebot/sync';

jest.mock('@stylebot/sync', () => ({
  getSyncIssue: jest.fn(),
}));

describe('updateBadge', () => {
  beforeEach(() => {
    global.chrome = {
      action: { setBadgeText: jest.fn(), setBadgeBackgroundColor: jest.fn() },
    } as unknown as typeof chrome;
  });

  it('leaves the icon without a badge', async () => {
    jest.mocked(getSyncIssue).mockResolvedValue(null);

    await updateBadge();

    expect(chrome.action.setBadgeText).toBeCalledWith({ text: '' });
  });

  it('marks a needed sign-in with a quiet dot', async () => {
    jest.mocked(getSyncIssue).mockResolvedValue('sign-in');

    await updateBadge();

    expect(chrome.action.setBadgeText).toBeCalledWith({ text: '•' });
    expect(chrome.action.setBadgeBackgroundColor).toBeCalledWith({
      color: '#6b7280',
    });
  });

  it('flags a failed sync in red', async () => {
    jest.mocked(getSyncIssue).mockResolvedValue('error');

    await updateBadge();

    expect(chrome.action.setBadgeText).toBeCalledWith({ text: '!' });
    expect(chrome.action.setBadgeBackgroundColor).toBeCalledWith({
      color: '#ef4444',
    });
  });
});
