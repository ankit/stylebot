import ContextMenu from './contextmenu';

declare global {
  interface Window {
    // todo
    cache: any;
  }
}

/**
 * Save an option in cache and datastore.
 * Also pushes the change to all currently open tabs.
 * todo: tighten the types
 */
export const saveOption = (name: string, value: string | boolean): void => {
  window.cache.options[name] = value;
  chrome.storage.local.set({ options: window.cache.options });

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
