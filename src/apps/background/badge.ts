import { hasSyncIssue } from '@stylebot/sync';

const ALERT_BADGE_COLOR = '#ef4444';

/**
 * Shows a ! on the toolbar icon while sync has stopped working, the one
 * thing the user has to act on. Otherwise the icon carries no badge.
 */
export const updateBadge = async (): Promise<void> => {
  const syncIssue = await hasSyncIssue();

  chrome.action.setBadgeBackgroundColor({ color: ALERT_BADGE_COLOR });
  chrome.action.setBadgeText({ text: syncIssue ? '!' : '' });
};
