import type {
  SetStyle,
  SetActiveProfile,
  CreateProfile,
  CreateProfileResponse,
  RenameProfile,
  DeleteProfile,
  SetReadability,
  SetOption,
  GetAllOptions,
  EnableStyle,
  GetStylesForPage,
  GetCommands,
  GetAllOptionsResponse,
  GetStylesForPageResponse,
  GetCommandsResponse,
  StylebotOptions,
  GetReadabilitySettingsResponse,
  GetReadabilitySettings,
  SetReadabilitySettings,
  ReadabilitySettings,
  GetRecentColors,
  AddRecentColor,
  GetRecentColorsResponse,
  AddRecentColorResponse,
  OpenEditorWindow,
  ToggleEditorWindow,
  CloseEditorWindow,
  GetIsEditorWindowOpen,
  GetIsEditorWindowOpenResponse,
  OpenEditorSidePanel,
  OpenEditorSidePanelResponse,
  CloseEditorSidePanel,
  ChatGetStatus,
  ChatConnect,
  ChatRemoveKey,
  ChatSetModel,
  ChatGetThread,
  ChatSetThread,
  ChatStatusResponse,
  ChatConnectResponse,
  ChatGetThreadResponse,
  ChatProviderId,
  ChatTurn,
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

export const setStyle = (
  url: string,
  css: string,
  readability: boolean,
  forceImportant: boolean,
  profileId?: string
): void => {
  const message: SetStyle = {
    name: 'SetStyle',
    url,
    css,
    readability,
    forceImportant,
    profileId,
  };

  chrome.runtime.sendMessage(message);
};

export const setActiveProfile = (url: string, profileId: string): void => {
  const message: SetActiveProfile = {
    name: 'SetActiveProfile',
    url,
    profileId,
  };

  chrome.runtime.sendMessage(message);
};

export const createProfile = (
  url: string,
  profileName: string,
  sourceProfileId?: string
): Promise<CreateProfileResponse> => {
  const message: CreateProfile = {
    name: 'CreateProfile',
    url,
    profileName,
    sourceProfileId,
    activate: true,
  };

  return chrome.runtime.sendMessage<CreateProfile, CreateProfileResponse>(
    message
  );
};

export const renameProfile = (
  url: string,
  profileId: string,
  profileName: string
): void => {
  const message: RenameProfile = {
    name: 'RenameProfile',
    url,
    profileId,
    profileName,
  };

  chrome.runtime.sendMessage(message);
};

export const deleteProfile = (url: string, profileId: string): void => {
  const message: DeleteProfile = { name: 'DeleteProfile', url, profileId };

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

export const getStylesForPage = (): Promise<GetStylesForPageResponse> => {
  const message: GetStylesForPage = {
    name: 'GetStylesForPage',
  };

  return chrome.runtime.sendMessage<GetStylesForPage, GetStylesForPageResponse>(
    message
  );
};

export const enableStyle = (url: string): void => {
  const message: EnableStyle = {
    name: 'EnableStyle',
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

// From a content script the background resolves the tab itself; the window
// host passes the tab it drives.
export const openEditorWindow = (tabId?: number): void => {
  const message: OpenEditorWindow = { name: 'OpenEditorWindow', tabId };
  chrome.runtime.sendMessage(message);
};

export const toggleEditorWindow = (tabId?: number): void => {
  const message: ToggleEditorWindow = { name: 'ToggleEditorWindow', tabId };
  chrome.runtime.sendMessage(message);
};

export const closeEditorWindow = (tabId?: number): void => {
  const message: CloseEditorWindow = { name: 'CloseEditorWindow', tabId };
  chrome.runtime.sendMessage(message);
};

export const getIsEditorWindowOpen = (
  tabId?: number
): Promise<GetIsEditorWindowOpenResponse> => {
  const message: GetIsEditorWindowOpen = {
    name: 'GetIsEditorWindowOpen',
    tabId,
  };

  return chrome.runtime.sendMessage<
    GetIsEditorWindowOpen,
    GetIsEditorWindowOpenResponse
  >(message);
};

/**
 * Asks the background to open the tab's side panel. Must be sent without
 * awaiting anything first, so the background still has the user's gesture.
 */
export const requestEditorSidePanel = (
  tabId?: number
): Promise<OpenEditorSidePanelResponse> => {
  const message: OpenEditorSidePanel = { name: 'OpenEditorSidePanel', tabId };

  return chrome.runtime.sendMessage<
    OpenEditorSidePanel,
    OpenEditorSidePanelResponse
  >(message);
};

export const requestCloseEditorSidePanel = (tabId?: number): void => {
  const message: CloseEditorSidePanel = { name: 'CloseEditorSidePanel', tabId };
  chrome.runtime.sendMessage(message);
};

export const chatGetStatus = (): Promise<ChatStatusResponse> =>
  chrome.runtime.sendMessage<ChatGetStatus, ChatStatusResponse>({
    name: 'ChatGetStatus',
  });

export const chatConnect = (
  provider: ChatProviderId,
  key: string
): Promise<ChatConnectResponse> =>
  chrome.runtime.sendMessage<ChatConnect, ChatConnectResponse>({
    name: 'ChatConnect',
    provider,
    key,
  });

export const chatGetThread = (url: string): Promise<ChatGetThreadResponse> =>
  chrome.runtime.sendMessage<ChatGetThread, ChatGetThreadResponse>({
    name: 'ChatGetThread',
    url,
  });

export const chatSetThread = (url: string, turns: Array<ChatTurn>): void => {
  const message: ChatSetThread = { name: 'ChatSetThread', url, turns };
  chrome.runtime.sendMessage(message);
};

export const chatRemoveKey = (
  provider: ChatProviderId
): Promise<ChatStatusResponse> =>
  chrome.runtime.sendMessage<ChatRemoveKey, ChatStatusResponse>({
    name: 'ChatRemoveKey',
    provider,
  });

export const chatSetModel = (
  provider: ChatProviderId,
  model: string
): Promise<ChatStatusResponse> =>
  chrome.runtime.sendMessage<ChatSetModel, ChatStatusResponse>({
    name: 'ChatSetModel',
    provider,
    model,
  });
