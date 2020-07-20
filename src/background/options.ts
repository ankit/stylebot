import ContextMenu from './contextmenu';
import { StylebotOptions } from 'types';

class BackgroundPageOptions {
  options: StylebotOptions;

  constructor(options: StylebotOptions) {
    this.options = options;
  }

  get(name: keyof StylebotOptions): StylebotOptions[keyof StylebotOptions] {
    return this.options[name];
  }

  getAll(): StylebotOptions {
    return this.options;
  }

  set(
    name: keyof StylebotOptions,
    value: StylebotOptions[keyof StylebotOptions]
  ): void {
    this.options = {
      ...this.options,
      [name]: value,
    };

    chrome.storage.local.set({ options: this.options });

    // If the option was contextMenu, update it
    if (name === 'contextMenu') {
      if (value === false) {
        ContextMenu.remove();
      } else {
        ContextMenu.init();
      }
    }
  }
}

export default BackgroundPageOptions;
