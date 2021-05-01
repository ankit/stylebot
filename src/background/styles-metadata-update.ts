import { getCurrentTimestamp } from '@stylebot/utils';

const StylesMetadataUpdate = async (): Promise<void> => {
  return new Promise(resolve => {
    chrome.storage.local.get(items => {
      if (!items['styles-metadata']) {
        chrome.storage.local.set(
          {
            'styles-metadata': getCurrentTimestamp(),
          },
          () => {
            resolve();
          }
        );
      } else {
        resolve();
      }
    });
  });
};

export default StylesMetadataUpdate;