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
  // Left out, the stored style keeps its current value.
  forceImportant?: boolean;
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
  route?: string;
};

export type OpenDonatePage = {
  name: 'OpenDonatePage';
};

export type OpenGoogleFontsPage = {
  name: 'OpenGoogleFontsPage';
};

export type OpenReportIssuePage = {
  name: 'OpenReportIssuePage';
};

export type SetReadability = {
  name: 'SetReadability';
  url: string;
  value: boolean;
};

// Sent when the reader mounts/unmounts — carries no state, the background
// re-queries GetIsReadabilityActive on the sender's tab for the live answer.
export type ReadabilityActiveChanged = {
  name: 'ReadabilityActiveChanged';
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

export type GetGoogleWebFontExists = {
  name: 'GetGoogleWebFontExists';
  url: string;
};

export type RunGoogleDriveSync = {
  name: 'RunGoogleDriveSync';
};

export type GetRecentColors = {
  name: 'GetRecentColors';
};

export type AddRecentColor = {
  name: 'AddRecentColor';
  color: string;
};

// tabId defaults to the sending tab, for messages from a content script.
export type OpenEditorWindow = {
  name: 'OpenEditorWindow';
  tabId?: number;
};

export type ToggleEditorWindow = {
  name: 'ToggleEditorWindow';
  tabId?: number;
};

export type CloseEditorWindow = {
  name: 'CloseEditorWindow';
  tabId?: number;
};

export type GetIsEditorWindowOpen = {
  name: 'GetIsEditorWindowOpen';
  tabId?: number;
};

type BackgroundPageMessage =
  | SetStyle
  | EnableStyle
  | DisableStyle
  | GetAllStyles
  | SetAllStyles
  | MoveStyle
  | GetStylesForPage
  | GetAllOptions
  | GetOption
  | SetOption
  | OpenOptionsPage
  | OpenDonatePage
  | OpenReportIssuePage
  | OpenGoogleFontsPage
  | SetReadability
  | ReadabilityActiveChanged
  | GetCommands
  | SetCommands
  | GetReadabilitySettings
  | SetReadabilitySettings
  | GetImportCss
  | GetGoogleWebFontExists
  | RunGoogleDriveSync
  | GetRecentColors
  | AddRecentColor
  | OpenEditorWindow
  | ToggleEditorWindow
  | CloseEditorWindow
  | GetIsEditorWindowOpen;

export default BackgroundPageMessage;
