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
  focus?: boolean;
};

export type ParentFocusEditorMessage = {
  type: 'stylebotFocusEditor';
};

export type ParentThemeUpdateMessage = {
  type: 'stylebotThemeUpdate';
  theme: 'light' | 'dark';
};

export type ParentMessage =
  | ParentUpdateCssMessage
  | ParentFocusEditorMessage
  | ParentThemeUpdateMessage;
