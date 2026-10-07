/**
 * Whether a tab shows the page asked for: any page on the site for a bare
 * site, otherwise the same url, ignoring the fragment.
 */
export const isSamePage = (tabUrl: URL, wanted: URL): boolean => {
  if (tabUrl.origin !== wanted.origin) {
    return false;
  }

  if (wanted.pathname === '/' && !wanted.search) {
    return true;
  }

  return (
    tabUrl.pathname.replace(/\/$/, '') === wanted.pathname.replace(/\/$/, '') &&
    tabUrl.search === wanted.search
  );
};

export const serializeTab = (tab: chrome.tabs.Tab) => ({
  id: tab.id,
  windowId: tab.windowId,
  active: tab.active,
  url: tab.url,
  title: tab.title,
});

export const waitForLoad = (tabId: number): Promise<void> =>
  new Promise(resolve => {
    const done = () => {
      chrome.tabs.onUpdated.removeListener(listener);
      resolve();
    };
    const listener = (id: number, info: chrome.tabs.TabChangeInfo) => {
      if (id === tabId && info.status === 'complete') {
        done();
      }
    };

    chrome.tabs.onUpdated.addListener(listener);

    // It may have finished before the listener was added.
    chrome.tabs
      .get(tabId)
      .then(tab => tab.status === 'complete' && done(), done);
  });

const CLI_WINDOW_KEY = 'cli-window';

/**
 * The window the CLI opens its tabs in, while it's still open.
 */
export const getCliWindowId = async (): Promise<number | undefined> => {
  const { [CLI_WINDOW_KEY]: id } = await chrome.storage.session.get(
    CLI_WINDOW_KEY
  );

  if (typeof id !== 'number') {
    return undefined;
  }

  return chrome.windows.get(id).then(
    () => id,
    () => undefined
  );
};

/**
 * Opens a url in the CLI's own window, creating it unfocused and sized like
 * the user's window when there isn't one, so pages lay out as they see them.
 */
export const openInCliWindow = async (
  url: string
): Promise<chrome.tabs.Tab> => {
  const windowId = await getCliWindowId();

  if (windowId !== undefined) {
    return chrome.tabs.create({ windowId, url });
  }

  const shape = await chrome.windows.getLastFocused().catch(() => undefined);
  const created = await chrome.windows.create({
    url,
    focused: false,
    type: 'normal',
    width: shape?.width,
    height: shape?.height,
  });

  await chrome.storage.session.set({ [CLI_WINDOW_KEY]: created.id });
  return (created.tabs as Array<chrome.tabs.Tab>)[0];
};

/**
 * Closes the CLI's window and its tabs, resolving to whether it was open.
 */
export const closeCliWindow = async (): Promise<boolean> => {
  const windowId = await getCliWindowId();
  await chrome.storage.session.remove(CLI_WINDOW_KEY);

  if (windowId !== undefined) {
    await chrome.windows.remove(windowId);
  }

  return windowId !== undefined;
};
