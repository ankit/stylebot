import ContextMenu from './contextmenu';
import BrowserAction from './browseraction';

import BackgroundPageUtils from './utils';
import { saveOption } from './options';

/**
 * Initialize listeners for the background page
 */
const init = () => {
  chrome.extension.onRequest.addListener((request, sender, sendResponse) => {
    let response;

    switch (request.name) {
      case 'activateBrowserAction':
        if (sender.tab) {
          BrowserAction.activate(sender.tab);
        }

        break;

      case 'unhighlightBrowserAction':
        if (sender.tab) {
          BrowserAction.unhighlight(sender.tab);
        }

        break;

      case 'highlightBrowserAction':
        if (sender.tab) {
          BrowserAction.highlight(sender.tab);
        }

        break;

      case 'copyToClipboard':
        BackgroundPageUtils.copyToClipboard(request.text);
        break;

      case 'save':
        window.cache.styles.save(request.url, request.css);
        break;

      case 'doesStyleExist':
        sendResponse(window.cache.styles.exists(request.url));
        break;

      case 'transfer':
        window.cache.styles.transfer(request.source, request.destination);
        break;

      case 'getStyleUrlMetadataForTab':
        {
          const styleUrlMetadata = window.cache.styles.getStyleUrlMetadataForTab(
            sender.tab || request.tab
          );

          if (styleUrlMetadata) {
            response = { styleUrlMetadata, success: true };
          } else {
            response = { success: false };
          }
        }

        sendResponse(response);
        break;

      case 'getComputedStylesForTab':
        if (window.cache.styles.getComputedStylesForTab) {
          response = window.cache.styles.getComputedStylesForTab(
            sender.tab?.url,
            sender.tab
          );

          response.success = true;
        } else {
          response = {
            success: false,
          };
        }

        sendResponse(response);
        break;

      case 'getComputedStylesForIframe':
        if (window.cache.styles.getComputedStylesForIframe) {
          response = window.cache.styles.getComputedStylesForIframe(
            request.url,
            sender.tab
          );

          response.success = true;
        } else {
          response = {
            success: false,
          };
        }

        sendResponse(response);
        break;

      case 'enableStyleUrl':
        {
          window.cache.styles.toggle(request.styleUrl, true, true);
          window.cache.styles.updateStylesForTab(request.tab);
        }

        break;

      case 'disableStyleUrl':
        {
          window.cache.styles.toggle(request.styleUrl, false, true);
          window.cache.styles.updateStylesForTab(request.tab);
        }

        break;

      case 'getOptions':
        sendResponse({
          options: window.cache.options,
        });
        break;

      case 'showOptions':
        chrome.tabs.create({
          url: 'options/index.html',
          active: true,
        });

        break;

      case 'saveOption':
        saveOption(request.option.name, request.option.value);
        break;

      case 'getOption':
        sendResponse(window.cache.options[request.optionName]);
        break;
    }
  });

  /**
   * Listen when an existing tab is updated to update the context
   * menu and browser action
   */
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.status === 'complete') {
      if (window.cache.options.contextMenu) {
        ContextMenu.update(tab);
      }
    }

    if (changeInfo.url) {
      BrowserAction.update(tab);
    }
  });

  /**
   * Listen when a tab is activated to update the context menu
   */
  chrome.tabs.onActivated.addListener(activeInfo => {
    if (window.cache.options.contextMenu) {
      chrome.tabs.get(activeInfo.tabId, tab => {
        ContextMenu.update(tab);
      });
    }
  });

  /**
   * Listen when a tab is removed to clear its related cache
   */
  chrome.tabs.onRemoved.addListener(tabId => {
    if (window.cache.loadingTabs[tabId]) {
      delete window.cache.loadingTabs[tabId];
    }
  });
};

export default { init };
