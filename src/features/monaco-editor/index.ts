import type { CssLineRange } from '@stylebot/types';

export { default as MonacoEditor } from './MonacoEditor.vue';

export type IframeCssUpdatedMessage = {
  type: 'stylebotMonacoIframeCssUpdated';
  css: string;
};

export type IframeLoadedMessage = {
  type: 'stylebotMonacoIframeLoaded';
};

export type IframeEscapeMessage = {
  type: 'stylebotEscapePressed';
};

export type IframeMessage =
  | IframeCssUpdatedMessage
  | IframeLoadedMessage
  | IframeEscapeMessage;

export type ParentUpdateCssMessage = {
  type: 'stylebotCssUpdate';
  css: string;
  selector?: string;
  // Defaults to true (existing behavior) when omitted.
  focus?: boolean;
};

// Focuses without touching the model, unlike stylebotCssUpdate — safe to send
// just because the editor became visible again.
export type ParentFocusEditorMessage = {
  type: 'stylebotFocusEditor';
};

// Pushed whenever the panel's light/dark appearance changes — the iframe is a
// separate document, so it can't just re-read the parent's Vuex state.
export type ParentThemeUpdateMessage = {
  type: 'stylebotThemeUpdate';
  theme: 'light' | 'dark';
};

// Marks lines (1-based, as in the css last sent) until the text next changes,
// and scrolls the first into view.
export type ParentHighlightLinesMessage = {
  type: 'stylebotHighlightLines';
  ranges: Array<CssLineRange>;
};

export type ParentMessage =
  | ParentUpdateCssMessage
  | ParentHighlightLinesMessage
  | ParentFocusEditorMessage
  | ParentThemeUpdateMessage;
