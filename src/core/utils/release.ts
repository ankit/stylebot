import type { NotificationId } from './notification';
import { getSiteUrl } from './site-url';

// Releases with a page on stylebot.dev; add one here when its page goes up.
const RELEASES_WITH_PAGES = ['3.1', '3.2', '4.0', '4.1'];

export const getExtensionVersion = (): string =>
  chrome.runtime.getManifest().version;

// e.g. "3.1.4" -> "3.1", matching how releases are grouped on stylebot.dev.
export const getReleaseVersion = (): string =>
  getExtensionVersion().split('.').slice(0, 2).join('.');

export const getReleaseNotificationId = (): NotificationId =>
  `release/${getReleaseVersion()}`;

export const getReleaseUrl = (): string =>
  getSiteUrl(`/releases/${getReleaseVersion()}`);

/**
 * Whether the running release has a page on stylebot.dev to announce it with.
 */
export const hasReleasePage = (): boolean =>
  RELEASES_WITH_PAGES.includes(getReleaseVersion());

export const getGoodbyeUrl = (): string =>
  getSiteUrl(`/goodbye?version=${getExtensionVersion()}`);

const getMajorVersion = (version?: string): number | undefined => {
  const match = /^(\d+)(\.\d+)*$/.exec(version?.trim() ?? '');
  return match ? Number(match[1]) : undefined;
};

/**
 * Whether going from previousVersion to currentVersion crosses into a new
 * major version. A missing or unparseable version never counts as one.
 */
export const isMajorUpdate = (
  previousVersion: string | undefined,
  currentVersion: string
): boolean => {
  const previous = getMajorVersion(previousVersion);
  const current = getMajorVersion(currentVersion);

  return previous !== undefined && current !== undefined && current > previous;
};
