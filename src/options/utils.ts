import {
  GetAllStyles,
  SetAllStyles,
  SetOption,
  GetAllOptions,
  GetAllStylesResponse,
  GetAllOptionsResponse,
  StylebotOptions,
  CopyToClipboard,
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

export const copyToClipboard = (text: string): void => {
  const message: CopyToClipboard = {
    name: 'CopyToClipboard',
    text,
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
