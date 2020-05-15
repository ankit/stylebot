Options.modal = {
  cached: null,
  errorMarker: null,

  init: function (options) {
    var html = Handlebars.templates['style-modal'](options);

    var modal = new ModalBox(html, {
      bgFadeSpeed: 0,
      closeOnBgClick: false,
      closeOnEsc: false,
    });

    if (options.editor) {
      modal.editor = this.editor(options.code);
      modal.options.onOpen = $.proxy(function () {
        this.resize();
        setTimeout(function () {
          var $input = modal.box.find('input');
          if ($input.length > 0) {
            $input.focus();
          } else {
            modal.editor.focus();
          }
          modal.editor.gotoLine(modal.editor.getSession().getLength(), 0);
        }, 0);
      }, this);
    } else {
      modal.options.onOpen = $.proxy(function () {
        var $textarea = modal.box.find('textarea');
        $textarea.focus();
        Utils.selectAllText($textarea.get(0));
        this.resize();
      }, this);
    }

    setTimeout(function () {
      modal.show();
    }, 0);

    this.cached = modal;
    return this.cached;
  },

  close: function () {
    this.cached.hide();
  },

  resize: function () {
    if (!this.cached) return;

    var $modal = this.cached.box;
    var modalHeight = $(window).height() / 2;
    var modalWidth = $modal.width();

    $('.stylebot-css-code').height(modalHeight).width(modalWidth);

    if (!this.cached.editor) return;

    $('#editor')
      .height(modalHeight)
      .width(modalWidth - 2);

    this.cached.editor.resize();
  },

  editor: function (code) {
    var editor = Utils.ace.monkeyPatch(ace.edit('editor'));
    var session = editor.getSession();

    editor.setTheme('ace/theme/dawn');

    var Mode = require('ace/mode/css').Mode;
    session.setMode(new Mode());

    session.setUseWrapMode(true);

    code = code === undefined ? '' : code;
    session.setValue(code);

    // Clear any leftover syntax error notifications.
    $('#parserError').html('');

    return editor;
  },

  showError: function (message) {
    var $error = this.cached.box.find('.error');
    if ($error.length === 0) {
      $error = $('<div>', {
        class: 'error',
      });
      this.cached.box.append($error);
    }

    $error.text(message);
  },

  showSyntaxError: function (error) {
    var editor = this.cached.editor;
    var session = editor.getSession();

    var Range = require('ace/range').Range;
    var range = new Range(error.currentLine - 1, 0, error.currentLine, 0);
    this.errorMarker = session.addMarker(range, 'warning', 'line');

    editor.gotoLine(error.currentLine, 0);
    editor.focus();

    session.on('change', $.proxy(this.clearSyntaxError, this));
    this.showError('Syntax Error at Line ' + error.currentLine);
  },

  clearSyntaxError: function () {
    if (!this.errorMarker) return;

    var editor = this.cached.editor;
    var session = editor.getSession();

    session.removeMarker(this.errorMarker);
    this.errorMarker = null;
    session.removeEventListener('change', this.clearSyntaxError);
  },

  getURL: function () {
    return $.trim(this.cached.box.find('input').attr('value'));
  },

  getCode: function () {
    return this.cached.editor.getSession().getValue();
  },

  getText: function () {
    return this.cached.box.find('textarea').val();
  },
};
