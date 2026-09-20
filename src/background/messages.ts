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
  applyStylesToAllTabs,
} from './styles';

import { getIsReadabilityActive, updateIcon } from './badge';

import {
  get as getOption,
  getAll as getAllOptions,
  set as setOption,
} from './options';

import {
  GetOption as GetOptionType,
  SetOption as SetOptionType,
  DisableStyle as DisableStyleType,
  EnableStyle as EnableStyleType,
  SetStyle as SetStyleType,
  GetStylesForPage as GetStylesForPageType,
  MoveStyle as MoveStyleType,
  SetAllStyles as SetAllStylesType,
  SetCommands as SetCommandsType,
  SetReadability as SetReadabilityType,
  ReadabilityStateChanged,
  ReadabilityActiveChanged as ReadabilityActiveChangedType,
  SetReadabilitySettings as SetReadabilitySettingsType,
  GetImportCss as GetImportCssType,
  GetGoogleWebFontExists as GetGoogleWebFontExistsType,
  RunGoogleDriveSync as RunGoogleDriveSyncType,
  AddRecentColor as AddRecentColorType,
  OpenEditorWindow as OpenEditorWindowType,
  ToggleEditorWindow as ToggleEditorWindowType,
  CloseEditorWindow as CloseEditorWindowType,
  GetIsEditorWindowOpen as GetIsEditorWindowOpenType,
  GetIsEditorWindowOpenResponse,
  GetCommandsResponse,
  GetAllOptionsResponse,
  GetAllStylesResponse,
  GetOptionResponse,
  GetStylesForPageResponse,
  GetReadabilitySettingsResponse,
  GetImportCssResponse,
  GetGoogleWebFontExistsResponse,
  RunGoogleDriveSyncResponse,
  GetRecentColorsResponse,
  AddRecentColorResponse,
} from '@stylebot/types';
import { runGoogleDriveSync } from '@stylebot/sync';

import {
  get as getReadabilitySettings,
  set as setReadabilitySettings,
} from './readability-settings';

import { get as getCommands, set as setCommands } from './commands';

import {
  getAll as getAllRecentColors,
  add as addRecentColorToHistory,
} from './color-history';

import * as editorWindow from './editor-window';

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
  set(message.url, message.css, message.readability);

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
  message: GetStylesForPageType,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: GetStylesForPageResponse) => void
): Promise<void> => {
  const tab = sender.tab || message.tab;

  if (!tab?.url) {
    return;
  }

  const styles = await getAll();
  const response = getStylesForPage(tab.url, styles, message.important);

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

export const OpenDonatePage = (): void => {
  chrome.tabs.create({ url: 'https://ko-fi.com/stylebot' });
};

export const OpenReportIssuePage = (): void => {
  chrome.tabs.create({ url: 'https://github.com/ankit/stylebot/issues' });
};

export const OpenGoogleFontsPage = (): void => {
  chrome.tabs.create({ url: 'https://fonts.google.com' });
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

export const SetCommands = (message: SetCommandsType): void => {
  setCommands(message.value);
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

export const GetGoogleWebFontExists = async (
  message: GetGoogleWebFontExistsType,

  sendResponse: (response: GetGoogleWebFontExistsResponse) => void
): Promise<void> => {
  const exists = await getGoogleWebFontExists(message.url);
  sendResponse(exists);
};

export const RunGoogleDriveSync = async (
  _message: RunGoogleDriveSyncType,
  sendResponse: (response: RunGoogleDriveSyncResponse) => void
): Promise<void> => {
  try {
    sendResponse(await runGoogleDriveSync());
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
  if (tabId !== undefined) {
    await editorWindow.toggle(tabId);
  }
};

export const CloseEditorWindow = async (
  message: CloseEditorWindowType
): Promise<void> => {
  await editorWindow.close(message.tabId);
};

export const GetIsEditorWindowOpen = async (
  message: GetIsEditorWindowOpenType,
  sendResponse: (response: GetIsEditorWindowOpenResponse) => void
): Promise<void> => {
  sendResponse(await editorWindow.isOpen(message.tabId));
};
