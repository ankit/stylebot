/**
  * Events
  * 
  * Events for Stylebot Panel Controls in Basic Mode
  **/

Events = {
    
    accordionTimer: null,
    
    onToggle: function(e) {
        var el = $(this);
        var className = 'stylebot-active-button';
        var status = el.hasClass(className);
        var value = '';
        var property = el.data('property');
        if (status)
            el.removeClass(className);
        else
        {
            el.addClass(className);
            value = el.data('value');
        }
        Events.saveProperty(property, value);
    },
    
    onRadioClick: function(e) {
        var value;
        if (e.target.checked == true)
            value = e.target.value;
        else
            value = '';
        var property = $(e.target).data('property');
        value = value.split(',');
        if (typeof(property) == "object")
        {
            var len = property.length;
            for (var i = 0; i < len; i++)
                Events.saveProperty(property[i], value[i]);
        }
        else
            Events.saveProperty(property, value);
    },
    
    onTextFieldKeyUp: function(e) {
        if (e.keyCode == 27) { // esc
            e.target.blur();
            return;
        }
        var value = e.target.value;
        var property = $(e.target).data('property');
        stylebot.style.apply(property, value);
    },
    
    onTextFieldFocus: function(e) {
        stylebot.style.saveState();
        $(e.target).data('lastState', e.target.value);
    },
    
    onTextFieldBlur: function(e) {
        if ($(e.target).data('lastState') == e.target.value) {
            stylebot.style.clearLastState();
        }
        $(e.target).data('lastState', null);
        stylebot.style.refreshUndoState();
    },
    
    onSizeFieldKeyUp: function(e) {
        if (e.keyCode == 27) { // esc
            e.target.blur();
            return;
        }
        var value = e.target.value;
        var property = $(e.target).data('property');
        var unit = $(e.target).next().attr('value');
        if (parseFloat(value))
            value += unit;
        stylebot.style.apply(property, value);
        // state saving for undo is handled by onTextFieldFocus and onTextFieldBlur
    },
    
    onSelectChange: function(e) {
        var value = e.target.value.split(',');
        var property = $(e.target).find('[value=' + e.target.value + ']').data('property');
        if (typeof(property) == "object")
        {
            var len = property.length;
            for (var i = 0; i < len; i++)
                Events.saveProperty(property[i], value[i]);
        }
        else
            Events.saveProperty(property, value);
    },
    
    onSegmentedControlClick: function(e) {
        var el = $(e.target);
        if (el.get(0).tagName != 'BUTTON')
            el = el.parent('button');

        // TODO: Try to implement the next element's border width using CSS
        var control = el.parent();
        var status = el.hasClass('stylebot-active-button');
        control.find('.stylebot-active-button')
        .removeClass('stylebot-active-button')
        .next().removeClass('stylebot-active-button-next');
        if (!status)
        {
            el.addClass('stylebot-active-button');
            el.next().addClass('stylebot-active-button-next');
            Events.saveProperty(el.data('property'), el.data('value'));
        }
        else
            Events.saveProperty(el.data('property'), '');
        el.focus();
    },
    
    toggleAccordion: function(h) {
        if (h.hasClass('stylebot-accordion-active'))
        {
            h.removeClass('stylebot-accordion-active')
            .focus()
            .next().hide();
        }
        else
        {
            h.addClass( 'stylebot-accordion-active' )
            .focus()
            .next().show();
        }
        
        // determine which accordions are open and
        // send request to save the new state to background.html cache
        if (this.accordionTimer)
            clearTimeout(this.accordionTimer);
        this.accordionTimer = setTimeout(function() {
            var len = stylebot.widget.basic.cache.accordionHeaders.length;
            var enabledAccordions = [];
            for (var i = 0; i < len; i++)
            {
                if ($(stylebot.widget.basic.cache.accordionHeaders[i]).hasClass( 'stylebot-accordion-active' ))
                    enabledAccordions[enabledAccordions.length] = i;
            }
            stylebot.chrome.saveAccordionState(enabledAccordions);
        }, 500);
    },
    
    saveProperty: function(property, value) {
        console.log("saveProperty called");
        // save current state to undo stack
        stylebot.style.saveState();
        stylebot.style.apply(property, value);
        stylebot.style.refreshUndoState();
    }
}