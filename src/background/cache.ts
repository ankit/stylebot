import BackgroundPageStyles from './styles';
import BackgroundPageOptions from './options';

const init = (
  callback: (
    styles: BackgroundPageStyles,
    options: BackgroundPageOptions
  ) => void
): void => {
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
      options = new BackgroundPageOptions({
        mode: 'basic',
        contextMenu: true,
      });
    }

    if (callback) {
      callback(styles, options);
    }
  });
};

export default { init };
