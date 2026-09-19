import { getCurrentTimestamp } from '@stylebot/utils';

const StylesModifiedTimeUpdate = async (): Promise<void> => {
  const { styles } = await chrome.storage.local.get('styles');

  if (!styles) {
    return;
  }

  for (const url in styles) {
    const style = styles[url];

    if (!style.modifiedTime) {
      styles[url].modifiedTime = getCurrentTimestamp();
    }
  }

  await chrome.storage.local.set({ styles });
};

export default StylesModifiedTimeUpdate;
