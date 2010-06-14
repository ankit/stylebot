/**
  * stylebot.widget.ui
  * 
  * UI for Stylebot Widget
  **/
  
stylebot.widget.ui = {
    
    isColorPickerVisible: false,
    
    groups: [{
        name: 'Text',
        controls: [
        {
            name: 'Font Size',
            id: 'font-size',
            type: 'size',
            el: null
        },
        {
            name: 'Font Weight',
            id: 'font-weight',
            type: 'select',
            options: ['normal', 'bold'],
            el: null
        },
        {
            name: 'Font Style',
            id: 'font-style',
            type: 'select',
            options: ['none', 'italic'],
            el: null
        },
        {
            name: 'Decoration',
            id: 'text-decoration',
            type: 'select',
            options: ['none', 'underline'],
            el: null

        },
        {
            name: 'Line Height',
            id: 'line-height',
            type: 'size',
            el: null
        },
        {
            name: 'Letter Spacing',
            id: 'letter-spacing',
            type: 'size',
            el: null
        }]
    },
    {
        name: 'Color & Background',
        controls:[{
            name: 'Color',
            id: 'color',
            type: 'color',
            el: null
        },
        {
            name: 'Background Color',
            id: 'background-color',
            type: 'color',
            el: null
        }]
    },
    {
        name: 'Borders',
        controls: [
        {
            name: 'Border Style',
            id: 'border-style',
            type: 'select',
            options: [ 'none', 'solid', 'dotted', 'dashed', 'double', 'groove', 'ridge', 'inset', 'outset' ],
            el: null
        },
        {
            name: 'Color',
            id: 'border-color',
            type: 'color',
            el: null
        },
        {
            name: 'Thickness',
            id: 'border-width',
            type: 'size',
            el: null
        }]
    },
    {
        name: 'Others',
        controls: [{
            name: 'Visibility',
            id: 'display',
            type: 'toggle',
            value: 'none',
            el: null
        }]
    }
    ],
    
    // cache of jQuery objects
    cache: {
        box: null,
        header: null,
        controls: null,
        textfields: null,
        checkboxes: null,
        radios: null,
        selectboxes: null,
        colorSelectorColor: null,
        toggleButtons: null
    },
    
    createBox: function() {
        
        this.cache.box = $('<div>', {
            id: 'stylebot'
        });
        
        
        this.cache.header = $('<div>', {
            id: 'stylebot-header-text',
            html: 'custom styles'
        });
        $('<div>', {
            id: 'stylebot-header'
        })
        .append(this.cache.header)
        .appendTo(this.cache.box);
        
        var controls_ui = $('<div>', {
            id: 'stylebot-controls'
        });
        
        // creating controls for different CSS properties
        var len = this.groups.length;
        
        for(var i=0; i<len; i++)
        {
            this.createGroupHeader(this.groups[i].name).appendTo(controls_ui);
            var group = $('<div>').appendTo(controls_ui);

            var len2 = this.groups[i].controls.length;
            for(var j=0; j<len2; j++)
                this.createControl(this.groups[i].controls[j]).appendTo(group);
        }
        
        controls_ui.appendTo(this.cache.box).accordion({
            header: 'h3',
            autoHeight: false,
            collapsible: true,
            animated: false
        });
        
        // creating options in widget
        var options_div = $('<div>', {
            id: 'stylebot-widget-options'
        });
        
        this.createLabel('Position').appendTo(options_div);
        this.createButtonSet(['Left', 'Right'], 1).appendTo(options_div);
        
        options_div.appendTo(this.cache.box);
        
        // creating main buttons for widget
        var buttons = $('<div>', {
            id: 'stylebot-main-buttons'
        });
        
        this.createButton('Save').appendTo(buttons).click(stylebot.widget.save);
        this.createButton('View CSS').appendTo(buttons).click(stylebot.widget.viewCSS);
        this.createButton('Reset').appendTo(buttons).click(stylebot.widget.resetCSS);
        buttons.appendTo(this.cache.box);
        
        this.cache.box.appendTo(document.body);
        
        // make title editable
        stylebot.utils.makeEditable(this.cache.header, function(value) {
            stylebot.selector.value = value;
            stylebot.selectedElement = null;
            stylebot.widget.show();
        });
        
        // fill cache with jQuery objects widget UI elements
        this.fillCache();
        
        // set initial widget position to Right
        stylebot.widget.setPosition('Right');

    },
    
    fillCache: function() {
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
        // toggle buttons
        this.cache.toggleButtons = $('.stylebot-toggle');
    },
    
    createGroupHeader: function(name) {
        return $('<h3>')
        .append($('<a>', {
            href: '#',
            html: name
        }));
    },
    
    createControl: function(control) {
        var el = $('<div>', {
            class: 'stylebot-control-set'
        });

        this.createLabel(control.name).appendTo(el);
        
        var control_el; // this will contain the control element
        
        // Add controls of different types
        switch(control.type){

            case 'size'             :   control_el = this.createSizeControl(control.id).appendTo(el);
                                        break;
                                        
            case 'color'            :   control_el = this.createTextField(control.id, 10);
                                        this.createColorPicker(control_el).appendTo(el);
                                        control_el.appendTo(el)
                                        .keyup(function(e){ stylebot.widget.ui.setColorSelectorColor( $(this) ) });
                                        break;
                                        
            case 'checkbox'         :   control_el = this.createCheckbox(null, control.id , control.value).appendTo(el);
                                        break;

            case 'toggle'           :   control_el = this.createToggleButton('Hide', control.id , control.value).appendTo(el);
                                        break;

            case 'select'           :   control_el = this.createSelect(control.id);
                                        this.createSelectOption("Default", control.id, '').appendTo(control_el);
                                        var len = control.options.length;
                                        for(var i=0; i<len; i++)
                                        {
                                            var option = control.options[i];
                                            this.createSelectOption( stylebot.utils.capitalize(option), control.id, option).appendTo(control_el);
                                        }
                                        control_el.appendTo(el);
                                        break;
        }
        // objects (except primitive type) are passed by reference in JS
        control.el = control_el;
        return el;
    },
    
    createTextField: function(property, size) {
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
    
    createSizeControl: function(property) {
        var container = $('<span>');
        
        // Textfield for entering size
        var input = $('<input>',{
            type: 'text',
            id: 'stylebot-' + property,
            class: 'stylebot-control stylebot-textfield',
            size: 4
        });
        input.data("property", property)
        .keyup(this.events.onSizeFieldKeyUp)
        .appendTo(container);

        // Select box for choosing unit
        var select = $('<select>', {
            class: 'stylebot-control stylebot-select'
        })
        .change(function(e){
            $(this).prev().keyup();
        })
        .appendTo(container);
        
        var units = ['px', 'em', '%', 'pt'];
        var len = units.length;
        
        for(var i=0; i<len; i++){
            $('<option>', {
                class: 'stylebot-select-option',
                html: units[i]
            })
            .appendTo(select);
        }
        
        return container;
    },
    
    createCheckbox: function(text, property, value) {
        var checkbox = $('<input>',{
            type: 'checkbox',
            id: 'stylebot-' + property,
            class: 'stylebot-control stylebot-checkbox',
            value: value
        })
        .data('property', property)
        .click(stylebot.widget.ui.events.onCheckboxChange);
        
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
    
    createToggleButton: function(text, property, value) {
        var container = $('<span>', {
            class: 'stylebot-control'
        });
        
        var checkbox = $('<input>',{
            type: 'checkbox',
            id: 'stylebot-' + property,
            class: 'stylebot-control stylebot-toggle',
            value: value
        })
        .appendTo(container)
        .data('property', property);
        
        $('<label for="stylebot-' + property + '" >' + text + '</label>')
        .appendTo(container);
        
        checkbox.button()
        .change(this.events.onCheckboxChange);
        
        return container;
    },
    
    createRadio: function(text, name, property, value) {
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
    
    createSelect: function(property) {
        var select = $('<select>', {
            id:'stylebot-' + property,
            class: 'stylebot-control stylebot-select'
        });
        select.data('property', property);
        select.change(this.events.onSelectChange);
        return select;
    },
    
    createSelectOption: function(text, property, value) {
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
    
    createColorPicker: function(input) {
        return $('<div>', {
            class:'stylebot-colorselector stylebot-control', 
            tabIndex:0
        })
        .append($('<div>', { class:'stylebot-colorselector-color'}))
        .ColorPicker({
            flat:false,
            onChange: function(hsb, hex, rgb) {
                var colorCode = '#' + hex;
                // set input value to reflect the newly picked color's code
                input.attr('value', colorCode);
                input.keyup();
                // update the color selector color
                stylebot.widget.ui.setColorSelectorColor(input);
            },
            onBeforeShow: function() {
                var color = input.attr('value');
                if(color == "")
                    color = "#ffffff"; // default is white
                $(this).ColorPickerSetColor(color);
                stylebot.widget.ui.isColorPickerVisible = true;
            },
            onHide: function() {
                stylebot.widget.ui.isColorPickerVisible = false;
            }
        })
        .keyup(function(e) {
            // TODO: Toggle visibility of color picker when enter is pressed
            if(e.keyCode == 13) //enter
                $(this).ColorPickerShow();
        });
    },
    
    // Set color selector value by fetching value from connected input textfield
    setColorSelectorColor: function(input) {
        // get the color value
        var color = input.attr('value');
        // get the color selector connected to the input field
        var colorSelector = input.prev().find('div');
        colorSelector.css('backgroundColor', color);
    },

    createLabel: function(text) {
        return $('<label>', {
            class: 'stylebot-label',
            html: text+":"
        });
    },
    
    createInlineLabel: function(text) {
        return $('<label>', {
            class: 'stylebot-inline-label',
            html: text
        });
    },
    
    createButton: function(text) {
        return $('<button>', {
            class: 'stylebot-button',
            html: text
        }).button();
    },
    
    createButtonSet: function(buttons, enabledButtonIndex) {
        var container = $('<span>');
        var len = buttons.length;
        for( var i=0; i<buttons.length; i++)
        {
            var radio = $('<input>', {
                type: 'radio',
                id: 'stylebot-position-' + i,
                name: 'stylebot-position',
                value: buttons[i]
            }).appendTo(container);
            $('<label for="stylebot-position-'+ i + '">' + buttons[i] + '</label>').appendTo(container);

            if(i == enabledButtonIndex)
                radio.attr('checked', 'checked');
            radio.change(function(e){
                stylebot.widget.setPosition(e.target.value);
            });
        }
        
        return container.buttonset();
    },
    
    fillControl: function(control, rule) {
        var pValue = rule[control.id];
        if( typeof(pValue) != 'undefined' )
        {
            switch(control.type){
                case 'size'             :   // get unit
                                            var validUnits = ['px', 'em', '%', 'pt'];
                                            var len = validUnits.length;
                                            for(var i=0; i<len; i++)
                                            {
                                                if( pValue.indexOf(validUnits[i]) != -1)
                                                    break;
                                            }
                                            var unit = validUnits[i];
                                            // set textfield value
                                            control.el.find('input')
                                            .attr('value', pValue.replace(unit, '') );
                                            
                                            // set select option
                                            var index = $.inArray( $.trim( String(unit) ), validUnits);
                                            control.el.find('select').attr('selectedIndex', index);
                                            break;
                                        
                case 'color'            :   control.el.attr('value', pValue);
                                            this.setColorSelectorColor(control.el);
                                            break;
                                        
                case 'checkbox'         :   if(pValue == control.value)
                                                control.el.attr('checked', true);
                                            else
                                                control.el.attr('checked', false);                                                
                                            break;
                                        
                case 'toggle'         :     var input = control.el.find('input');
                                            if(pValue == control.value)
                                                input.attr('checked', true);
                                            else
                                                input.attr('checked', false);
                                            input.button('refresh');
                                            break;
                                        
                case 'select'            :  var index = $.inArray( $.trim( String(pValue) ), control.options);
                                            if(index != -1)
                                                control.el.attr('selectedIndex', index + 1);
                                            break;
            }
        }
    },
    
    // fill widget
    fill: function() {
        // fill controls
        var len = this.groups.length;
        var rule = stylebot.style.getRule(stylebot.selector.value);
        
        if(rule)
        {
            for(var i=0; i<len; i++)
            {
                var len2 = this.groups[i].controls.length;
                for(var j=0; j<len2; j++)
                    this.fillControl(this.groups[i].controls[j], rule);
            }
        }
        
        // set widget title
        this.cache.header.html(stylebot.selector.value ? stylebot.selector.value : "Select an element");
    },
    
    // reset values to default for all controls
    reset: function() {
        this.cache.textfields.attr('value', '');
        this.cache.checkboxes.attr('checked', false);
        this.cache.radios.attr('checked', false);
        this.cache.selectboxes.attr('selectedIndex', 0);
        this.cache.colorSelectorColor.css('backgroundColor', '#fff');
        this.cache.toggleButtons.attr('checked', false).button('refresh');
    }
}