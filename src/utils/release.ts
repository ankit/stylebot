import type { NotificationId } from './notification';

export const getExtensionVersion = (): string =>
  chrome.runtime.getManifest().version;

// e.g. "3.1.4" -> "3.1", matching how releases are grouped on stylebot.dev.
export const getReleaseVersion = (): string =>
  getExtensionVersion().split('.').slice(0, 2).join('.');

export const getReleaseNotificationId = (): NotificationId =>
  `release/${getReleaseVersion()}`;
