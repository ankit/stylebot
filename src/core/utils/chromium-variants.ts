/*
 * Chromium variants that have Chrome's extension APIs but don't honour them,
 * and the only place Stylebot names them. Each is found once and remembered
 * for every other context.
 */

export type ChromiumVariant = 'vivaldi' | 'arc';

type BrokenFeatures = {
  sidePanel: boolean;
  shortcuts: boolean;
};

const BROKEN_FEATURES: Record<ChromiumVariant, BrokenFeatures> = {
  // Hosts side panels as tabs, one shared across all tabs.
  vivaldi: { sidePanel: true, shortcuts: false },
  // Loads side panels but never shows them, and registers extension
  // shortcuts but never passes them on.
  arc: { sidePanel: true, shortcuts: true },
};

export const CHROMIUM_VARIANT_KEY = 'chromiumVariant';

// What 4.0.0-4.0.3 stored on finding Vivaldi.
const LEGACY_VIVALDI_KEY = 'sidePanelIgnoresTabs';

/**
 * Whether the editor's side panel works in the variant, or in Chrome and
 * the rest when there is none.
 */
export const doesSidePanelWorkInChromiumVariant = (
  variant: ChromiumVariant | undefined
): boolean => !variant || !BROKEN_FEATURES[variant].sidePanel;

/**
 * Whether Stylebot's shortcuts work in the variant, or in Chrome and the
 * rest when there is none.
 */
export const doShortcutsWorkInChromiumVariant = (
  variant: ChromiumVariant | undefined
): boolean => !variant || !BROKEN_FEATURES[variant].shortcuts;

/**
 * The Chromium variant Stylebot found itself in, if any.
 */
export const getChromiumVariant = async (): Promise<
  ChromiumVariant | undefined
> => {
  const items = await chrome.storage.local.get([
    CHROMIUM_VARIANT_KEY,
    LEGACY_VIVALDI_KEY,
  ]);

  return (
    items[CHROMIUM_VARIANT_KEY] ??
    (items[LEGACY_VIVALDI_KEY] ? 'vivaldi' : undefined)
  );
};

/**
 * Remembers the Chromium variant Stylebot found itself in.
 */
export const rememberChromiumVariant = async (
  variant: ChromiumVariant
): Promise<void> => {
  if ((await getChromiumVariant()) !== variant) {
    await chrome.storage.local.set({ [CHROMIUM_VARIANT_KEY]: variant });
  }
};

/**
 * The Chromium variant showing this page, as far as the page can tell at
 * once: only Arc, by the palette variables it adds to every page, since its
 * user agent matches Chrome's. Arc adds them a moment after the page loads.
 */
export const detectChromiumVariantSync = (): ChromiumVariant | undefined => {
  const style = getComputedStyle(document.documentElement);

  if (style.getPropertyValue('--arc-palette-title')) {
    return 'arc';
  }

  return undefined;
};

/**
 * Vivaldi, by the data it adds to every window the windows API returns,
 * where there is a windows API.
 */
const detectVivaldi = async (): Promise<ChromiumVariant | undefined> => {
  if (!chrome.windows) {
    return undefined;
  }

  const [win] = await chrome.windows.getAll();
  return win && 'vivExtData' in win ? 'vivaldi' : undefined;
};

/**
 * Arc, waiting a while for it to add its palette, where there is a page.
 */
const detectArc = async (): Promise<ChromiumVariant | undefined> => {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const waitMs = 2000;
  const pollMs = 250;

  for (let waited = 0; waited <= waitMs; waited += pollMs) {
    const variant = detectChromiumVariantSync();
    if (variant) {
      return variant;
    }

    await new Promise(resolve => setTimeout(resolve, pollMs));
  }

  return undefined;
};

/**
 * Finds the Chromium variant Stylebot runs in and remembers it. A content
 * script has no windows API, so it only knows Vivaldi once the background or
 * another extension page has found it.
 */
export const detectChromiumVariant = async (): Promise<
  ChromiumVariant | undefined
> => {
  if (!/Chrome\//.test(navigator.userAgent)) {
    return undefined;
  }

  const known = await getChromiumVariant();
  if (known) {
    return known;
  }

  const variant = (await detectVivaldi()) ?? (await detectArc());
  if (variant) {
    await rememberChromiumVariant(variant);
  }

  return variant;
};
