import {
  ReadabilitySettings,
  Style,
  StylebotCommandName,
} from '@stylebot/types';

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

// Relayed by the background after SetReadability persists, so a change
// initiated outside the editor (e.g. the reader's own dock) stays in sync.
export type ReadabilityStateChanged = {
  name: 'ReadabilityStateChanged';
  value: boolean;
};

// Relayed by the background once editor/index.js has been on-demand
// injected in response to a keyboard shortcut, so the matched command
// actually runs.
export type RunCommand = {
  name: 'RunCommand';
  command: StylebotCommandName;
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
  | UpdateReader
  | ReadabilityStateChanged
  | RunCommand;

export default TabMessage;
