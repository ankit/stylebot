export { default as MonacoEditor } from './MonacoEditor.vue';

export type IframeCssUpdatedMessage = {
  type: 'stylebotMonacoIframeCssUpdated';
  css: string;
};

export type IframeLoadedMessage = {
  type: 'stylebotMonacoIframeLoaded';
};

export type IframeMessage = IframeCssUpdatedMessage | IframeLoadedMessage;

export type ParentUpdateCssMessage = {
  type: 'stylebotCssUpdate';
  css: string;
};
