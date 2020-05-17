/**
 * Selection of DOM elements
 * Based on Firebug's non-canvas implementation
 *
 * @requires jQuery
 *
 * A DIV is used for each edge.
 * To highlight an element, the width, height, left offset and top offset values of edge DIVs
 * are manipulated to surround the element.
 *
 * TODO: Canvas?
 *
 * Copyright (c) 2007, Parakey Inc.
 * Copyright (c) 2012, Ankit Ahuja
 * Licensed under GPL, MIT and BSD Licenses
 */

/**
 * @constructor
 * @param {number} edgeSize Thickness of each edge. By default, 2
 * @param {string} edgeColor Hexcode for color of each edge. By default, #65f166
 * @param {element} edgeContainer Element inside which the edges are inserted.
 *    By default, body
 */
var SelectionBox = function (edgeSize, edgeColor, edgeContainer) {
  edgeSize = edgeSize ? edgeSize : 2;
  edgeColor = edgeColor ? edgeColor : '#65f166';
  edgeContainer = edgeContainer ? edgeContainer : $('body').get(0);

  /**
   * Create an edge
   * @return {element} DIV for the edge
   * @private
   */
  var createEdge = function () {
    var css = {
      'background-color': edgeColor,
      position: 'absolute',
      'z-index': '2147483644',
    };
    return $('<div>').css(css);
  };

  var edges = {};
  edges.top = createEdge();
  edges.right = createEdge();
  edges.bottom = createEdge();
  edges.left = createEdge();

  for (var edge in edges) {
    edges[edge].appendTo(edgeContainer);
  }

  var self = this;

  /**
   * Highlight an element. Removes highlight from previously highlighted element
   * @param {element} el DOM element to highlight
   * @public
   */
  this.highlight = function (el) {
    if (!el) {
      self.hide();
      return;
    }

    if (el.nodeType != 1) el = el.parentNode;

    var scrollbarSize = 17;
    var windowSize = getWindowSize();
    var scrollSize = getWindowScrollSize();
    var scrollPosition = getWindowScrollPosition();
    var box = getElementBox(el);
    var top = box.top;
    var left = box.left;
    var height = box.height;
    var width = box.width;

    var freeHorizontalSpace =
      scrollPosition.left +
      windowSize.width -
      left -
      width -
      (scrollSize.height > windowSize.height // is *vertical* scrollbar visible
        ? scrollbarSize
        : 0);

    var freeVerticalSpace =
      scrollPosition.top +
      windowSize.height -
      top -
      height -
      (scrollSize.width > windowSize.width // is *horizontal* scrollbar visible
        ? scrollbarSize
        : 0);

    var numVerticalBorders = freeVerticalSpace > 0 ? 2 : 1;

    // top edge
    moveEdge('top', top - edgeSize, left);
    resizeEdge('top', edgeSize, width);

    // left edge
    moveEdge('left', top - edgeSize, left - edgeSize);
    resizeEdge('left', height + numVerticalBorders * edgeSize, edgeSize);

    // bottom edge
    if (freeVerticalSpace > 0) {
      moveEdge('bottom', top + height, left);
      resizeEdge('bottom', edgeSize, width);
    } else {
      moveEdge('bottom', -2 * edgeSize, -2 * edgeSize);
      resizeEdge('bottom', edgeSize, edgeSize);
    }

    // right edge
    if (freeHorizontalSpace > 0) {
      moveEdge('right', top - edgeSize, left + width);
      resizeEdge(
        'right',
        height + numVerticalBorders * edgeSize,
        freeHorizontalSpace < edgeSize ? freeHorizontalSpace : edgeSize
      );
    } else {
      moveEdge('right', -2 * edgeSize, -2 * edgeSize);
      resizeEdge('right', edgeSize, edgeSize);
    }
  };

  /**
   * Hide selection edges
   * @public
   */
  this.hide = function () {
    for (var edge in edges) edges[edge].width(0).height(0);
  };

  /**
   * Remove the selection box from DOM
   * @public
   */
  this.destroy = function () {
    for (var edge in edges) edges[edge].remove();
  };

  /**
   * Move an edge
   * @private
   * @param {element} edge DIV
   * @param {number} t Top offset
   * @param {number} l Left offset
   */
  var moveEdge = function (edge, t, l) {
    edges[edge].css('top', t + 'px');
    edges[edge].css('left', l + 'px');
  };

  /**
   * Resize an edge
   * @private
   * @param {element} edge DIV
   * @param {number} h Height of edge to set
   * @param {number} w Width of edge to set
   */
  var resizeEdge = function (edge, h, w) {
    edges[edge].height(h);
    edges[edge].width(w);
  };

  /**
   * Get an element's offset and dimensions
   * @private
   * @param {element} el Element
   * @return {object} Offset and dimensions of element.
   *    Example: {top:1, left: 2, height: 3, width: 4}
   */
  var getElementBox = function (el) {
    var result = {};

    if (el.getBoundingClientRect) {
      var rect = el.getBoundingClientRect();
      var scroll = getWindowScrollPosition();
      result.top = Math.round(rect.top + scroll.top);
      result.left = Math.round(rect.left + scroll.left);
      result.height = Math.round(rect.bottom - rect.top);
      result.width = Math.round(rect.right - rect.left);
    } else {
      var position = getElementPosition(el);
      result.top = position.top;
      result.left = position.left;
      result.height = el.offsetHeight;
      result.width = el.offsetWidth;
    }
    return result;
  };

  /**
   * Get a window's scroll width and height
   * @private
   * @return {object} Scroll width and height. {width: 12, height: 12}
   */
  var getWindowScrollSize = function () {
    var width = 0,
      height = 0,
      el;

    // first try the document.documentElement scroll size
    if (
      (el = document.documentElement) &&
      (el.scrollHeight || el.scrollWidth)
    ) {
      width = el.scrollWidth;
      height = el.scrollHeight;
    }

    // then we need to check if document.body has a bigger scroll size value
    // because sometimes depending on the browser and the page, the document.body
    // scroll size returns a smaller (and wrong) measure
    if (
      (el = document.body) &&
      (el.scrollHeight || el.scrollWidth) &&
      (el.scrollWidth > width || el.scrollHeight > height)
    ) {
      width = el.scrollWidth;
      height = el.scrollHeight;
    }

    return { width: width, height: height };
  };

  /**
   * Get an element's left and top offset
   * @private
   * @param {element} el Element
   * @return {object} Object containing left and top offset values for element.
   */
  var getElementPosition = function (el) {
    var left = 0;
    var top = 0;

    do {
      left += el.offsetLeft;
      top += el.offsetTop;
    } while ((el = el.offsetParent));

    return { left: left, top: top };
  };

  /**
   * Get the DOM window's width and height
   * @private
   * @return {object} Example: {width: 600, height: 600}
   */
  var getWindowSize = function () {
    var width = 0,
      height = 0,
      el;

    if (typeof window.innerWidth == 'number') {
      width = window.innerWidth;
      height = window.innerHeight;
    } else if (
      (el = document.documentElement) &&
      (el.clientHeight || el.clientWidth)
    ) {
      width = el.clientWidth;
      height = el.clientHeight;
    } else if ((el = document.body) && (el.clientHeight || el.clientWidth)) {
      width = el.clientWidth;
      height = el.clientHeight;
    }

    return { width: width, height: height };
  };

  /**
   * Get DOM window's scroll position
   * @private
   * @return {object} With top and left properties
   */
  var getWindowScrollPosition = function () {
    var top = 0,
      left = 0,
      el;

    if (typeof window.pageYOffset === 'number') {
      top = window.pageYOffset;
      left = window.pageXOffset;
    } else if ((el = document.body) && (el.scrollTop || el.scrollLeft)) {
      top = el.scrollTop;
      left = el.scrollLeft;
    } else if (
      (el = document.documentElement) &&
      (el.scrollTop || el.scrollLeft)
    ) {
      top = el.scrollTop;
      left = el.scrollLeft;
    }

    return { top: top, left: left };
  };
};
