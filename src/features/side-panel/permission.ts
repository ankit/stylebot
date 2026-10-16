import { tryPermissionsCall } from '@stylebot/utils';

const SIDE_PANEL_PERMISSIONS: chrome.permissions.Permissions = {
  permissions: ['sidePanel'],
};

let grantedSinceStart = false;

/**
 * Whether chrome.sidePanel can be called here: this context started with the
 * sidePanel permission. Using it after a grant at runtime, before Stylebot
 * reloads, crashes Chrome (crbug.com/426412557).
 */
export const isSidePanelGranted = (): boolean =>
  typeof chrome !== 'undefined' &&
  !grantedSinceStart &&
  !!chrome.sidePanel?.open;

/**
 * Whether the sidePanel permission came while this context was running, so
 * chrome.sidePanel waits for Stylebot to reload.
 */
export const isSidePanelAwaitingReload = (): boolean => grantedSinceStart;

/**
 * Marks chrome.sidePanel as off limits until Stylebot reloads, when the
 * permissions just granted include sidePanel.
 */
export const markSidePanelAwaitingReload = (
  permissions: chrome.permissions.Permissions
): void => {
  if (permissions.permissions?.includes('sidePanel')) {
    grantedSinceStart = true;
  }
};

/**
 * Asks for the sidePanel permission, which has no prompt. Must be called
 * during a user gesture, before awaiting anything, and only without it.
 */
export const requestSidePanelPermission = async (): Promise<boolean> => {
  const granted = await tryPermissionsCall(
    chrome.permissions.request,
    SIDE_PANEL_PERMISSIONS
  );

  if (granted) {
    markSidePanelAwaitingReload(SIDE_PANEL_PERMISSIONS);
  }

  return granted;
};

/**
 * Whether Stylebot holds the sidePanel permission, even one granted since
 * this context started.
 */
export const hasSidePanelPermission = (): Promise<boolean> =>
  tryPermissionsCall(chrome.permissions.contains, SIDE_PANEL_PERMISSIONS);

/**
 * Gives up the sidePanel permission, as browsers that force open the panel
 * of any extension holding it need.
 */
export const removeSidePanelPermission = (): Promise<boolean> =>
  tryPermissionsCall(chrome.permissions.remove, SIDE_PANEL_PERMISSIONS);
