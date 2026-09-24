import { format } from 'date-fns';
import { Timestamp } from '@stylebot/types';

export {
  MODIFIER_KEYS,
  modifiersFromEvent,
  keydownToShortcut,
} from './keydown-to-shortcut';

export { debounce } from './debounce';
export { resolveAppearance, getSystemPreference } from './resolve-appearance';

export { formatSyncTime } from './format-sync-time';
export { KEYBOARD_FOCUS, isFieldTarget, consumeFieldEscape } from './focus';

export const getCurrentTimestamp = (): Timestamp =>
  format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");

type NotificationId = string;

const getNotificationKey = (id: NotificationId) => `notification~${id}`;

export const getNotification = async (id: NotificationId): Promise<boolean> => {
  const items = await chrome.storage.local.get(getNotificationKey(id));
  return items[getNotificationKey(id)];
};

export const setNotification = (
  id: NotificationId,
  value: boolean
): Promise<void> =>
  chrome.storage.local.set({ [getNotificationKey(id)]: value });

// e.g. "3.1.4" -> "3.1", matching how releases are grouped on stylebot.dev.
export const getReleaseVersion = (): string =>
  chrome.runtime.getManifest().version.split('.').slice(0, 2).join('.');

export const getReleaseNotificationId = (): NotificationId =>
  `release/${getReleaseVersion()}`;

export const openOptionsPage = (route?: string): void => {
  chrome.runtime.sendMessage({
    name: 'OpenOptionsPage',
    ...(route ? { route } : {}),
  });
};

export const openReportIssuePage = (): void => {
  chrome.runtime.sendMessage({ name: 'OpenReportIssuePage' });
};

export const openDonatePage = (): void => {
  chrome.runtime.sendMessage({ name: 'OpenDonatePage' });
};
