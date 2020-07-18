import BackgroundPageStyles from './styles';
import { StylebotOptions } from '@stylebot/types';

// TODO: Make this only accessible as arg / via getters/setters
window.cache = {
  styles: {},
  options: {},
  importRules: {},
};

const init = (
  callback: (styles: BackgroundPageStyles, options: StylebotOptions) => void
): void => {
  chrome.storage.local.get(['options', 'styles'], items => {
    const options = items['options'] || {
      useShortcutKey: true,
      shortcutKey: 77, // keydown code for 'm'
      shortcutMetaKey: 'alt',
      mode: 'Basic',
      sync: false,
      contextMenu: true,
    };

    let styles: BackgroundPageStyles;
    if (items['styles']) {
      styles = new BackgroundPageStyles(items['styles']);
    } else {
      styles = new BackgroundPageStyles({});
    }

    window.cache.options = options;
    window.cache.styles = styles;

    if (callback) {
      callback(styles, options);
    }
  });
};

export default { init };
