// Chrome rate-limits captureVisibleTab, and a freshly activated tab needs a frame to paint.
const PAINT_DELAY_MS = 300;

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
    return chrome.tabs.captureVisibleTab(windowId, { format: 'png' });
  }

  const [shown] = await chrome.tabs.query({ active: true, windowId });
  await chrome.tabs.update(id as number, { active: true });

  try {
    await new Promise(resolve => setTimeout(resolve, PAINT_DELAY_MS));
    return await chrome.tabs.captureVisibleTab(windowId, { format: 'png' });
  } finally {
    if (shown?.id !== undefined) {
      await chrome.tabs
        .update(shown.id, { active: true })
        .catch(() => undefined);
    }
  }
};
