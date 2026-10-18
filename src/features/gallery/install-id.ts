const INSTALL_ID_KEY = 'gallery-install-id';

/**
 * The random id this copy of Stylebot sends with installs, made once and
 * kept, so the gallery counts each install once.
 */
export const getInstallId = async (): Promise<string> => {
  const stored: string | undefined = (
    await chrome.storage.local.get(INSTALL_ID_KEY)
  )[INSTALL_ID_KEY];

  if (stored) {
    return stored;
  }

  const installId = crypto.randomUUID();
  await chrome.storage.local.set({ [INSTALL_ID_KEY]: installId });

  return installId;
};
