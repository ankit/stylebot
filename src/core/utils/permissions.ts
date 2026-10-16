type PermissionsCall = (
  permissions: chrome.permissions.Permissions,
  callback: (result: boolean) => void
) => void;

/**
 * Runs a chrome.permissions call. A browser that doesn't declare the
 * permissions as optional fails the call, which counts as no.
 */
export const tryPermissionsCall = (
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
