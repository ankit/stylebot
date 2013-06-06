/* Creation of UI Controls for Basic Mode in Stylebot */

var WidgetUI = {
  SELECTORS: {
    accordion: '.stylebot-accordion-header',
    textfield: '.stylebot-textfield',
    button: '#stylebot-controls .stylebot-button',
    colorSelector: '.stylebot-color-selector',
    select: '.stylebot-select',
    toggleButton: '.stylebot-toggle',
    segmentedButton: '.stylebot-segmented-button',
    activeButton: '.stylebot-button-active',
    selectedButton: '.stylebot-button-selected'
  },

  CLASS_NAMES: {
    option: 'stylebot-widget-option',
    control: 'stylebot-control',

    button: {
      default: 'stylebot-button',
      active: 'stylebot-button-active',
      selected: 'stylebot-button-selected',
      nextToSelected: 'stylebot-next-segmented-button'
    },

    accordion: {
      header: 'stylebot-accordion-header',
      active: 'stylebot-accordion-active',
      icon: 'stylebot-accordion-icon'
    },

    textfield: 'stylebot-textfield',
    select: 'stylebot-select',
    multisize: 'stylebot-multisize',
    fontFamily: 'stylebot-font-family-control',
    borderStyle: 'stylebot-border-style-control',
    radio: 'stylebot-radio',
    colorSelector: 'stylebot-colorselector',
    colorSelectorColor: 'stylebot-colorselector-color',
    label: 'stylebot-label',
    inlineLabel: 'stylebot-inline-label',
    segmentedControl: 'stylebot-segmented-control',
    lastSegmentedButton: 'stylebot-last-segmented-button',
    toggleButton: 'stylebot-toggle'
  },

  SIZE_UNITS: ['px', 'em', '%', 'pt'],

  DEFAULT_FONT_STACK: ['Helvetica',
    'Roboto',
    'Lato',
    'Palatino',
    'Georgia',
    'Lucida Grande',
    'Consolas',
    'monospace'
  ],

  /**
    * Create option for control
    * @param {element} Control
    * @return {element} UI for option
    */
  createOption: function(control) {
    var container = $('<div>', {
      class: this.CLASS_NAMES.option
    });
    return container.append(control);
  },

  /**
    * Create Accordion UI
    * @param {string} Name of accordion
    * @return {element} Accordion <a> element
    */
  createAccordionHeader: function(name) {
    var $accordion = $('<a>', {
      class: this.CLASS_NAMES.accordion.header,
      tabIndex: 0,
      html: name
    })

    .prepend($('<div>', {
      class: this.CLASS_NAMES.accordion.icon
    }))

    .bind('mousedown keydown', $.proxy(function(e) {
      if (e.type == 'keydown' && e.keyCode != 13)
        return true;
      e.preventDefault();

      var el = $(e.target);
      if (!el.hasClass(this.CLASS_NAMES.accordion.header))
        el = el.parent();

      Events.toggleAccordion(el);
    }, this));

    return $accordion;
  },

  /**
    * Create a textfield
    * @param {string} property Property name for textfield
    * @param {number} size Size of textfield
    * @param {function} onKeyDownHandler Callback for 'keydown' event
    * @param {function} onKeyUpHandler Callback for 'keyup' event
    * @return {jQuery element} The textfield element
    */
  createTextField: function(property, size, onKeyDownHandler, onKeyUpHandler) {
    var $input = $('<input>', {
      type: 'text',
      id: 'stylebot-' + property,
      class: this.CLASS_NAMES.control + " " + this.CLASS_NAMES.textfield,
      size: size
    })

    .data('property', property)

    .click(function(e) {
      Utils.selectAllText(e.target);
    })
    .focus(Events.onTextFieldFocus)
    .blur(Events.onTextFieldBlur);

    if (onKeyDownHandler)
      $input.keydown(onKeyDownHandler);
    if (onKeyUpHandler)
      $input.keyup(onKeyUpHandler);

    return $input;
  },

  /**
    * Create a size <select> control
    * @param {string} property Property Name
    * @return {jQuery element} SPAN for size selection
    */
  createSizeControl: function(property) {
    var container = $('<span>');

    // Textfield for entering size
    this.createTextField(property, 2,
      Events.onSizeFieldKeyDown,
      Events.onSizeFieldKeyUp)
    .appendTo(container);

    // Select box for choosing unit
    var $select = $('<select>', {
      class: this.CLASS_NAMES.control + " " + this.CLASS_NAMES.select
    })
    .data('default', 'px')
    .appendTo(container);

    var len = this.SIZE_UNITS.length;
    for (var i = 0; i < len; i++) {
      this.createSelectOption($select, this.SIZE_UNITS[i], this.SIZE_UNITS[i]);
    }

    this.selectize($select, {
      onValueChange: function(value) {
        $select.prev().keyup();
      }
    });

    return container;
  },

  /**
    * Create size controls for top, right, bottom and all
    * @param {element} control Control to insert multisize control in
    * @return {jQuery element} SPAN containing select element
    */
  createMultiSizeControl: function(control) {
    var container = $('<span>', {
      class: this.CLASS_NAMES.multisize
    });

    var len = control.id.length;
    var sizeTypes = ['all', 'top', 'right', 'bottom', 'left'];

    for (var i = 0; i < len; i++) {
      var property = control.id[i];
      this.createTextField(property, 1, Events.onSizeFieldKeyDown, Events.onSizeFieldKeyUp)
        .addClass(this.CLASS_NAMES.multisize + '-' + sizeTypes[i])
        .appendTo(container);
    }

    // Select box for choosing unit
    var $select = $("<select>", {
      class: this.CLASS_NAMES.control + " " + this.CLASS_NAMES.select
    })
    .data('default', 'px')
    .appendTo(container);

    var len = this.SIZE_UNITS.length;
    for (var i = 0; i < len; i++) {
      this.createSelectOption($select, this.SIZE_UNITS[i], this.SIZE_UNITS[i]);
    }

    this.selectize($select, {
      onValueChange: function(value) {
        $select.parent().find('input').keyup();
      }
    });

    return container;
  },

  /**
    * Create a font family <select>
    * @param {element} control Element that should contain this control
    * @return {jQuery element} SPAN element containing the control
    */
  createFontFamilyControl: function(control) {
    var $container = $('<span>', {
      class: this.CLASS_NAMES.fontFamily
    });

    var $select = $('<select>', {
      class: this.CLASS_NAMES.control + " " + this.CLASS_NAMES.select
    })
    .data('default', 'default')
    .appendTo($container);

    // default option
    this.createSelectOption($select, 'Default', 'default');

    chrome.storage.local.get("fontStack", $.proxy(function(items) {
      var fontStack = items["fontStack"];
      if (!fontStack) {
        fontStack = this.DEFAULT_FONT_STACK;
        chrome.storage.local.set({"fontStack": fontStack});
      }

      var len = fontStack.length;
      var $select = $('.' + this.CLASS_NAMES.fontFamily + ' select');
      var selectize = $select.get(0).selectize;

      for (var i = 0; i < len; i++) {
        var font = fontStack[i];
        selectize.addOption(font, {text: font, value: font});
      }

      $select.data('set', true);
    }, this));

    this.selectize($select, {
      persist: true,

      create: function(input) {
        input = $.trim(input);

        return {
          value: input,
          text: input
        }
      },

      onOptionAdd: $.proxy(function(value, data) {
        var $select = $('.' + this.CLASS_NAMES.fontFamily + ' select');
        if (!$select.data('set')) { return; }

        chrome.storage.local.get("fontStack", function(items) {
          var fontStack = items["fontStack"];
          fontStack.unshift(value);
          fontStack = fontStack.slice(0, 15);
          chrome.storage.local.set({"fontStack": fontStack});
        });
      }, this),

      onValueChange: function(value) {
        Events.onSelectChange('font-family', value);
      }
    });

    return $container;
  },

  createBorderStyleControl: function(control) {
    var container = $('<span>', {
      class: this.CLASS_NAMES.borderStyle
    });

    var $select = $('<select>', {
      class: this.CLASS_NAMES.control + " " + this.CLASS_NAMES.select
    })
    .data('default', 'default')
    .appendTo(container);

    // default option
    this.createSelectOption($select, 'Default', 'default');

    var len = control.options.length;
    for (var i = 0; i < len; i++) {
      this.createSelectOption($select, control.options[i], control.options[i])
    }

    this.selectize($select, {
      persist: true,
      create: false,
      onValueChange: function(value) {
        Events.onSelectChange('border-style', value);
      }
    });

    return container;
  },

  /**
    * Wrapper for selectize.js with default options.
    */
  selectize: function($select, moreOptions) {
    if (!moreOptions) {
      moreOptions = {};
    }

    var options = {
      onDropdownOpen: function($dropdown) {
        var value = $select.get(0).selectize.getValue();
        $dropdown.data('value', value);
      },

      onDropdownClose: function($dropdown) {
        var oldValue = $dropdown.data('value');
        var selectize = $select.get(0).selectize;
        var value = selectize.getValue();

        if (oldValue === value) { return; }

        if (value === '') {
          selectize.setValue(oldValue);
          return;
        }

        if (value === 'default') {
          value = '';
        }

        if (moreOptions['onValueChange']) {
          moreOptions['onValueChange'](value);
        }
      }
    };

    if (moreOptions) {
      $.each(moreOptions, function (key, value) {
        options[key] = value;
      });
    }

    $select.selectize(options);
  },

  /**
    *
    */
  createToggleButton: function(text, property, value) {
    return this.createButton(text)
    .addClass(this.CLASS_NAMES.control + " " + this.CLASS_NAMES.toggleButton)
    .attr('id', 'stylebot-' + property)
    .data({
      'value': value,
      'property': property
    })
    .click(Events.onToggle);
  },

  /**
    *
    */
  createRadio: function(text, name, property, value) {
    var span = $('<span>', {
      id: 'stylebot-' + property,
      class: this.CLASS_NAMES.control
    });

    var radio = $('<input>', {
      type: 'radio',
      name: name,
      class: this.CLASS_NAMES.control + " " + this.CLASS_NAMES.radio
    });

    if (typeof(property) == 'string')
      radio.attr('value', value);
    else
      radio.attr('value', value.join(','));

    radio.data('property', property);
    radio.click(Events.onRadioClick);
    radio.appendTo(span);
    this.createInlineLabel(text).appendTo(span);
    return span;
  },

  /**
    *
    */
  createSelectOption: function($select, text, data, property) {
    var $option = $('<option>', {
      html: text,
      value: data
    });

    if (property) {
      $option.data('property', property);
    }

    $select.append($option);
    return $option;
  },

  /**
    * Create the color picker
    */
  createColorPicker: function(input, el) {
    return $('<div>', {
      class: this.CLASS_NAMES.control + " " + this.CLASS_NAMES.colorSelector,
      tabIndex: 0
    })

    .append($('<div>', {
      class: this.CLASS_NAMES.colorSelectorColor
    }))

    .ColorPicker({
      flat: false,
      appendToElement: el,

      onChange: function(hsb, hex, rgb) {
        var colorCode = '#' + hex;
        // set input value to reflect the newly picked color's code
        input.attr('value', colorCode);
        // update the color selector color
        WidgetUI.setColorSelectorColor(input);

        // if live preview is enabled, update DOM
        if (stylebot.options.livePreviewColorPicker)
          input.keyup().blur();
      },

      onBeforeShow: function() {
        var color = input.attr('value');
        if (color === '' || color === undefined)
          color = '#ffffff'; // default is white
        $(this).ColorPickerSetColor(color);
        stylebot.widget.basic.isColorPickerVisible = true;
        input.focus();
      },

      onHide: function() {
        input.keyup().blur();
        stylebot.widget.basic.isColorPickerVisible = false;
      }
    })

    .keyup(function(e) {
      // enter
      if (e.keyCode == 13 && !$(e.target).hasClass('disabled'))
        $(this).ColorPickerToggle();
    });
  },

  // Set color selector value by fetching value from connected input textfield
  setColorSelectorColor: function(input) {
    // get the color value
    var color = input.attr('value');
    if (color != undefined) {
      // get the color selector connected to the input field
      var colorSelector = input.prev().find('div');
      colorSelector.css('backgroundColor', color);
    }
  },

  createLabel: function(text) {
    return $('<label>', {
      class: this.CLASS_NAMES.label,
      html: text + ':'
    });
  },

  createInlineLabel: function(text) {
    return $('<label>', {
      class: this.CLASS_NAMES.inlineLabel,
      html: text
    });
  },

  createButton: function(text) {
    return $('<button>', {
      class: this.CLASS_NAMES.button.default,
      html: text
    })
    .mouseup(function(e) { e.target.focus(); });
  },

  createButtonSet: function(buttons, className,  enabledButtonIndex, callback) {
    var container = $('<span>');
    var len = buttons.length;

    for (var i = 0; i < len; i++) {
      var bt = this.createButton(buttons[i])
      .addClass(className)
      .data('class', className)
      .appendTo(container)
      .click(callback);

      if (i === enabledButtonIndex)
        bt.addClass(this.BUTTON_SELECTED_CLASS);
    }

    return container;
  },

  createSegmentedControl: function(control) {
    var container = $('<span>', {
      class: this.CLASS_NAMES.control + " " + this.CLASS_NAMES.segmentedControl,
      id: 'stylebot-' + control.id
    });

    var len = control.options.length;
    for (var i = 0; i < len; i++) {
      var bt = this.createButton(control.options[i])
      .data({
        value: control.values[i],
        property: control.id
      })
      .bind('mousedown keydown', Events.onSegmentedControlMouseDown)
      .appendTo(container);
      // explicitly having to add the 'stylebot-last-child' class as :last-child causes weird issue in Chrome
      if (i == (len - 1)) {
        bt.addClass(this.CLASS_NAMES.lastSegmentedButton);
      }
    }

    return container;
  },

  setFontFamily: function(control, value) {
    if (value === undefined)
      return false;

    var selectize = control.el.find('select').get(0).selectize;
    var option = selectize.getOption(value);

    if (option.length == 0) {
      selectize.addOption(value, {text: value, value: value});
      selectize.refreshOptions(false);
    }

    selectize.setValue(value);
  },

  setBorderStyle: function(control, value) {
    if (value === undefined)
      return false;

    control.el.find('select').get(0).selectize.setValue(value);
  },

  setColor: function(control, value) {
    if (value === undefined)
      return false;
    control.el.attr('value', value);
    this.setColorSelectorColor(control.el);
  },

  setToggleButton: function(control, value) {
    if (value === control.el.data('value'))
      this.selectButton(control.el);
    else
      this.deselectButton(control.el);
  },

  setSegmentedControl: function(control, value) {
    var index = $.inArray($.trim(String(value)), control.values);
    if (index != -1)
      this.selectSegmentedButton($(control.el.find('button').get(index)));
  },

  setSize: function(control, value) {
    if (value === undefined)
      return false;

    var unit = $.trim(this.determineSizeUnit(value));

    control.el.find(this.SELECTORS.textfield).attr('value', value.replace(unit, ''));
    control.el.find(this.SELECTORS.select).get(0).selectize.setValue(unit);
  },

  determineSizeUnit: function(value) {
    var len = this.SIZE_UNITS.length;

    for (var i = 0; i < len; i++) {
      if (value.indexOf(this.SIZE_UNITS[i]) != -1) {
        break;
      }
    }

    if (i < len)
      return this.SIZE_UNITS[i];
    else
      return '';
  },

  setMultiSize: function(control, values) {
    var $input = control.el.find(this.SELECTORS.textfield);
    var $select = control.el.find(this.SELECTORS.select);

    if (values[0] != undefined) {
      var parts = values[0].split(' ');
      // parse value of the form margin: 2px 10px;
      if (parts.length === 2) {
        values[0] = '';
        values[1] = values[3] = $.trim(parts[0]); // top & bottom
        values[2] = values[4] = $.trim(parts[1]); // left & right
      }
      // parse value of the form margin: 2px 10px 8px 6px;
      else if (parts.length === 4) {
        values[0] = '';
        values[1] = $.trim(parts[0]);
        values[2] = $.trim(parts[1]);
        values[3] = $.trim(parts[2]);
        values[4] = $.trim(parts[3]);
      }
    }

    var len = values.length;
    var unit;

    for (var i = 0; i < len; i++) {
      var value = values[i];
      if (value != undefined) {
        if (unit == undefined) {
          unit = $.trim(this.determineSizeUnit(value));
        }
        $($input.get(i)).attr('value', value.replace(unit, ''));
      }
    }

    if (unit) {
      $select.get(0).selectize.setValue(unit);
    }

    $input.keyup();
  },

  selectButton: function($bt) {
    $bt.addClass(this.CLASS_NAMES.button.selected);
  },

  deselectButton: function($bt) {
    $bt.removeClass(this.CLASS_NAMES.button.selected);
  },

  selectSegmentedButton: function($bt) {
    $bt.addClass(this.CLASS_NAMES.button.selected)
    .next().addClass(this.CLASS_NAMES.button.nextToSelected);
  },

  deselectSegmentedButton: function($bt) {
    $bt.removeClass(this.CLASS_NAMES.button.selected)
    .next().removeClass(this.CLASS_NAMES.button.nextToSelected);
  },

  isButtonSelected: function($bt) {
    return $bt.hasClass(this.CLASS_NAMES.button.selected);
  },

  setButtonAsActive: function($bt) {
    $bt.addClass(this.CLASS_NAMES.button.active);
  },

  setButtonAsInactive: function($bt) {
    $bt.removeClass(this.CLASS_NAMES.button.active);
  }
};
