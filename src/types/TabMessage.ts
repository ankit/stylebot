import { ReadabilitySettings } from '@stylebot/types';

export type ToggleStylebot = {
  name: 'ToggleStylebot';
};

export type OpenStylebot = {
  name: 'OpenStylebot';
};

export type OpenStylebotFromContextMenu = {
  name: 'OpenStylebotFromContextMenu';
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

export type UpdateReader = {
  name: 'UpdateReader';
  value: ReadabilitySettings;
};

type TabMessage =
  | ToggleStylebot
  | OpenStylebot
  | OpenStylebotFromContextMenu
  | EnableStyleForTab
  | DisableStyleForTab
  | ToggleReadabilityForTab
  | TabUpdated
  | GetIsStylebotOpen
  | UpdateReader;

export default TabMessage;
