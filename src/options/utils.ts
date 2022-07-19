import {
  GetAllStyles,
  SetAllStyles,
  SetOption,
  GetAllOptions,
  GetAllStylesResponse,
  GetAllOptionsResponse,
  StylebotOptions,
  GetCommands,
  SetCommands,
  GetCommandsResponse,
  StylebotCommands,
  StyleMap,
  RunGoogleDriveSync,
} from '@stylebot/types';

export const getAllStyles = async (): Promise<GetAllStylesResponse> => {
  const message: GetAllStyles = {
    name: 'GetAllStyles',
  };

  return new Promise(resolve => {
    chrome.runtime.sendMessage(message, (response: GetAllStylesResponse) => {
      resolve(response);
    });
  });
};

export const getAllOptions = async (): Promise<StylebotOptions> => {
  const message: GetAllOptions = {
    name: 'GetAllOptions',
  };

  return new Promise(resolve => {
    chrome.runtime.sendMessage(message, (response: GetAllOptionsResponse) => {
      resolve(response);
    });
  });
};

export const setAllStyles = (styles: StyleMap): void => {
  const message: SetAllStyles = {
    name: 'SetAllStyles',
    styles,
  };

  chrome.runtime.sendMessage(message);
};

export const setOption = (
  name: keyof StylebotOptions,
  value: StylebotOptions[keyof StylebotOptions]
): void => {
  const message: SetOption = {
    name: 'SetOption',
    option: {
      name,
      value,
    },
  };

  chrome.runtime.sendMessage(message);
};

export const getCommands = async (): Promise<GetCommandsResponse> => {
  const message: GetCommands = {
    name: 'GetCommands',
  };

  return new Promise(resolve => {
    chrome.runtime.sendMessage(message, (response: GetCommandsResponse) => {
      resolve(response);
    });
  });
};

export const setCommands = (commands: StylebotCommands): void => {
  const message: SetCommands = {
    name: 'SetCommands',
    value: commands,
  };

  chrome.runtime.sendMessage(message);
};

export const runGoogleDriveSync = async (): Promise<void> => {
  const message: RunGoogleDriveSync = {
    name: 'RunGoogleDriveSync',
  };

  return new Promise(resolve => {
    chrome.runtime.sendMessage(message, () => {
      resolve();
    });
  });
};

export const importStylesWithFilePicker = (): Promise<StyleMap> => {
  return new Promise((resolve, reject) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json';

    fileInput.addEventListener('change', (event: Event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files && files[0]) {
        const file = files[0];
        if (file.type && file.type !== 'application/json') {
          reject('Only JSON format is supported.');
          return;
        }

        const reader = new FileReader();
        reader.readAsText(file);

        reader.onload = () => {
          try {
            const styles = JSON.parse(reader.result as string);
            resolve(styles);
          } catch (e) {
            reject(e);
          }
        };

        reader.onerror = () => {
          reject(reader.error);
        };
      }
    });

    document.body.appendChild(fileInput);
    fileInput.click();
    fileInput.remove();
  });
};

export const exportAsJSONFile = (styles: StyleMap): void => {
  const json = JSON.stringify(styles);
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(json);
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute('href', dataStr);
  downloadAnchorNode.setAttribute('download', 'stylebot_backup.json');
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};
