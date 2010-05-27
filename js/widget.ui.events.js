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
            // save the color selector element that triggered the color picker
            stylebot.widget.ui.colorpicker.data('selector', $(e.target));
            stylebot.widget.ui.colorpicker.ColorPicker({
                flat:true,
                onChange: function(hsb, hex, rgb){
                    // get the color selector that triggered the color picker
                    var colorSelector = stylebot.widget.ui.colorpicker.data('selector');
                    // connected input field to the color picker
                    var input = colorSelector.data('input');
                    var colorCode = '#' + hex;
                    // set input value to reflect the newly picker color code
                    input.attr('value', colorCode);
                    input.keyup();
                    // update the color selector color
                    colorSelector.css('backgroundColor', colorCode);
                }
            })
            .dialog({
                title:'Color Picker',
                width:400,
                height:250
                // buttons:{"Close": function(e){$(this).dialog('close');}}
            });
        }
        else
        {
            // update the color selector element
            stylebot.widget.ui.colorpicker.data('selector', $(e.target));
            stylebot.widget.ui.colorpicker.dialog('open');
        }
        // set color
        var colorSelector = stylebot.widget.ui.colorpicker.data('selector');
        var colorCode = colorSelector.data('input').attr('value');
        // default is white
        if(colorCode == "")
            colorCode = "#ffffff";
            
        stylebot.widget.ui.colorpicker.ColorPickerSetColor(colorCode);
        stylebot.widget.ui.colorpicker.dialog('option', 'position', [left, top]);
    }
}