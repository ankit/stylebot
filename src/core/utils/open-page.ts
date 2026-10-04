import type {
  OpenOptionsPage,
  OpenShortcutsPage,
  OpenReportIssuePage,
  OpenDonatePage,
} from '@stylebot/types';

export const openOptionsPage = (route?: string): void => {
  const message: OpenOptionsPage = {
    name: 'OpenOptionsPage',
    ...(route ? { route } : {}),
  };

  chrome.runtime.sendMessage(message);
};

/**
 * Whether the browser has a shortcuts page the extension can open. Safari
 * keeps them in its own settings, which no extension API reaches.
 */
export const canOpenShortcutsPage = (): boolean =>
  /Chrome\//.test(navigator.userAgent) || !/Safari\//.test(navigator.userAgent);

export const openShortcutsPage = (): void => {
  const message: OpenShortcutsPage = { name: 'OpenShortcutsPage' };
  chrome.runtime.sendMessage(message);
};

export const openReportIssuePage = (): void => {
  const message: OpenReportIssuePage = {
    name: 'OpenReportIssuePage',
  };

  chrome.runtime.sendMessage(message);
};

export const openDonatePage = (): void => {
  const message: OpenDonatePage = {
    name: 'OpenDonatePage',
  };

  chrome.runtime.sendMessage(message);
};
