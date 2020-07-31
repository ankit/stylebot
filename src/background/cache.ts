import { defaultOptions } from '@stylebot/settings';

import BackgroundPageStyles from './styles';
import BackgroundPageOptions from './options';

const init = async (): Promise<{
  styles: BackgroundPageStyles;
  options: BackgroundPageOptions;
}> => {
  return new Promise(resolve => {
    chrome.storage.local.get(['options', 'styles'], items => {
      let styles: BackgroundPageStyles;

      if (items['styles']) {
        styles = new BackgroundPageStyles(items['styles']);
      } else {
        styles = new BackgroundPageStyles({});
      }

      let options: BackgroundPageOptions;

      if (items['options']) {
        options = new BackgroundPageOptions(items['options']);
      } else {
        options = new BackgroundPageOptions(defaultOptions);
      }

      resolve({ styles, options });
    });
  });
};

export default { init };
