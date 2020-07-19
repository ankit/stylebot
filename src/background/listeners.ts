import ContextMenu from './contextmenu';
import BackgroundPageStyles from './styles';

import styleRequest from './requests/styleRequest';
import optionRequest from './requests/optionRequest';
import copyToClipboardRequest from './requests/copyToClipboardRequest';

import {
  StylebotOptions,
  BackgroundPageRequest,
  BackgroundPageResponse,
} from '@stylebot/types';

/**
 * Initialize listeners for the background page
 */
const init = (styles: BackgroundPageStyles, options: StylebotOptions): void => {
  chrome.extension.onRequest.addListener(
    (
      request: BackgroundPageRequest,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response: BackgroundPageResponse) => void
    ) => {
      if (request.name === 'copyToClipboard') {
        copyToClipboardRequest(request);
        return;
      }

      if (
        request.name === 'getOption' ||
        request.name === 'setOption' ||
        request.name === 'getAllOptions' ||
        request.name === 'openOptionsPage'
      ) {
        optionRequest(request, options, sendResponse);
        return;
      }

      if (
        request.name === 'setStyle' ||
        request.name === 'moveStyles' ||
        request.name === 'getAllStyles' ||
        request.name === 'setAllStyles' ||
        request.name === 'getStylesForPage' ||
        request.name === 'getStylesForIframe' ||
        request.name === 'enableStyle' ||
        request.name === 'disableStyle' ||
        request.name === 'setReadability'
      ) {
        styleRequest(request, styles, sender, sendResponse);
        return;
      }
    }
  );

  /**
   * Listen when an existing tab is updated
   * and update the context-menu and browser-action
   */
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.status === 'complete') {
      if (options.contextMenu) {
        ContextMenu.update(tab);
      }
    }

    chrome.tabs.sendRequest(tabId, {
      name: 'tabUpdated',
    });
  });

  /**
   * Listen when a tab is activated to update the context-menu
   */
  chrome.tabs.onActivated.addListener(activeInfo => {
    if (options.contextMenu) {
      chrome.tabs.get(activeInfo.tabId, tab => {
        ContextMenu.update(tab);
      });
    }
  });
};

export default { init };
