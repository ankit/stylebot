import { format } from 'date-fns';

const StylesModifiedTimeUpdate = async (): Promise<void> => {
  return new Promise(resolve => {
    chrome.storage.local.get(items => {
      if (items['styles']) {
        const styles = items['styles'];

        for (const url in styles) {
          const style = styles[url];

          if (!style.modifiedTime) {
            styles[url].modifiedTime = format(
              new Date(),
              "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"
            );
          }
        }

        chrome.storage.local.set({ styles }, () => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  });
};

export default StylesModifiedTimeUpdate;
