export type NotificationId = string;

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
