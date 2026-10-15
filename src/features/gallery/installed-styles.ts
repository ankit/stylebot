// Remembers which gallery styles are installed and as which Stylebot
// profile, so the popup doesn't suggest them again.
const INSTALL_ID_KEY = 'gallery-install-id';
const INSTALLED_STYLES_KEY = 'gallery-installed';

/**
 * Where a gallery style was installed, at which version, and where its
 * gallery page is.
 */
export type InstalledStyleRecord = {
  url: string;
  profileId: string;
  version: number;
  group: string;
  slug: string;
};

// Keyed by gallery style id.
type InstalledStyles = Record<string, InstalledStyleRecord>;

const getInstalledStyles = async (): Promise<InstalledStyles> =>
  (await chrome.storage.local.get(INSTALLED_STYLES_KEY))[
    INSTALLED_STYLES_KEY
  ] ?? {};

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

export const getInstalledStyleIds = async (): Promise<Set<string>> =>
  new Set(Object.keys(await getInstalledStyles()));

export const rememberInstalledStyle = async (
  styleId: string,
  installed: InstalledStyleRecord
): Promise<void> => {
  const styles = await getInstalledStyles();

  await chrome.storage.local.set({
    [INSTALLED_STYLES_KEY]: { ...styles, [styleId]: installed },
  });
};
