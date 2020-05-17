/**
 * Generate CSS Selector for an element
 *
 * Copyright (c) 2013 Ankit Ahuja
 * Dual licensed under GPL and MIT licenses.
 *
 * @requires jQuery
 **/

/**
 * Generator of CSS selectors for an element
 * @constructor
 * @param {String} [level] Specificity level at which to generate CSS selector.
      Valid values are low, high and medium. Default is medium
 */
var SelectorGenerator = function (level) {
  this.specificityLevel = level ? level : 'medium';

  var self = this;

  /**
   * Generate CSS selector for element
   * @public
   * @param {element} el Element
   * @return {string} CSS selector
   */
  this.generate = function (el) {
    var $el;

    if (!el) {
      return null;
    }

    $el = $(el);

    if (self.specificityLevel === 'low') {
      return inspectAtLowSpecificity($el);
    } else if (self.specificityLevel === 'high') {
      return inspectAtHighSpecificity($el, 0);
    } else {
      return inspect($el, 0);
    }
  };

  /**
   * If element has a class, return it as the CSS selector.
   *    Else, look for ID. Else, traverse upto 2 levels up
   * @private
   * @param {element} el Element to inspect
   * @param {number} DOM Traversal Level. Root is at 0
   * @return {string} CSS Selector
   */
  var inspect = function (el, level) {
    var elClass = el.attr('class');

    if (elClass !== undefined) {
      elClass = $.trim(elClass).replace(/\s{2,}/g, ' ');

      if (elClass.length !== 0) {
        var classes = elClass.split(' ');
        var len = classes.length;

        var selector = el.prop('tagName');
        selector = selector ? selector.toLowerCase() : '';

        for (var i = 0; i < len; i++) {
          selector += '.' + classes[i];
        }

        return selector;
      }
    }

    var elId = el.attr('id');
    if (elId !== undefined) {
      return '#' + elId;
    }

    var elTag = el.prop('tagName');
    elTag = elTag ? elTag.toLowerCase() : '';

    // don't go beyond 2 levels up
    if (level < 2) {
      return inspect(el.parent(), level + 1) + ' ' + elTag;
    } else {
      return elTag;
    }
  };

  /**
   * If element has an ID, return #ID.
   *    Else, check for classname (traverse upto 1 level up)
   * @private
   * @param {element} el Element to inspect
   * @param {number} DOM Traversal Level. Root is at 0
   * @return {string} CSS Selector
   */
  var inspectAtHighSpecificity = function (el, level) {
    var elId = el.attr('id');

    if (elId !== undefined) {
      return '#' + elId;
    }

    var elClass = el.attr('class');

    if (elClass !== undefined) {
      elClass = $.trim(elClass);
    } else {
      elClass = '';
    }

    var elTag = el.prop('tagName');
    elTag = elTag ? elTag.toLowerCase : '';

    var selector;
    if (level < 1) {
      selector = inspectAtHighSpecificity(el.parent(), level + 1) + ' ' + elTag;

      if (elClass.length !== 0) {
        selector += '.' + elClass;
      }
    } else {
      selector = elTag;

      if (elClass.length !== 0) {
        selector += '.' + elClass;
      }
    }

    return selector;
  };

  /**
   * Return element's tagName as CSS selector (Low Specificity Level)
   * @private
   * @param {element} el Element to inspect
   * @return {string} CSS Selector
   */
  var inspectAtLowSpecificity = function (el) {
    var elTag = el.prop('tagName');
    return elTag ? elTag.toLowerCase() : '';
  };
};
