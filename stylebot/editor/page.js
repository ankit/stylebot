/**
 * stylebot.page
 *
 * Manages the UI for the Page mode (Edit CSS) in Stylebot editor
 */
stylebot.page = {
  RIGHT_PADDING: 15,
  BOTTOM_EDITOR_PADDING: 102,

  isVisible: false,
  modal: null,
  timer: null,

  cache: {
    livePreview: false,
    originalCSS: null,
    editor: null,
    marker: null,
    css: null
  },

  create: function(options) {
    var html = Handlebars.templates['page']({
      url: stylebot.style.cache.url
    });

    this.modal = new ModalBox(html, options, function() {});
    this.initializeEditor();

    var buttons = stylebot.page.modal.box.find('.stylebot-button');

    var $livePreviewCheckbox = $(buttons.get(0));
    $livePreviewCheckbox.click(this.toggleLivePreview)
      .tipsy({delayIn: 100, gravity: 'sw'});

    stylebot.chrome.getOption('livePreviewPage', function(value) {
      $livePreviewCheckbox.prop('checked', value);
      stylebot.page.cache.livePreview = value;
    });

    $(buttons.get(1)).click(this.copyToClipboard)
      .tipsy({delayIn: 100, gravity: 'sw'});

    // Icebird begin    
    $(buttons.get(2)).click(this.saveClose);
    $(buttons.get(3)).click(this.save);
    $(buttons.get(4)).click(this.cancel);
    // Icebird end
    
  },

  initializeEditor: function() {
    var self = this,
        editor,
        session,
        CssMode;

    // ace monkey-patch to allow automatic resizing based on scrollbars
    self.cache.editor = Utils.ace.monkeyPatch(ace.edit('stylebot-page-editor'));

    editor = self.cache.editor;
    session = editor.getSession();
    CssMode = new require('ace/mode/css').Mode;

    session.setMode(new CssMode());
    session.setUseWrapMode(true);
    session.on('change', self.contentChanged);

    editor.setTheme('ace/theme/dawn');
    editor.renderer.setShowGutter(false);

    setTimeout(function() {
      editor.resize();
    }, 0);
  },

  show: function(content, prevTarget) {
    var self = this;
    if (self.isVisible) {
      return;
    }

    self.create({
      closeOnEsc: false,
      closeOnBgClick: false,
      bgFadeSpeed: 0,
      width: $(WidgetUI.SELECTORS.stylebot).width() - self.RIGHT_PADDING + 'px',
      top: '0%',
      left: '0',
      height: $(WidgetUI.SELECTORS.stylebot).height() + 'px',
      bgOpacity: 0,
      parent: $(WidgetUI.SELECTORS.stylebot),

      onOpen: function() {
        stylebot.page.resize();
        var editor = self.cache.editor;
        var session = editor.getSession();

        session.setValue(self.cache.originalCSS);

        editor.focus();
        editor.gotoLine(session.getLength(), 0);

        if (!prevTarget) {
          setTimeout(function() {
            self.onWindowResize();
          }, 0);
        }

        self.clearSyntaxError();
        stylebot.undo.push(Utils.cloneObject(stylebot.style.rules));
        self.cache.css = session.getValue();
      },

      onClose: function() {
        self.isVisible = false;
        if (prevTarget) {
          prevTarget.focus();
        }

        $(window).unbind('resize', self.onWindowResize);
      }
    });

    self.cache.originalCSS = content;

    self.modal.show();
    self.isVisible = true;

    $(window).bind('resize', self.onWindowResize);
  },

  copyToClipboard: function() {
    var text = stylebot.page.cache.editor.getValue();
    if (text !== undefined) {
      stylebot.chrome.copyToClipboard(text);
    }
  },

  toggleLivePreview: function() {
    stylebot.page.cache.livePreview = !stylebot.page.cache.livePreview;
    if (stylebot.page.cache.livePreview) {
      stylebot.page.contentChanged();
    }
    stylebot.chrome.saveOption('livePreviewPage', stylebot.page.cache.livePreview);
  },

  contentChanged: function() {
    var self = stylebot.page;
    if (!self.cache.livePreview) {
      return;
    }

    if (self.timer) {
      clearTimeout(self.timer);
      self.timer = null;
    }

    self.timer = setTimeout(function() {
      try {
        self.saveCSS(self.cache.editor.getSession().getValue(), false);
      }
      catch (e) {}
    }, 100);
  },

  cancel: function(e) {
    stylebot.page.saveCSS(stylebot.page.cache.originalCSS, true);
    stylebot.page.modal.hide();

    // Icebird begin
    if (stylebot.options.mode === 'Edit CSS')
      stylebot.close();  
    // Icebird end

  },

  save: function(e) {
    var self = stylebot.page;
    if (self.saveCSS(self.cache.editor.getSession().getValue(), true)) {
      self.modal.hide();
      stylebot.widget.open();
    }
  },

// Icebird begin
  saveClose: function(e) {
    var self = stylebot.page;
    if (self.saveCSS(self.cache.editor.getSession().getValue(), true)) {
      self.modal.hide();
      stylebot.close();
    }
  },
// Icebird end
  
  saveCSS: function(css, save) {
    if (css === undefined) {
      return true;
    }

    if (stylebot.page.cache.css !== css) {
      stylebot.page.cache.css = null;
      var response = stylebot.style.applyPageCSS(css, save);

      if (response !== true) {
        stylebot.page.displaySyntaxError(response, save);
        return false;
      }

      stylebot.page.clearSyntaxError();
      stylebot.undo.refresh();
    } else {
      stylebot.undo.pop();
    }

    return true;
  },

  onWindowResize: function() {
    var self = stylebot.page;
    self.modal.reset({
      width: $(WidgetUI.SELECTORS.stylebot).width() - self.RIGHT_PADDING + 'px',
      top: '0%',
      left: '0',
      height: $(WidgetUI.SELECTORS.stylebot).height() + 'px'
    });
    self.resize();
  },

  displaySyntaxError: function(error, setCursor) {
    if (!this.cache.marker) {
      var Range = require('ace/range').Range;
      var range = new Range(error.currentLine - 1, 0, error.currentLine, 0);
      this.cache.marker = this.cache.editor.getSession().addMarker(range,
        'stylebot_warning',
        'line');
    }

    if (setCursor) {
      this.cache.editor.focus();
      this.cache.editor.gotoLine(error.currentLine, 0);
    }
  },

  clearSyntaxError: function() {
    if (!this.cache.marker) {
      return;
    }
    this.cache.editor.getSession().removeMarker(this.cache.marker);
    this.cache.marker = null;
  },

  resize: function() {
    $('#stylebot-page-editor').css('height',
      $(WidgetUI.SELECTORS.stylebot).height() - this.BOTTOM_EDITOR_PADDING + 'px');
    this.cache.editor.resize();
  }
};
