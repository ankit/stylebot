/**
 * What the CLI needs: its native host, and every site, to read pages and
 * take screenshots. Optional, so they're requested only when it's turned on.
 */
export const CLI_PERMISSIONS: chrome.permissions.Permissions = {
  permissions: ['nativeMessaging'],
  origins: ['<all_urls>'],
};

/**
 * What turning the CLI on asks for: its permissions, and scripting to put
 * Stylebot back into open tabs after the restart the grant takes.
 */
const CLI_REQUEST: chrome.permissions.Permissions = {
  ...CLI_PERMISSIONS,
  permissions: ['nativeMessaging', 'scripting'],
};

/**
 * Whether this build carries the CLI, which only Chrome and Edge do for now.
 */
export const supportsCLI = (): boolean => process.env.STYLEBOT_CLI === 'true';

type PermissionsCall = (
  permissions: chrome.permissions.Permissions,
  callback: (result: boolean) => void
) => void;

/**
 * Runs a chrome.permissions call. A browser that doesn't declare the
 * permissions as optional fails the call, which counts as no.
 */
const callPermissions = (
  call: PermissionsCall,
  permissions: chrome.permissions.Permissions
): Promise<boolean> =>
  new Promise(resolve => {
    try {
      call(permissions, result => {
        void chrome.runtime.lastError;
        resolve(!!result);
      });
    } catch {
      resolve(false);
    }
  });

export const hasCliPermissions = (): Promise<boolean> =>
  callPermissions(chrome.permissions.contains, CLI_PERMISSIONS);

/**
 * Asks for the CLI's permissions. Call it straight from a click, before any
 * await, since the browser only prompts during a user gesture.
 */
export const requestCliPermissions = (): Promise<boolean> =>
  callPermissions(chrome.permissions.request, CLI_REQUEST);

/**
 * Gives back the native host, which cuts the CLI off. Chrome refuses to remove
 * <all_urls> since the content scripts match it, and would fail the whole call.
 */
export const removeCliPermissions = (): Promise<boolean> =>
  callPermissions(chrome.permissions.remove, {
    permissions: CLI_PERMISSIONS.permissions,
  });

const CLI_CONNECTED_KEY = 'cli-connected';

/**
 * Records whether the background holds a connection to the CLI's native
 * host, for the editor to read since it can't ask the port itself.
 */
export const setCliConnected = (connected: boolean): Promise<void> =>
  chrome.storage.local.set({ [CLI_CONNECTED_KEY]: connected });

export const getCliConnected = async (): Promise<boolean> => {
  const items = await chrome.storage.local.get(CLI_CONNECTED_KEY);
  return items[CLI_CONNECTED_KEY] === true;
};

/**
 * Calls back with each change to whether the CLI is connected, until the
 * returned function is called.
 */
export const onCliConnectedChange = (
  callback: (connected: boolean) => void
): (() => void) => {
  const listener = (
    changes: Record<string, chrome.storage.StorageChange>,
    area: string
  ): void => {
    if (area === 'local' && CLI_CONNECTED_KEY in changes) {
      callback(changes[CLI_CONNECTED_KEY].newValue === true);
    }
  };

  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
};
