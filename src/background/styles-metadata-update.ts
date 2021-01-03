import { format } from 'date-fns';

const StylesMetadataUpdate = async (): Promise<void> => {
  return new Promise(resolve => {
    chrome.storage.local.get(items => {
      if (!items['styles-metadata']) {
        chrome.storage.local.set(
          {
            'styles-metadata': format(
              new Date(),
              "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"
            ),
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
