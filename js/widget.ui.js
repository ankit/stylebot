/**
  * stylebot.widget.ui
  * 
  * UI for Stylebot Widget
  **/
  
stylebot.widget.ui = {
    isColorPickerVisible: false,
    controls:[{
        name: 'Color',
        id: 'color',
        type: 'color'
    },
    {
        name: 'Background Color',
        id: 'background-color',
        type: 'color'
    },
    {
        name: 'Size',
        id: 'font-size',
        type: 'size'
    },
    {
        name: 'Weight',
        id: 'font-weight',
        type: 'select',
        options: ['none', 'bold']
    },
    {
        name: 'Style',
        id: 'font-style',
        type: 'select',
        options: ['none', 'italic']
    },
    {
        name: 'Decoration',
        id: 'text-decoration',
        type: 'select',
        options: ['none', 'underline']
        
    },
    {
        name: 'Line Height',
        id: 'line-height',
        type: 'size'
    },
    {
        name: 'Letter Spacing',
        id: 'letter-spacing',
        type: 'size'
    },
    {
        name: 'Border Style',
        id: 'border-style',
        type: 'select',
        options: [ 'none', 'solid', 'dotted', 'dashed', 'double', 'groove', 'ridge', 'inset', 'outset' ]
    },
    {
        name: 'Border Width',
        id: 'border-width',
        type: 'size'
    },
    {
        name: 'Border Color',
        id: 'border-color',
        type: 'color'
    },
    {
        name: 'Hide Element',
        id: 'display',
        type: 'checkbox',
        value: 'none'
    }
    ],
    
    // cache of jQuery objects
    cache:{
        box: null,
        dialog: null,
        controls: null,
        textfields: null,
        checkboxes: null,
        radios: null,
        selectboxes: null,
        colorSelectorColor: null
    },
    
    createBox: function(){
        
        this.cache.box = $('<div>', {
            id:'stylebot'
        });
        
        var controls_ui = $('<ul>', {
            id: 'stylebot-controls'
        });
        
        // creating controls for different CSS properties
        var len = this.controls.length;
        
        for(var i=0; i<len; i++)
            this.createControl(this.controls[i]).appendTo(controls_ui);
        
        controls_ui.appendTo(this.cache.box);
        
        // creating main buttons for widget
        var buttons = $('<div>', {
            id: 'stylebot-main-buttons'
        });
        this.createButton('Save changes').appendTo(buttons).click(stylebot.widget.save);
        this.createButton('Generate CSS').appendTo(buttons).click(stylebot.widget.generateCSS);
        buttons.appendTo(this.cache.box);
        
        // create dialog
        this.cache.box.appendTo(document.body).dialog({
            title: 'Custom Styles',
            autoOpen: false,
            closeOnEscape: false,
            dragStart: function(e, ui){
                stylebot.widget.isBeingDragged = true;
            },
            dragStop: function(e, ui){
                stylebot.widget.isBeingDragged = false;
            },
            beforeOpen: function(e, ui){
                stylebot.isEditing = true;
            },
            beforeClose: function(e, ui){
                stylebot.isEditing = false;
            }
        });
        
        // fill cache with widget UI elements
        this.fillCache();
    },
    
    fillCache: function(){
        // dialog widget
        this.cache.dialog = this.cache.box.dialog('widget');
        // controls
        this.cache.controls = $('.stylebot-control');
        // textfields
        this.cache.textfields = $('.stylebot-textfield');
        // checkboxes
        this.cache.checkboxes = $('.stylebot-checkbox');
        // radios
        this.cache.radios = $('.stylebot-radio');
        // select boxes
        this.cache.selectboxes = $('.stylebot-select');
        // color selector color divs
        this.cache.colorSelectorColor = $('.stylebot-colorselector-color');
    },
    
    createControl: function(control){
        var el = $('<li>', {
            class: 'stylebot-control-set'
        });

        this.createLabel(control.name).appendTo(el);
        
        // Add controls of different types
        switch(control.type){

            case 'size'             :   var input = this.createSizeField(control.id).appendTo(el);
                                        break;
                                        
            case 'color'            :   var input = this.createTextField(control.id, 10);
                                        this.createColorPicker(input).appendTo(el);
                                        input.appendTo(el)
                                        .keyup(function(e){ stylebot.widget.ui.setColorSelectorColor( $(this) ) });
                                        break;
                                        
            case 'checkbox'          :  this.createCheckbox(null, control.id , control.value).appendTo(el);
                                        break;
                                        
            case 'select'            :  var select = this.createSelect(control.id);
                                        this.createSelectOption("Default", control.id, '').appendTo(select);
                                        var len = control.options.length;
                                        for(var i=0; i<len; i++)
                                        {
                                            var option = control.options[i];
                                            this.createSelectOption( stylebot.utils.capitalize(option), control.id, option).appendTo(select);
                                        }
                                        select.appendTo(el);
                                        break;
        }
        return el;
    },
    
    createTextField: function(property, size){
        var input = $('<input>',{
            type: 'text',
            id: 'stylebot-' + property,
            class: 'stylebot-control stylebot-textfield',
            size: size
        });

        input.data("property", property);
        input.keyup(this.events.onTextFieldKeyUp);
        return input;
    },
    
    createSizeField: function(property){
        var span = $('<span>');
        
        this.createTextField(property, 4).appendTo(span);
        $('<span>', {
             html: ' px',
             style: 'color:#aaa'
        })
        .appendTo(span);
        return span;
    },
    
    createCheckbox: function(text, property, value){
        var checkbox = $('<input>',{
            type: 'checkbox',
            id: 'stylebot-' + property,
            class: 'stylebot-control stylebot-checkbox',
            value: value
        });
        
        checkbox.data('property', property);
        checkbox.click(stylebot.widget.ui.events.onCheckboxClick);
        if(text)
        {
            var span = $('<span class="stylebot-control"></span>');
            checkbox.appendTo(span);
            this.createInlineLabel(text).appendTo(span);
            return span;
        }
        else
            return checkbox;
    },
    
    createRadio: function(text, name, property, value){
        var span = $('<span>',{
            id: 'stylebot-' + property,
            class: 'stylebot-control'
        });

        var radio = $('<input>',{
            type: 'radio',
            name: name,
            class: 'stylebot-control stylebot-radio'
        });
        
        if(typeof(property) == 'string')
            radio.attr('value', value);
        else
            radio.attr('value', value.join(','));
        
        radio.data('property', property);
        radio.click(this.events.onRadioClick);
        radio.appendTo(span);
        this.createInlineLabel(text).appendTo(span);
        return span;
    },
    
    createSelect: function(property){
        var select = $('<select>', {
            id:'stylebot-' + property,
            class: 'stylebot-control stylebot-select'
        });
        select.data('property', property);
        select.change(this.events.onSelectChange);
        return select;
    },
    
    createSelectOption: function(text, property, value){
        var option = $('<option>', {
            class: 'stylebot-select-option',
            html: text
        });
        
        if(typeof(property) == 'string')
            option.attr('value', value);
        else
            option.attr('value', value.join(','));
        option.data('property', property);
        return option;
    },
    
    createColorPicker: function(input){
        return $('<div>', {
            class:'stylebot-colorselector stylebot-control', 
            tabIndex:0
        })
        .append($('<div>', { class:'stylebot-colorselector-color'}))
        .ColorPicker({
            flat:false,
            onChange: function(hsb, hex, rgb){
                var colorCode = '#' + hex;
                // set input value to reflect the newly picked color's code
                input.attr('value', colorCode);
                input.keyup();
                // update the color selector color
                stylebot.widget.ui.setColorSelectorColor(input);
            },
            onBeforeShow: function(){
                var color = input.attr('value');
                if(color == "")
                    color = "#ffffff"; // default is white
                $(this).ColorPickerSetColor(color);
                stylebot.widget.ui.isColorPickerVisible = true;
            },
            onHide: function(){
                stylebot.widget.ui.isColorPickerVisible = false;
            }
        })
        .keyup(function(e){
            // TODO: Toggle visibility of color picker when enter is pressed
            if(e.keyCode == 13) //enter
                $(this).ColorPickerShow();
        });
    },
    
    // Set color selector value by fetching value from connected input textfield
    setColorSelectorColor: function(input){
        // get the color value
        var color = input.attr('value');
        // get the color selector connected to the input field
        var colorSelector = input.prev().find('div');
        colorSelector.css('backgroundColor', color);
    },

    createLabel: function(text){
        return $('<label>', {
            class: 'stylebot-label',
            html: text+":"
        });
    },
    
    createInlineLabel: function(text){
        return $('<label>', {
            class: 'stylebot-inline-label',
            html: text
        });
    },
    
    createButton: function(text){
        return $('<button>', {
            class: 'stylebot-button',
            html: text
        }).button();

    },
    
    fillControl: function(control, styles){
        switch(control.type){
            case 'size'             :   var index = stylebot.utils.search(styles, "property", control.id);
                                        if(index != null)
                                        {
                                            this.getControl(control.id)
                                            .attr('value', styles[index].value.replace('px',''));
                                        }
                                            
                                        break;
                                        
            case 'color'            :   var index = stylebot.utils.search(styles, "property", control.id);
                                        if(index != null)
                                        {
                                            var control = this.getControl(control.id);
                                            var color = styles[index].value;
                                            control.attr('value', color);
                                            if(color != "")
                                            this.setColorSelectorColor(control);
                                        }
                                        break;
                                        
            case 'checkbox'         :   var index = stylebot.utils.search(styles, "property", control.id);
                                        if(index != null)
                                        {
                                            if(styles[index].value == control.value)
                                                this.getControl(control.id).attr('checked', true);
                                            else
                                                this.getControl(control.id).attr('checked', false);                                                
                                        }
                                        break;
                                        
            case 'select'            :  var index = stylebot.utils.search(styles, "property", control.id);
                                        if(index != null)
                                        {
                                            var index2 = $.inArray($.trim(String(styles[index].value)), control.options);
                                            if(index2 != -1)
                                                this.getControl(control.id).attr('selectedIndex', index2 + 1);
                                        }
                                        break;
        }
    },
    
    getControl: function(controlId){
        return $('#stylebot-' + controlId);
    },
    
    // fill controls with any existing custom styles for current selector
    fill: function(){
        var len = this.controls.length;
        var styles = stylebot.style.getStyles(stylebot.selector.value);
        
        if(styles)
        {
            for(var i=0; i<len; i++)
                this.fillControl(this.controls[i], styles);
        }
        
        // set widget title
        this.cache.box.dialog('option', 'title', stylebot.selector.value ? stylebot.selector.value : "Select an element");
    },
    
    // reset values to default for all controls
    reset: function(){
        this.cache.textfields.attr('value', '');
        this.cache.checkboxes.attr('checked', false);
        this.cache.radios.attr('checked', false);
        this.cache.selectboxes.attr('selectedIndex', 0);
        this.cache.colorSelectorColor.css('backgroundColor', '#fff');
    },
}