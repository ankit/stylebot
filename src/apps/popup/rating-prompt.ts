import { STYLES_KEY, hasAnyCss } from '@stylebot/saved-styles';
import type { StyleMap } from '@stylebot/types';
import {
  INSTALL_TIME_KEY,
  getNotification,
  setNotification,
  getReleaseNotificationId,
} from '@stylebot/utils';

export const RATING_PROMPT_ID = 'rating-prompt';
export const MIN_SAVED_STYLES = 3;
export const MIN_DAYS_INSTALLED = 7;

const DAY = 24 * 60 * 60 * 1000;

const REVIEW_URLS = {
  chrome:
    'https://chromewebstore.google.com/detail/stylebot/oiaejidbmkiecgbjeifoejpgmdaleoha/reviews',
  edge: 'https://microsoftedge.microsoft.com/addons/detail/stylebot/mjolbpfednnbebfapicajpifliopnnai',
  firefox: 'https://addons.mozilla.org/firefox/addon/stylebot-web/reviews/',
};

export type RatingPromptState = {
  installTime?: number;
  savedStyles: number;
  dismissed: boolean;
  // Leaves the release banner to show on its own first.
  releaseNotificationSeen: boolean;
};

/**
 * Whether to ask for a rating: once, after enough styles saved over enough
 * days that the user has seen Stylebot work for them.
 */
export const isEligibleForRatingPrompt = (
  {
    installTime,
    savedStyles,
    dismissed,
    releaseNotificationSeen,
  }: RatingPromptState,
  now = Date.now()
): boolean =>
  !dismissed &&
  releaseNotificationSeen &&
  typeof installTime === 'number' &&
  now - installTime >= MIN_DAYS_INSTALLED * DAY &&
  savedStyles >= MIN_SAVED_STYLES;

/**
 * The store page to review Stylebot on in the running browser, or null
 * where it isn't listed in a store with reviews, as in Safari.
 */
export const getReviewUrl = (
  userAgent = navigator.userAgent
): string | null => {
  if (/Firefox\//.test(userAgent)) {
    return REVIEW_URLS.firefox;
  }

  if (/Edg\//.test(userAgent)) {
    return REVIEW_URLS.edge;
  }

  if (/Chrome\//.test(userAgent)) {
    return REVIEW_URLS.chrome;
  }

  return null;
};

/**
 * Reads what decides whether the popup asks for a rating.
 */
export const getRatingPromptState = async (): Promise<RatingPromptState> => {
  const items = await chrome.storage.local.get([INSTALL_TIME_KEY, STYLES_KEY]);
  const styles: StyleMap = items[STYLES_KEY] ?? {};

  return {
    installTime: items[INSTALL_TIME_KEY],
    savedStyles: Object.values(styles).filter(hasAnyCss).length,
    dismissed: !!(await getNotification(RATING_PROMPT_ID)),
    releaseNotificationSeen: !!(await getNotification(
      getReleaseNotificationId()
    )),
  };
};

/**
 * Stops the prompt from ever showing again.
 */
export const dismissRatingPrompt = (): Promise<void> =>
  setNotification(RATING_PROMPT_ID, true);
