/**
  * Events
  *
  * Event handlers for Stylebot editor Basic mode controls
  *
  * todo: Move this under stylebot.widget.basic or
  *   atleast a more descriptive name
  **/
Events = {
  ACCORDION_SAVE_TIMEOUT: 500,
  GOOGLE_FONT_API: "http://fonts.googleapis.com/css?family=",

  accordionTimer: null,

  onToggle: function(e) {
    var $bt = $(this);
    var ui = WidgetUI;

    var value = '';
    var property = $bt.data('property');

    if (ui.isButtonSelected($bt))
      ui.deselectButton($bt);
    else {
      ui.selectButton($bt);
      value = $bt.data('value');
    }

    Events.saveProperty(property, value);
  },

  onRadioClick: function(e) {
    var value;

    if (e.target.checked == true)
      value = e.target.value;
    else
      value = '';
    value = value.split(',');

    var property = $(e.target).data('property');
    if (typeof property === 'object') {
      var len = property.length;
      for (var i = 0; i < len; i++) {
        Events.saveProperty(property[i], value[i]);
      }
    }
    else
      Events.saveProperty(property, value);
  },

  onTextFieldKeyUp: function(e) {
    if (e.keyCode == 27) { // esc
      e.target.blur();
      return;
    }

    var value = e.target.value;
    var property = $(e.target).data('property');
    stylebot.style.apply(property, value);
  },

  onTextFieldFocus: function(e) {
    stylebot.undo.push(Utils.cloneObject(stylebot.style.rules));
    $(e.target).data('lastState', e.target.value);
  },

  onTextFieldBlur: function(e) {
    if ($(e.target).data('lastState') == e.target.value)
      stylebot.undo.pop();
    $(e.target).data('lastState', null);
    stylebot.undo.refresh();
  },

  onSizeFieldKeyDown: function(e) {
    // increment / decrement value by 1 with arrow keys
    // up / down arrow
    if (e.keyCode === 38 || e.keyCode === 40) {
      e.preventDefault();

      var value = e.target.value;
      var property = $(e.target).data('property');
      var unit = $(e.target).nextAll('select').attr('value');

      value = parseInt(value);

      if (isNaN(value))
        value = 0;
      else {
        if (e.keyCode === 38) // up
          value += 1;
        else
          value -= 1;
      }

      e.target.value = value;
      if (parseFloat(value)) {
        value += unit;
      }

      stylebot.style.apply(property, value);
    }
  },

  onSizeFieldKeyUp: function(e) {
    // esc
    if (e.keyCode === 27) {
      e.target.blur();
      return;
    }

    if (e.keyCode === 38 || e.keyCode === 40) {
      // we're already handling this case in onSizeFieldKeyDown
      return;
    }

    var value = e.target.value;
    var property = $(e.target).data('property');
    var unit = $(e.target).nextAll('select').attr('value');

    if (parseFloat(value)) {
      value += unit;
    }

    stylebot.style.apply(property, value);
  },

  onSelectChange: function(property, value) {
    if (typeof property === 'object') {
      var len = property.length;
      for (var i = 0; i < len; i++) {
        Events.saveProperty(property[i], value[i]);
      }
    } else {
      if (property === 'font-family') {
        var valueForURL = value.replace(" ", "+");
        var fontURL = Events.GOOGLE_FONT_API + valueForURL;

        chrome.extension.sendRequest({name: "expandImportRule", url: fontURL},
          function(response) {
            // Hacky check to see if Google Web Font exists
            // todo: Use Google Font API instead
            if (response.text.indexOf("@font-face") == 0) {
              // prepend @import
              stylebot.style.prependWebFont(fontURL);
            }

            Events.saveProperty(property, value);
        });
      } else {
        Events.saveProperty(property, value);
      }
    }
  },

  onSegmentedControlMouseDown: function(e) {
    if (e.type === 'keydown' && e.keyCode != 13 && e.keyCode != 32)
      return true;
    var $button = $(e.target);

    // if the user clicked the SPAN enclosed inside BUTTON, get to the button
    if (e.target.tagName != 'BUTTON')
      $button = $button.parent();

    WidgetUI.setButtonAsActive($button);

    // Bind the mouseup handler which will handle saving the new property value and CSS classes
    $(document).bind('mouseup keyup', Events.onSegmentedControlMouseUp);
  },

  onSegmentedControlMouseUp: function(e) {
    var ui = WidgetUI;

    var $button = $('.' + ui.CLASS_NAMES.button.active);
    ui.setButtonAsInactive($button);

    var status = ui.isButtonSelected($button);
    var control = $button.parent();

    ui.deselectSegmentedButton(control.find('.' + ui.CLASS_NAMES.button.selected));

    // Button is currently selected. Deselect it
    if (status)
      Events.saveProperty($button.data('property'), '');
    // Select button
    else {
      Events.saveProperty($button.data('property'), $button.data('value'));
      ui.selectSegmentedButton($button);
    }

    $(document).unbind('mouseup keyup', Events.onSegmentedControlMouseUp);
  },

  toggleAccordion: function(h) {
    var self = Events;
    var ui = WidgetUI;

    if (h.hasClass(ui.CLASS_NAMES.accordion.active)) {
      h.removeClass(ui.CLASS_NAMES.accordion.active).focus().next().hide();
    } else {
      h.addClass(ui.CLASS_NAMES.accordion.active).focus().next().show();
    }

    // determine which accordions are open and
    // send request to save the new state to background.html cache
    if (self.accordionTimer) {
      clearTimeout(self.accordionTimer);
      self.accordionTimer = null;
    }

    self.accordionTimer = setTimeout(function() {
      var $accordions = $(ui.SELECTORS.accordion);
      var len = $accordions.length;
      var accordion_states = [];

      for (var i = 0; i < len; i++) {
        var $accordion = $($accordions.get(i));
        if ($accordion.hasClass(ui.CLASS_NAMES.accordion.active)) {
          accordion_states[accordion_states.length] = i;
        }
      }

      stylebot.chrome.saveAccordionState(accordion_states);
    }, self.ACCORDION_SAVE_TIMEOUT);
  },

  saveProperty: function(property, value) {
    stylebot.undo.push(Utils.cloneObject(stylebot.style.rules));
    stylebot.style.apply(property, value);
    stylebot.undo.refresh();
  }
};
