import BackgroundPageUtils from './utils';
import BackgroundPageStyles from './styles';
import BackgroundPageOptions from './options';

import {
  GetOption as GetOptionType,
  SetOption as SetOptionType,
  DisableStyle as DisableStyleType,
  EnableStyle as EnableStyleType,
  SetStyle as SetStyleType,
  GetStylesForPage as GetStylesForPageType,
  GetStylesForIframe as GetStylesForIframeType,
  MoveStyle as MoveStyleType,
  SetAllStyles as SetAllStylesType,
  SetCommands as SetCommandsType,
  SetReadability as SetReadabilityType,
  SetReadabilitySettings as SetReadabilitySettingsType,
  GetImportCss as GetImportCssType,
  RunGoogleDriveSync as RunGoogleDriveSyncType,
  GetCommandsResponse,
  GetAllOptionsResponse,
  GetAllStylesResponse,
  GetOptionResponse,
  GetStylesForPageResponse,
  GetReadabilitySettingsResponse,
  GetImportCssResponse,
  RunGoogleDriveSyncResponse,
} from '@stylebot/types';
import { runGoogleDriveSync } from '@stylebot/sync';

import {
  get as getReadabilitySettings,
  set as setReadabilitySettings,
} from './readability-settings';

import { get as getCommands, set as setCommands } from './commands';

export const DisableStyle = (
  message: DisableStyleType,
  styles: BackgroundPageStyles
): void => {
  styles.disable(message.url);
};

export const EnableStyle = (
  message: EnableStyleType,
  styles: BackgroundPageStyles
): void => {
  styles.enable(message.url);
};

export const SetStyle = (
  message: SetStyleType,
  styles: BackgroundPageStyles
): void => {
  styles.set(message.url, message.css, message.readability);
};

export const GetAllStyles = (
  styles: BackgroundPageStyles,
  sendResponse: (response: GetAllStylesResponse) => void
): void => {
  sendResponse(styles.getAll());
};

export const SetAllStyles = (
  message: SetAllStylesType,
  styles: BackgroundPageStyles
): void => {
  styles.setAll(message.styles, message.shouldPersist);
};

export const GetStylesForIframe = (
  message: GetStylesForIframeType,
  styles: BackgroundPageStyles,
  sendResponse: (response: GetStylesForPageResponse) => void
): void => {
  sendResponse(styles.getStylesForPage(message.url, message.important));
};

export const GetStylesForPage = (
  message: GetStylesForPageType,
  styles: BackgroundPageStyles,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: GetStylesForPageResponse) => void
): void => {
  const tab = sender.tab || message.tab;

  if (!tab || !tab.url) {
    return;
  }

  const response = styles.getStylesForPage(tab.url, message.important);
  styles.updateIcon(tab, response.styles, response.defaultStyle);

  sendResponse(response);
};

export const MoveStyle = (
  message: MoveStyleType,
  styles: BackgroundPageStyles
): void => {
  styles.move(message.sourceUrl, message.destinationUrl);
};

export const GetOption = (
  message: GetOptionType,
  options: BackgroundPageOptions,
  sendResponse: (response: GetOptionResponse) => void
): void => {
  sendResponse(options.get(message.optionName));
};

export const GetAllOptions = (
  options: BackgroundPageOptions,
  sendResponse: (response: GetAllOptionsResponse) => void
): void => {
  sendResponse(options.getAll());
};

export const OpenOptionsPage = (): void => {
  chrome.runtime.openOptionsPage();
};

export const SetOption = (
  message: SetOptionType,
  options: BackgroundPageOptions
): void => {
  options.set(message.option.name, message.option.value);
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

export const SetReadability = (
  message: SetReadabilityType,
  styles: BackgroundPageStyles
): void => {
  styles.setReadability(message.url, message.value);
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
  styles: BackgroundPageStyles,
  sendResponse: (response: GetImportCssResponse) => void
): Promise<void> => {
  const css = await styles.getImportCss(message.url);
  sendResponse(css);
};

export const RunGoogleDriveSync = async (
  _message: RunGoogleDriveSyncType,
  styles: BackgroundPageStyles,
  sendResponse: (response: RunGoogleDriveSyncResponse) => void
): Promise<void> => {
  await runGoogleDriveSync(styles);
  sendResponse();
};

export const CopyToClipboard = (text: string): void => {
  BackgroundPageUtils.copyToClipboard(text);
};
