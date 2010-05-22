/**
  * stylebot.widget.ui.events
  * 
  * Events for Stylebot Widget UI Controls
  **/

stylebot.widget.ui.events = {
    
    onCheckboxClick: function(e){
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
        /* if esc is pressed, take away focus from textfield and stop editing*/
        if(e.keyCode == 27)
        {
            e.target.blur();
            stylebot.disable();
            return;
        }
        
        var value = e.target.value;
        var property = $(e.target).data('property');
        switch(property){
            case 'font-size':
                value += 'px';
                break;
        }
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
    },
    
    onColorSelectorClick: function(e){
        var left = stylebot.widget.ui.getColorPickerLeftPosition();
        var top = stylebot.widget.box.dialog('widget').css('top');
        
        if(!stylebot.widget.ui.colorpicker)
        {
            stylebot.widget.ui.colorpicker = $('<div>', {id:'stylebot-colorpicker'});
            stylebot.widget.ui.colorpicker.ColorPicker({flat:true}).dialog({
                title:'Color Picker',
                width:400,
                height:250
                // buttons:{"Close": function(e){$(this).dialog('close');}}
            });
        }
        else
            stylebot.widget.ui.colorpicker.dialog('open');

        stylebot.widget.ui.colorpicker.dialog('option', 'position', [left, top]);
    }
}