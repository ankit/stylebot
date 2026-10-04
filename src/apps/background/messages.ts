import {
  set,
  disable,
  enable,
  getAll,
  setAll,
  move,
  getStylesForPage,
  setReadability,
  refreshBadgeForTab,
  getImportCss,
  getGoogleWebFontExists,
  getGoogleFontFile,
  applyStylesToAllTabs,
  ensureCompiledStyles,
  setActiveProfile,
  createProfile,
  renameProfile,
  deleteProfile,
} from './styles';
import * as styleStorage from './styles';

import { getIsReadabilityActive, updateIcon } from './badge';

import {
  get as getOption,
  getAll as getAllOptions,
  set as setOption,
} from './options';

import type {
  GetOption as GetOptionType,
  SetOption as SetOptionType,
  DisableStyle as DisableStyleType,
  EnableStyle as EnableStyleType,
  SetStyle as SetStyleType,
  SetActiveProfile as SetActiveProfileType,
  CreateProfile as CreateProfileType,
  CreateProfileResponse,
  RenameProfile as RenameProfileType,
  DeleteProfile as DeleteProfileType,
  MoveStyle as MoveStyleType,
  SetAllStyles as SetAllStylesType,
  SetReadability as SetReadabilityType,
  ReadabilityStateChanged,
  ReadabilityActiveChanged as ReadabilityActiveChangedType,
  SetReadabilitySettings as SetReadabilitySettingsType,
  GetImportCss as GetImportCssType,
  GetCompiledStylesResponse,
  GetGoogleWebFontExists as GetGoogleWebFontExistsType,
  GetGoogleFontFile as GetGoogleFontFileType,
  RunGoogleDriveSync as RunGoogleDriveSyncType,
  GoogleSignInRedirect as GoogleSignInRedirectType,
  ScanVersionHistory as ScanVersionHistoryType,
  RestoreVersion as RestoreVersionType,
  AddRecentColor as AddRecentColorType,
  OpenEditorWindow as OpenEditorWindowType,
  ToggleEditorWindow as ToggleEditorWindowType,
  CloseEditorWindow as CloseEditorWindowType,
  GetIsEditorWindowOpen as GetIsEditorWindowOpenType,
  GetIsEditorWindowOpenResponse,
  OpenEditorSidePanel as OpenEditorSidePanelType,
  CloseEditorSidePanel as CloseEditorSidePanelType,
  OpenEditorSidePanelResponse,
  GetCommandsResponse,
  GetAllOptionsResponse,
  GetAllStylesResponse,
  GetOptionResponse,
  GetStylesForPageResponse,
  GetReadabilitySettingsResponse,
  GetImportCssResponse,
  GetGoogleWebFontExistsResponse,
  GetGoogleFontFileResponse,
  RunGoogleDriveSyncResponse,
  ScanVersionHistoryResponse,
  RestoreVersionResponse,
  GetRecentColorsResponse,
  AddRecentColorResponse,
  ChatConnect as ChatConnectType,
  ChatRemoveKey as ChatRemoveKeyType,
  ChatSetModel as ChatSetModelType,
  ChatGetThread as ChatGetThreadType,
  ChatSetThread as ChatSetThreadType,
  ChatStatusResponse,
  ChatConnectResponse,
  ChatGetThreadResponse,
} from '@stylebot/types';
import { runGoogleDriveSync, completeTabSignIn } from '@stylebot/sync';

import { scanVersionHistory, restoreVersion } from '@stylebot/history';

import {
  get as getReadabilitySettings,
  set as setReadabilitySettings,
} from './readability-settings';

import { get as getCommands } from './commands';

import {
  getAll as getAllRecentColors,
  add as addRecentColorToHistory,
} from './color-history';

import * as editorWindow from './editor-window';
import {
  supportsEditorSidePanel,
  openEditorSidePanel,
  closeEditorSidePanel,
  isEditorSidePanelOpen,
} from '@stylebot/utils';
import {
  getChatStatus,
  connectChat,
  removeChatKey,
  setChatModel,
  getChatThread,
  setChatThread,
} from './chat';

export const DisableStyle = async (
  message: DisableStyleType
): Promise<void> => {
  await disable(message.url);
  return applyStylesToAllTabs();
};

export const EnableStyle = async (message: EnableStyleType): Promise<void> => {
  await enable(message.url);
  return applyStylesToAllTabs();
};

export const SetStyle = (message: SetStyleType): Promise<void> =>
  set(
    message.url,
    message.css,
    message.readability,
    message.forceImportant,
    message.profileId
  );

export const SetActiveProfile = async (
  message: SetActiveProfileType
): Promise<void> => {
  await setActiveProfile(message.url, message.profileId);
  return applyStylesToAllTabs();
};

export const CreateProfile = async (
  message: CreateProfileType,
  sendResponse: (response: CreateProfileResponse) => void
): Promise<void> => {
  const profileId = await createProfile(message.url, {
    name: message.profileName,
    sourceProfileId: message.sourceProfileId,
    activate: message.activate,
  });

  sendResponse({ profileId });
  return applyStylesToAllTabs();
};

export const RenameProfile = async (
  message: RenameProfileType
): Promise<void> => {
  await renameProfile(message.url, message.profileId, message.profileName);
  return applyStylesToAllTabs();
};

export const DeleteProfile = async (
  message: DeleteProfileType
): Promise<void> => {
  await deleteProfile(message.url, message.profileId);
  return applyStylesToAllTabs();
};

export const GetAllStyles = async (
  sendResponse: (response: GetAllStylesResponse) => void
): Promise<void> => {
  const styles = await getAll();
  sendResponse(styles);
};

export const SetAllStyles = async (
  message: SetAllStylesType
): Promise<void> => {
  await setAll(message.styles);
  return applyStylesToAllTabs();
};

export const GetStylesForPage = async (
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: GetStylesForPageResponse) => void
): Promise<void> => {
  const tab = sender.tab;

  if (!tab?.url) {
    return;
  }

  const styles = await getAll();
  const response = getStylesForPage(tab.url, styles);

  sendResponse(response);

  if (tab.id !== undefined) {
    const readabilityActive = await getIsReadabilityActive(tab.id);
    updateIcon(tab, response.styles, readabilityActive);
  }
};

export const MoveStyle = (message: MoveStyleType): void => {
  move(message.sourceUrl, message.destinationUrl);
};

export const GetOption = async (
  message: GetOptionType,
  sendResponse: (response: GetOptionResponse) => void
): Promise<void> => {
  const option = await getOption(message.optionName);
  sendResponse(option);
};

export const GetAllOptions = async (
  sendResponse: (response: GetAllOptionsResponse) => void
): Promise<void> => {
  const options = await getAllOptions();
  sendResponse(options);
};

/**
 * Not chrome.runtime.openOptionsPage: it drops the hash on Chrome and
 * won't reuse a tab on a different route on Firefox.
 */
export const OpenOptionsPage = async (message?: {
  route?: string;
}): Promise<void> => {
  const base = chrome.runtime.getURL('options.html');
  const url = message?.route ? `${base}#${message.route}` : base;

  const tabs = await chrome.tabs.query({});
  const existing = tabs.find(tab => tab.url?.startsWith(base));

  if (existing?.id !== undefined) {
    await chrome.tabs.update(existing.id, {
      active: true,
      ...(message?.route ? { url } : {}),
    });

    if (existing.windowId !== undefined) {
      await chrome.windows.update(existing.windowId, { focused: true });
    }

    return;
  }

  await chrome.tabs.create({ url, active: true });
};

/**
 * Opens the browser's own page for extension shortcuts, where they're
 * changed. Firefox has its page opened for the extension; the others by URL.
 */
export const OpenShortcutsPage = (): void => {
  if (chrome.commands.openShortcutSettings) {
    chrome.commands.openShortcutSettings();
    return;
  }

  const scheme = /\bEdg\//.test(navigator.userAgent) ? 'edge' : 'chrome';
  chrome.tabs.create({ url: `${scheme}://extensions/shortcuts` });
};

export const OpenDonatePage = (): void => {
  chrome.tabs.create({ url: 'https://ko-fi.com/stylebot' });
};

export const OpenReportIssuePage = (): void => {
  chrome.tabs.create({ url: 'https://github.com/ankit/stylebot/issues' });
};

export const SetOption = (message: SetOptionType): void => {
  setOption(message.option.name, message.option.value);
};

export const GetCommands = async (
  sendResponse: (response: GetCommandsResponse) => void
): Promise<void> => {
  const commands = await getCommands();
  sendResponse(commands);
};

export const SetReadability = async (
  message: SetReadabilityType,
  sender: chrome.runtime.MessageSender
): Promise<void> => {
  await setReadability(message.url, message.value);

  if (sender.tab) {
    await refreshBadgeForTab(sender.tab);

    if (sender.tab.id) {
      const relay: ReadabilityStateChanged = {
        name: 'ReadabilityStateChanged',
        value: message.value,
      };
      chrome.tabs.sendMessage(sender.tab.id, relay);
    }
  }
};

export const ReadabilityActiveChanged = async (
  _message: ReadabilityActiveChangedType,
  sender: chrome.runtime.MessageSender
): Promise<void> => {
  if (sender.tab) {
    await refreshBadgeForTab(sender.tab);
  }
};

export const GetReadabilitySettings = async (
  sendResponse: (response: GetReadabilitySettingsResponse) => void
): Promise<void> => {
  const settings = await getReadabilitySettings();
  sendResponse(settings);
};

export const SetReadabilitySettings = (
  message: SetReadabilitySettingsType
): void => {
  setReadabilitySettings(message.value);
};

export const GetImportCss = async (
  message: GetImportCssType,

  sendResponse: (response: GetImportCssResponse) => void
): Promise<void> => {
  const css = await getImportCss(message.url);
  sendResponse(css);
};

export const GetCompiledStyles = async (
  sendResponse: (response: GetCompiledStylesResponse) => void
): Promise<void> => {
  sendResponse(await ensureCompiledStyles());
};

export const GetGoogleWebFontExists = async (
  message: GetGoogleWebFontExistsType,

  sendResponse: (response: GetGoogleWebFontExistsResponse) => void
): Promise<void> => {
  const exists = await getGoogleWebFontExists(message.url);
  sendResponse(exists);
};

export const GetGoogleFontFile = async (
  message: GetGoogleFontFileType,

  sendResponse: (response: GetGoogleFontFileResponse) => void
): Promise<void> => {
  sendResponse(await getGoogleFontFile(message.url));
};

/**
 * Finishes a tab sign-in, then syncs: the run that opened the tab may have
 * gone with a background Safari unloaded while the user was on Google's page.
 */
export const GoogleSignInRedirect = async (
  message: GoogleSignInRedirectType,
  sender: chrome.runtime.MessageSender
): Promise<void> => {
  if (await completeTabSignIn(message.url, sender.tab?.id)) {
    runGoogleDriveSync(styleStorage, { interactive: false });
  }
};

export const RunGoogleDriveSync = async (
  _message: RunGoogleDriveSyncType,
  sendResponse: (response: RunGoogleDriveSyncResponse) => void
): Promise<void> => {
  try {
    sendResponse(await runGoogleDriveSync(styleStorage));
  } catch (e) {
    // runGoogleDriveSync already returns failures as a result, so this only
    // fires if that contract breaks. Left in because a missed sendResponse
    // leaves the caller's spinner stuck until its page is reloaded.
    sendResponse({
      ok: false,
      errorKey: 'sync_error_unknown',
      errorDetail: e instanceof Error ? e.message : undefined,
    });
  }
};

export const ScanVersionHistory = async (
  message: ScanVersionHistoryType,
  sendResponse: (response: ScanVersionHistoryResponse) => void
): Promise<void> => {
  sendResponse({ scan: await scanVersionHistory(styleStorage, message.limit) });
};

export const RestoreVersion = async (
  message: RestoreVersionType,
  sendResponse: (response: RestoreVersionResponse) => void
): Promise<void> => {
  sendResponse({
    ok: await restoreVersion(styleStorage, message.versionId, message.urls),
  });
};

export const GetRecentColors = async (
  sendResponse: (response: GetRecentColorsResponse) => void
): Promise<void> => {
  const colors = await getAllRecentColors();
  sendResponse(colors);
};

export const AddRecentColor = async (
  message: AddRecentColorType,
  sendResponse: (response: AddRecentColorResponse) => void
): Promise<void> => {
  const colors = await addRecentColorToHistory(message.color);
  sendResponse(colors);
};

export const OpenEditorWindow = async (
  message: OpenEditorWindowType,
  sender: chrome.runtime.MessageSender
): Promise<void> => {
  const tabId = message.tabId ?? sender.tab?.id;
  if (tabId !== undefined) {
    await editorWindow.open(tabId);
  }
};

export const ToggleEditorWindow = async (
  message: ToggleEditorWindowType,
  sender: chrome.runtime.MessageSender
): Promise<void> => {
  const tabId = message.tabId ?? sender.tab?.id;
  if (tabId === undefined) {
    return;
  }

  // The page also counts a connected side panel as its editor window.
  if (supportsEditorSidePanel() && (await isEditorSidePanelOpen(tabId))) {
    await closeEditorSidePanel(tabId);
  } else {
    await editorWindow.toggle(tabId);
  }
};

export const CloseEditorWindow = async (
  message: CloseEditorWindowType,
  sender: chrome.runtime.MessageSender
): Promise<void> => {
  const tabId = message.tabId ?? sender.tab?.id;
  if (tabId !== undefined) {
    await editorWindow.close(tabId);
  }
};

/**
 * Opens the side panel straight away, while the gesture of the page's
 * keypress or click that sent this still counts. Answers whether it opened,
 * so the page can fall back to its own panel.
 */
export const OpenEditorSidePanel = (
  message: OpenEditorSidePanelType,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: OpenEditorSidePanelResponse) => void
): void => {
  const tabId = message.tabId ?? sender.tab?.id;
  if (tabId === undefined || !supportsEditorSidePanel()) {
    sendResponse(false);
    return;
  }

  openEditorSidePanel(tabId).then(
    () => sendResponse(true),
    () => sendResponse(false)
  );
};

export const CloseEditorSidePanel = async (
  message: CloseEditorSidePanelType,
  sender: chrome.runtime.MessageSender
): Promise<void> => {
  const tabId = message.tabId ?? sender.tab?.id;
  if (tabId !== undefined && supportsEditorSidePanel()) {
    await closeEditorSidePanel(tabId);
  }
};

export const GetIsEditorWindowOpen = async (
  message: GetIsEditorWindowOpenType,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: GetIsEditorWindowOpenResponse) => void
): Promise<void> => {
  const tabId = message.tabId ?? sender.tab?.id;
  sendResponse(
    tabId !== undefined &&
      ((await editorWindow.isOpen(tabId)) ||
        (supportsEditorSidePanel() && (await isEditorSidePanelOpen(tabId))))
  );
};

export const ChatGetStatus = async (
  sendResponse: (response: ChatStatusResponse) => void
): Promise<void> => {
  sendResponse(await getChatStatus());
};

export const ChatConnect = async (
  message: ChatConnectType,
  sendResponse: (response: ChatConnectResponse) => void
): Promise<void> => {
  try {
    sendResponse(await connectChat(message.provider, message.key));
  } catch (e) {
    // A missed sendResponse would leave the Connect button checking forever.
    sendResponse({
      ok: false,
      errorKey: 'chat_error_provider',
      errorDetail: e instanceof Error ? e.message : undefined,
    });
  }
};

export const ChatRemoveKey = async (
  message: ChatRemoveKeyType,
  sendResponse: (response: ChatStatusResponse) => void
): Promise<void> => {
  sendResponse(await removeChatKey(message.provider));
};

export const ChatSetModel = async (
  message: ChatSetModelType,
  sendResponse: (response: ChatStatusResponse) => void
): Promise<void> => {
  sendResponse(await setChatModel(message.provider, message.model));
};

export const ChatGetThread = async (
  message: ChatGetThreadType,
  sendResponse: (response: ChatGetThreadResponse) => void
): Promise<void> => {
  sendResponse(await getChatThread(message.url));
};

export const ChatSetThread = async (
  message: ChatSetThreadType
): Promise<void> => {
  await setChatThread(message.url, message.turns);
};
