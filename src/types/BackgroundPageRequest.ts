export type SetStyleRequest = {
  name: 'setStyle';
  url: string;
  css: string;
};

export type EnableStyleRequest = {
  name: 'enableStyle';
  url: string;
};

export type DisableStyleRequest = {
  name: 'disableStyle';
  url: string;
};

export type GetAllStylesRequest = {
  name: 'getAllStyles';
};

export type SetAllStylesRequest = {
  name: 'setAllStyles';
  styles: {
    [url: string]: {
      css: string;
      enabled: boolean;
      readability: boolean;
    };
  };
};

export type MoveStylesRequest = {
  name: 'moveStyles';
  sourceUrl: string;
  destinationUrl: string;
};

export type GetStylesForPageRequest = {
  name: 'getStylesForPage';
  tab?: chrome.tabs.Tab;
  important?: boolean;
};

export type GetStylesForIframeRequest = {
  name: 'getStylesForIframe';
  url: string;
  important?: boolean;
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

export type OpenOptionsPageRequest = {
  name: 'openOptionsPage';
};

export type OpenCommandsPageRequest = {
  name: 'openCommandsPage';
};

export type CopyToClipboardRequest = {
  name: 'copyToClipboard';
  text: string;
};

export type SetReadabilityRequest = {
  name: 'setReadability';
  url: string;
  value: boolean;
};

export type GetAllCommandsRequest = {
  name: 'getAllCommands';
};

type BackgroundPageRequest =
  | SetStyleRequest
  | EnableStyleRequest
  | DisableStyleRequest
  | GetAllStylesRequest
  | SetAllStylesRequest
  | MoveStylesRequest
  | GetStylesForPageRequest
  | GetStylesForIframeRequest
  | GetAllOptionsRequest
  | GetOptionRequest
  | SetOptionRequest
  | OpenOptionsPageRequest
  | OpenCommandsPageRequest
  | CopyToClipboardRequest
  | SetReadabilityRequest
  | GetAllCommandsRequest;

export default BackgroundPageRequest;
