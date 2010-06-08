/**
  * stylebot.widget.ui.events
  * 
  * Events for Stylebot Widget Controls
  **/

stylebot.widget.ui.events = {
    
    onCheckboxChange: function(e){
        var value;
        if(e.target.checked == true)
            value = e.target.value;
        else
            value = '';
        var property = $(e.target).data('property');
        stylebot.style.apply(stylebot.widget.selector, property, value);
    },
    
    onRadioClick: function(e){
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
                stylebot.style.apply(stylebot.widget.selector, property[i], value[i]);
        }
        else
            stylebot.style.apply(stylebot.widget.selector, property, value);
    },
    
    onTextFieldKeyUp: function(e){
        // filter out meta keys which do not display any text
        if(!stylebot.utils.filterKeys(['ctrl', 'shift', 'tab', 'esc', 'enter', 'arrowkeys'], e))
            return true;
        
        var value = e.target.value;
        var property = $(e.target).data('property');

        stylebot.style.apply(stylebot.widget.selector, property, value);
    },
    
    onSizeFieldKeyUp: function(e){
        if(!stylebot.utils.filterKeys(['ctrl', 'shift', 'tab', 'esc', 'enter', 'arrowkeys'], e))
            return true;
        
        var value = e.target.value;
        var property = $(e.target).data('property');
        var unit = $(e.target).next().attr('value');
        value += unit;
        
        stylebot.style.apply(stylebot.widget.selector, property, value);
    },
    
    onSelectChange: function(e){
        var value = e.target.value.split(',');
        var property = $(e.target).find('[value='+e.target.value+']').data('property');
        if(typeof(property) == "object")
        {
            var len = property.length;
            for(var i=0; i<len; i++)
                stylebot.style.apply(stylebot.widget.selector, property[i], value[i]);
        }
        else
            stylebot.style.apply(stylebot.widget.selector, property, value);
    }
}