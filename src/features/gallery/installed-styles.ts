import type { StyleMap } from '@stylebot/types';

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
  // hashCss of the installed CSS, to tell if the profile was edited since.
  cssHash: string;
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

/**
 * The gallery styles still installed: their profiles may since have been
 * removed, here or by sync, which leaves them free to suggest again.
 */
export const getInstalledStyleIds = async (
  styles: StyleMap
): Promise<Set<string>> => {
  const installed = Object.entries(await getInstalledStyles());

  return new Set(
    installed
      .filter(([, { url, profileId }]) => styles[url]?.profiles?.[profileId])
      .map(([styleId]) => styleId)
  );
};

/**
 * The profile name each of the given gallery styles is installed as, leaving
 * out the ones not installed, or whose profile has since been removed.
 */
export const getInstalledProfileNames = async (
  styles: StyleMap,
  styleIds: Array<string>
): Promise<Record<string, string>> => {
  const installed = await getInstalledStyles();

  return Object.fromEntries(
    styleIds.flatMap(styleId => {
      const record = installed[styleId];
      const profile =
        record && styles[record.url]?.profiles?.[record.profileId];

      return profile ? [[styleId, profile.name]] : [];
    })
  );
};

/**
 * The gallery style a profile was installed from, if any.
 */
export const getInstalledStyleForProfile = async (
  url: string,
  profileId: string
): Promise<InstalledStyleRecord | null> =>
  Object.values(await getInstalledStyles()).find(
    installed => installed.url === url && installed.profileId === profileId
  ) ?? null;

/**
 * Where a gallery style was installed, if it was.
 */
export const getInstalledStyle = async (
  styleId: string
): Promise<InstalledStyleRecord | null> => {
  const installed = await getInstalledStyles();

  return installed[styleId] ?? null;
};

export const rememberInstalledStyle = async (
  styleId: string,
  installed: InstalledStyleRecord
): Promise<void> => {
  const styles = await getInstalledStyles();

  await chrome.storage.local.set({
    [INSTALLED_STYLES_KEY]: { ...styles, [styleId]: installed },
  });
};
