/**
* stylebot.widget.basic
*
* Manages the UI for the Basic mode in Stylebot editor
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
    controls: [{
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
      controls: [{
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
      controls: [{
        name: 'Border Style',
        id: 'border-style',
        type: 'select',
        options: ['none', 'solid', 'dotted', 'dashed', 'double', 'groove', 'ridge', 'inset', 'outset'],
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
      controls: [{
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
    }],
  // Create the UI for Basic Mode
  createUI: function() {
    this.cache.container = $('<div>', {
      id: 'stylebot-controls'
    });

    // creating controls for different CSS properties
    var len = this.groups.length;
    for (var i = 0; i < len; i++) {

      WidgetUI.createAccordionHeader(this.groups[i].name)
      .appendTo(this.cache.container);

      var group = $('<div>', {
        class: 'stylebot-accordion'
      })
      .appendTo(this.cache.container);

      var len2 = this.groups[i].controls.length;
      for (var j = 0; j < len2; j++) {
        this.createUIForControl(this.groups[i].controls[j])
        .appendTo(group);
      }
    }
    return this.cache.container;
  },

  // initialize cache for UI controls. This is called when UI is first created
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

  // Create the UI for a control
  createUIForControl: function(control) {
    var ui = WidgetUI;

    var $controlSet = $('<div>', {
      class: 'stylebot-control-set'
    });
    ui.createLabel(control.name)
    .appendTo($controlSet);

    var control_el; // this will contain the control element

    // Add controls of different types
    switch (control.type) {
      case 'size' :
        control_el = ui.createSizeControl(control.id)
        .appendTo($controlSet);
        break;

      case 'multi-size' :
        control_el = ui.createMultiSizeControl(control)
        .appendTo($controlSet);
        break;

      case 'color' :
        control_el = ui.createTextField(control.id, 10, null, Events.onTextFieldKeyUp);

        ui.createColorPicker(control_el, $('#stylebot-container'))
        .appendTo($controlSet);

        control_el
        .keyup(function(e) {
          ui.setColorSelectorColor($(this));
        })
        .appendTo($controlSet);
        break;

      case 'toggle' :
        control_el = ui.createToggleButton('Hide', control.id, control.value)
        .appendTo($controlSet);
        break;

      case 'select' :
        control_el = ui.createSelect(control.id);

        ui.createSelectOption('Default', control.id, '')
        .appendTo(control_el);

        var len = control.options.length;
        for (var i = 0; i < len; i++) {
          var option = control.options[i];
          ui.createSelectOption(Utils.capitalize(option), control.id, option).appendTo(control_el);
        }

        control_el.appendTo($controlSet);
        break;

      case 'segmented' :
        control_el = ui.createSegmentedControl(control)
        .appendTo($controlSet);
        break;

      case 'font-family' :
        control_el = ui.createFontFamilyControl(control)
        .appendTo($controlSet);
        break;
    }

    // objects (except primitive type) are passed by reference in JS
    control.el = control_el;
    return $controlSet;
  },

  // Fill controls with all rules for current selector in cache
  fill: function() {
    var rule = stylebot.style.getRule(stylebot.style.cache.selector);
    if (rule) {
      var len = this.groups.length;
      for (var i = 0; i < len; i++) {
        var len2 = this.groups[i].controls.length;
        for (var j = 0; j < len2; j++) {
          this.fillControl(this.groups[i].controls[j], rule);
        }
      }
    }
  },

  // Fill a control with a style rule
  fillControl: function(control, rule) {
    var ui = WidgetUI;
    var value = rule[control.id];
    switch (control.type) {
      case 'size' :
        ui.setSize(control, value);
        break;

      case 'multi-size' :
        var values = [];
        var len = control.id.length;
        for (var i = 0; i < len; i++) {
          values[i] = rule[control.id[i]];
        }
        ui.setMultiSize(control, values);
        break;

      case 'font-family' :
        ui.setFontFamily(control, value);
        break;

      case 'color' :
        ui.setColor(control, value);
        break;

      case 'toggle' :
        ui.setToggleButton(control, value);
        break;

      case 'select' :
        ui.setSelectOption(control, value);
        break;

      case 'segmented' :
        ui.setSegmentedControl(control, value);
        break;
    }
  },

  // Reset all controls to default values
  reset: function() {
    var ui = WidgetUI;

    this.cache.textfields.attr('value' , '');
    this.cache.selectboxes.prop('selectedIndex', 0);
    this.cache.colorSelectorColor.css('backgroundColor', '#fff');
    this.cache.fontFamilyInput.hide();

    ui.deselectButton(this.cache.toggleButtons);
    ui.deselectSegmentedButton(this.cache.segmentedControls.find('button'));
  },

  // Initialize and present the Basic Mode UI to user
  show: function() {
    var self = stylebot.widget.basic;
    self.reset();
    self.fill();

    // set focus to first visible accordion header
    var controlContainerOffset = self.cache.container.offset().top;
    var len = self.cache.accordionHeaders.length;
    for (var i = 0; i < len; i++) {
      if ($(self.cache.accordionHeaders[i]).offset().top >=
      controlContainerOffset) {
        setTimeout(function() {
          self.cache.accordionHeaders[i].focus();
        }, 0);
        break;
      }
    }
    self.cache.container.show();
  },

  // Hide the Basic Mode UI
  hide: function() {
    stylebot.widget.basic.cache.container.hide();
  },

  // Open enabled accordions
  initAccordions: function() {
    // todo: the toggleAccordion method should be in WidgetUI
    var len = this.enabledAccordions.length;
    for (var i = 0; i < len; i++) {
      Events.toggleAccordion(
        $(this.cache.accordionHeaders[this.enabledAccordions[i]]));
    }
  },

  // Resize the height of the container
  resize: function(height) {
    this.cache.container.css('height', height);
  },

  // Enable all UI Controls
  enable: function() {
    this.cache.textfields.prop('disabled', false);
    this.cache.buttons.prop('disabled', false);
    this.cache.selectboxes.prop('disabled', false);
    this.cache.colorSelectors.removeClass('disabled');
  },

  // Disable all UI Controls
  disable: function() {
    this.cache.textfields.prop('disabled', true);
    this.cache.buttons.prop('disabled', true);
    this.cache.selectboxes.prop('disabled', true);
    this.cache.colorSelectors.addClass('disabled');
  }
};