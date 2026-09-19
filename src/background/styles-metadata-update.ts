import { getCurrentTimestamp } from '@stylebot/utils';

const StylesMetadataUpdate = async (): Promise<void> => {
  const items = await chrome.storage.local.get('styles-metadata');

  if (!items['styles-metadata']) {
    await chrome.storage.local.set({
      'styles-metadata': getCurrentTimestamp(),
    });
  }
};

export default StylesMetadataUpdate;
