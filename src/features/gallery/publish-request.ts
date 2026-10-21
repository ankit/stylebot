const PUBLISH_REQUEST_KEY = 'gallery-publish-request';

// Long enough for the editor to load and connect; a stale request is dropped.
const PUBLISH_REQUEST_TTL = 30_000;

type PublishRequest = {
  url: string;
  profileId: string;
  requestedAt: number;
};

/**
 * Asks the editor that opens next on a style's profile to show its publish
 * view, as the popup can't reach into an editor that hasn't loaded yet.
 */
export const requestPublishing = (
  url: string,
  profileId: string
): Promise<void> => {
  const request: PublishRequest = { url, profileId, requestedAt: Date.now() };

  return chrome.storage.local.set({ [PUBLISH_REQUEST_KEY]: request });
};

/**
 * The profile publishing was just asked for on the style, if it was.
 */
export const getPublishRequest = async (
  url: string
): Promise<string | null> => {
  const items = await chrome.storage.local.get(PUBLISH_REQUEST_KEY);
  const request = items[PUBLISH_REQUEST_KEY] as PublishRequest | undefined;

  if (
    request?.url !== url ||
    Date.now() - request.requestedAt >= PUBLISH_REQUEST_TTL
  ) {
    return null;
  }

  return request.profileId;
};

/**
 * Clears the request once an editor answers it, so no other one does.
 */
export const clearPublishRequest = (): Promise<void> =>
  chrome.storage.local.remove(PUBLISH_REQUEST_KEY);

/**
 * Calls back whenever publishing is asked for, for an editor already open.
 */
export const onPublishRequest = (callback: () => void): (() => void) => {
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string
  ): void => {
    if (areaName === 'local' && changes[PUBLISH_REQUEST_KEY]?.newValue) {
      callback();
    }
  };

  chrome.storage.onChanged.addListener(listener);

  return () => chrome.storage.onChanged.removeListener(listener);
};
