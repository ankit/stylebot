/**
  * stylebot.widget
  *
  * Stylebot Widget
  **/

stylebot.widget = {
    
    cache: {
        box: null,
        header: null,
        headerSelectIcon: null
    },
    
    isBeingDragged: false,
    
    createUI: function() {
        
        this.cache.box = $('<div>', {
            id: 'stylebot'
        });
        
        // header
        this.cache.header = $('<div>', {
            id: 'stylebot-header-selector',
            class: 'stylebot-editable-text',
            html: 'custom styles'
        });
        
        this.cache.headerSelectIcon = $('<div>', {
            class: 'stylebot-select-icon'
        })
        .click(function(e) {
            stylebot.toggleSelection();
        });
        
        var urlContainer = $('<span>', {
            id: 'stylebot-header-url'
        });
        
        var url = $('<span>', {
            html: stylebot.style.cache.url,
            class: 'stylebot-editable-text'
        }).appendTo(urlContainer);

        // make selector editable
        Utils.makeEditable( this.cache.header, function(value) {
            stylebot.select( value );
        });
        
        // make url editable
        Utils.makeEditable(url, function(value) {
            stylebot.style.cache.url = value;
        });
        
        $('<div>', {
            id: 'stylebot-header'
        })
        .append( this.cache.header )
        .append( this.cache.headerSelectIcon )
        .append( urlContainer )
        .appendTo( this.cache.box );
        
        // UI for basic mode
        stylebot.widget.basic.createUI().appendTo( this.cache.box );
        
        // UI for advanced mode
        stylebot.widget.advanced.createUI().appendTo( this.cache.box );
        
        // creating options in widget
        var optionsContainer = $('<div>', {
            id: 'stylebot-widget-options'
        });
        
        WidgetUI.createOption( "Mode", WidgetUI.createButtonSet( ['Basic', 'Advanced'], "stylebot-mode", 0, stylebot.widget.toggleMode) )
        .appendTo( optionsContainer );
        
        WidgetUI.createOption( "Widget position", WidgetUI.createButtonSet( ['Left', 'Right'], "stylebot-position", 1, stylebot.widget.togglePosition) )
        .appendTo( optionsContainer );
        
        optionsContainer.appendTo( this.cache.box );
        
        // creating main buttons for widget
        var btContainer = $('<div>', {
            id: 'stylebot-main-buttons'
        });
        
        WidgetUI.createButton('Save').appendTo( btContainer ).click( stylebot.widget.save );
        WidgetUI.createButton('View CSS').appendTo( btContainer ).click( stylebot.widget.viewCSS );
        WidgetUI.createButton('Reset').appendTo( btContainer ).click( stylebot.widget.resetCSS );
        WidgetUI.createButton('Reset All').appendTo( btContainer ).click( stylebot.widget.resetAllCSS );

        btContainer.appendTo( this.cache.box );
        
        this.cache.box.appendTo( document.body );
        
        this.basic.fillCache();

        // open first accordion
        // TODO: load last opened accordions from cache
        this.basic.events.toggleAccordion( $( this.basic.cache.accordionHeaders[0] ) );
        
        // set initial widget position to Right
        stylebot.widget.setPosition( 'Right' );
        
        this.addListeners();
    },
    
    addListeners: function() {
        
        // TODO: Instead of having these separate handlers, implement them into a single handler
        this.cache.box.keydown( function(e) {
            // disable editing on esc
            if( e.keyCode == 27 && !stylebot.widget.basic.isColorPickerVisible )
            {
                e.target.blur();
                stylebot.disable();
            }
        });

        // listen to window resize event to update position/dimension of widget
        $( window ).resize( function(e) {
            stylebot.widget.setPosition(stylebot.options.position);
            stylebot.widget.updateHeight();
            if(stylebot.options.mode == 'Basic')
                stylebot.widget.basic.updateHeight();
            else
                stylebot.widget.advanced.updateHeight();
        });
        
        this.basic.cache.controls.keydown( function(e) {
            // if esc is pressed, take away focus and stop editing
            if(e.keyCode == 27 && !stylebot.widget.basic.isColorPickerVisible)
            {
                e.target.blur();
                stylebot.disable();
            }
        });
        
        var lastBt = $('#stylebot-main-buttons').find('button').last();
        
        // Shift + TAB on first accordion sets focus to last button
        $( this.basic.cache.accordionHeaders[0] ).bind('keydown', { lastBt: lastBt }, function(e) {
            if(e.keyCode == 9 && e.shiftKey)
            {
                e.stopImmediatePropagation();
                e.preventDefault();
                e.data.lastBt.focus();
            }
        });
        
        // TAB on last button sets focus to first accordion header
        lastBt.keydown( function(e) {
            if(e.keyCode == 9 && !e.shiftKey)
            {
                e.stopImmediatePropagation();
                e.preventDefault();
                stylebot.widget.basic.cache.accordionHeaders[0].focus();
            }
        });
    },
    
    show: function() {
        if( !this.cache.box )
            this.createUI();
            
        this.setPosition( stylebot.options.position );
        this.updateHeight();
        
        // set widget title
        this.cache.header.html(stylebot.style.cache.selector ? stylebot.style.cache.selector : "Select an element");
        
        // set mode
        this.setMode();
        
        this.cache.box.show();
    },
    
    hide: function() {
        this.cache.box.hide();
    },
    
    setPosition: function(where) {
        var dialogWidth = 300;
        var left;

        if(where == 'Left')
            left = 0;
        else if(where == 'Right')
            left = document.width - dialogWidth - 40;

        this.cache.box.css('left', left);

        stylebot.options.position = where;
    },
    
    updateHeight: function() {
        this.cache.box.css('height', window.innerHeight);
    },
    
    setMode: function() {
        $('.stylebot-mode').removeClass('stylebot-active-button');
        if(stylebot.options.mode == "Advanced")
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
        stylebot.widget.updateRuleCache();
        stylebot.style.save();
    },
    
    // display CSS for page in a modal box
    viewCSS: function(e) {
        stylebot.widget.updateRuleCache();
        stylebot.modal.show( CSSUtils.crunchCSS( stylebot.style.rules, false ) , {
            onClose: function() { stylebot.modal.isVisible = false; e.target.focus(); }
        });
    },
    
    // reset CSS for current selector
    resetCSS: function(e) {
        stylebot.widget.basic.reset();
        stylebot.widget.advanced.reset();
        // clear any custom styles for currently selected element
        stylebot.style.clear();
    },
    
    // reset all CSS for page
    resetAllCSS: function(e) {
        stylebot.widget.basic.reset();
        stylebot.widget.advanced.reset();
        stylebot.style.clearAll();
    },
    
    togglePosition: function(e) {
        var el = $(e.target);
        stylebot.widget.setPosition( el.html() );
        $("." + el.data('class')).removeClass('stylebot-active-button');
        el.addClass('stylebot-active-button');
    },
    
    toggleMode: function(e) {
        var el = $(e.target);
        stylebot.options.mode = el.html();
        
        // when toggling from Advanced mode, update rule cache.
        if(stylebot.options.mode == "Basic")
            stylebot.widget.advanced.updateRuleCache();
        stylebot.widget.setMode();
    },
    
    updateRuleCache: function(e) {
        if(stylebot.options.mode == "Advanced")
            stylebot.widget.advanced.updateRuleCache();
    }
}