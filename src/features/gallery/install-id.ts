const INSTALL_ID_KEY = 'gallery-install-id';

/**
 * The install id kept in a storage area, or undefined if it has none or
 * can't be read.
 */
const readInstallId = async (
  storage: chrome.storage.StorageArea | undefined
): Promise<string | undefined> => {
  try {
    const items = await storage?.get(INSTALL_ID_KEY);

    return items?.[INSTALL_ID_KEY];
  } catch {
    return undefined;
  }
};

/**
 * Saves the install id to a storage area, saying whether it was saved.
 */
const writeInstallId = async (
  storage: chrome.storage.StorageArea | undefined,
  installId: string
): Promise<boolean> => {
  if (!storage) {
    return false;
  }

  try {
    await storage.set({ [INSTALL_ID_KEY]: installId });

    return true;
  } catch {
    return false;
  }
};

/**
 * The random id Stylebot sends with installs, made once and kept in sync
 * storage so it follows the browser account and the gallery counts each
 * person once. Falls back to local storage where sync isn't available.
 */
export const getInstallId = async (): Promise<string> => {
  const { sync, local } = chrome.storage;
  const synced = await readInstallId(sync);

  if (synced) {
    return synced;
  }

  const installId = (await readInstallId(local)) ?? crypto.randomUUID();
  const savedToSync = await writeInstallId(sync, installId);

  if (!savedToSync) {
    await writeInstallId(local, installId);
  }

  return installId;
};
