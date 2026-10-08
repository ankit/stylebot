/**
 * Runs the content scripts again in every tab they match. A reload cuts off
 * the copies already running there, and Chrome only injects into new pages.
 * Needs scripting, so it does nothing without it.
 */
export const restoreOpenTabs = async (): Promise<void> => {
  if (!chrome.scripting) {
    return;
  }

  const scripts = chrome.runtime.getManifest().content_scripts ?? [];

  await Promise.all(
    scripts.map(async script => {
      const tabs = await chrome.tabs.query({ url: script.matches });

      await Promise.all(
        tabs.flatMap(({ id }) =>
          id === undefined
            ? []
            : chrome.scripting
                .executeScript({
                  target: { tabId: id, allFrames: !!script.all_frames },
                  files: script.js ?? [],
                })
                // A page the extension can't script, or one closed meanwhile.
                .catch(() => undefined)
        )
      );
    })
  );
};
