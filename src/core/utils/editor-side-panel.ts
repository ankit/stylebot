/**
 * Whether this browser can host the editor in its side panel. Content
 * scripts can't see chrome.sidePanel, so they can't use this.
 */
export const supportsEditorSidePanel = (): boolean =>
  typeof chrome !== 'undefined' && !!chrome.sidePanel?.open;

/**
 * Sets up the tab's side panel to host the editor, or takes it away. The path
 * is the same every time, so setting it again doesn't reload an open panel,
 * which paints first with the theme it last used.
 */
export const configureEditorSidePanel = (
  tabId: number,
  enabled: boolean
): Promise<void> =>
  chrome.sidePanel.setOptions(
    enabled
      ? {
          tabId,
          path: `editor-window/index.html?tabId=${tabId}&host=sidepanel`,
          enabled,
        }
      : { tabId, enabled }
  );

/**
 * Opens the editor in the tab's own side panel, which Chrome then shows only
 * while that tab is active. Chrome only allows this during a user gesture,
 * so callers must reach it before awaiting anything.
 */
export const openEditorSidePanel = (tabId: number): Promise<void> => {
  configureEditorSidePanel(tabId, true);
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
