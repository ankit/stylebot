/**
  * Generate CSS Selector for an element
  *
  * Copyright (c) 2010 Ankit Ahuja
  * Dual licensed under GPL and MIT licenses.
 **/

var SelectorGenerator =  {

    generate: function(el, granularityLevel) {
        if (!el)
            return null;

        $el = $(el);

        if (granularityLevel === 'low')
            return this.inspectLow($el);

        else if (granularityLevel === 'high')
            return this.inspectHigh($el, 0);

        else
            return this.inspect($el, 0);
    },

    // inspect an element and return a CSS selector for it. this is the default mode
    inspect: function(el, level) {
        var elClass = el.attr("class");

        if (elClass != undefined) {
            elClass = $.trim(elClass.replace('stylebot-selected', ''));

            if (elClass.length != 0)
            {
                var classes = elClass.split(" ");
                var len = classes.length;

                var selector = el.prop('tagName');
                selector = selector ? selector.toLowerCase() : "";

                for (var i = 0; i < len; i++)
                    selector += "." + classes[i];

                return selector;
            }
        }

        var elId = el.attr('id');
        if (elId != undefined)
        {
            return "#" + elId;
        }

        var elTag = el.prop('tagName');
        elTag = elTag ? elTag.toLowerCase() : "";

        // don't go beyond 2 levels up
        //
        if (level < 2)
            return this.inspect(el.parent(), level + 1) + " " + elTag;
        else
            return elTag;
    },

    inspectHigh: function(el, level) {
        var elId = el.attr('id');

        if (elId != undefined)
            return "#" + elId;

        var elClass = el.attr("class");

        if (elClass != undefined) {
            elClass = $.trim(elClass.replace('stylebot-selected', ''));
        }

        else {
            elClass = "";
        }

        var elTag = el.prop('tagName');
        elTag = elTag ? elTag.toLowerCase : "";

        var selector;

        if (level < 1)
        {
            selector = this.inspectHigh(el.parent(), level + 1) + " " + elTag;

            if (elClass.length != 0) {
                selector += "." + elClass;
            }
        }

        else
        {
            selector = elTag;

            if (elClass.length != 0) {
                selector += "." + elClass;
            }
        }

        return selector;
    },

    inspectLow: function(el) {
        var elTag = el.prop('tagName');
        return elTag ? elTag.toLowerCase() : "";
    }
};