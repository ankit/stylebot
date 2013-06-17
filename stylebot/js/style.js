/**
* stylebot.style
*
* Generating, applying and saving CSS styling rules
**/

stylebot.style = {
  AT_RULE_PREFIX: "at",
  CSS_SELECTOR: "#stylebot-css",
  GLOBAL_CSS_SELECTOR: "#stylebot-global-css",
  PREVIEW_SELECTOR: "#stylebot-preview",
  PREVIEW_FADE_OUT_DELAY: 500,

  /*  cache of custom CSS rules applied to elements on the current page
  e.g.:
  rules = {
    'a': {
      'color': '#fff',
      'font-size': '12px'
    }
  }
  */
  rules: {},
  global: {},
  social: {},
  timer: null,
  parser: null,
  status: true,

  cache: {
    // last selected elements' selector
    selector: null,
    // last selected elements
    elements: null,
    // url for which styles will be saved
    url: document.domain,
    styleEl: null
  },

  /**
    * Initialize rules and url from temporary variables in apply-css.js
    */
  initialize: function() {
    if (stylebotTempUrl) {
      this.cache.url = stylebotTempUrl;
      delete stylebotTempUrl;
    }

    // if domain is empty, return url
    else if (!this.cache.url || this.cache.url === '')
      this.cache.url = location.href;

    if (stylebotTempRules) {
      this.rules = stylebotTempRules;
      delete stylebotTempRules;
    }

    if (stylebotTempGlobalRules) {
      this.global = stylebotTempGlobalRules;
      delete stylebotTempGlobalRules;
    }

    if (stylebotTempSocialData) {
      this.social = stylebotTempSocialData;
      delete stylebotTempSocialData;
    }
  },

  /**
    * Update cache with selector and selected elements
    * @param {string} selector CSS selector to update cache
    */
  fillCache: function(selector) {
    if (selector != this.cache.selector) {
      this.cache.selector = selector;
      try {
        this.cache.elements = $(selector + ':not(#stylebot, #stylebot *)');
      }
      catch (e) {
        this.cache.elements = null;
      }
    }
  },

  /**
    * Applies and saves CSS style to selected elements as inline css.
    *   Used by Basic Mode.
    * @param {string} property CSS property
    * @param {string} value Value for CSS property
    */
  apply: function(property, value) {
    if (!this.cache.selector || this.cache.selector == '') {
      return true;
    }

    this.savePropertyToCache(this.cache.selector, property, value);
    this.save();

    setTimeout(function() {
      if (stylebot.style.cache.elements &&
        stylebot.style.cache.elements.length != 0)
        stylebot.style.updateInlineCSS(stylebot.style.cache.elements,
          stylebot.style.getInlineCSS(stylebot.style.cache.selector));
      else
        stylebot.style.updateStyleElement(stylebot.style.rules);
    }, 0);
  },

  /** Applies and saves CSS to selected elements as inline css.
    *   Used by Advanced Mode.
    * @param {string} css CSS string to apply
    */
  applyCSS: function(css) {
    if (!stylebot.style.cache.selector) return true;

    // calculating timer duration based upon number of elements
    var duration;

    if (stylebot.style.cache.elements) {
      var noOfElements = stylebot.style.cache.elements.length;

      if (noOfElements >= 400)
        duration = 400;
      else if (noOfElements >= 200)
        duration = 300;
      else
        duration = 0;
    }
    else
      duration = 0;

    if (stylebot.style.updateCSSTimer) {
      clearTimeout(stylebot.style.updateCSSTimer);
      stylebot.style.updateCSSTimer = null;
    }

    stylebot.style.updateCSSTimer = setTimeout(function() {
      stylebot.style.saveRuleFromCSS(css, stylebot.style.cache.selector);

      if (stylebot.style.cache.elements &&
        stylebot.style.cache.elements.length != 0) {

        var newCSS = CSSUtils.crunchCSSForSelector(
          stylebot.style.rules,
          stylebot.style.cache.selector,
          true,
          false);

          stylebot.style.updateInlineCSS(stylebot.style.cache.elements, newCSS);
      } else {
        stylebot.style.updateStyleElement(stylebot.style.rules);
      }
    }, duration);

    if (stylebot.style.timer) {
      clearTimeout(stylebot.style.timer);
      stylebot.style.timer = null;
    }

    stylebot.style.timer = setTimeout(function() {
      stylebot.style.save();
    }, 1000);
  },

  /**
    * Update CSS for the entire page. Used by Page Editing Mode
    * @param {string} css CSS string
    * @param {boolean} save Should CSS be saved
    * @param {Object} data Any additional data that should be sent
    *   along with the save request.
    */
  applyPageCSS: function(css, shouldSave, data) {
    if (shouldSave === undefined) { shouldSave = true; }

    var parsedRules = {};

    if (css != '') {
      if (!this.parser)
        this.parser = new CSSParser();
      try {
        var sheet = this.parser.parse(css, false, true);
        parsedRules = CSSUtils.getRulesFromParserObject(sheet);
      } catch (e) {
        console.log(e);
      }
    }

    if (parsedRules['error']) { return parsedRules['error']; }

    this.clearInlineCSS(this.cache.elements);
    this.updateStyleElement(parsedRules);

    if (shouldSave) {
      this.rules = parsedRules;
      this.save(data);
    }

    return true;
  },

  /**
    * Parses CSS string into a rule and then saves the rule
    *   for the specified selector
    * @param {string} css CSS String
    * @param {string} selector CSS selector
    */
  saveRuleFromCSS: function(css, selector) {
    if (!selector) return true;
    // empty rule for selector
    delete this.rules[selector];

    if (css != '') {
      if (!this.parser)
        this.parser = new CSSParser();

      var sheet = this.parser.parse(selector + '{' + css + '}', false, true);
      var generatedRule = CSSUtils.getRuleFromParserObject(sheet);
      // save rule to cache
      this.rules[selector] = generatedRule;
    }
  },

  /**
    * Add rule to cache
    * @param {string} selector CSS selector
    * @param {property} property CSS property
    * @param {value} value Value for property
    */
  savePropertyToCache: function(selector, property, value) {
    // check if the selector already exists in the list
    var rule = this.rules[selector];
    if (rule != undefined) {
      if (!this.filter(property, value)) {
        // does a value for property already exist
        if (rule[property] != undefined) {
          delete this.rules[selector][property];

          // if no properties left, remove rule as well
          // TODO: Use something more elegant than this hack.
          var i = null;
          for (i in this.rules[selector])
            break;

          if (!i)
            delete this.rules[selector];
        }
      }
      else
        rule[property] = value;
    }
    else if (this.filter(property, value)) {
      this.rules[selector] = new Object();
      this.rules[selector][property] = value;
    }
  },

  /**
    * Checks to see if a rule is valid i.e. value is not empty
    * @param {string} property CSS property
    * @param {string} value Value for property
    */
  filter: function(property, value) {
    if (value === '')
      return false;
    return true;
  },

  /**
    * Generate inline CSS for selector from saved rules
    * @param {string} selector CSS Selector
    */
  getInlineCSS: function(selector) {
    var rule = this.rules[selector];

    if (rule != undefined) {
      var css = '';
      for (var property in rule) {
        if (property.indexOf('comment') != -1) continue;
        css += CSSUtils.crunchCSSForDeclaration(property, rule[property], true);
      }
      return css;
    }
    return '';
  },

  /**
    * Apply inline CSS to specified eleement(s)
    * @param {element} el Element to apply CSS to
    * @param {string} newCustomCSS CSS to apply
    */
  updateInlineCSS: function(el, newCustomCSS) {
    if (!el || el.length == 0) return false;

    el.each(function() {
      var $this = $(this);

      var existingCSS = $this.attr('style');
      existingCSS = existingCSS ? $.trim(existingCSS) : '';

      var existingCustomCSS = $this.data('stylebotCSS');
      existingCustomCSS = existingCustomCSS ? $.trim(existingCustomCSS) : '';

      var newCSS;

      // if stylebot css is being applied to the element for the first time
      if (!existingCustomCSS) {
        // if there is any existing inline CSS, append stylebot CSS to it
        if (existingCSS != undefined) {
          if (existingCSS.length != 0 &&
            existingCSS[existingCSS.length - 1] != ';')
            newCSS = existingCSS + ';' + newCustomCSS;
          else
            newCSS = existingCSS + newCustomCSS;
        }
        else
          newCSS = newCustomCSS;
      }

      else
        // replace existing stylebot CSS with updated stylebot CSS
        newCSS = existingCSS.replace(existingCustomCSS, newCustomCSS);

      // update style
      $this.attr('style', newCSS);
      // update stylebot css data associated with element
      $this.data('stylebotCSS', newCustomCSS);
    });

    // update selection box
    setTimeout(function() {
      stylebot.selectionBox.highlight(stylebot.selectedElement);
    }, 0);
  },

  /**
    * Remove any inline CSS for specified element(s)
    * @param {element} el jQuery object of elements
    */
  clearInlineCSS: function(el) {
    if (!el) return false;

    el.each(function() {
      var $this = $(this);

      var existingCSS = $this.attr('style');
      var existingCustomCSS = $this.data('stylebotCSS');

      if (existingCustomCSS != undefined && existingCSS != undefined) {
        var newCSS = existingCSS.replace(existingCustomCSS, '');
        $this.attr('style', newCSS);
        // clear stylebot css data associated with element
        $this.data('stylebotCSS', null);
      }
    });
  },

  /**
    * Remove inline CSS for all elements
    */
  resetInlineCSS: function() {
    for (var selector in stylebot.style.rules) {
      stylebot.style.clearInlineCSS($(selector));
    }
  },

  /**
    * Remove rule for cached CSS selector from <style> element
    *   and apply it as inline css
    */
  removeFromStyleElement: function() {
    // if no elements are selected, return
    if (!this.cache.elements || this.cache.elements.length == 0) return;

    this.updateInlineCSS(this.cache.elements,
      this.getInlineCSS(this.cache.selector));
    var tempRules = {};

    for (var sel in this.rules) {
      if (sel != this.cache.selector)
      tempRules[sel] = this.rules[sel];
    }

    this.updateStyleElement(tempRules);
  },

  /**
    * Update CSS in <style> element from the specified rules
    * @param {array} rules The style rules
    */
  updateStyleElement: function(rules) {
    if (!this.cache.styleEl) {
      this.cache.styleEl = $(this.CSS_SELECTOR);
    }

    CSSUtils.crunchCSS(rules, true, true, $.proxy(function(css) {
      if (this.cache.styleEl.length != 0) {
        this.cache.styleEl.html(css);
      } else {
        CSSUtils.injectCSS(css, 'stylebot-css');
        this.cache.styleEl = $(this.CSS_SELECTOR);
      }
    }, this));
  },

  /**
    * Get the rule for the specified CSS selector
    * @param {string} selector CSS selector for which to get the rule
    */
  getRule: function(selector) {
    var rule = this.rules[selector];
    if (rule != undefined)
      return rule;
    else
      return null;
  },

  /**
    * Remove any existing custom CSS for current selector from the rules cache
    * and the selected elements' inline css
    */
  resetSelectedElementCSS: function() {
    if (this.rules[this.cache.selector])
      delete this.rules[this.cache.selector];

    this.clearInlineCSS(this.cache.elements);

    setTimeout(function() {
      stylebot.selectionBox.highlight(stylebot.selectedElement);
    }, 0);

    this.save();
  },

  /**
    * Remove all the CSS for page from cache, <style> element and inline CSS.
    */
  resetAllCSS: function(showPopover) {
    if (showPopover) {
      this.showPreviewPopover("Reset custom CSS for the page");
      this.hidePreviewPopover(true);
    }

    for (var selector in this.rules) {
      delete this.rules[selector];
      this.clearInlineCSS($(selector));
    }

    this.updateStyleElement(null);

    setTimeout(function() {
      if (stylebot.selectionBox) {
        stylebot.selectionBox.highlight(stylebot.selectedElement);
      }
    }, 0);

    this.save();
  },

  /**
    * Send request to background.html to save all the cached rules
    * @param {Object} data Any additional metadata to save along with the rules
    */
  save: function(data) {
    // if no rules are present, send null as value
    var rules = null;
    var i = false;

    for (var i in stylebot.style.rules) {
      break;
    }

    if (i) {
      rules = stylebot.style.rules;
    }

    stylebot.chrome.save(stylebot.style.cache.url, rules, data);
  },

  /**
    * Clears all the inline CSS and updates the <style> element
    * Called when stylebot is closed.
    */
  cleanUp: function() {
    stylebot.style.cache.selector = null;
    stylebot.style.cache.elements = null;
    stylebot.style.social = null;

    setTimeout(function() {
      stylebot.style.updateStyleElement(stylebot.style.rules);
      stylebot.style.resetInlineCSS();
    }, 100);
  },

  /**
    * Undo last style applied
    */
  undo: function() {
    var self = this;
    if (stylebot.undo.isEmpty())
      return false;

    self.rules = stylebot.undo.pop();
    self.clearInlineCSS(self.cache.elements);
    self.updateStyleElement(self.rules);
    self.save();

    stylebot.widget.open();
    stylebot.undo.refresh();

    setTimeout(function() {
      stylebot.highlight(stylebot.selectedElement);
    }, 0);
  },

  /**
    * Disable styling
    */
  disable: function() {
    this.status = false;
    $(this.CSS_SELECTOR).html('');
    $(this.GLOBAL_CSS_SELECTOR).html('');
  },

  /**
    * Enable styling
    */
  enable: function() {
    if (this.status)
      return;
    this.status = true;

    CSSUtils.crunchCSS(this.rules, true, true, $.proxy(function(css) {
      $(this.CSS_SELECTOR).html(css);
    }, this));

    if (this.global) {
      CSSUtils.crunchCSS(this.global, true, true, $.proxy(function(css) {
        $(this.GLOBAL_CSS_SELECTOR).html(css);
      }, this));
    }
  },

  /**
    * Toggle styling
    */
  toggle: function() {
    // If stylebot is open, don't allow user to disable styling on the page.
    if (stylebot.status) {
      return false;
    }

    if (this.status)
      this.disable();
    else
      this.enable();
  },

  /**
    * Preview the page after removing any style rules
    */
  previewReset: function() {
    this.showPreviewPopover("Reset Preview");
    this.applyPageCSS("", false);
  },

  /**
    * Preview the specified style by applying its CSS to the page.
    * @param {String} title The title of style.
    * @param {String} desc Description for the style.
    * @param {String} author The author of the style.
    * @param {String} timeAgo Relative time string when the style was authored.
    * @param {Integer} favCount Number of times the style has been favorited
    *   on Stylebot Social.
    * @param {String} css The css for the style.
    */
  preview: function(title, desc, author, timeAgo, favCount, css) {
    if (desc) {
      desc = desc.replace(/\n/g, '<br />');
    }

    this.showPreviewPopover(title + "<br>" +
      "<div id='stylebot-preview-meta'>by " + author + " (" + favCount +
      " favorites) • Last updated " + timeAgo + "</div>" +
      "<br><div id='stylebot-preview-description'>" + desc + "</div>");

    this.applyPageCSS(css, false);
  },

  /**
    * Reset the preview of any style and reset to the specifed CSS.
    * @param {String} css The CSS to apply to the page.
    */
  resetPreview: function(css) {
    CSSUtils.crunchCSS(this.rules, true, true, $.proxy(function(css) {
      $(this.CSS_SELECTOR).html(css);
    }, this));

    this.hidePreviewPopover();
  },

  /**
    * Install the specified style for the current URL
    * @param {Number} id The id of the style
    * @param {String} title The title describing the style
    * @param {String} css The css for the style
    * @param {String} timestamp The timestamp when the style was last updated
    */
  install: function(id, title, css, timestamp) {
    this.showPreviewPopover("Installed " + title);
    this.hidePreviewPopover(true);

    this.social = {
      id: id,
      timestamp: timestamp
    };

    this.applyPageCSS(css, true, this.social);
  },

  /**
    * Show the preview popover
    * @param {String} html The content to display inside the popover
    */
  showPreviewPopover: function(html) {
    var $preview = $(this.PREVIEW_SELECTOR);
    if ($preview.length === 0) {
      $preview = $("<div>", {
        id: "stylebot-preview"
      });

      $("body").append($preview);
    }

    $preview.html(html)
    .css('left', $(window).width() / 2 - $preview.width() / 2)
    .css('top', $(window).height() - $preview.height() - 100)
    .show();
  },

  /**
    * Hide the preview popover
    * @param {Boolean} shouldFadeOut If the popover should fade out
    */
  hidePreviewPopover: function(shouldFadeOut) {
    var $preview = $(this.PREVIEW_SELECTOR);
    if (shouldFadeOut) {
      setTimeout($.proxy(function() {
        $preview.fadeOut(1000);
      }, this), this.PREVIEW_FADE_OUT_DELAY);
    } else {
      $preview.hide();
    }
  },

  /**
    * Prepend an @import rule for a web-based font to the current
    * style and save the style.
    * @param {String} url The URL of the font.
    * @param {String} css the @font-face css for the font.
    */
  prependWebFont: function(url, css) {
    var self = this;

    var rule = {
      'text': '@import url(' + url + ');',
      'expanded_text': css,
      'type': '@import',
      'url': url
    };

    rule[self.AT_RULE_PREFIX] = true;

    var selectorCounter = 1;
    while (self.rules.hasOwnProperty(self.AT_RULE_PREFIX + selectorCounter)) {
      selectorCounter++;
    }

    var newRules = {};
    newRules[self.AT_RULE_PREFIX + selectorCounter] = rule;

    // todo: add ordering to styling rules, this is not reliable.
    for (selector in self.rules) {
      if (!self.rules[selector]['text'] ||
        !self.rules[selector]['text'] === rule['text']) {
        newRules[selector] = self.rules[selector];
      }
    }

    self.rules = newRules;
    self.resetInlineCSS();
    self.updateStyleElement(self.rules);
    self.save();
  }
};
