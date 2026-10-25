import type { StyleMap } from './styles';
import type { StylebotOptions } from './options';
import type { ReadabilitySettings } from './readability';
import type { StylebotCommandName } from './commands';

export type SetStyle = {
  name: 'SetStyle';
  url: string;
  css: string;
  readability: boolean;
  // Left out, the stored style keeps its current value.
  forceImportant?: boolean;
  // Left out, the css goes to the active profile.
  profileId?: string;
};

export type SetActiveProfile = {
  name: 'SetActiveProfile';
  url: string;
  profileId: string;
};

export type CreateProfile = {
  name: 'CreateProfile';
  url: string;
  profileName: string;
  // Left out, the new profile starts blank.
  sourceProfileId?: string;
  activate: boolean;
};

// Sent by the stylebot.dev bridge to add a gallery style as a new profile.
export type InstallStyle = {
  name: 'InstallStyle';
  url: string;
  profileName: string;
  css: string;
};

export type RenameProfile = {
  name: 'RenameProfile';
  url: string;
  profileId: string;
  profileName: string;
};

export type DeleteProfile = {
  name: 'DeleteProfile';
  url: string;
  profileId: string;
};

export type DeleteStyle = {
  name: 'DeleteStyle';
  url: string;
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
  // Defaults to true. Off where an auth window can't be shown, like the popup.
  interactive?: boolean;
};

// Sent by the page Google's sign-in redirects to where there's no identity API.
export type GoogleSignInRedirect = {
  name: 'GoogleSignInRedirect';
  url: string;
};

export type ScanVersionHistory = {
  name: 'ScanVersionHistory';
  // Absent asks for every version held.
  limit?: number;
  // Only versions that touched this site.
  site?: string;
};

export type UndoRestore = {
  name: 'UndoRestore';
  // The history entry the restore recorded.
  entryId: string;
  // The one profile the restore put back, if it was one.
  profileId?: string;
};

export type RestoreVersion = {
  name: 'RestoreVersion';
  versionId: string;
  // Absent restores the whole version; a list restores only those sites.
  urls?: Array<string>;
  // Restores the styles as they were just before this version's change.
  before?: boolean;
  // Restores only this profile of the one site in `urls`.
  profileId?: string;
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

// Options got the sidePanel permission, which takes a reload to use.
export type ReloadForSidePanelGrant = {
  name: 'ReloadForSidePanelGrant';
};

export type EditorSidePanelOpened = {
  name: 'EditorSidePanelOpened';
  tabId: number;
};

// A global shortcut the page caught itself, where the browser doesn't pass
// it on (Arc).
export type RunPageCommand = {
  name: 'RunPageCommand';
  command: StylebotCommandName;
};

export type CloseEditorSidePanel = {
  name: 'CloseEditorSidePanel';
  tabId?: number;
};

export type GetIsEditorWindowOpen = {
  name: 'GetIsEditorWindowOpen';
  tabId?: number;
};

export type RestoreTab = {
  name: 'RestoreTab';
  tabId: number;
};

// Leave out tabId to capture the tab the message came from, as taken.
export type CaptureGalleryScreenshot = {
  name: 'CaptureGalleryScreenshot';
  tabId?: number;
};

// Hands a profile to the gallery site to publish, opening it in a new tab.
// The screenshot is a data URL, fitted to the gallery's limit here.
export type OpenGalleryDraft = {
  name: 'OpenGalleryDraft';
  url: string;
  profileId: string;
  css: string;
  profileName: string;
  screenshot: string | null;
};

// The popup's Publish: shows the profile on the tab if it isn't already,
// then captures it and hands it to the gallery site like OpenGalleryDraft.
export type PublishProfileToGallery = {
  name: 'PublishProfileToGallery';
  // The tab to capture; none from the options page.
  tabId?: number;
  url: string;
  profileId: string;
};

// For the site bridge on the gallery, by the id its publish page was given.
export type GetGalleryDraft = {
  name: 'GetGalleryDraft';
  id: string;
};

// The gallery site published a draft, as this version of a gallery style.
export type GalleryDraftPublished = {
  name: 'GalleryDraftPublished';
  id: string;
  styleId: number;
  version: number;
  slug: string;
};

// The gallery site deleted one of its styles, by its id.
export type GalleryStyleDeleted = {
  name: 'GalleryStyleDeleted';
  styleId: number;
};

export type GetPublishedGalleryStyle = {
  name: 'GetPublishedGalleryStyle';
  url: string;
  profileId: string;
};

// Puts the latest version of the gallery style a profile was installed from
// back in it, dropping the user's edits.
export type ResetGalleryProfile = {
  name: 'ResetGalleryProfile';
  url: string;
  profileId: string;
};

// A gallery style's author and latest version, by its id.
export type GetGalleryStyle = {
  name: 'GetGalleryStyle';
  styleId: number;
};

export type GetGallerySuggestions = {
  name: 'GetGallerySuggestions';
  // The page's url; suggestions are the gallery's styles for its site.
  pageUrl: string;
  incognito: boolean;
};

// Previews a gallery style on a tab: the popup's tab, or the page's own.
export type PreviewGalleryStyle = {
  name: 'PreviewGalleryStyle';
  id: number;
  tabId?: number;
};

// Sent by the site bridge: opens the style's site in a new tab, previewing it.
export type OpenGalleryPreview = {
  name: 'OpenGalleryPreview';
  id: number;
};

// Sent by the site bridge on the gallery: takes its tab to the publish page,
// on the profile published as the style.
export type PublishGalleryStyleUpdate = {
  name: 'PublishGalleryStyleUpdate';
  styleId: number;
};

// A tab's gallery preview: the popup's tab, or the page's own.
export type GetGalleryPreview = {
  name: 'GetGalleryPreview';
  tabId?: number;
};

export type InstallGalleryPreview = {
  name: 'InstallGalleryPreview';
  tabId?: number;
};

// Sent by the site bridge: which of these gallery styles are installed.
export type GetGalleryInstallStatus = {
  name: 'GetGalleryInstallStatus';
  styleIds: Array<number>;
};

export type EndGalleryPreview = {
  name: 'EndGalleryPreview';
  tabId?: number;
};

// Sent by the page's preview bar, just after an install.
export type UndoGalleryInstall = {
  name: 'UndoGalleryInstall';
};

type BackgroundPageMessage =
  | SetStyle
  | EnableStyle
  | DisableStyle
  | GetAllStyles
  | SetAllStyles
  | MoveStyle
  | GetStylesForPage
  | SetActiveProfile
  | CreateProfile
  | InstallStyle
  | RenameProfile
  | DeleteProfile
  | DeleteStyle
  | GetAllOptions
  | GetOption
  | SetOption
  | OpenOptionsPage
  | OpenShortcutsPage
  | OpenDonatePage
  | OpenReportIssuePage
  | SetReadability
  | GetCommands
  | GetReadabilitySettings
  | SetReadabilitySettings
  | GetImportCss
  | GetCompiledStyles
  | GetGoogleWebFontExists
  | GetGoogleFontFile
  | RunGoogleDriveSync
  | GoogleSignInRedirect
  | ScanVersionHistory
  | RestoreVersion
  | UndoRestore
  | GetRecentColors
  | AddRecentColor
  | OpenEditorWindow
  | ToggleEditorWindow
  | CloseEditorWindow
  | GetIsEditorWindowOpen
  | OpenEditorSidePanel
  | CloseEditorSidePanel
  | EditorSidePanelOpened
  | ReloadForSidePanelGrant
  | RunPageCommand
  | RestoreTab
  | CaptureGalleryScreenshot
  | OpenGalleryDraft
  | PublishProfileToGallery
  | GetGalleryDraft
  | GalleryDraftPublished
  | GalleryStyleDeleted
  | GetPublishedGalleryStyle
  | ResetGalleryProfile
  | GetGallerySuggestions
  | GetGalleryStyle
  | PreviewGalleryStyle
  | OpenGalleryPreview
  | GetGalleryPreview
  | InstallGalleryPreview
  | EndGalleryPreview
  | UndoGalleryInstall
  | GetGalleryInstallStatus
  | PublishGalleryStyleUpdate;

export default BackgroundPageMessage;
