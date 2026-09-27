import type {
  OpenOptionsPage,
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
