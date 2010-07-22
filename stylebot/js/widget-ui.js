/**
  * Utility Methods to create various Widget controls.
  *
  * Dual licensed under GPL and MIT licenses
  **/

/** TODO: Remove any dependence on other parts of stylebot (mostly stylebot.widget.basic.events) **/
var WidgetUI = {
    
    validSizeUnits: ['px', 'em', '%', 'pt'],
    
    createOption: function(control) {
        var container = $('<div>', {
            class: 'stylebot-widget-option'
        });
        
        return container.append(control);
    },
    
    createAccordionHeader: function(name) {
        return $('<a>', {
            class: 'stylebot-accordion-header',
            tabIndex: 0,
            html: name
        })
        .prepend( $('<div>', {
            class: 'stylebot-accordion-icon'
        }))
        .bind('mousedown keydown', function (e) {
            if (e.type == "keydown" && e.keyCode != 13)
                return true;
            e.preventDefault();
            
            var el = $(e.target);
            if (!el.hasClass('stylebot-accordion-header'))
                el = el.parent();
            
            stylebot.widget.basic.events.toggleAccordion(el);
        });
    },
    
    createTextField: function(property, size, handler) {
        return $('<input>',{
            type: 'text',
            id: 'stylebot-' + property,
            class: 'stylebot-control stylebot-textfield',
            size: size
        })
        .data('property', property)
        .keyup(handler);
    },
    
    createSizeControl: function( property ) {
        var container = $('<span>');
        
        // Textfield for entering size
        this.createTextField(property, 2, stylebot.widget.basic.events.onSizeFieldKeyUp)
        .appendTo(container);

        // Select box for choosing unit
        var select = $('<select>', {
            class: 'stylebot-control stylebot-select'
        })
        .change(function(e) {
            $(this).prev().keyup();
        })
        .appendTo(container);
        
        var len = this.validSizeUnits.length;
        
        for (var i = 0; i < len; i++){
            this.createSelectOption(this.validSizeUnits[i], null, this.validSizeUnits[i])
            .appendTo(select);
        }
        return container;
    },
    
    createMultiSizeControl: function(control) {
        var container = $('<span>', {
            style: 'display: inline-block; margin-left: 50px; margin-top: -10px'
        });
        var len = control.id.length;
        for (var i = 0; i < len; i++)
        {
            this.createLabel(control.options[i])
            .appendTo(container);
            
            this.createSizeControl(control.id[i])
            .attr('style', 'margin-bottom: 3px; display: inline-block;')
            .appendTo(container);
        }
        return container;
    },
    
    createFontFamilyControl: function(control) {
        var container = $('<span>');
        
        var select = $('<select>', {
            class: 'stylebot-control stylebot-select'
        })
        .change(function(e) {
            var el = $(this);
            var input = el.next();
            if (el.attr('value') == "Custom")
            {
                input
                .attr('value', '')
                .show();
            }
            else
            {
                input
                .hide()
                .attr('value', el.attr('value'));
            }
            input.keyup();
        })
        .appendTo(container);
        
        // default option
        this.createSelectOption('Default', null, '')
        .appendTo(select);
        
        var len = control.options.length;
        for (var i = 0; i < len; i++)
        {
            this.createSelectOption(control.options[i], null, control.options[i])
            .appendTo(select);
        }
        
        // custom option
        this.createSelectOption('Custom', null, 'Custom')
        .appendTo(select);

        // end of select
        
        // create custom font field
        this.createTextField(control.id, 20, stylebot.widget.basic.events.onTextFieldKeyUp)
        .css({
            marginLeft: '95px !important',
            marginTop: '5px',
            display: 'none'
        })
        .appendTo(container);
        
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
        .click(stylebot.widget.basic.events.onCheckboxChange);
        
        if (text)
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

        return this.createButton(text)
        .addClass('stylebot-toggle stylebot-control')
        .attr('id', 'stylebot-' + property)
        .data({
            'value': value,
            'property': property
        })
        .click(stylebot.widget.basic.events.onToggle);
    },
    
    createRadio: function(text, name, property, value) {
        var span = $('<span>', {
            id: 'stylebot-' + property,
            class: 'stylebot-control'
        });

        var radio = $('<input>',{
            type: 'radio',
            name: name,
            class: 'stylebot-control stylebot-radio'
        });
        
        if (typeof(property) == 'string')
            radio.attr('value', value);
        else
            radio.attr('value', value.join(','));
        
        radio.data('property', property);
        radio.click(stylebot.widget.basic.events.onRadioClick);
        radio.appendTo(span);
        this.createInlineLabel(text).appendTo(span);
        return span;
    },
    
    createSelect: function(property) {
        return $('<select>', {
            id:'stylebot-' + property,
            class: 'stylebot-control stylebot-select'
        })
        .data('property', property)
        .change(stylebot.widget.basic.events.onSelectChange);
    },
    
    createSelectOption: function(text, property, value) {
        var option = $('<option>', {
            class: 'stylebot-select-option',
            html: text,
            value: value
        });
        
        if (property)
            option.data('property', property);
        return option;
    },
    
    createColorPicker: function(input) {
        return $( '<div>', {
            class: 'stylebot-colorselector stylebot-control', 
            tabIndex: 0
        })
        .append( $('<div>', { class: 'stylebot-colorselector-color' } ) )
        .ColorPicker({
            flat: false,

            onChange: function(hsb, hex, rgb) {
                var colorCode = '#' + hex;
                // set input value to reflect the newly picked color's code
                input.attr( 'value', colorCode );
                // update the color selector color
                WidgetUI.setColorSelectorColor( input );
            },
            
            onBeforeShow: function() {
                var color = input.attr('value');
                if(color == "")
                    color = "#ffffff"; // default is white
                $(this).ColorPickerSetColor( color );
                stylebot.widget.basic.isColorPickerVisible = true;
            },
            
            onHide: function() {
                input.keyup();
                stylebot.widget.basic.isColorPickerVisible = false;
            }
        })
        .keyup( function(e) {
            if( e.keyCode == 13 && !$(e.target).hasClass( 'disabled' ) ) //enter
                $( this ).ColorPickerToggle();
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
        })
        .mouseup( function(e) { e.target.focus(); } );
    },
    
    createButtonSet: function(buttons, className,  enabledButtonIndex, callback) {
        var container = $('<span>');
        var len = buttons.length;
        for(var i=0; i<len; i++)
        {
            var bt = this.createButton(buttons[i])
            .addClass(className)
            .data('class', className)
            .appendTo(container)
            .click(callback);

            if(i == enabledButtonIndex)
                bt.addClass('stylebot-active-button');
        }
        return container;
    }, 
    
    createSegmentedControl: function(control) {
        var container = $('<span>', {
            class: 'stylebot-control stylebot-segmented-control',
            id: 'stylebot-' + control.id,
        });
        
        var len = control.options.length;
        for(var i=0; i<len; i++)
        {
            var bt = this.createButton( control.options[i] )
            .addClass('stylebot-segmented-button')
            .data({
                 value: control.values[i],
                 property: control.id
            })
            .click(stylebot.widget.basic.events.onSegmentedControlClick)
            .appendTo(container);
        }
        return container;
    }
}