/**
* stylebot.widget
*
* Stylebot editor UI and event handling
**/

stylebot.widget = {
  cache: {
    box: null,
    header: null,
    headerSelector: null,
    headerSelectIcon: null,
    undo: null,
    dropdown: null
  },

  defaults: {
    width: 320
  },

  isBeingDragged: false,

  //  Initialize widget UI
  create: function() {
    var self = stylebot.widget;

    self.cache.box = $('<div>', {
      id: 'stylebot'
    });

    var boxContainer = $('<div>', {
      id: 'stylebot-container'
    }).appendTo(document.body);

    //  Selection toggle button
    self.cache.headerSelectIcon = $('<div>', {
      id: 'stylebot-select-icon'
    })
    .tipsy({delayIn: 1500, gravity: 'nw'})
    .click(function(e) {
      stylebot.toggleSelection();
    });

    //  Selector
    self.cache.headerSelector = $('<div>', {
      class: 'stylebot-editable-text',
      html: 'custom styles',
      title: 'Click to edit the CSS selector'
    })
    .tipsy({ delayIn: 500, gravity: 'n' });

    //  Selector dropdown
    self.dropDown = $('<div>', {
      id: 'stylebot-dropdown-button',
      class: 'stylebot-header-button',
      title: 'View previously edited CSS selectors'
    })
    .tipsy({ delayIn: 1500, gravity: 'ne' })
    .mouseup(self.showSelectorDropdown);

    var selectorContainer = $('<div>', {
      id: 'stylebot-header-selector'
    })
    .append(self.cache.headerSelector)
    .append(self.dropDown);

    // URL
    var url = $('<div>', {
      html: stylebot.style.cache.url,
      class: 'stylebot-editable-text',
      title: 'Click to edit the URL for the style'
    })
    .tipsy({delayIn: 1500, gravity: 'n', html: true});

    var urlContainer = $('<div>', {
      id: 'stylebot-header-url'
    })
    .append(url);

    //  Container for URL and selector
    var headerTextContainer = $('<div>', {
      id: 'stylebot-header-container'
    })
    .append(selectorContainer)
    .append(urlContainer);

    //  Make selector editable
    Utils.makeEditable(
      self.cache.headerSelector,

      function(value) {
        self.updateHeight();
        self.setSelector(self.cache.headerSelector.html());
        stylebot.select(null, value);
      }, {
      selectText: true,
      editFieldClass: 'stylebot-editing-field'
    });

    //  Make URL editable
    Utils.makeEditable(
      url,
      function(value) {
        self.updateHeight();
        if (value != stylebot.style.cache.url) {
          stylebot.chrome.transfer(stylebot.style.cache.url, value);
          stylebot.style.cache.url = value;
        }
      }, {
      selectText: true,
      editFieldClass: 'stylebot-editing-field'
    });

    //  Close button
    var closeButton = $('<div>', {
      id: 'stylebot-close-button',
      class: 'stylebot-header-button'
    })
    .click(stylebot.close);

    //  Arrow button to toggle stylebot position
    var arrowButton = $('<div>', {
      id: 'stylebot-arrow-button',
      class: 'stylebot-arrow-left stylebot-header-button',
      title: 'Move stylebot to the left'
    })
    .data('position', 'Right')
    .tipsy({ delayIn: 1500, gravity: 'ne' })
    .appendTo(self.cache.box)
    .mouseup(self.togglePosition);

    // Settings button to open options page
    var settingsButton = $('<div>', {
      id: 'stylebot-settings-button',
      class: 'stylebot-header-button',
      title: 'View Options'
    })
    .tipsy({delayIn: 1000, gravity: 'ne'})
    .click(stylebot.chrome.openOptionsPage);

    self.cache.header = $('<div>', {
      id: 'stylebot-header'
    })
    .append(self.cache.headerSelectIcon)
    .append(headerTextContainer)
    .append(closeButton)
    .append(arrowButton)
    .append(settingsButton)
    .appendTo(self.cache.box);

    //  Basic mode
    self.basic.create().appendTo(self.cache.box);

    //  Advanced mode
    self.advanced.create(self.cache.box);

    //  Options (footer)
    var optionsContainer = $('<div>', {
      id: 'stylebot-widget-options'
    });

    // Basic and Advanced mode buttons
    WidgetUI.createOption(WidgetUI.createButtonSet(['Basic', 'Advanced'],
      'stylebot-mode', 0, self.toggleMode))
    .appendTo(optionsContainer);

    var btContainer = $('<div>', {
      id: 'stylebot-main-buttons'
    });

    // Edit CSS button
    WidgetUI.createButton('Edit CSS')
    .attr('title', 'Edit entire page\'s CSS')
    .tipsy({ delayIn: 800, gravity: 'sw', html: true })
    .appendTo(btContainer)
    .click(self.editCSS);

    // Undo button
    self.cache.undo = WidgetUI.createButton('Undo')
    .attr('title', 'Undo your last action')
    .prop('disabled', true)
    .tipsy({ delayIn: 800, gravity: 's', html: true })
    .appendTo(btContainer)
    .click(function(e) { stylebot.style.undo(); });

    // Reset button
    WidgetUI.createButton('Reset')
    .attr('title', 'Reset custom CSS for the selected elements')
    .tipsy({ delayIn: 800, gravity: 's', html: true })
    .appendTo(btContainer)
    .click(self.resetCSS);

    // Reset Page button
    WidgetUI.createButton('Reset Page')
    .attr('title', 'Reset custom CSS for the entire page')
    .tipsy({ delayIn: 500, gravity: 'se', html: true })
    .appendTo(btContainer)
    .click(self.resetAllCSS);

    btContainer.appendTo(optionsContainer);
    optionsContainer.appendTo(self.cache.box);

    self.cache.box.appendTo(boxContainer);
    self.basic.fillCache();

    //  Initialize accordion state
    self.basic.initAccordions();

    //  By default, place the widget on the right of the screen
    self.setPosition('Right');
  },

  //  Attach listeners for TAB keypresses and window resize
  attachListeners: function() {
    var lastBt = $('#stylebot-main-buttons').find('button').last();

    // Shift + TAB on first accordion sets focus to last button
    $(this.basic.cache.accordionHeaders[0]).bind('keydown',
      { lastBt: lastBt }, function(e) {
      if (e.keyCode == 9 && e.shiftKey) {
        e.stopImmediatePropagation();
        e.preventDefault();
        e.data.lastBt.focus();
      }
    });

    // TAB on last button sets focus to first accordion header
    lastBt.keydown(function(e) {
      if (e.keyCode == 9 && !e.shiftKey) {
        e.stopImmediatePropagation();
        e.preventDefault();
        stylebot.widget.basic.cache.accordionHeaders[0].focus();
      }
    });

    // listen to window resize event to update position/dimension of widget
    $(window).bind('resize', this.onWindowResize);
  },

  //  Get rid of the window resize listener
  detachListeners: function() {
    $(window).unbind('resize', this.onWindowResize);
  },

  //  Called on when the window is resized. Updates height of widget and selection UI
  //  @param e Event  Event object for when the window is resized
  onWindowResize: function(e) {
    stylebot.widget.setPosition(stylebot.options.position);
    stylebot.widget.updateHeight();

    if (stylebot.selectionBox)
      stylebot.selectionBox.highlight(stylebot.selectedElement);
  },

  //  Open the stylebot widget
  open: function() {
    if (!this.cache.box) {
      this.create();
    }

    this.attachListeners();
    this.setPosition(stylebot.options.position);

    if (stylebot.style.cache.selector) {
      this.enable();
    } else {
      this.disable();
    }

    // TODO: Get rid of all this setTimeout mess.
    setTimeout($.proxy(function() {
      this.setMode();
      this.cache.box.show();

      if (stylebot.options.mode === 'Edit CSS') {
        this.editCSS();
        this.updateHeight();
      }

      setTimeout($.proxy(function() {
        this.updateHeight();
      }, this), 0);
    }, this), 0);
  },

  //  Close stylebot widget
  close: function() {
    this.detachListeners();
    this.cache.box.hide();
  },

  //  Enable UI of widget
  enable: function() {
    this.setSelector(stylebot.style.cache.selector);
    this.basic.enable();
    this.advanced.enable();
  },

  //  Disable UI of widget
  disable: function() {
    this.setSelector('Select an element');
    this.basic.disable();
    this.advanced.disable();
  },

  //  Update widget position
  setPosition: function(where) {
    var left;
    if (where === 'Left')
      left = 0;
    else if (where === 'Right')
      left = $(window).width() - this.defaults.width - 2; // some padding

    this.cache.box.css('left', left);
    stylebot.options.position = where;
  },

  //  Refresh height of widget
  updateHeight: function() {
    var self = stylebot.widget;
    var windowHeight = $(window).height();
    self.cache.box.css('height', windowHeight);
    var headerHeight = self.cache.header.height();
    if (headerHeight != 0)
      headerHeight -= 42;

    var optionsHeight = $('#stylebot-widget-options').height();
    var newHeight = windowHeight - (optionsHeight + headerHeight);

    if (stylebot.options.mode === 'Advanced')
      self.advanced.resize(newHeight);
    else
      self.basic.resize(newHeight);
  },

  //  Refresh widget UI based on the current mode of stylebot
  setMode: function() {
    var ui = WidgetUI;
    ui.deselectButton($('.stylebot-mode'));

    if (stylebot.options.mode === 'Advanced') {
      ui.selectButton($('.stylebot-mode:contains(Advanced)'));
      stylebot.widget.basic.hide();
      stylebot.widget.advanced.show();
    } else {
      ui.selectButton($('.stylebot-mode:contains(Basic)'));
      stylebot.widget.advanced.hide();
      stylebot.widget.basic.show();
    }
  },

  //  Save styles
  save: function(e) {
    stylebot.style.save();
  },

  //  Reset the UI of the widget
  reset: function() {
    if (stylebot.options.mode === 'Advanced')
      stylebot.widget.advanced.reset();
    else
      stylebot.widget.basic.reset();
  },

  //  Display the page's CSS in a popup for editing
  editCSS: function(e) {
    CSSUtils.crunchFormattedCSS(stylebot.style.rules, false, false, function(css) {
      stylebot.page.show(css, e ? e.target : null);
    });
  },

  //  Reset CSS for current selector
  resetCSS: function() {
    stylebot.widget.reset();
    stylebot.style.remove();
  },

  //  Reset the entire CSS for the page
  resetAllCSS: function() {
    stylebot.widget.reset();
    stylebot.style.removeAll();
  },

  //  Toggle stylebot position between left / right
  //  @param Event e The event object for when the left/right arrow button is clicked
  togglePosition: function(e) {
    var $el = $('#stylebot-arrow-button');
    var pos;
    if (e)
      pos = $el.data('position');
    else
      pos = stylebot.options.position;

    if (pos === 'Left') {
      pos = 'Right';
      $el.removeClass('stylebot-arrow-right')
      .addClass('stylebot-arrow-left')
      .attr('title', 'Move stylebot to the left');
    }
    else {
      pos = 'Left';
      $el.removeClass('stylebot-arrow-left')
      .addClass('stylebot-arrow-right')
      .attr('title', 'Move stylebot to the right');
    }

    $el.data('position', pos);
    stylebot.widget.setPosition(pos);
  },

  //  Toggle between Basic / Advanced modes
  //  @param e Event Event object for when the Basic/Advanced mode buttons are clicked. Optional
  toggleMode: function(e) {
    if (e)
      stylebot.options.mode = $(e.target).html();
    else if (stylebot.options.mode === 'Advanced')
      stylebot.options.mode = 'Basic';
    else
      stylebot.options.mode = 'Advanced';

    stylebot.widget.updateHeight();
    stylebot.widget.setMode();
  },

  //  Initialize and toggle the visibility of the selectors dropdown
  showSelectorDropdown: function() {
    var dropdown = $('#stylebot-dropdown');
    if (dropdown.length != 0) {
      dropdown.remove();
      return true;
    }

    var parent = stylebot.widget.cache.headerSelector.parent();
    var parentHeight = parent.height() + 10;
    var height = $(window).height() - 50 - parentHeight;

    dropdown = $('<div>', {
      id: 'stylebot-dropdown'
    })

    .css({
      top: parentHeight,
      'max-height': height
    });

    var onClickElsewhere = function(e) {
      var $target = $(e.target);
      var id = 'stylebot-dropdown';
      if ((e.target.id.indexOf(id) === -1 &&
      $target.parent().attr('id') != id &&
      e.type === 'mousedown') ||
      e.keyCode == 27) {
        $('#stylebot-dropdown').remove();
        stylebot.unhighlight();
        stylebot.select(null, stylebot.style.cache.selector);
        $(document).unbind('mousedown keydown', onClickElsewhere);
        return true;
      }
      return true;
    };

    var any = false;
    for (var selector in stylebot.style.rules) {
      if (stylebot.style.rules[selector]['comment'])
        continue;
      if (stylebot.style.rules[selector]['__isAnimation'])
        continue;

      any = true;

      var li = $('<li>', {
        class: 'stylebot-dropdown-li',
        tabIndex: 0,
        html: selector
      })

      .hover(function(e) {
        if (stylebot.selectionStatus)
          return true;
        stylebot.highlight($(e.target.innerText)[0]);
        $(e.target).addClass('stylebot-dropdown-li-selected');
        return true;
      })

      .mouseout(function(e) {
        $(e.target).removeClass('stylebot-dropdown-li-selected');
      })

      .bind('click keydown', function(e) {
        if (e.type === 'keydown' && e.keyCode != 13)
        return true;
        var value = e.target.innerHTML;
        stylebot.widget.setSelector(value);
        stylebot.widget.updateHeight();
        stylebot.select(null, Utils.HTMLDecode(value));
        $(document).unbind('mousedown keydown', onClickElsewhere);
        $('#stylebot-dropdown').remove();
      })
      .appendTo(dropdown);
    }

    if (!any)
      $('<li>', { html: 'No CSS selectors edited' }).appendTo(dropdown);

    dropdown.appendTo(parent);
    $(document).bind('mousedown keydown', onClickElsewhere);
  },

  //  Select the next selector in the selectors dropdown list. Called when down arrow key is pressed
  selectNextDropdownOption: function() {
    var $li = $('.stylebot-dropdown-li');

    if ($li.length === 0)
      return;

    var $current = $('.stylebot-dropdown-li-selected');
    if ($current.length === 0) {
      $li = $($li.get(0));
      stylebot.highlight($($li.text()).get(0));
      $li.addClass('stylebot-dropdown-li-selected').focus();
      return;
    }
    else {
      $current = $($current.get(0));
      $current.removeClass('stylebot-dropdown-li-selected');
      var $next = $($current.next().get(0));
      if ($next.length != 0) {
        stylebot.highlight($($next.text()).get(0));
        $next.addClass('stylebot-dropdown-li-selected').focus();
      }
      else {
        $li = $($li.get(0));
        stylebot.highlight($($li.text()).get(0));
        $li.addClass('stylebot-dropdown-li-selected').focus();
      }
      return;
    }
  },

  //  Select the previous selector in the selectors dropdown list. Called when up arrow key is pressed
  selectPreviousDropdownOption: function() {
    var $li = $('.stylebot-dropdown-li');
    if ($li.length === 0)
    return;

    var $current = $('.stylebot-dropdown-li-selected');

    if ($current.length === 0) {
      $li = $($li[$li.length - 1]);
      stylebot.highlight($($li.text()).get(0));
      $li.addClass('stylebot-dropdown-li-selected').focus();
      return;
    }

    else {
      $current = $($current.get(0));
      $current.removeClass('stylebot-dropdown-li-selected');
      var $prev = $($current.prev().get(0));

      if ($prev.length != 0) {
        stylebot.highlight($($prev.text()).get(0));
        $prev.addClass('stylebot-dropdown-li-selected').focus();
      }
      else {
        $li = $($li[$li.length - 1]);
        stylebot.highlight($($li.text()).get(0));
        $li.addClass('stylebot-dropdown-li-selected').focus();
      }
      return;
    }
  },

  setSelector: function(value) {
    this.cache.headerSelector.html(value);
    if (value === 'Select an element')
      value = 'Click to edit the CSS Selector';
    this.cache.headerSelector.attr('title', value);
  },

  enableUndoButton: function() {
    this.cache.undo.prop('disabled', false);
  },

  disableUndoButton: function() {
    this.cache.undo.prop('disabled', true);
  }
};
