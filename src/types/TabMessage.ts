import { ReadabilitySettings, Style } from '@stylebot/types';

export type ToggleStylebot = {
  name: 'ToggleStylebot';
};

export type OpenStylebot = {
  name: 'OpenStylebot';
};

export type OpenStylebotFromContextMenu = {
  name: 'OpenStylebotFromContextMenu';
};

export type ToggleReadabilityForTab = {
  name: 'ToggleReadabilityForTab';
};

export type ApplyStylesToTab = {
  name: 'ApplyStylesToTab';
  defaultStyle?: Style;
  styles: Style[];
};

export type TabUpdated = {
  name: 'TabUpdated';
};

export type GetIsStylebotOpen = {
  name: 'GetIsStylebotOpen';
};

export type GetIsPageReaderable = {
  name: 'GetIsPageReaderable';
};

// Whether the reader is mounted on this tab right now, distinct from a
// style's stored preference — answered live from the DOM, never persisted.
export type GetIsReadabilityActive = {
  name: 'GetIsReadabilityActive';
};

export type UpdateReader = {
  name: 'UpdateReader';
  value: ReadabilitySettings;
};

type TabMessage =
  | ToggleStylebot
  | OpenStylebot
  | OpenStylebotFromContextMenu
  | ToggleReadabilityForTab
  | ApplyStylesToTab
  | TabUpdated
  | GetIsStylebotOpen
  | GetIsPageReaderable
  | GetIsReadabilityActive
  | UpdateReader;

export default TabMessage;
