// Only declared on Chrome/Edge — the Firefox manifest never requests the
// "scripting" permission, so `editor/index.js` stays statically injected
// there and this becomes a no-op.
export const ensureEditorInjected = async (tabId: number): Promise<void> => {
  if (typeof chrome.scripting === 'undefined') {
    return;
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['editor/index.js'],
    });
  } catch {
    // Tab may have closed, navigated away, or be a page scripting can't
    // target (chrome://, the Web Store, etc.) — nothing to inject into.
  }
};
