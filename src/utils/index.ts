import { format } from 'date-fns';
import { Timestamp } from '@stylebot/types';

export {
  MODIFIER_KEYS,
  modifiersFromEvent,
  keydownToShortcut,
} from './keydown-to-shortcut';

export const getCurrentTimestamp = (): Timestamp =>
  format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");


type NotificationId = string;

const getNotificationKey = (id: NotificationId) => `notification~${id}`;

export const getNotification = (id: NotificationId): Promise<boolean> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(getNotificationKey(id), (items) => {
      resolve(items[getNotificationKey(id)]);
    });
  });
}

export const setNotification = (id: NotificationId, value: boolean): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [getNotificationKey(id)]: value }, () => {
      resolve();
    });
  });
}

// e.g. "3.1.4" -> "3.1", matching how releases are grouped on stylebot.dev.
export const getReleaseVersion = (): string =>
  chrome.runtime.getManifest().version.split('.').slice(0, 2).join('.');

export const getReleaseNotificationId = (): NotificationId =>
  `release/${getReleaseVersion()}`;

export const openOptionsPage = (): void => {
  chrome.runtime.sendMessage({ name: 'OpenOptionsPage' });
};

export const openReportIssuePage = (): void => {
  chrome.runtime.sendMessage({ name: 'OpenReportIssuePage' });
};

export const openDonatePage = (): void => {
  chrome.runtime.sendMessage({ name: 'OpenDonatePage' });
};
