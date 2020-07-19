import { StylebotCommand } from 'types';

export type ToggleStylebot = {
  name: 'ToggleStylebot';
};

export type OpenStylebot = {
  name: 'OpenStylebot';
};

export type EnableStyleForTab = {
  name: 'EnableStyleForTab';
  css: string;
  url: string;
};

export type DisableStyleForTab = {
  name: 'DisableStyleForTab';
  url: string;
};

export type ToggleReadabilityForTab = {
  name: 'ToggleReadabilityForTab';
};

export type TabUpdated = {
  name: 'TabUpdated';
};

export type GetIsStylebotOpen = {
  name: 'GetIsStylebotOpen';
};

export type ExecuteCommand = {
  name: 'ExecuteCommand';
  command: StylebotCommand;
};

type TabMessage =
  | ToggleStylebot
  | OpenStylebot
  | EnableStyleForTab
  | DisableStyleForTab
  | ToggleReadabilityForTab
  | TabUpdated
  | GetIsStylebotOpen
  | ExecuteCommand;

export default TabMessage;
