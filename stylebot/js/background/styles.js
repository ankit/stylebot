/**
  * Styles object used by background.js
  * @constructor
  * @param {Object} param JSON style object
  * Example:
  * styles = {
      'google.com' : {.
        _rules: {
          'a': {
            'color': 'red'
          }
        },
        _social: {
          id: 4,
          timestamp: 123456 (UNIX based)
        },
        _enabled: true
      }
    }
  */
function Styles(param) {
  this.styles = param;
}

/**
  * Deletes an style
  * @param {String} url The url of the style to delete.
  */
Styles.prototype.delete = function(url) {
  delete this.styles[url];
  this.persist();
};

/**
  * Returns the style object associated with the given url
  *   If no url is given, returns all the style objects
  * @param {String} url The URL of the requested object.
  * @return {Object} The request style(s) object(s).
  */
Styles.prototype.get = function(url) {
  if (url === undefined) {
    return this.styles;
  } else {
    return this.styles[url];
  }
};

Styles.prototype.set = function(url, value) {
  if (url === undefined) {
    return false;
  } else {
    this.styles[url] = value;
    return this.styles[url];
  }
};

Styles.prototype.persist = function() {
  chrome.storage.local.set({'styles': this.styles});
}

/**
  * Creates a new style for the given URL
  * @param {String} url URL of the new object.
  * @param {Object} rules Rules for the given URL.
  */
Styles.prototype.create = function(url, rules, data) {
  this.styles[url] = {};
  this.styles[url]['_enabled'] = true;
  this.styles[url]['_rules'] = rules === undefined ? {} : rules;
  if (data !== undefined) {
    this.setMetadata(url, data);
  }
  this.persist();
};

/**
  * Saves the given metadata inside the style for the given URL.
  * @param {String} url URL of the saved object.
  * @param {Object} data New metadata for the given URL.
  */
Styles.prototype.setMetadata = function(url, data) {
  this.styles[url]['_social'] = {};
  this.styles[url]['_social'].id = data.id;
  this.styles[url]['_social'].timestamp = data.timestamp;
};

/**
  * Retrieves the enabled status for the given URL
  * @param {String} url URL of the requested object.
  * @return {Boolean} The enabled status for the given URL.
  */
Styles.prototype.isEnabled = function(url) {
  if (this.styles[url] === undefined) {
    return false;
  }
  return this.styles[url]['_enabled'];
};

/**
  * Saves the given rules and metadata inside the style for the given URL.
  *   If no rules are given, the given URL style is deleted.
  * @param {String} url URL of the saved object.
  * @param {Object} rules rules New rules for the given URL.
  * @param {Object} data New metadata for the given URL.
  */
Styles.prototype.save = function(url, rules, data) {
  if (!url || url === '') {
    return;
  }

  if (rules) {
    this.create(url, rules, data);
  } else {
    this.delete(url);
  }
};

/**
  * If no value is given toggles the enabled status for the given URL.
  *   Otherwise, sets the enabled status for the given URL.
  * @param {String} url URL of the saved object.
  * @param {Object} value The enabled status for the given URL.
  */
Styles.prototype.toggle = function(url, value, shouldSave) {
  if (this.isEmpty(url)) {
    return false;
  }

  if (value != undefined && value != null) {
    this.styles[url]['_enabled'] = !this.styles[url]['_enabled'];
  } else {
    this.styles[url]['_enabled'] = value;
  }

  if (shouldSave) {
    this.persist();
  }

  return true;
};

/**
  * If no value is given toggles the enabled status for all the styles.
  *   Otherwise, sets the enabled status for all the styles.
  * @param {Object} value The enabled status.
  */
Styles.prototype.toggleAll = function(value) {
  for (var url in this.styles) {
    this.toggle(url, value, false);
  }
  this.persist();
};

Styles.prototype.deleteAll = function() {
  this.styles = {};
  this.persist();
};

/**
  * Check if the style for the given identifier exists.
  * @param {String} url The style's identifier.
  * @return {Boolean} True if the requested style exists.
  */
Styles.prototype.isEmpty = function(url) {
  return this.styles[url] === undefined || this.styles[url] == null;
};

/**
  * Empties an style associated rules
  * @param {String} url Identifier of the style to empty.
  */
Styles.prototype.emptyRules = function(url) {
  this.styles[url]['_rules'] = null;
  this.persist();
};

/**
  * Imports a styles object i.e. replaces the existing styles
  *   object with the specified object
  * @param {Object} newStyles Styles object to import.
  */
Styles.prototype.import = function(newStyles) {
  for (var url in newStyles) {
    if (newStyles[url]['_rules']) {
      // it's the new format.
      this.styles[url] = newStyles[url];
    } else {
      // legacy support for the old format.
      this.create(url, newStyles[url]);
    }
  }

  this.persist();
};

/**
  * Upgrades the style object to match the specified version
  * @param {String} version The version to upgrade to
  */
Styles.prototype.upgrade = function(version, callback) {
  switch (version) {
    case '1.7':
      console.log('Upgrading data model for 1.7');

      var initOptions = function() {
        chrome.storage.local.set({'options': cache.options}, function() {
          callback();
        });
      };

      if (localStorage['stylebot_styles']) {
          chrome.storage.local.set({'styles':
          JSON.parse(localStorage['stylebot_styles'])}, function() {

          for (var option in cache.options) {
            var value = localStorage['stylebot_option_' + option];
            if (value) {
              if (value === 'true' || value === 'false') {
                value = (value === 'true');
              }
              cache.options[option] = value;
            } else {
              value = cache.options[option];
            }
          }

          initOptions();
        });
      } else {
        initOptions();
      }

      break;
  }
};

/**
  * Retrieves rules for the given identifier
  * @param {String} url The given identifier.
  * @return {Object} The enabled status for the given URL.
  */
Styles.prototype.getRules = function(url) {
  if (this.styles[url] === undefined) {
    return null;
  }
  var rules = this.styles[url]['_rules'];
  return rules ? rules : null;
};

/**
  * Returns if a style exists for the URL
  * @param {String} aURL The URL to check.
  * @return {Boolean} True if any rules are associated with the URL
  */
Styles.prototype.exists = function(aURL) {
  if (this.isEnabled(aURL) && aURL !== '*') {
    return true;
  }
  else {
    return false;
  }
};

/**
  * Retrieves all the CSS rules applicable to the URL,
  *   including global CSS rules
  * @param {String} aURL The URL to retrieve the rules for.
  * @return {Object} rules: The rules. url: The identifier representing the URL.
  */
Styles.prototype.getCombinedRulesForPage = function(aURL, tab) {
  // global css rules
  var global;
  if (this.isEmpty('*') || !this.isEnabled('*'))
    global = null;
  else
    global = this.getRules('*');

  if (!aURL.isOfHTMLType())
    return {rules: null, url: null, global: null};

  var response;

  // if the URL is stylebot.me, return rules for stylebot.me if they exist
  // otherwise, return response as null
  if (aURL.indexOf('stylebot.me') != -1) {
    if (!this.isEmpty('stylebot.me')) {
      response = {
        rules: this.getRules('stylebot.me'),
        url: 'stylebot.me',
        global: global
      };
    }
    else {
      response = {
        rules: null,
        url: null,
        global: global
      };
    }
  }

  else {
    // this will contain the combined set of evaluated rules to be applied to
    // the page. longer, more specific URLs get the priority for each selector
    // and property
    var rules = {};
    var url_for_page = '';
    var found = false;

    for (var url in this.styles) {
      if (!this.isEnabled(url) || url === '*')
        continue;

      if (aURL.matchesPattern(url)) {
        if (!found) found = true;

        if (url.length > url_for_page.length)
          url_for_page = url;

        // iterate over each selector in styles
        var urlRules = this.getRules(url);

        for (var selector in urlRules) {
          // if no rule exists for selector, simply copy the rule
          if (rules[selector] == undefined)
            rules[selector] = cloneObject(urlRules[selector]);
          // otherwise, iterate over each property
          else {
            for (var property in urlRules[selector]) {
              if (rules[selector][property] == undefined || url == url_for_page)
                rules[selector][property] = urlRules[selector][property];
            }
          }
        }
      }
    }
    if (found) {
      response = {
        rules: rules,
        url: url_for_page,
        global: global
      };
    }
    else {
      response = {
        rules: null,
        url: null,
        global: global
      };
    }
  }

  // Update page action.
  if (cache.options.showPageAction) {
    if (response.rules || response.global) {
      highlightPageAction(tab);
    } else {
      disablePageAction(tab);
    }
    chrome.pageAction.show(tab.id);
  }

  cache.loadingTabs[tab.id] = response;
  return response;
};

Styles.prototype.getCombinedRulesForIframe = function(aURL, tab) {
  var response;
  if (response = cache.loadingTabs[tab.id]) {
    // just in case the page action wasn't updated when getCombinedRulesForPage was called
    // this mostly occurs when there are lots of iframes in a page. e.g. plus.google.com
    // todo: find a better way out for this
    if (cache.options.showPageAction) {
      if (response.rules || response.global)
        highlightPageAction(tab);
      else
        disablePageAction(tab);

      chrome.pageAction.show(tab.id);
    }
    return response;
  }
  else {
    return this.getCombinedRulesForPage(aURL, tab);
  }
}

/**
  * Retrieves Get all the global rules
  * @return {Object} The rules of the global stylesheet.
  */
Styles.prototype.getGlobalRules = function() {
  if (this.isEmpty('*') || !this.isEnabled('*')) {
    return null;
  }
  return this.getRules('*');
};

/**
  * Transfer rules from source URL to destination URL.
  * @param {String} source Source's identifier.
  * @param {String} destination Destination's identifier.
  */
Styles.prototype.transfer = function(source, destination) {
  if (this.styles[source]) {
    this.styles[destination] = this.styles[source];
    this.persist();
  }
};
