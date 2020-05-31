/* eslint-disable no-undef */
Options.styles = {
  count: 0,

  init: function() {
    this.$container = $('#styles');
    this.$count = $('#style-count');

    this.fill();
    this.attachListeners();
  },

  attachListeners: function() {
    $('#styles-container')
      .on('click', '.show-add-style', $.proxy(this.showAdd, this))
      .on('click', '.enable-all', $.proxy(this.enableAll, this))
      .on('click', '.disable-all', $.proxy(this.disableAll, this))
      .on('click', '.delete-all', $.proxy(this.deleteAll, this))
      .on('click', '.style .show-edit-style', $.proxy(this.showEdit, this))
      .on('click', '.style .delete-style', $.proxy(this.delete, this))
      .on('click', '.style .toggle-style', $.proxy(this.toggle, this));

    $('#backup')
      .on('click', '.show-export', $.proxy(this.showExport, this))
      .on('click', '.show-import', $.proxy(this.showImport, this));

    $(document)
      .on(
        'click',
        '#stylebot-modal .cancel',
        $.proxy(Options.modal.close, Options.modal)
      )
      .on('click', '#stylebot-modal .add-style', $.proxy(this.add, this))
      .on('click', '#stylebot-modal .edit-style', $.proxy(this.edit, this))
      .on(
        'click',
        '#stylebot-modal .edit-global',
        $.proxy(this.editGlobal, this)
      )
      .on('click', '#stylebot-modal .import', $.proxy(this.import, this))
      .on('click', '#stylebot-modal .copy-to-clipboard', this.copyToClipboard);

    // Search.
    $('#style-search-field').bind(
      'keyup',
      $.proxy(function(e) {
        var $target = $(e.target);
        if (e.keyCode === 27) {
          $target.val('');
          this.filter('');
        } else {
          this.filter($target.val());
        }
      }, this)
    );

    // Tap / to search styles.
    $(document).keyup(function(e) {
      if (e.keyCode != 191) return true;

      if ($('#styles-container').css('display') === 'none') return true;

      var tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return true;

      $('#style-search-field').focus();
    });
  },

  /**
   * Resets and renders all the users styles.
   */
  fill: function() {
    this.$container.html('');
    var styles = backgroundPage.cache.styles.get();

    var counter = 0;

    for (var url in styles) {
      this.$container.prepend(
        this.render(url, backgroundPage.cache.styles.isEnabled(url), counter++)
      );

      this.count++;
    }

    this.updateCount();
  },

  get: function(id) {
    return $('#style' + id);
  },

  render: function(url, isEnabled, id) {
    return Handlebars.templates.style({
      url: url,
      enabled: isEnabled,
      id: id,
    });
  },

  toggle: function(e) {
    var $target = $(e.target);
    var $style = $target.parents('.style');
    var url = $style.data('url');
    backgroundPage.cache.styles.toggle(url, $target.attr('checked'), true);
  },

  delete: function(e) {
    var $style = $(e.target).parents('.style');
    var url = $style.data('url');

    if (
      !confirm('Are you sure you want to delete the style for "' + url + '"?')
    ) {
      return false;
    }

    backgroundPage.cache.styles.delete(url);

    // Remove tooltip for delete icon so that it does not lag around later.
    $style.find('.close-button').attr('original-title', '');
    // Wait for the tooltip to disappear,
    // then remove the style element from DOM.
    setTimeout(function() {
      $style.remove();
    }, 0);

    this.count--;
    this.updateCount();
  },

  validate: function(url, css) {
    if (url === '') {
      Options.modal.showError('Please enter a URL.');
      return false;
    }

    if (css === '') {
      Options.modal.showError('Please enter some CSS.');
      return false;
    }

    return true;
  },

  add: function(e) {
    var url = Options.modal.getURL();
    var css = Options.modal.getCode();

    if (this.save(url, css)) {
      this.$container.prepend(this.render(url, true, this.count));
      this.count++;
      this.updateCount();
      Options.modal.close();
    }
  },

  edit: function(e) {
    var $el = $(e.target);
    var previousURL = $el.data('previous-url');
    var id = $el.data('id');
    var url = Options.modal.getURL();
    var css = Options.modal.getCode();

    if (this.save(url, css, previousURL)) {
      this.get(id).replaceWith(this.render(url, true, id));
      Options.modal.close();
    }
  },

  save: function(url, css, previousURL) {
    if (!this.validate(url, css)) {
      return false;
    }

    var parser = new CSSParser();
    var sheet = parser.parse(css, false, true);

    if (sheet) {
      try {
        var rules = CSSUtils.getRulesFromParserObject(sheet);

        // Syntax error!
        if (rules['error']) {
          Options.modal.showSyntaxError(rules['error']);
          return false;
        }

        backgroundPage.cache.styles.create(url, rules);

        if (previousURL && previousURL != url) {
          backgroundPage.cache.styles.delete(previousURL);
        }

        return true;
      } catch (e) {
        // TODO: show error here instead of just true.
        return true;
      }
    }

    return true;
  },

  enableAll: function() {
    $('.style input[type=checkbox]').prop('checked', true);
    backgroundPage.cache.styles.toggleAll(true);
  },

  disableAll: function() {
    $('.style input[type=checkbox]').prop('checked', false);
    backgroundPage.cache.styles.toggleAll(false);
  },

  deleteAll: function() {
    if (confirm('Are you sure you want to delete ALL your styles?')) {
      backgroundPage.cache.styles.deleteAll();
      $('#styles').html('');
      this.count = 0;
      this.updateCount();
    }

    return false;
  },

  updateCount: function() {
    this.$count.text(this.count);
  },

  showEdit: function(e) {
    var $style = $(e.target).parents('.style');
    var url = $style.data('url');
    var id = $style.data('id');
    var rules = backgroundPage.cache.styles.getRules(url);

    CSSUtils.crunchFormattedCSS(rules, false, false, function(css) {
      Options.modal.init({
        url: url,
        editor: true,
        edit: true,
        code: css,
        id: id,
      });
    });
  },

  showAdd: function(e) {
    Options.modal.init({
      editor: true,
      add: true,
      code: '',
    });
  },

  filter: function(query) {
    var $styles = $('.style');
    var len = $styles.length;

    for (var i = 0; i < len; i++) {
      var $style = $($styles.get(i));
      var url = $style.data('url');

      if (url.indexOf(query) === -1) {
        $style.hide();
      } else {
        $style.show();
      }
    }
  },

  showExport: function() {
    var json = '';
    if (styles) {
      json = JSON.stringify(backgroundPage.cache.styles.get());
    }

    Options.modal.init({
      export: true,
      code: json,
    });
  },

  showImport: function() {
    Options.modal.init({
      import: true,
      code: '',
    });
  },

  import: function() {
    var json = Options.modal.getText();

    if (json && json != '') {
      try {
        var imported_styles = JSON.parse(json);
        backgroundPage.cache.styles.import(imported_styles);
      } catch (e) {
        // TODO: show a more humanised message.
        Options.modal.showError('' + e);
        return false;
      }

      this.fill();
      Options.modal.close();

      return true;
    }
  },

  copyToClipboard: function() {
    var text = Options.modal.getText();
    chrome.extension.sendRequest(
      {
        name: 'copyToClipboard',
        text: text,
      },
      function(response) {}
    );
  },
};
