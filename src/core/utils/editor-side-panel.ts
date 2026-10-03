import type { StylebotAppearance } from '@stylebot/types';

/**
 * Whether this browser can host the editor in its side panel. Content
 * scripts can't see chrome.sidePanel, so they can't use this.
 */
export const supportsEditorSidePanel = (): boolean =>
  typeof chrome !== 'undefined' && !!chrome.sidePanel?.open;

/**
 * Opens the editor in the tab's own side panel, which Chrome then shows only
 * while that tab is active. Chrome only allows this during a user gesture,
 * so callers must reach it before awaiting anything. Without an appearance
 * the panel paints first with the one it last used.
 */
export const openEditorSidePanel = (
  tabId: number,
  appearance?: StylebotAppearance
): Promise<void> => {
  const params = new URLSearchParams({
    tabId: String(tabId),
    host: 'sidepanel',
  });
  if (appearance) {
    params.set('appearance', appearance);
  }

  chrome.sidePanel.setOptions({
    tabId,
    path: `editor-window/index.html?${params}`,
    enabled: true,
  });

  return chrome.sidePanel.open({ tabId });
};

/**
 * Closes the tab's panel the way Chrome's own close button does, animating
 * it away. Chrome before 141 has no sidePanel.close, so there disabling the
 * panel removes it at once instead.
 */
export const closeEditorSidePanel = (tabId: number): Promise<void> =>
  chrome.sidePanel.close
    ? chrome.sidePanel.close({ tabId })
    : chrome.sidePanel.setOptions({ tabId, enabled: false });

/**
 * Whether the tab's editor side panel is showing, from the extension
 * contexts Chrome reports rather than any state we keep.
 */
export const isEditorSidePanelOpen = async (
  tabId: number
): Promise<boolean> => {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['SIDE_PANEL'],
  });

  return contexts.some(
    context =>
      new URL(context.documentUrl ?? '', location.href).searchParams.get(
        'tabId'
      ) === String(tabId)
  );
};
