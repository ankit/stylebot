/**
  * stylebot.widget
  *
  * Widget UI and functionality
  **/

stylebot.widget = {
    
    cache: {
        box: null,
        header: null,
        headerSelector: null,
        headerSelectIcon: null,
        undoBt: null,
        dropDown: null
    },
    
    defaults: {
        width: 320
    },
    
    isBeingDragged: false,
    
    createUI: function() {
        this.cache.box = $('<div>', {
            id: 'stylebot'
        });
        
        /** Header **/
        
        /** Selection toggle button **/
        this.cache.headerSelectIcon = $('<div>', {
            id: 'stylebot-select-icon'
        })
        .tipsy({delayIn: 1500, gravity:'nw'})
        .click(function(e) {
            stylebot.toggleSelection();
        });

        /** Selector **/
        this.cache.headerSelector = $('<div>', {
            class: 'stylebot-editable-text',
            html: 'custom styles',
            title: 'Click to edit the CSS selector'
        })
        .tipsy({delayIn: 1500, gravity:'nw'});
        
        /** Dropdown for choosing selectors **/
        this.dropDown = $('<div>', {
            id: 'stylebot-dropdown-button',
            class: 'stylebot-header-button',
            title: "View previously edited CSS selectors"
        })
        .tipsy({delayIn: 1500, gravity: 'ne'})
        .mouseup(stylebot.widget.showSelectorDropdown);
        
        var selectorContainer = $('<div>', {
            id: 'stylebot-header-selector'
        })
        .append(this.cache.headerSelector)
        .append(this.dropDown);
        
        // Make selector editable
        Utils.makeEditable(this.cache.headerSelector, function(value) {
            stylebot.widget.updateHeight();
            stylebot.select(null, value);
        }, {
            selectText: true,
            fixedWidth: 200
        });
        
        /** URL **/
        var url = $('<div>', {
            html: stylebot.style.cache.url,
            class: 'stylebot-editable-text',
            title: 'Click to edit the partial URL for which custom CSS will be saved. <br><br>Tip: You can add multiple such URLs by separating them with a ,'
        })
        .tipsy({delayIn: 1500, gravity:'n', html: true});
        
        var urlContainer = $('<div>', {
            id: 'stylebot-header-url'
        })
        .append(url);
        
        // Make url editable
        Utils.makeEditable(url, function(value) {
            stylebot.widget.updateHeight();
            if (value != stylebot.style.cache.url) {
                stylebot.chrome.transfer(stylebot.style.cache.url, value);
            }
            stylebot.style.cache.url = value;
        }, {
            selectText: true,
            fixedWidth: 200
        });

        // Container for URL and selector
        var headerTextContainer = $('<div>', {
            id: 'stylebot-header-container'
        })
        .append(selectorContainer)
        .append(urlContainer);

        /** Close Button **/
        var closeButton = $('<div>', {
            id: 'stylebot-close-button',
            class: 'stylebot-header-button'
        })
        .click(stylebot.close);
        
        /** Position Toggle Button **/
        var arrowButton = $('<div>', {
            id: 'stylebot-arrow-button',
            class: 'stylebot-arrow-left stylebot-header-button',
            title: "Move stylebot to the left"
        })
        .data('position', "Right")
        .tipsy({delayIn: 1500, gravity: 'ne'})
        .appendTo(this.cache.box)
        .mouseup(stylebot.widget.togglePosition);
        
        this.cache.header = $('<div>', {
            id: 'stylebot-header'
        })
        .append(this.cache.headerSelectIcon)
        .append(headerTextContainer)
        .append(closeButton)
        .append(arrowButton)
        .appendTo(this.cache.box);
        
        /** End of Header **/
        
        /** Basic Mode **/
        stylebot.widget.basic.createUI().appendTo(this.cache.box);
        
        /** Advanced Mode **/
        stylebot.widget.advanced.createUI().appendTo(this.cache.box);
        
        /** Options **/
        var optionsContainer = $('<div>', {
            id: 'stylebot-widget-options'
        });
        
        WidgetUI.createOption(WidgetUI.createButtonSet(['Basic', 'Advanced'], "stylebot-mode", 0, stylebot.widget.toggleMode))
        .appendTo(optionsContainer);
        
        var btContainer = $('<div>', {
            id: 'stylebot-main-buttons'
        });
        
        WidgetUI.createButton("Edit CSS").appendTo(btContainer).click(stylebot.widget.editCSS);

        this.cache.undoBt = WidgetUI.createButton("Undo").attr({
            title: "Undo your last action",
            'disabled': "disabled"
        })
        .tipsy({delayIn: 1500, gravity:'s', html: true})
        .appendTo(btContainer).click(function(e) {stylebot.style.undo();});
        
        WidgetUI.createButton("Reset").attr('title', "Reset selected element(s) CSS")
        .tipsy({delayIn: 1500, gravity:'s', html: true})
        .appendTo(btContainer).click(stylebot.widget.resetCSS);
        
        WidgetUI.createButton("Reset Page").attr('title', "Reset all custom CSS for page")
        .tipsy({delayIn: 1500, gravity:'se', html: true})
        .appendTo(btContainer).click(stylebot.widget.resetAllCSS);

        btContainer.appendTo(optionsContainer);
        optionsContainer.appendTo(this.cache.box);
        
        this.cache.box.appendTo(document.body);
        this.basic.fillCache();

        // open the accordions loaded from cache
        this.basic.initAccordions();
        
        // set initial widget position to Right
        stylebot.widget.setPosition("Right");
    },
    
    attachListeners: function() {
        var lastBt = $('#stylebot-main-buttons').find('button').last();
        
        // Shift + TAB on first accordion sets focus to last button
        $(this.basic.cache.accordionHeaders[0] ).bind('keydown', {lastBt: lastBt}, function(e) {
            if (e.keyCode == 9 && e.shiftKey)
            {
                e.stopImmediatePropagation();
                e.preventDefault();
                e.data.lastBt.focus();
            }
        });
        
        // TAB on last button sets focus to first accordion header
        lastBt.keydown(function(e) {
            if (e.keyCode == 9 && !e.shiftKey)
            {
                e.stopImmediatePropagation();
                e.preventDefault();
                stylebot.widget.basic.cache.accordionHeaders[0].focus();
            }
        });
        
        // listen to window resize event to update position/dimension of widget
        $(window).bind('resize', this.onWindowResize);
    },
    
    detachListeners: function() {
        $(window).unbind('resize', this.onWindowResize);
    },
    
    onWindowResize: function(e) {
        stylebot.widget.setPosition(stylebot.options.position);
        stylebot.widget.updateHeight();
        
        if(stylebot.selectionBox)
            stylebot.selectionBox.highlight(stylebot.selectedElement);
    },
    
	open: function() {
        if (!this.cache.box)
            this.createUI();
        
        this.attachListeners();
        this.setPosition(stylebot.options.position);

        if (stylebot.style.cache.selector) {
			this.enable();
		}
		else {
			this.disable();
		}
            

        setTimeout(function() {
            stylebot.widget.updateHeight();
        }, 0);

        this.setMode();
        this.cache.box.show();
    },

	close: function() {
        this.detachListeners();
		this.cache.box.hide();
    },
    
    enable: function() {
        this.cache.headerSelector.html(stylebot.style.cache.selector);
        this.basic.cache.textfields.attr('disabled', '');
        this.basic.cache.buttons.attr('disabled', '');
        this.basic.cache.selectboxes.attr('disabled', '');
        this.basic.cache.colorSelectors.removeClass('disabled');
        this.advanced.cache.cssField.attr('disabled', '');
    },
    
    disable: function() {
        this.cache.headerSelector.html("Select an element");
        this.basic.cache.textfields.attr('disabled', 'disabled');
        this.basic.cache.buttons.attr('disabled', 'disabled');
        this.basic.cache.selectboxes.attr('disabled', 'disabled');
        this.basic.cache.colorSelectors.addClass('disabled');
        this.advanced.cache.cssField.attr('disabled', 'disabled');
    },
    
    setPosition: function(where) {
        var left;
        if (where == "Left")
            left = 0;
        else if (where == "Right")
            left = $(window).width() - this.defaults.width - 3; // some padding

        this.cache.box.css('left', left);
        stylebot.options.position = where;
    },
    
    updateHeight: function() {
        stylebot.widget.cache.box.css('height', window.innerHeight);

        var headerHeight = stylebot.widget.cache.header.height();
        
        var optionsHeight = 150;
        if (headerHeight != 0)
            headerHeight -= 36;
        var newHeight = window.innerHeight - (optionsHeight + headerHeight);
        
        if (stylebot.options.mode == "Basic")
            stylebot.widget.basic.cache.container.css('height',  newHeight);
        else
            stylebot.widget.advanced.cache.cssField.css('height',  newHeight - 44);
    },
    
    setMode: function() {
        $('.stylebot-mode').removeClass('stylebot-active-button');
        if (stylebot.options.mode == "Advanced")
        {
            $('.stylebot-mode:contains(Advanced)').addClass('stylebot-active-button');
            stylebot.widget.basic.hide();
            stylebot.widget.advanced.show();
        }
        else
        {
            $('.stylebot-mode:contains(Basic)').addClass('stylebot-active-button');
            stylebot.widget.advanced.hide();
            stylebot.widget.basic.show();
        }
    },
    
    save: function(e) {
        stylebot.style.save();
    },
    
    reset: function() {
        if (stylebot.options.mode == "Basic")
            stylebot.widget.basic.reset();
        else
            stylebot.widget.advanced.reset();
    },
    
    // display page CSS in a popup
    editCSS: function(e) {
        stylebot.page.show(CSSUtils.crunchFormattedCSS(stylebot.style.rules, false), e.target);
    },
    
    // reset CSS for current selector
    resetCSS: function(e) {
        stylebot.widget.reset();
        stylebot.style.remove();
    },
    
    // reset all CSS for page
    resetAllCSS: function(e) {
        stylebot.widget.reset();
        stylebot.style.removeAll();
    },
    
    togglePosition: function(e) {
        var el = $("#stylebot-arrow-button");
        var pos;
        if (e)
            pos = el.data('position');
        else
            pos = stylebot.options.position;
        if (pos == "Left")
        {
            pos = "Right";
            el.removeClass("stylebot-arrow-right")
            .addClass("stylebot-arrow-left")
            .attr('title', "Move stylebot to the left");
        }
        else
        {
            pos = "Left";
            el.removeClass("stylebot-arrow-left")
            .addClass("stylebot-arrow-right")
            .attr('title', "Move stylebot to the right");
        }
        el.data('position', pos);
        stylebot.widget.setPosition(pos);
    },
    
    toggleMode: function(e) {
        var el;
        if (e) {
            el = $(e.target);
            stylebot.options.mode = el.html();
        }
        else {
            if (stylebot.options.mode == "Basic") {
                stylebot.options.mode = "Advanced";
                el = $(".stylebot-mode:contains(Advanced)");
            }
            else {
                stylebot.options.mode = "Basic";
                el = $(".stylebot-mode:contains(Basic)");
            }
        }
        stylebot.widget.updateHeight();
        stylebot.widget.setMode();
    },
    
    showSelectorDropdown: function() {
        var dropdown = $("#stylebot-dropdown");
        if (dropdown.length != 0) {
            dropdown.remove(); return true;
        }
        var parent = stylebot.widget.cache.headerSelector.parent();
        var parentHeight = parent.height() + 10
        var height = $(window).height() - 50 - parentHeight;
        dropdown = $("<div>", {
            id: "stylebot-dropdown"
        })
        .css({
            left: parent.offset().left + (parent.width()/2),
            top: parentHeight,
            'max-height': height
        })
        
        var onClickElsewhere = function(e) {
            var $target = $(e.target);
            var id = "stylebot-dropdown";
            if ((e.target.id.indexOf(id) == -1 && $target.parent().attr('id') != id && e.type == "mousedown")
            || e.keyCode == 27)
            {
                $("#stylebot-dropdown").remove();
                stylebot.unhighlight();
                stylebot.select(null, stylebot.style.cache.selector);
                $(document).unbind('mousedown keydown', onClickElsewhere);
                return true;
            }
            return true;
        };
        
        var any = false;
        for (var selector in stylebot.style.rules) {
            any = true;
            var li = $("<li>", {
                class: 'stylebot-dropdown-li',
                tabIndex: 0,
                html: selector
            })
            .hover(function(e) {
                if (stylebot.selectionStatus)
                    return true;
                stylebot.highlight($(e.target.innerText)[0]);
                $(e.target).addClass('stylebot-dropdown-li-selected');
                return true;
            })
            .mouseout(function(e) {
                $(e.target).removeClass('stylebot-dropdown-li-selected');
            })
            .bind('click keydown', function(e) {
                if (e.type == 'keydown' && e.keyCode != 13)
                    return true;
                var value = e.target.innerHTML;
                stylebot.widget.cache.headerSelector.html(value);
                stylebot.widget.updateHeight();
                stylebot.select(null, Utils.HTMLDecode(value));
                $(document).unbind('mousedown keydown', onClickElsewhere);
                $("#stylebot-dropdown").remove();
            })
            .appendTo(dropdown);
        }
        if (!any)
            $("<li>", {html: "No CSS selectors edited"}).appendTo(dropdown);

        dropdown.appendTo(parent);
        $(document).bind('mousedown keydown', onClickElsewhere);
    },
    
    // TODO: Clean up and make more readable!
    selectNextDropdownOption: function() {
        var li = $(".stylebot-dropdown-li");
        if (li.length == 0)
            return;
        var current = $(".stylebot-dropdown-li-selected");
        if (current.length == 0) {
            $li = $(li[0]);
            stylebot.highlight($($li.text())[0]);
            $li.addClass("stylebot-dropdown-li-selected").focus();
            return;
        }
        else {
            $current = $(current[0]);
            $current.removeClass("stylebot-dropdown-li-selected");
            var $next = $($current.next().get(0));
            if ($next.length != 0) {
                stylebot.highlight($($next.text())[0]);
                $next.addClass("stylebot-dropdown-li-selected").focus();
            }
            else {
                $li = $(li[0]);
                stylebot.highlight($($li.text())[0]);
                $li.addClass("stylebot-dropdown-li-selected").focus();
            }
            return;
        }
    },
    
    // TODO: Clean up and make more readable!
    selectPreviousDropdownOption: function() {
        var li = $(".stylebot-dropdown-li");
        if (li.length == 0)
            return;
        var current = $(".stylebot-dropdown-li-selected");
        if (current.length == 0) {
            $li = $(li[li.length - 1]);
            stylebot.highlight($($li.text())[0]);
            $li.addClass("stylebot-dropdown-li-selected").focus();
            return;
        }
        else {
            $current = $(current[0]);
            $current.removeClass("stylebot-dropdown-li-selected");
            var $prev = $($current.prev().get(0));
            if ($prev.length != 0) {
                stylebot.highlight($($prev.text())[0]);
                $prev.addClass("stylebot-dropdown-li-selected").focus();
            }
            else {
                $li = $(li[li.length - 1]);
                stylebot.highlight($($li.text())[0]);
                $li.addClass("stylebot-dropdown-li-selected").focus();
            }
            return;
        }
    },
    
    enableUndo: function() {
        this.cache.undoBt.attr('disabled', '');
    },
    
    disableUndo: function() {
        this.cache.undoBt.attr('disabled', 'disabled');
    }
}