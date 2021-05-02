import { format } from 'date-fns';
import { Timestamp } from '@stylebot/types';

export const getCurrentTimestamp = (): Timestamp =>
  format(new Date(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");


type NotificationId = 'release/3.1' | 'donate';

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
