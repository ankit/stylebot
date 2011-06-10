/**
  * Selection of DOM elements
  * Based on Firebug's non-canvas implementation
  *
  * Copyright (c) 2007, Parakey Inc.
  * Copyright (c) 2010, Ankit Ahuja
  * Licensed under GPL, MIT and BSD Licenses
 **/

/*
Currently, a DIV is used for each edge. To highlight an element, the width, height, left offset and top offset values of edge DIVs are manipulated to surround the element.

TODO: Canvas?
*/

var SelectionBox = function(edgeSize, className) {
    this.edgeSize = edgeSize;
    this.className = className;

    this.edges = {};
    this.edges.top = this.createEdge();
    this.edges.right = this.createEdge();
    this.edges.bottom = this.createEdge();
    this.edges.left = this.createEdge();

    for (var edge in this.edges)
        this.edges[edge].appendTo($('#stylebot-container').get(0));
};

SelectionBox.prototype.createEdge = function() {
    return $('<div>', {
        class: this.className
    });
};

SelectionBox.prototype.moveEdge = function(edge, t, l) {
    this.edges[edge].css('top', t + 'px');
    this.edges[edge].css('left', l + 'px');
};

SelectionBox.prototype.resizeEdge = function(edge, h, w) {
    this.edges[edge].height(h);
    this.edges[edge].width(w);
};

SelectionBox.prototype.hide = function() {
    for (var edge in this.edges)
        this.edges[edge].width(0).height(0);
};

// Modified version of drawOutline() from Firebug Lite
SelectionBox.prototype.highlight = function(el) {
    if (!el) {
        this.hide(); return;
    }
    if (el.nodeType != 1)
        el = el.parentNode;

    var scrollbarSize = 17;
    var windowSize = this.getWindowSize();
    var scrollSize = this.getWindowScrollSize();
    var scrollPosition = this.getWindowScrollPosition();

    var box = this.getElementBox(el);
    var top = box.top;
    var left = box.left;
    var height = box.height;
    var width = box.width;

    var freeHorizontalSpace = scrollPosition.left + windowSize.width - left - width -
            (scrollSize.height > windowSize.height ? // is *vertical* scrollbar visible
             scrollbarSize : 0);

    var freeVerticalSpace = scrollPosition.top + windowSize.height - top - height -
            (scrollSize.width > windowSize.width ? // is *horizontal* scrollbar visible
            scrollbarSize : 0);

    var numVerticalBorders = freeVerticalSpace > 0 ? 2 : 1;

    // top edge
    this.moveEdge('top', top - this.edgeSize, left);
    this.resizeEdge('top', this.edgeSize, width);

    // left edge
    this.moveEdge('left', top - this.edgeSize, left - this.edgeSize);
    this.resizeEdge('left', height + numVerticalBorders * this.edgeSize, this.edgeSize);

    // bottom edge
    if (freeVerticalSpace > 0) {
        this.moveEdge('bottom', top + height, left);
        this.resizeEdge('bottom', this.edgeSize, width);
    }
    else {
        this.moveEdge('bottom', -2 * this.edgeSize, -2 * this.edgeSize);
        this.resizeEdge('bottom', this.edgeSize, this.edgeSize);
    }

    // right edge
    if (freeHorizontalSpace > 0) {
        this.moveEdge('right', top - this.edgeSize, left + width);
        this.resizeEdge('right', height + numVerticalBorders * this.edgeSize, (freeHorizontalSpace < this.edgeSize ? freeHorizontalSpace : this.edgeSize));
    }
    else {
        this.moveEdge('right', -2 * this.edgeSize, -2 * this.edgeSize);
        this.resizeEdge('right', this.edgeSize, this.edgeSize);
    }
};

SelectionBox.prototype.destroy = function() {
    for (var edge in this.edges)
        this.edges[edge].remove();
};

// Unmodified methods from Firebug Lite
SelectionBox.prototype.getElementBox = function(el)
{
    var result = {};

    if (el.getBoundingClientRect)
    {
        var rect = el.getBoundingClientRect();

        var scroll = this.getWindowScrollPosition();

        result.top = Math.round(rect.top + scroll.top);
        result.left = Math.round(rect.left + scroll.left);
        result.height = Math.round(rect.bottom - rect.top);
        result.width = Math.round(rect.right - rect.left);
    }
    else
    {
        var position = this.getElementPosition(el);

        result.top = position.top;
        result.left = position.left;
        result.height = el.offsetHeight;
        result.width = el.offsetWidth;
    }

    return result;
};

SelectionBox.prototype.getElementPosition = function(el) {
    var left = 0;
    var top = 0;

    do
    {
        left += el.offsetLeft;
        top += el.offsetTop;
    }
    while (el = el.offsetParent);

    return {left: left, top: top};
};

SelectionBox.prototype.getWindowSize = function() {
    var width = 0, height = 0, el;

    if (typeof window.innerWidth == 'number')
    {
        width = window.innerWidth;
        height = window.innerHeight;
    }
    else if ((el = document.documentElement) && (el.clientHeight || el.clientWidth))
    {
        width = el.clientWidth;
        height = el.clientHeight;
    }
    else if ((el = document.body) && (el.clientHeight || el.clientWidth))
    {
        width = el.clientWidth;
        height = el.clientHeight;
    }

    return {width: width, height: height};
};

SelectionBox.prototype.getWindowScrollSize = function() {
    var width = 0, height = 0, el;

    // first try the document.documentElement scroll size
    if ((el = document.documentElement) &&
       (el.scrollHeight || el.scrollWidth))
    {
        width = el.scrollWidth;
        height = el.scrollHeight;
    }

    // then we need to check if document.body has a bigger scroll size value
    // because sometimes depending on the browser and the page, the document.body
    // scroll size returns a smaller (and wrong) measure
    if ((el = document.body) && (el.scrollHeight || el.scrollWidth) &&
        (el.scrollWidth > width || el.scrollHeight > height))
    {
        width = el.scrollWidth;
        height = el.scrollHeight;
    }

    return {width: width, height: height};
};

SelectionBox.prototype.getWindowScrollPosition = function() {
    var top = 0, left = 0, el;

    if (typeof window.pageYOffset == 'number')
    {
        top = window.pageYOffset;
        left = window.pageXOffset;
    }
    else if ((el = document.body) && (el.scrollTop || el.scrollLeft))
    {
        top = el.scrollTop;
        left = el.scrollLeft;
    }
    else if ((el = document.documentElement) && (el.scrollTop || el.scrollLeft))
    {
        top = el.scrollTop;
        left = el.scrollLeft;
    }

    return {top: top, left: left};
};
