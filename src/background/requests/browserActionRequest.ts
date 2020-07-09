import BrowserAction from '../browseraction';

import {
  ActivateBrowserActionRequest,
  UnhighlightBrowserActionRequest,
  HighlightBrowserActionRequest,
} from '../../types/BackgroundPageRequest';

type Request =
  | ActivateBrowserActionRequest
  | UnhighlightBrowserActionRequest
  | HighlightBrowserActionRequest;

export default (request: Request, sender: chrome.runtime.MessageSender) => {
  if (!sender.tab) {
    return;
  }

  if (request.name === 'activateBrowserAction') {
    BrowserAction.activate(sender.tab);
  } else if (request.name === 'unhighlightBrowserAction') {
    BrowserAction.unhighlight(sender.tab);
  } else if (request.name === 'highlightBrowserAction') {
    BrowserAction.highlight(sender.tab);
  }
};
