import {
  SetOption,
  GetAllOptions,
  OpenOptionsPage,
  SetStyle,
  EnableStyle,
  DisableStyle,
  GetStylesForPage,
  SetReadability,
  GetAllCommands,
  OpenCommandsPage,
  GetAllOptionsResponse,
  GetStylesForPageResponse,
  GetAllCommandsResponse,
  StylebotOptions,
  GetReadabilitySettingsResponse,
  GetReadabilitySettings,
  SetReadabilitySettings,
  ReadabilitySettings,
} from '@stylebot/types';

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

export const getStylesForPage = async (
  important: boolean
): Promise<GetStylesForPageResponse> => {
  const message: GetStylesForPage = {
    name: 'GetStylesForPage',
    important,
  };

  return new Promise(resolve => {
    chrome.runtime.sendMessage(
      message,
      (response: GetStylesForPageResponse) => {
        resolve(response);
      }
    );
  });
};

export const openOptionsPage = (): void => {
  const message: OpenOptionsPage = {
    name: 'OpenOptionsPage',
  };

  chrome.runtime.sendMessage(message);
};

export const setStyle = (
  url: string,
  css: string,
  readability: boolean
): void => {
  const message: SetStyle = {
    name: 'SetStyle',
    url,
    css,
    readability,
  };

  chrome.runtime.sendMessage(message);
};

export const enableStyle = (url: string): void => {
  const message: EnableStyle = {
    name: 'EnableStyle',
    url,
  };

  chrome.runtime.sendMessage(message);
};

export const disableStyle = (url: string): void => {
  const message: DisableStyle = {
    name: 'DisableStyle',
    url,
  };

  chrome.runtime.sendMessage(message);
};

export const setReadability = (url: string, value: boolean): void => {
  const message: SetReadability = {
    name: 'SetReadability',
    value,
    url,
  };

  chrome.runtime.sendMessage(message);
};

export const getAllCommands = async (): Promise<GetAllCommandsResponse> => {
  const message: GetAllCommands = {
    name: 'GetAllCommands',
  };

  return new Promise(resolve => {
    chrome.runtime.sendMessage(message, (response: GetAllCommandsResponse) => {
      resolve(response);
    });
  });
};

export const openCommandsPage = (): void => {
  const message: OpenCommandsPage = {
    name: 'OpenCommandsPage',
  };

  chrome.runtime.sendMessage(message);
};

export const getReadabilitySettings = async (): Promise<
  GetReadabilitySettingsResponse
> => {
  const message: GetReadabilitySettings = {
    name: 'GetReadabilitySettings',
  };

  return new Promise(resolve => {
    chrome.runtime.sendMessage(
      message,
      (response: GetReadabilitySettingsResponse) => {
        resolve(response);
      }
    );
  });
};

export const setReadabilitySettings = (value: ReadabilitySettings): void => {
  const message: SetReadabilitySettings = {
    name: 'SetReadabilitySettings',
    value,
  };

  chrome.runtime.sendMessage(message);
};
