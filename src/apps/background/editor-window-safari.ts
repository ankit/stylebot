import type { EditorWindowBounds } from '@stylebot/types';

const REGROW_WATCH_MS = 3000;
const REGROW_POLL_MS = 100;
const REGROW_MAX_FIXES = 3;

/**
 * Dragging the window in Safari can stretch it to the width of the tiled
 * window it was opened from, which isn't a width the user chose. Bounds that
 * wide get the given width instead, keeping their right edge within the
 * tab's window.
 */
export const unstretchInSafari = async (
  bounds: EditorWindowBounds,
  tab: chrome.tabs.Tab,
  width: number
): Promise<EditorWindowBounds> => {
  const owner = await chrome.windows.get(tab.windowId);
  const ownerLeft = owner.left ?? 0;
  const ownerWidth = owner.width ?? Infinity;

  if (bounds.width < ownerWidth) {
    return bounds;
  }

  const right = Math.min(bounds.left + bounds.width, ownerLeft + ownerWidth);
  return {
    ...bounds,
    width,
    left: Math.max(right - width, 0),
  };
};

/**
 * Safari opens the window at the bounds it was given, then a moment later
 * maximizes it like the window it was opened from, so put it back once it has.
 */
export const restoreBoundsInSafari = (
  windowId: number,
  bounds: EditorWindowBounds
): void => {
  const deadline = Date.now() + REGROW_WATCH_MS;
  let fixes = 0;

  const check = async () => {
    const current = await chrome.windows.get(windowId).catch(() => undefined);
    if (!current) {
      return;
    }

    if (
      current.state !== 'normal' ||
      current.width !== bounds.width ||
      current.height !== bounds.height
    ) {
      fixes += 1;
      await chrome.windows
        .update(windowId, { state: 'normal', ...bounds })
        .catch(() => undefined);
    }

    if (Date.now() < deadline && fixes < REGROW_MAX_FIXES) {
      setTimeout(check, REGROW_POLL_MS);
    }
  };

  check();
};
