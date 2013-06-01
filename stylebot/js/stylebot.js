/**
* stylebot
* Source: http://github.com/ankit/stylebot
*
* Copyright (c) 2011 Ankit Ahuja
* Dual licensed under GPL and MIT licenses
**/

var stylebot = {
  status: false,
  selectedElement: null,
  hoveredElement: null,
  selectionStatus: false,
  selectionBox: null,
  selectorGenerator: null,

  options: {
    useShortcutKey: true,
    shortcutKey: 77, // 77 is keycode for 'm'
    shortcutMetaKey: 'alt',
    mode: 'Basic',
    position: 'Right',
    sync: false,
    livePreviewColorPicker: false
  },

  /**
    * Initialize stylebot
    * @param {object} options Options to initialize stylebot with
    */
  initialize: function(options) {
    this.style.initialize();
    this.setOptions(options);
    this.contextmenu.initialize();
    this.selectorGenerator = new SelectorGenerator();
  },

  /**
    * Apply stylebot options
    * @param {object} options Options to apply
    */
  setOptions: function(options) {
    for (option in options)
      this.options[option] = options[option];
  },

  /**
    * Open / close editor
    */
  toggle: function() {
    if (this.status === true)
      this.close();
    else
      this.open();
  },

  /**
    * Open stylebot editor
    */
  open: function() {
    this.attachListeners();
    this.style.enable();
    this.widget.open();
    this.status = true;
    this.chrome.setPageAction(true);
    this.enableSelection();
    attachKeyboardShortcuts();
  },

  /**
    * Close stylebot editor
    */
  close: function() {
    stylebot.widget.close();
    stylebot.status = false;
    stylebot.chrome.setPageAction(false);
    stylebot.style.reset();
    stylebot.disableSelection();
    stylebot.detachClickListener();
    stylebot.unhighlight();
    stylebot.selectedElement = null;
    stylebot.destroyHighlighter();
    detachKeyboardShortcuts();
  },

  /**
    * Highlight specified element
    * @param {element} el Element to highlight
    */
  highlight: function(el) {
    if (!stylebot.selectionBox)
      stylebot.createHighlighter();

    stylebot.hoveredElement = el;
    stylebot.selectionBox.highlight(el);
  },

  /**
    * Remove highlight from previously selected element
    */
  unhighlight: function() {
    stylebot.hoveredElement = null;
    if (stylebot.selectionBox)
      stylebot.selectionBox.hide();
  },

  /**
    * Select element(s)
    * @param {element} el Element to select
    * @param {string} selector CSS selector for elements to select
    */
  select: function(el, selector) {
    stylebot.disableSelection();
    stylebot.style.fillCache(null);
    stylebot.widget.reset();

    // if element is specified, it is selected
    if (el) {
      stylebot.selectedElement = el;
      selector = stylebot.selectorGenerator.generate(el);
      stylebot.highlight(el);
    }
    // else select all elements that match the specified CSS selector
    else if (selector) {
      try {
        el = $(selector).get(0);
        stylebot.selectedElement = el;
        stylebot.highlight(el);
      }
      catch (e) {
        stylebot.selectedElement = null;
      }
    }
    else {
      stylebot.selectedElement = stylebot.hoveredElement;
      selector = stylebot.selectorGenerator.generate(stylebot.selectedElement);
    }

    stylebot.style.fillCache(selector);
    stylebot.widget.open();
    setTimeout(function() {
      stylebot.style.removeFromStyleElement();
    }, 100);
  },

  /**
    * Enable / disable selection of elements
    */
  toggleSelection: function() {
    if (stylebot.selectionStatus) {
      stylebot.select(null, stylebot.style.cache.selector);
      stylebot.disableSelection();
    }
    else {
      stylebot.widget.disable();
      stylebot.unhighlight();
      stylebot.enableSelection();
    }
  },

  /**
    * Enable selection of elements
    */
  enableSelection: function() {
    stylebot.attachListeners();
    stylebot.selectionStatus = true;
    stylebot.widget.cache.headerSelectIcon
    .addClass('stylebot-select-icon-active')
    .attr('title', 'Click to disable selection of element');
  },

  /**
    * Disable selection of elements
    */
  disableSelection: function() {
    stylebot.detachListeners();
    stylebot.selectionStatus = false;
    stylebot.widget.cache.headerSelectIcon
    .removeClass('stylebot-select-icon-active')
    .attr('title', 'Click to enable selection of element');
  },

  /**
    * Create the highlighter
    */
  createHighlighter: function() {
    stylebot.selectionBox = new SelectionBox(null, null, $('#stylebot-container').get(0));
  },

  /**
    * Remove the highlighter
    */
  destroyHighlighter: function() {
    if (stylebot.selectionBox) {
      stylebot.selectionBox.destroy();
      delete stylebot.selectionBox;
    }
  },

  /**
    * Add event listeners for mouse activity
    */
  attachListeners: function() {
    document.addEventListener('mousemove', this.onMouseMove, true);
    document.addEventListener('mousedown', this.onMouseDown, true);
    document.addEventListener('click', this.onMouseClick, true);
  },

  /**
    * Remove event listeners for mouse activity
    */
  detachListeners: function() {
    document.removeEventListener('mousemove', this.onMouseMove, true);
    document.removeEventListener('mousedown', this.onMouseDown, true);
  },

  /**
    * Remove event listener for mouse click
    */
  detachClickListener: function() {
    // We have to remove the click listener in a second phase because if we remove it
    // after the mousedown, we won't be able to cancel clicked links
    // thanks to firebug
    document.removeEventListener('click', this.onMouseClick, true);
  },

  /**
    * When the user moves the mouse
    */
  onMouseMove: function(e) {
    // for dropdown
    if (e.target.className == 'stylebot-dropdown-li') {
      var $el = $(e.target.innerText).get(0);
      if ($el != stylebot.hoveredElement) {
        stylebot.highlight($el);
      }
      return true;
    }

    if (!stylebot.shouldSelect(e.target))
      return true;

    if (stylebot.belongsToStylebot(e.target)) {
      stylebot.unhighlight();
      return true;
    }

    e.preventDefault();
    e.stopPropagation();
    stylebot.highlight(e.target);
  },

  /**
    * When the user has pressed the mouse button down
    */
  onMouseDown: function(e) {
    if (!stylebot.belongsToStylebot(e.target)) {
      e.preventDefault();
      e.stopPropagation();
      stylebot.select();
      return false;
    }
  },

  /**
    * When the user clicks the mouse
    */
  onMouseClick: function(e) {
    if (!stylebot.belongsToStylebot(e.target)) {
      e.preventDefault();
      e.stopPropagation();
      stylebot.detachClickListener();
      return false;
    }
  },

  /**
    * Checks if the specified element belongs to the stylebot editor
    * @param {element} el Element to check
    * @return {boolean} True if element belongs to stylebot
    */
  belongsToStylebot: function(el) {
    var $el = $(el);
    var parent = $el.closest('#stylebot-container');
    var id = $el.attr('id');
    if (parent.length != 0 || (id && id.indexOf('stylebot') != -1))
      return true;
    return false;
  },

  /**
    * Checks if the stylebot editor should close
    * @param {element} el Currently selected element
    * @return {boolean} Returns true if stylebot editor can close
    */
  shouldClose: function(el) {
    if (!stylebot.status ||
      stylebot.widget.basic.isColorPickerVisible ||
      stylebot.isKeyboardHelpVisible ||
      stylebot.page.isVisible ||
      $('#stylebot-dropdown').length != 0 ||
      el.tagName === 'SELECT')
        return false;
    return true;
  },

  /**
    * Checks if the specified element can be selected
    * @param {element} el The element to select
    * @return {boolean} Returns true if element should be selected
    */
  shouldSelect: function(el) {
    if (stylebot.widget.isBeingDragged
      || stylebot.page.isVisible
      || stylebot.isKeyboardHelpVisible
      || stylebot.hoveredElement === el
    )
      return false;
    return true;
  }
};
