import type { Style } from './styles';
import type { ReadabilitySettings } from './readability';
import type { StylebotCommandName } from './commands';

export type ToggleStylebot = {
  name: 'ToggleStylebot';
};

export type OpenStylebot = {
  name: 'OpenStylebot';
};

export type OpenStylebotFromContextMenu = {
  name: 'OpenStylebotFromContextMenu';
  // The background already opened the side panel, which needs the click's gesture.
  sidePanel?: boolean;
};

// A global shortcut the browser caught, for the page to carry out.
export type RunCommand = {
  name: 'RunCommand';
  command: StylebotCommandName;
};

export type ToggleReadabilityForTab = {
  name: 'ToggleReadabilityForTab';
};

export type ApplyStylesToTab = {
  name: 'ApplyStylesToTab';
  defaultStyle?: Style;
  styles: Array<Style>;
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

type TabMessage =
  | ToggleStylebot
  | RunCommand
  | OpenStylebot
  | OpenStylebotFromContextMenu
  | ToggleReadabilityForTab
  | ApplyStylesToTab
  | TabUpdated
  | GetIsStylebotOpen
  | GetIsPageReaderable
  | GetIsReadabilityActive
  | UpdateReader
  | ReadabilityStateChanged;

export default TabMessage;
