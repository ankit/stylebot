export {
  MODIFIER_KEYS,
  modifiersFromEvent,
  keydownToShortcut,
} from './keydown-to-shortcut';

export { debounce } from './debounce';
export { resolveAppearance, getSystemPreference } from './resolve-appearance';

export { formatSyncTime } from './format-sync-time';
export {
  formatClockTime,
  formatDay,
  formatWeekday,
  formatDayTime,
  formatExact,
} from './time-formatter';
export { KEYBOARD_FOCUS, isFieldTarget, consumeFieldEscape } from './focus';

export { getCurrentTimestamp } from './timestamp';

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

export const getExtensionVersion = (): string =>
  chrome.runtime.getManifest().version;

// e.g. "3.1.4" -> "3.1", matching how releases are grouped on stylebot.dev.
export const getReleaseVersion = (): string =>
  getExtensionVersion().split('.').slice(0, 2).join('.');

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
