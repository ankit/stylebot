import { getCurrentTimestamp } from '@stylebot/utils';

const StylesMetadataUpdate = async (): Promise<void> => {
  return new Promise(resolve => {
    chrome.storage.local.get(items => {
      const stylesMetadata = items['styles-metadata'];

      if (typeof stylesMetadata?.modifiedTime === 'string') {
        resolve();
        return;
      }

      /* Earlier versions stored a bare timestamp here. Keep that timestamp
         instead of resetting it, so local styles don't look newer than the
         remote copy and push a spurious upload on the next sync. */
      const modifiedTime =
        typeof stylesMetadata === 'string'
          ? stylesMetadata
          : getCurrentTimestamp();

      chrome.storage.local.set({ 'styles-metadata': { modifiedTime } }, () => {
        resolve();
      });
    });
  });
};

export default StylesMetadataUpdate;
