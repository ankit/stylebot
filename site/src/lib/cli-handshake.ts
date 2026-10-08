/*
 * The page side of the stylebot.dev handshake with the extension, described
 * in docs/cli.md. Messages go through window.postMessage on this page.
 */

export const SITE_SOURCE = 'stylebot-site';
export const EXTENSION_SOURCE = 'stylebot-extension';

export type SiteMessage = {
  source: typeof SITE_SOURCE;
  type: 'status' | 'open-cli-settings';
};

export type ExtensionStatus = {
  installed: true;
  version: string;
  cliEnabled: boolean;
  cliConnected: boolean;
};

/**
 * Posts a message for the extension's content script on this page.
 */
export function postToExtension(type: SiteMessage['type']) {
  const message: SiteMessage = { source: SITE_SOURCE, type };
  window.postMessage(message, window.location.origin);
}

/**
 * Returns the status in a message event if it's a well-formed reply from the
 * extension on this page, or null for anything else.
 */
export function readStatusReply(event: MessageEvent): ExtensionStatus | null {
  if (event.source !== window || event.origin !== window.location.origin) {
    return null;
  }

  const data: unknown = event.data;
  if (typeof data !== 'object' || data === null) return null;

  const { source, type, installed, version, cliEnabled, cliConnected } =
    data as Record<string, unknown>;
  if (source !== EXTENSION_SOURCE || type !== 'status') return null;
  if (installed !== true) return null;
  if (typeof version !== 'string' || !/^\d+(\.\d+){0,3}$/.test(version)) {
    return null;
  }
  if (typeof cliEnabled !== 'boolean' || typeof cliConnected !== 'boolean') {
    return null;
  }

  return { installed, version, cliEnabled, cliConnected };
}
