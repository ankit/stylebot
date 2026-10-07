/**
 * What the CLI needs: its native host, and every site, to read pages and
 * take screenshots. Optional, so they're requested only when it's turned on.
 */
export const CLI_PERMISSIONS: chrome.permissions.Permissions = {
  permissions: ['nativeMessaging'],
  origins: ['<all_urls>'],
};

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
  callPermissions(chrome.permissions.request, CLI_PERMISSIONS);

/**
 * Gives back the native host, which cuts the CLI off. Chrome refuses to remove
 * <all_urls> since the content scripts match it, and would fail the whole call.
 */
export const removeCliPermissions = (): Promise<boolean> =>
  callPermissions(chrome.permissions.remove, {
    permissions: CLI_PERMISSIONS.permissions,
  });
