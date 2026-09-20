import {
  SetOption,
  GetAllOptions,
  OpenOptionsPage,
  SetStyle,
  EnableStyle,
  DisableStyle,
  GetStylesForPage,
  SetReadability,
  GetCommands,
  GetAllOptionsResponse,
  GetStylesForPageResponse,
  GetCommandsResponse,
  StylebotOptions,
  GetReadabilitySettingsResponse,
  GetReadabilitySettings,
  SetReadabilitySettings,
  ReadabilitySettings,
  OpenDonatePage,
  OpenGoogleFontsPage,
  GetRecentColors,
  AddRecentColor,
  GetRecentColorsResponse,
  AddRecentColorResponse,
} from '@stylebot/types';

export const getAllOptions = (): Promise<StylebotOptions> => {
  const message: GetAllOptions = {
    name: 'GetAllOptions',
  };

  return chrome.runtime.sendMessage<GetAllOptions, GetAllOptionsResponse>(
    message
  );
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

export const getStylesForPage = (
  important: boolean
): Promise<GetStylesForPageResponse> => {
  const message: GetStylesForPage = {
    name: 'GetStylesForPage',
    important,
  };

  return chrome.runtime.sendMessage<GetStylesForPage, GetStylesForPageResponse>(
    message
  );
};

export const openOptionsPage = (route?: string): void => {
  const message: OpenOptionsPage = {
    name: 'OpenOptionsPage',
    ...(route ? { route } : {}),
  };

  chrome.runtime.sendMessage(message);
};

export const openDonatePage = (): void => {
  const message: OpenDonatePage = {
    name: 'OpenDonatePage',
  };

  chrome.runtime.sendMessage(message);
};

export const openGoogleFontsPage = (): void => {
  const message: OpenGoogleFontsPage = {
    name: 'OpenGoogleFontsPage',
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

export const getCommands = (): Promise<GetCommandsResponse> => {
  const message: GetCommands = {
    name: 'GetCommands',
  };

  return chrome.runtime.sendMessage<GetCommands, GetCommandsResponse>(message);
};

export const getReadabilitySettings =
  (): Promise<GetReadabilitySettingsResponse> => {
    const message: GetReadabilitySettings = {
      name: 'GetReadabilitySettings',
    };

    return chrome.runtime.sendMessage<
      GetReadabilitySettings,
      GetReadabilitySettingsResponse
    >(message);
  };

export const setReadabilitySettings = (value: ReadabilitySettings): void => {
  const message: SetReadabilitySettings = {
    name: 'SetReadabilitySettings',
    value,
  };

  chrome.runtime.sendMessage(message);
};

export const getRecentColors = async (): Promise<GetRecentColorsResponse> => {
  const message: GetRecentColors = {
    name: 'GetRecentColors',
  };

  return new Promise(resolve => {
    chrome.runtime.sendMessage(message, (response: GetRecentColorsResponse) => {
      resolve(response);
    });
  });
};

export const addRecentColor = async (
  color: string
): Promise<AddRecentColorResponse> => {
  const message: AddRecentColor = {
    name: 'AddRecentColor',
    color,
  };

  return new Promise(resolve => {
    chrome.runtime.sendMessage(message, (response: AddRecentColorResponse) => {
      resolve(response);
    });
  });
};
