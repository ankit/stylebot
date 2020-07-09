export type ActivateBrowserActionRequest = {
  name: 'activateBrowserAction';
};

export type UnhighlightBrowserActionRequest = {
  name: 'unhighlightBrowserAction';
};

export type HighlightBrowserActionRequest = {
  name: 'highlightBrowserAction';
};

export type SetStyleRequest = {
  name: 'setStyle';
  url: string;
  css: string;
};

export type MoveStylesRequest = {
  name: 'moveStyles';
  sourceUrl: string;
  destinationUrl: string;
};

export type GetStylesForPageRequest = {
  name: 'getStylesForPage';
  tab?: chrome.tabs.Tab;
};

export type GetMergedCssAndUrlForPageRequest = {
  name: 'getMergedCssAndUrlForPage';
};

export type GetMergedCssAndUrlForIframeRequest = {
  name: 'getMergedCssAndUrlForIframe';
  url: string;
};

export type EnableStyleRequest = {
  name: 'enableStyle';
  url: string;
};

export type DisableStyleRequest = {
  name: 'disableStyle';
  url: string;
};

export type GetAllOptionsRequest = {
  name: 'getAllOptions';
};

export type GetOptionRequest = {
  name: 'getOption';
  optionName: string;
};

export type SetOptionRequest = {
  name: 'setOption';
  option: {
    name: string;
    value: any; // todo
  };
};

export type ViewOptionsPageRequest = {
  name: 'viewOptionsPage';
};

export type CopyToClipboardRequest = {
  name: 'copyToClipboard';
  text: string;
};

type BackgroundPageRequest =
  | ActivateBrowserActionRequest
  | UnhighlightBrowserActionRequest
  | HighlightBrowserActionRequest
  | SetStyleRequest
  | MoveStylesRequest
  | GetStylesForPageRequest
  | GetMergedCssAndUrlForPageRequest
  | GetMergedCssAndUrlForIframeRequest
  | EnableStyleRequest
  | DisableStyleRequest
  | GetAllOptionsRequest
  | GetOptionRequest
  | SetOptionRequest
  | ViewOptionsPageRequest
  | CopyToClipboardRequest;

export default BackgroundPageRequest;
