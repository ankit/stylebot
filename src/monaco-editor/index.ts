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

export type ParentMessage =
  | ParentUpdateCssMessage
  | ParentFocusEditorMessage
  | ParentThemeUpdateMessage;
