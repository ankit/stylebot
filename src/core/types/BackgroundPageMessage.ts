import type { StyleMap } from './styles';
import type { StylebotOptions } from './options';
import type { ReadabilitySettings } from './readability';
import type { ChatProviderId, ChatTurn } from './chat';

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

export type OpenShortcutsPage = {
  name: 'OpenShortcutsPage';
};

export type OpenDonatePage = {
  name: 'OpenDonatePage';
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

export type GetCompiledStyles = {
  name: 'GetCompiledStyles';
};

export type GetGoogleWebFontExists = {
  name: 'GetGoogleWebFontExists';
  url: string;
};

export type GetGoogleFontFile = {
  name: 'GetGoogleFontFile';
  url: string;
};

export type RunGoogleDriveSync = {
  name: 'RunGoogleDriveSync';
};

export type ScanVersionHistory = {
  name: 'ScanVersionHistory';
  // Absent asks for every version held.
  limit?: number;
};

export type RestoreVersion = {
  name: 'RestoreVersion';
  versionId: string;
  // Absent restores the whole version; a list restores only those sites.
  urls?: Array<string>;
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

export type OpenEditorSidePanel = {
  name: 'OpenEditorSidePanel';
  tabId?: number;
};

export type CloseEditorSidePanel = {
  name: 'CloseEditorSidePanel';
  tabId?: number;
};

export type GetIsEditorWindowOpen = {
  name: 'GetIsEditorWindowOpen';
  tabId?: number;
};

export type ChatGetStatus = {
  name: 'ChatGetStatus';
};

// Checks the key with the provider before storing it.
export type ChatConnect = {
  name: 'ChatConnect';
  provider: ChatProviderId;
  key: string;
};

export type ChatRemoveKey = {
  name: 'ChatRemoveKey';
  provider: ChatProviderId;
};

// Replies come from this provider, with this model, from now on.
export type ChatSetModel = {
  name: 'ChatSetModel';
  provider: ChatProviderId;
  model: string;
};

export type ChatGetThread = {
  name: 'ChatGetThread';
  url: string;
};

// An empty list clears the site's thread.
export type ChatSetThread = {
  name: 'ChatSetThread';
  url: string;
  turns: Array<ChatTurn>;
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
  | OpenShortcutsPage
  | OpenDonatePage
  | OpenReportIssuePage
  | SetReadability
  | ReadabilityActiveChanged
  | GetCommands
  | GetReadabilitySettings
  | SetReadabilitySettings
  | GetImportCss
  | GetCompiledStyles
  | GetGoogleWebFontExists
  | GetGoogleFontFile
  | RunGoogleDriveSync
  | ScanVersionHistory
  | RestoreVersion
  | GetRecentColors
  | AddRecentColor
  | OpenEditorWindow
  | ToggleEditorWindow
  | CloseEditorWindow
  | GetIsEditorWindowOpen
  | OpenEditorSidePanel
  | CloseEditorSidePanel
  | ChatGetStatus
  | ChatConnect
  | ChatRemoveKey
  | ChatSetModel
  | ChatGetThread
  | ChatSetThread;

export default BackgroundPageMessage;
