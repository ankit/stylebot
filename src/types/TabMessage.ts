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

// Whether the reader is actually mounted on this tab right now — distinct
// from a style's stored readability preference, which can be true for a
// whole domain while the current page doesn't actually qualify (e.g. a
// listing page). Answered live from the DOM rather than tracked/persisted,
// so there's no stale-state race to worry about.
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
