export const INSTALL_TIME_KEY = 'install-time';

/**
 * Records when Stylebot was installed, the first time it is installed or
 * updated; an update stands in for the install of users who predate the key.
 */
export const recordInstallTime = async (now = Date.now()): Promise<void> => {
  const items = await chrome.storage.local.get(INSTALL_TIME_KEY);

  if (typeof items[INSTALL_TIME_KEY] !== 'number') {
    await chrome.storage.local.set({ [INSTALL_TIME_KEY]: now });
  }
};
