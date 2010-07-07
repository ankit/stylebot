/**
  * stylebot.widget.basic.events
  * 
  * Events for Stylebot Widget Controls in Basic Mode
  **/

stylebot.widget.basic.events = {
    
    onCheckboxChange: function(e) {
        var value;
        if(e.target.checked == true)
            value = e.target.value;
        else
            value = '';
        var property = $(e.target).data('property');
        stylebot.style.apply(property, value);
    },
    
    onToggle: function(e) {
        var el = $(this);
        var className = 'stylebot-active-button';
        var status = el.hasClass(className);
        var value = '';
        var property = el.data('property');
        if(status)
            el.removeClass(className);
        else
        {
            el.addClass(className);
            value = el.data('value');
        }
        stylebot.style.apply(property, value);
    },
    
    onRadioClick: function(e) {
        var value;
        if(e.target.checked == true)
            value = e.target.value;
        else
            value = '';
        var property = $(e.target).data('property');
        value = value.split(',');
        if(typeof(property) == "object")
        {
            var len = property.length;
            for(var i=0; i<len; i++)
                stylebot.style.apply(property[i], value[i]);
        }
        else
            stylebot.style.apply(property, value);
    },
    
    onTextFieldKeyUp: function(e) {
        
        var value = e.target.value;
        var property = $(e.target).data('property');

        stylebot.style.apply(property, value);
    },
    
    onSizeFieldKeyUp: function(e) {
        
        var value = e.target.value;
        var property = $(e.target).data('property');
        var unit = $(e.target).next().attr('value');
        value += unit;
        
        stylebot.style.apply(property, value);
    },
    
    onSelectChange: function(e) {
        var value = e.target.value.split(',');
        var property = $(e.target).find('[value='+e.target.value+']').data('property');
        if(typeof(property) == "object")
        {
            var len = property.length;
            for(var i=0; i<len; i++)
                stylebot.style.apply(property[i], value[i]);
        }
        else
            stylebot.style.apply(property, value);
    },
    
    onSegmentedControlClick: function(e) {
        var el = $(e.target);
        if(el[0].tagName != 'BUTTON')
            el = el.parent('button');

        // TODO: Try to implement the next element's border width using CSS
        var control = el.parent();
        var status = el.hasClass('stylebot-active-button');
        control.find('.stylebot-active-button')
        .removeClass('stylebot-active-button')
        .next().css('border-left-width', '1px');
        if(!status)
        {
            el.addClass('stylebot-active-button');
            el.next().css('border-left-width', '0px');
            stylebot.style.apply(el.data('property'), el.data('value'));
        }
        else
            stylebot.style.apply(el.data('property'), '');
        el.focus();
    },
    
    toggleAccordion: function(h) {
        var status = h.hasClass('stylebot-accordion-active');
        if(status)
        {
            h.removeClass('stylebot-accordion-active')
            .next().hide();
        }
        else
        {
            // close all accordion groups
            stylebot.widget.basic.cache.accordionHeaders
            .removeClass('stylebot-accordion-active')
            .next().hide();
            
            h.addClass('stylebot-accordion-active')
            .next().show();
        }
    }
}