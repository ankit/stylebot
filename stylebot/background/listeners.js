/**
 * Listeners for the background page
 */

chrome.extension.onRequest.addListener(
  function(request, sender, sendResponse) {
    switch (request.name) {
      case 'activateBrowserAction':
        BrowserAction.activate(sender.tab);
        break;

      case 'unhighlightBrowserAction':
        BrowserAction.unhighlight(sender.tab);
        break;

      case 'highlightBrowserAction':
        BrowserAction.highlight(sender.tab);
        break;

      case 'copyToClipboard':
        request.text.copyToClipboard();
        break;

      case 'save':
        cache.styles.save(request.url, request.rules, request.data);
        break;

      case 'doesStyleExist':
        sendResponse(cache.styles.exists(request.url));
        break;

      case 'transfer':
        cache.styles.transfer(request.source, request.destination);
        break;

      case 'getGlobalRules':
        sendResponse(cache.styles.getGlobalRules());
        break;

      case 'getCombinedRulesForPage':
        var response;
        if (cache.styles.getCombinedRulesForPage) {
          response = cache.styles.getCombinedRulesForPage(
            request.url, sender.tab);
          response.success = true;
        } else {
          response = {
            success: false
          }
        }

        sendResponse(response);
        break;

      case 'getCombinedRulesForIframe':
        var response;
        if (cache.styles.getCombinedRulesForIframe) {
          response = cache.styles.getCombinedRulesForIframe(
            request.url, sender.tab);
          response.success = true;
        } else {
          response = {
            success: false
          }
        }

        sendResponse(response);
        break;

      case 'fetchOptions':
        sendResponse({
          options: cache.options
        });
        break;

      case 'showOptions':
        chrome.tabs.create({
          url: 'options/index.html',
          active: true
        });
        break;

      case 'saveAccordionState':
        saveAccordionState(request.accordions);
        break;

      case 'saveOption':
        saveOption(request.option.name, request.option.value);
        break;

      case 'getOption':
        sendResponse(cache.options[name]);
        break;

      case 'fetchImportCSS':
        cache.styles.fetchImportCSS(request.url, function(css) {
          sendResponse({text: css});
        });
  }
});

/**
 * Listen when an existing tab is updated to update the context
 * menu and browser action
 */
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (tab.status === 'complete') {
    if (cache.options.contextMenu) {
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
chrome.tabs.onActivated.addListener(function(activeInfo) {
  if (cache.options.contextMenu) {
    chrome.tabs.get(activeInfo.tabId, function(tab) {
      ContextMenu.update(tab);
    });
  }
});

/**
 * Listen when a tab is removed to clear its related cache
 */
chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
  if (cache.loadingTabs[tabId]) {
    delete cache.loadingTabs[tabId];
  }
});
