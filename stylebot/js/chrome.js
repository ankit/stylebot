/**
  * stylebot.chrome
  *
  * Methods sending / receving messages from background.html
  **/

stylebot.chrome = {
    setPageAction: function(status) {
        if (status)
            chrome.extension.sendRequest({ name: 'enablePageAction' }, function() {});
        else if (!$.isEmptyObject(stylebot.style.rules) || !$.isEmptyObject(stylebot.style.global))
            chrome.extension.sendRequest({ name: 'highlightPageAction' }, function() {});
        else
            chrome.extension.sendRequest({ name: 'disablePageAction' }, function() {});
    },

    // send request to background.html to copy text
    copyToClipboard: function(text) {
        chrome.extension.sendRequest({ name: 'copyToClipboard', text: text }, function() {});
    },

    // save all rules for a page
    save: function(url, rules, data) {
        chrome.extension.sendRequest({ name: 'save', rules: rules, url: url, data: data }, function() {});
    },

    doesStyleExist: function(url, callback) {
       chrome.extension.sendRequest({ name: 'doesStyleExist', url: url }, callback);
    },

    install: function(url, rules, id) {
        chrome.extension.sendRequest({ name: 'install', rules: rules, url: url, id: id }, function() {});
    },

    // transfer all rules for src url to dest url
    transfer: function(src, dest) {
        chrome.extension.sendRequest({name: 'transfer', source: src, destination: dest }, function() {});
    },

    // send request to fetch options from datastore
    fetchOptions: function() {
        chrome.extension.sendRequest({ name: 'fetchOptions' }, function(response) {
            initialize(response);
        });
    },

    saveAccordionState: function(enabledAccordions) {
        chrome.extension.sendRequest({ name: 'saveAccordionState', enabledAccordions: enabledAccordions }, function() {});
    },

    savePreference: function(name, value) {
        chrome.extension.sendRequest({ name: 'savePreference', preference: { name: name, value: value } }, function() {});
    },

    getPreference: function(name, callback) {
        chrome.extension.sendRequest({ name: 'getPreference', preferenceName: name }, function(response) {
            callback(response.value);
        });
    },

    pushStyles: function() {
        chrome.extension.sendRequest({ name: 'pushStyles' }, function() {});
    },

    openOptionsPage: function() {
        window.open(chrome.extension.getURL('options.html'));
    }
};

// Listen to requests from background.html
chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse) {
        if (request.name === 'status') {
            if (window != window.top)
                return;
            sendResponse({
                status: stylebot.status,
                rules: $.isEmptyObject(stylebot.style.rules) ? null : stylebot.style.rules,
                global: $.isEmptyObject(stylebot.style.global) ? null : stylebot.style.global
            });
        }

        else if (request.name === 'toggle') {
            if (window.document.domain === 'mail.google.com') {
                if (!window.frameElement || window.frameElement.id != 'canvas_frame')
                    return;
            }
            else if (window != window.top)
                return;
            stylebot.toggle();
            sendResponse({ status: stylebot.status });
        }

        else if (request.name === 'setOptions') {
            stylebot.setOptions(request.options);
            sendResponse({});
        }

        else if (request.name === 'openWidget') {
            stylebot.contextmenu.openWidget();
            sendResponse({});
        }

        else if (request.name === 'searchSocial') {
            if (!window.top)
                return;
            stylebot.contextmenu.searchSocial();
        }

        else if (request.name === 'shareStyleOnSocial') {
            if (!window.top)
                return;
            stylebot.contextmenu.shareStyleOnSocial();
        }

        else if (request.name === 'toggleStyle') {
            if (!window.top)
                return;
            stylebot.style.toggle();
            sendResponse({ status: stylebot.style.status });
        }

        else if (request.name === 'styleStatus') {
            if (!window.top)
                return;
            sendResponse({ status: stylebot.style.status });
        }
    }
);
