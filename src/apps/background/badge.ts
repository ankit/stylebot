import { getSyncIssue, type SyncIssue } from '@stylebot/sync';

const BADGES: Record<SyncIssue, { text: string; color: string }> = {
  'sign-in': { text: '•', color: '#6b7280' },
  error: { text: '!', color: '#ef4444' },
};

/**
 * Marks the toolbar icon while sync has stopped: a dot when it needs a
 * sign-in, a red ! when a run failed.
 */
export const updateBadge = async (): Promise<void> => {
  const issue = await getSyncIssue();

  if (!issue) {
    chrome.action.setBadgeText({ text: '' });
    return;
  }

  chrome.action.setBadgeBackgroundColor({ color: BADGES[issue].color });
  chrome.action.setBadgeText({ text: BADGES[issue].text });
};
