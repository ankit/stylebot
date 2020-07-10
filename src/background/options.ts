import ContextMenu from './contextmenu';

declare global {
  interface Window {
    // todo
    cache: any;
  }
}

/**
 * Propagate options to all existing tabs
 */
const propagateOptions = () => {
  const req = {
    name: 'setOptions',
    options: window.cache.options,
  };

  chrome.windows.getAll(
    {
      populate: true,
    },
    windows => {
      const w_len = windows.length;
      for (let i = 0; i < w_len; i++) {
        /* @ts-ignore */
        const t_len = windows[i].tabs.length;

        for (let j = 0; j < t_len; j++) {
          /* @ts-ignore */
          chrome.tabs.sendRequest(windows[i].tabs[j].id, req);
        }
      }
    }
  );
};

/**
 * Save an option in cache and datastore.
 * Also pushes the change to all currently open tabs.
 * todo: tighten the types
 */
export const saveOption = (name: string, value: string | boolean) => {
  window.cache.options[name] = value;
  chrome.storage.local.set({ options: window.cache.options });

  propagateOptions();

  // If the option was contextMenu, update it
  if (name === 'contextMenu') {
    if (value === false) {
      ContextMenu.remove();
    } else {
      ContextMenu.init();
    }
  }
};

export default { saveOption };
