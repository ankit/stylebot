import {
  StylebotOptions,
  StylebotCommands,
  ReadabilitySettings,
  StyleMap,
} from '@stylebot/types';

export type SetStyle = {
  name: 'SetStyle';
  url: string;
  css: string;
  readability: boolean;
};

export type EnableStyle = {
  name: 'EnableStyle';
  url: string;
};

export type DisableStyle = {
  name: 'DisableStyle';
  url: string;
};

export type GetAllStyles = {
  name: 'GetAllStyles';
};

export type SetAllStyles = {
  name: 'SetAllStyles';
  styles: StyleMap;
  shouldPersist?: boolean;
};

export type MoveStyle = {
  name: 'MoveStyle';
  sourceUrl: string;
  destinationUrl: string;
};

export type GetStylesForPage = {
  name: 'GetStylesForPage';
  tab?: chrome.tabs.Tab;
  important?: boolean;
};

export type GetStylesForIframe = {
  name: 'GetStylesForIframe';
  url: string;
  important?: boolean;
};

export type GetAllOptions = {
  name: 'GetAllOptions';
};

export type GetOption = {
  name: 'GetOption';
  optionName: keyof StylebotOptions;
};

export type SetOption = {
  name: 'SetOption';
  option: {
    name: keyof StylebotOptions;
    value: StylebotOptions[keyof StylebotOptions]; // todo
  };
};

export type OpenOptionsPage = {
  name: 'OpenOptionsPage';
};

export type OpenDonatePage = {
  name: 'OpenDonatePage';
};

export type SetReadability = {
  name: 'SetReadability';
  url: string;
  value: boolean;
};

export type GetCommands = {
  name: 'GetCommands';
};

export type SetCommands = {
  name: 'SetCommands';
  value: StylebotCommands;
};

export type GetReadabilitySettings = {
  name: 'GetReadabilitySettings';
};

export type SetReadabilitySettings = {
  name: 'SetReadabilitySettings';
  value: ReadabilitySettings;
};

export type GetImportCss = {
  name: 'GetImportCss';
  url: string;
};

export type RunGoogleDriveSync = {
  name: 'RunGoogleDriveSync';
};

type BackgroundPageMessage =
  | SetStyle
  | EnableStyle
  | DisableStyle
  | GetAllStyles
  | SetAllStyles
  | MoveStyle
  | GetStylesForPage
  | GetStylesForIframe
  | GetAllOptions
  | GetOption
  | SetOption
  | OpenOptionsPage
  | OpenDonatePage
  | SetReadability
  | GetCommands
  | SetCommands
  | GetReadabilitySettings
  | SetReadabilitySettings
  | GetImportCss
  | RunGoogleDriveSync;

export default BackgroundPageMessage;
