import type {
  OpenOptionsPage,
  OpenShortcutsPage,
  OpenFeedbackPage,
  OpenDonatePage,
} from '@stylebot/types';

export const openOptionsPage = (route?: string): void => {
  const message: OpenOptionsPage = {
    name: 'OpenOptionsPage',
    ...(route ? { route } : {}),
  };

  chrome.runtime.sendMessage(message);
};

export const openShortcutsPage = (): void => {
  const message: OpenShortcutsPage = { name: 'OpenShortcutsPage' };
  chrome.runtime.sendMessage(message);
};

export const openFeedbackPage = (): void => {
  const message: OpenFeedbackPage = { name: 'OpenFeedbackPage' };
  chrome.runtime.sendMessage(message);
};

export const openDonatePage = (): void => {
  const message: OpenDonatePage = {
    name: 'OpenDonatePage',
  };

  chrome.runtime.sendMessage(message);
};
