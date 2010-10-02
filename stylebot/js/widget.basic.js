/**
  * stylebot.widget.basic
  * 
  * Basic mode
  **/

stylebot.widget.basic = {
    
    isColorPickerVisible: false,
    
    enabledAccordions: [0, 1, 2, 3],
    
    cache: {
        container: null,
        controls: null,
        buttons: null,
        textfields: null,
        selectboxes: null,
        colorSelectors: null,
        colorSelectorColor: null,
        toggleButtons: null,
        accordionHeaders: null,
        fontFamilyInput: null,
        segmentedControls: null
    },
    
    groups: [{
        name: '<u>T</u>ext',
        controls: [
        {
            name: 'Font Family',
            id: 'font-family',
            type: 'font-family',
            options: ['Helvetica, Arial, sans-serif', '"Lucida Grande", Verdana, sans-serif', 'Palatino, "Palatino Linotype", serif', 'Georgia'],
            el: null
        },
        {
            name: 'Font Size',
            id: 'font-size',
            type: 'size',
            el: null
        },
        {
            name: 'Font Weight',
            id: 'font-weight',
            type: 'segmented',
            values: ['bold', 'normal'],
            options: ['Bold', 'Normal'],
            el: null
        },
        {
            name: 'Font Style',
            id: 'font-style',
            type: 'segmented',
            values: ['italic', 'normal'],
            options: ['<span style="font-style: italic;">Italic</span>', 'Normal'],
            el: null
        },
        {
            name: 'Font Variant',
            id: 'font-variant',
            type: 'segmented',
            options: ['<span style="font-variant: small-caps;">Small Caps</span>', 'Normal'],
            values: ['small-caps', 'normal'],
            el: null
        },
        {
            name: 'Transform',
            id: 'text-transform',
            type: 'segmented',
            values: ['capitalize', 'uppercase', 'lowercase', 'none'],
            options: ['Abc', 'ABC', 'abc', 'None'],
            el: null
        },
        {
            name: 'Decoration',
            id: 'text-decoration',
            type: 'segmented',
            options: ['<span style="text-decoration: underline;">ab</span>', '<span style="text-decoration: line-through;">ab</span>', '<span style="text-decoration: overline;">ab</span>', 'None'],
            values: ['underline', 'line-through', 'overline', 'none'],
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
        name: '<u>C</u>olor & Background',
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
        name: '<u>B</u>orders',
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
            options: ['All', 'Top', 'Right', 'Bottom', 'Left'],
            id: ['border-width', 'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width'],
            type: 'multi-size',
            el: null
        }]
    },
    {
        name: '<u>L</u>ayout & Visibility',
        controls: [
        {
            name: 'Visibility',
            id: 'display',
            type: 'toggle',
            value: 'none',
            el: null
        },
        {
            name: 'Height',
            id: 'height',
            type: 'size',
            el: null
        },
        {
            name: 'Width',
            id: 'width',
            type: 'size',
            el: null
        },
        {
            name: 'Margins',
            options: ['All', 'Top', 'Right', 'Bottom', 'Left'],
            id: ['margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left'],
            type: 'multi-size',
            el: null
        },
        {
            name: 'Paddings',
            options: ['All', 'Top', 'Right', 'Bottom', 'Left'],
            id: ['padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left'],
            type: 'multi-size',
            el: null
        }]
    }
    ],
    
    createUI: function() {
        this.cache.container = $('<div>', {
            id: 'stylebot-controls'
        });
        
        // creating controls for different CSS properties
        var len = this.groups.length;
        
        for (var i=0; i<len; i++)
        {
            WidgetUI.createAccordionHeader(this.groups[i].name)
            .appendTo(this.cache.container);
            
            var group = $('<div>', {
                class: 'stylebot-accordion'
            })
            .appendTo(this.cache.container);

            var len2 = this.groups[i].controls.length;
            for (var j=0; j<len2; j++)
                this.createUIForControl(this.groups[i].controls[j])
                .appendTo(group);
        }
        return this.cache.container;
    },
    
    fillCache: function() {
        // controls
        this.cache.controls = $('.stylebot-control');
        // textfields
        this.cache.textfields = $('.stylebot-textfield');
        // buttons
        this.cache.buttons = $('#stylebot-controls .stylebot-button');
        // select dropdowns
        this.cache.selectboxes = $('.stylebot-select');
        // color selector
        this.cache.colorSelectors = $('.stylebot-colorselector');
        // color selector color divs
        this.cache.colorSelectorColor = $('.stylebot-colorselector-color');
        // toggle buttons
        this.cache.toggleButtons = $('.stylebot-toggle');
        // accordion headers
        this.cache.accordionHeaders = $('.stylebot-accordion-header');
        // font family input
        this.cache.fontFamilyInput = $('#stylebot-font-family');
        // segmented controls
        this.cache.segmentedControls = $('.stylebot-segmented-control');
    },
    
    createUIForControl: function(control) {
        var el = $('<div>', {
            class: 'stylebot-control-set'
        });

        WidgetUI.createLabel(control.name).appendTo(el);
        
        var control_el; // this will contain the control element
        
        // Add controls of different types
        switch (control.type) {

            case 'size'             :   control_el = WidgetUI.createSizeControl(control.id).appendTo(el);
                                        break;
            
            case 'multi-size'       :   control_el = WidgetUI.createMultiSizeControl(control).appendTo(el); break;
                                        
            case 'color'            :   control_el = WidgetUI.createTextField(control.id, 10, Events.onTextFieldKeyUp);
                                        WidgetUI.createColorPicker(control_el).appendTo(el);
                                        control_el.appendTo(el)
                                        .keyup(function (e) { WidgetUI.setColorSelectorColor($(this)) });
                                        break;

            case 'toggle'           :   control_el = WidgetUI.createToggleButton("Hide", control.id , control.value).appendTo(el);
                                        break;

            case 'select'           :   control_el = WidgetUI.createSelect(control.id);
                                        WidgetUI.createSelectOption("Default", control.id, '').appendTo(control_el);
                                        var len = control.options.length;
                                        for (var i=0; i<len; i++)
                                        {
                                            var option = control.options[i];
                                            WidgetUI.createSelectOption(Utils.capitalize(option), control.id, option).appendTo(control_el);
                                        }
                                        control_el.appendTo(el);
                                        break;

            case 'segmented'        :   control_el = WidgetUI.createSegmentedControl(control).appendTo(el);
                                        break;
                                        
            case 'font-family'      :   control_el = WidgetUI.createFontFamilyControl(control).appendTo(el);
                                        break;
        }
        
        // objects (except primitive type) are passed by reference in JS
        control.el = control_el;
        return el;
    },
    
    fill: function() {
        // fill controls
        var len = this.groups.length;
        var rule = stylebot.style.getRule(stylebot.style.cache.selector);

        if (rule)
        {
            for (var i=0; i<len; i++)
            {
                var len2 = this.groups[i].controls.length;
                for (var j=0; j<len2; j++)
                    this.fillControl(this.groups[i].controls[j], rule);
            }
        }
    },
    
    fillControl: function(control, rule) {
        function determineSizeUnit(val) {
            var len = WidgetUI.validSizeUnits.length;
            for (var i=0; i<len; i++)
            {
                if (val.indexOf(WidgetUI.validSizeUnits[i]) != -1)
                    break;
            }
            return WidgetUI.validSizeUnits[i];
        }
        
        var pValue = rule[control.id];

        switch (control.type) {
            case 'size'         :       if(pValue == undefined)
                                            return false;
                                        var unit = determineSizeUnit(pValue);
                                        
                                        control.el.find('input')
                                        .attr('value', pValue.replace(unit, '') );
                                        
                                        // set select option
                                        var index = $.inArray($.trim(String(unit)), WidgetUI.validSizeUnits);
                                        control.el.find('select').attr('selectedIndex', index);
                                        break;
                                        
            case 'multi-size'   :       var len = control.id.length;
                                        var inputFields = control.el.find('input');
                                        var selectInputs = control.el.find('select');
                                        var values = [];
                                        for (var i=0; i<len; i++)
                                            values[i] = rule[control.id[i]];
                                        
                                        if (values[0] != undefined)
                                        {
                                            var parts = values[0].split(' ');
                                            // parse value of the form margin: 2px 10px;
                                            if (parts.length == 2)
                                            {
                                                values[0] = "";
                                                values[1] = values[3] = $.trim( parts[0] ); // top & bottom
                                                values[2] = values[4] = $.trim( parts[1] ); // left & right
                                            }
                                            // parse value of the form margin: 2px 10px 8px 6px;                                        
                                            else if (parts.length == 4)
                                            {
                                                values[0] = "";
                                                values[1] = $.trim( parts[0] );
                                                values[2] = $.trim( parts[1] );
                                                values[3] = $.trim( parts[2] );
                                                values[4] = $.trim( parts[3] );
                                            }
                                        }
                                        
                                        for (var i=0; i<len; i++)
                                        {
                                            pValue = values[i];
                                            if (pValue != undefined)
                                            {
                                                var unit = determineSizeUnit(pValue);
                                                var input = $(inputFields[i]);
                                                input.attr('value', pValue.replace(unit, ''))
                                                .keyup(); // keyup called to update rules cache as values maybe modified when mode is switched.
                                                var index = $.inArray($.trim( String(unit)), WidgetUI.validSizeUnits);
                                                $(selectInputs[i]).attr('selectedIndex', index);
                                            }
                                        }
                                        break;

            case 'font-family'  :       if (pValue == undefined)
                                            return false;
                                        
                                        // set input value
                                        var input = control.el.find('input')
                                        .attr('value', pValue);
                                        
                                        var index = $.inArray(pValue, control.options);
                                        if (index != -1)
                                        {
                                            control.el.find('select').attr('selectedIndex', index + 1);
                                            input.hide();
                                        }
                                        else
                                        {
                                            control.el.find('select').attr('selectedIndex', control.options.length + 1);
                                            input.show();
                                        }
                                        break;
                                    
            case 'color'            :   if (pValue == undefined)
                                            return false;
                                        control.el.attr('value', pValue);
                                        WidgetUI.setColorSelectorColor(control.el);
                                        break;
                                    
            case 'toggle'           :   if (pValue == control.el.data('value'))
                                            control.el.addClass('stylebot-active-button');
                                        else
                                            control.el.removeClass('stylebot-active-button');
                                        break;
                                    
            case 'select'           :   var index = $.inArray($.trim(String(pValue)), control.options);
                                        if (index != -1)
                                            control.el.attr('selectedIndex', index + 1);
                                        break;

            case 'segmented'        :   var index = $.inArray( $.trim( String(pValue) ), control.values);
                                        if (index != -1)
                                            $(control.el.find('button')[index])
                                            .addClass('stylebot-active-button')
                                            .next().addClass('stylebot-active-button-next');
        }
    },
    
    // reset values to default for all controls
    reset: function() {
        this.cache.textfields.attr('value' , '');
        this.cache.selectboxes.attr('selectedIndex', 0);
        this.cache.colorSelectorColor.css('backgroundColor', '#fff');
        this.cache.toggleButtons.removeClass('stylebot-active-button');
        this.cache.fontFamilyInput.hide();
        this.cache.segmentedControls.find('.stylebot-active-button')
        .removeClass('stylebot-active-button')
        .next().removeClass('stylebot-active-button-next');
    },

    show: function() {
        // reset all values for controls to default values
        this.reset();
        this.fill();
        
        // set focus to first visible accordion header
        var controlContainerOffset = this.cache.container.offset().top;

        for (var i=0; i<4; i++)
        {
            if ($(this.cache.accordionHeaders[i]).offset().top >= controlContainerOffset)
             {
                 setTimeout(function() {
                      stylebot.widget.basic.cache.accordionHeaders[i].focus();
                 }, 0);
                 break;
             }
        }
        this.cache.container.show();
    },
    
    hide: function() {
        $('#stylebot-controls').hide();
    },
    
    initAccordions: function() {
        var len = this.enabledAccordions.length;
        for (var i=0; i < len; i++)
            Events.toggleAccordion($(this.cache.accordionHeaders[this.enabledAccordions[i]]));
    }
}