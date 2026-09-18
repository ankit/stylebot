import { getCurrentTimestamp } from '@stylebot/utils';

/**
 * Earlier versions stored `styles-metadata` as a bare timestamp string, while
 * every reader expects `{ modifiedTime }`. This runs on every startup rather
 * than once, because a profile migrated by those versions is still corrupt.
 */
const StylesMetadataUpdate = async (): Promise<void> => {
  return new Promise(resolve => {
    chrome.storage.local.get('styles-metadata', items => {
      const metadata = items['styles-metadata'];

      if (typeof metadata === 'string') {
        // Keep the original timestamp. Replacing it with now would look like a
        // local edit and trigger a pointless upload on the next sync.
        chrome.storage.local.set(
          { 'styles-metadata': { modifiedTime: metadata } },
          () => resolve()
        );

        return;
      }

      if (
        metadata &&
        typeof metadata === 'object' &&
        typeof metadata.modifiedTime === 'string'
      ) {
        resolve();
        return;
      }

      chrome.storage.local.set(
        { 'styles-metadata': { modifiedTime: getCurrentTimestamp() } },
        () => resolve()
      );
    });
  });
};

export default StylesMetadataUpdate;
