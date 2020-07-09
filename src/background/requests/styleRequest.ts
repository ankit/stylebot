import {
  SetStyleRequest,
  MoveStylesRequest,
  GetStylesForPageRequest,
  GetMergedCssAndUrlForPageRequest,
  GetMergedCssAndUrlForIframeRequest,
  EnableStyleRequest,
  DisableStyleRequest,
} from '../../types/BackgroundPageRequest';

import {
  GetStylesForPageResponse,
  GetMergedCssAndUrlForPageResponse,
  GetMergedCssAndUrlForIframeResponse,
} from '../../types/BackgroundPageResponse';

import BackgroundPageStyles from '../styles';

type Request =
  | SetStyleRequest
  | MoveStylesRequest
  | GetStylesForPageRequest
  | GetMergedCssAndUrlForPageRequest
  | GetMergedCssAndUrlForIframeRequest
  | EnableStyleRequest
  | DisableStyleRequest;

type Response =
  | GetStylesForPageResponse
  | GetMergedCssAndUrlForPageResponse
  | GetMergedCssAndUrlForIframeResponse;

export default (
  request: Request,
  styles: BackgroundPageStyles,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: Response) => void
) => {
  if (request.name === 'setStyle') {
    if (request.css) {
      styles.set(request.url, request.css);
    } else {
      styles.delete(request.url);
    }
  } else if (request.name === 'moveStyles') {
    styles.move(request.sourceUrl, request.destinationUrl);
  } else if (request.name === 'getStylesForPage') {
    const tab = sender.tab || request.tab;

    if (!tab || !tab.url) {
      return;
    }

    const pageStyles = styles.getStylesForPage(tab.url);
    if (pageStyles) {
      sendResponse(pageStyles);
    }
  } else if (request.name === 'getMergedCssAndUrlForPage') {
    if (!sender.tab || !sender.tab.url) {
      return;
    }

    sendResponse(styles.getMergedCssAndUrlForPage(sender.tab.url));
  } else if (request.name === 'getMergedCssAndUrlForIframe') {
    sendResponse(styles.getMergedCssAndUrlForIframe(request.url));
  } else if (request.name === 'enableStyle') {
    styles.toggle(request.url);
  } else if (request.name === 'disableStyle') {
    styles.toggle(request.url);
  }
};
