import type { Style } from './styles';
import type { ReadabilitySettings } from './readability';
import type { StylebotCommandName } from './commands';
import type { ChatCssEdit, ChatStyleProblem } from './chat';

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

// Answered by Stylebot's page script, where it runs, with whether it can
// style the page. No answer means it isn't running there.
export type GetCanStylePage = {
  name: 'GetCanStylePage';
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

// What the background can ask a page about itself.
export type PageInspection =
  | { kind: 'outline' }
  | { kind: 'suggestionContext' }
  | { kind: 'cssVariables' }
  | { kind: 'pageRules'; selector: string }
  | { kind: 'computedStyles'; selector: string; properties: Array<string> }
  | { kind: 'matchCount'; selectors: Array<string> }
  | { kind: 'startCheck'; edits: Array<ChatCssEdit> }
  | { kind: 'finishCheck'; selectors: Array<string> }
  | { kind: 'pointer'; action: PointerAction };

// What the content script lends the inspector bundle, which can't import it.
export type InspectorHost = {
  reapplySavedStyles: () => Promise<void>;
};

// Answers a page inspection; the CLI's inspector bundle provides it.
export type PageInspector = (
  inspection: PageInspection,
  host: InspectorHost
) => Promise<unknown>;

// The inspector bundle sets stylebotInspectPage once it has run.
export type InspectorWindow = Window & {
  stylebotInspectPage?: PageInspector;
};

// Where the CLI's pointer goes: the middle of a selector's first match, or a
// point in screenshot pixels, which are css pixels times the device pixel ratio.
export type PointerAction = {
  kind: 'hover' | 'inspect';
  selector?: string;
  // For an inspect, the style's css, whose selectors it prefers.
  css?: string;
  x?: number;
  y?: number;
};

export type InspectedSelector = {
  selector: string;
  matches: number | null;
  // The style's css already has a rule with this selector.
  saved: boolean;
};

export type PointerResult = {
  x: number;
  y: number;
  // A selector for the element the pointer ended up over.
  selector: string;
  // For an inspect: how many elements the selector matches, and other
  // selectors for the element, as the editor's selector menu offers them.
  matches?: number | null;
  alternatives?: Array<InspectedSelector>;
};

// A selector built on class names the site generates, which change when it rebuilds.
export type FragileSelector = {
  selector: string;
  // The selector with each partly generated class matched by its stable part.
  stable: string | null;
  // Generated classes with no stable part to match instead.
  unstable: Array<string>;
};

export type StyleCheckReport = {
  matchCounts: Array<number | null>;
  styleProblems: Array<ChatStyleProblem>;
  fragileSelectors: Array<FragileSelector>;
};

export type InspectPage = {
  name: 'InspectPage';
  inspection: PageInspection;
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
  | GetCanStylePage
  | GetIsPageReaderable
  | GetIsReadabilityActive
  | UpdateReader
  | ReadabilityStateChanged
  | InspectPage;

export default TabMessage;
