import { StylebotOptions } from '../../types';

export const getOptions = async () => {
  const promise = new Promise((resolve, reject) => {
    chrome.extension.sendRequest(
      {
        name: 'getOptions',
      },
      response => {
        resolve(response.options);
      }
    );
  });

  return promise;
};

export const viewOptionsPage = () => {
  chrome.extension.sendRequest({
    name: 'showOptions',
  });
};
