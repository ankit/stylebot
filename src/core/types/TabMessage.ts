import type { Style } from './styles';
import type { ReadabilitySettings } from './readability';
import type { StylebotCommandName } from './commands';
import type { CssEdit, StyleProblem } from './page-reading';
import type { GalleryPreview } from './gallery';

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
  | { kind: 'startCheck'; edits: Array<CssEdit> }
  | { kind: 'finishCheck'; selectors: Array<string> }
  | { kind: 'pointer'; action: PointerAction }
  | { kind: 'frameElement'; selector: string }
  | { kind: 'restoreScroll' }
  | { kind: 'force'; action: PseudoStateAction };

export type PseudoState =
  | 'hover'
  | 'active'
  | 'focus'
  | 'focus-visible'
  | 'focus-within';

// Forces a state on a selector's first visible match, or every match with
// all; release undoes one force, clear every one.
export type PseudoStateAction =
  | { op: 'add'; selector: string; state: PseudoState; all?: boolean }
  | { op: 'release'; selector: string; state: PseudoState }
  | { op: 'list' }
  | { op: 'clear' };

export type ForcedPseudoState = {
  selector: string;
  state: PseudoState;
  elements: number;
  ancestors: number;
};

export type PseudoStateResult = {
  forced: Array<ForcedPseudoState>;
  // What this action added or removed.
  changed: Array<ForcedPseudoState>;
  // Stylesheets whose rules couldn't be read or fetched.
  unreadable: Array<string>;
};

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
// point in css pixels of the viewport, as in a screenshot at scale 1.
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

// A box in css pixels, relative to the viewport.
export type ViewportRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

// An element a screenshot frames, scrolled into view if it wasn't.
export type ElementFrame = { rect: ViewportRect; scrolled: boolean };

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
  styleProblems: Array<StyleProblem>;
  fragileSelectors: Array<FragileSelector>;
};

export type InspectPage = {
  name: 'InspectPage';
  inspection: PageInspection;
};

export type ShowGalleryPreview = {
  name: 'ShowGalleryPreview';
  preview: GalleryPreview;
  // The saved style installing it would replace, which the preview hides.
  replacedUrl: string;
};

// The tab's gallery preview ended: cancelled, or installed as a profile.
export type HideGalleryPreview = {
  name: 'HideGalleryPreview';
  installed?: boolean;
};

// For the site bridge, on the gallery page a preview was opened from.
export type GalleryStyleInstalled = {
  name: 'GalleryStyleInstalled';
  id: number;
  profileName: string;
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
  | UpdateReader
  | ReadabilityStateChanged
  | InspectPage
  | ShowGalleryPreview
  | HideGalleryPreview
  | GalleryStyleInstalled;

export default TabMessage;
