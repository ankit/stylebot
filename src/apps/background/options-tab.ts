/**
 * Shows Options at the given route, in the tab it's already open in if any.
 * Not chrome.runtime.openOptionsPage: it drops the hash on Chrome and won't
 * reuse a tab on a different route on Firefox.
 */
export const openOptionsTab = async (route?: string): Promise<void> => {
  const base = chrome.runtime.getURL('options.html');
  const url = route ? `${base}#${route}` : base;

  const tabs = await chrome.tabs.query({});
  const existing = tabs.find(tab => tab.url?.startsWith(base));

  if (existing?.id !== undefined) {
    await chrome.tabs.update(existing.id, {
      active: true,
      ...(route ? { url } : {}),
    });

    if (existing.windowId !== undefined) {
      await chrome.windows.update(existing.windowId, { focused: true });
    }

    return;
  }

  await chrome.tabs.create({ url, active: true });
};
