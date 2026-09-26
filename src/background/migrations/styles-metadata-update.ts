import { STYLES_METADATA_KEY } from '@stylebot/styles';
import { getCurrentTimestamp } from '@stylebot/utils';

/**
 * Earlier versions stored `styles-metadata` as a bare timestamp string, while
 * every reader expects `{ modifiedTime }`. This runs on every startup rather
 * than once, because a profile migrated by those versions is still corrupt.
 */
const StylesMetadataUpdate = async (): Promise<void> => {
  const items = await chrome.storage.local.get(STYLES_METADATA_KEY);
  const metadata = items[STYLES_METADATA_KEY];

  if (typeof metadata === 'string') {
    // Keep the original timestamp. Replacing it with now would look like a
    // local edit and trigger a pointless upload on the next sync.
    await chrome.storage.local.set({
      [STYLES_METADATA_KEY]: { modifiedTime: metadata },
    });

    return;
  }

  if (
    metadata &&
    typeof metadata === 'object' &&
    typeof metadata.modifiedTime === 'string'
  ) {
    return;
  }

  await chrome.storage.local.set({
    [STYLES_METADATA_KEY]: { modifiedTime: getCurrentTimestamp() },
  });
};

export default StylesMetadataUpdate;
