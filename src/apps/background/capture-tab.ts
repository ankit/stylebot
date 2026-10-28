// Chrome rate-limits captureVisibleTab, and a freshly activated tab needs a frame to paint.
const PAINT_DELAY_MS = 300;
// Chrome allows two captures a second, so one that comes too soon waits a turn.
const QUOTA_DELAY_MS = 500;
const QUOTA_RETRIES = 3;

/**
 * Captures a window's shown tab, waiting out Chrome's rate limit if it's hit.
 */
const captureVisible = async (
  windowId: number,
  retries = QUOTA_RETRIES
): Promise<string> => {
  try {
    return await chrome.tabs.captureVisibleTab(windowId, { format: 'png' });
  } catch (error) {
    if (
      retries === 0 ||
      !/MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND/.test(String(error))
    ) {
      throw error;
    }

    await new Promise(resolve => setTimeout(resolve, QUOTA_DELAY_MS));
    return captureVisible(windowId, retries - 1);
  }
};

/**
 * Captures what a tab shows as a PNG data URL. Chrome only captures a
 * window's shown tab, so a background tab is shown just for the capture.
 */
export const captureTab = async ({
  id,
  windowId,
  active,
}: chrome.tabs.Tab): Promise<string> => {
  if (active) {
    return captureVisible(windowId);
  }

  const [shown] = await chrome.tabs.query({ active: true, windowId });
  await chrome.tabs.update(id as number, { active: true });

  try {
    await new Promise(resolve => setTimeout(resolve, PAINT_DELAY_MS));
    return await captureVisible(windowId);
  } finally {
    if (shown?.id !== undefined) {
      await chrome.tabs
        .update(shown.id, { active: true })
        .catch(() => undefined);
    }
  }
};
