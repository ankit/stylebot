Options.styles = {
  count: 0,

  init: function() {
    this.$container = $('#styles');
    this.$count = $('#style-count');
    this.$globalButton = $('.toggle-global');
    this.fill();
    this.attachListeners();
    this.updateGlobalButton();
  },

  attachListeners: function() {
      $("#styles-container")
        .on("click", ".show-edit-global", $.proxy(this.showEditGlobal, this))
        .on("click", ".toggle-global", $.proxy(this.toggleGlobal, this))
        .on("click", ".show-add-style", $.proxy(this.showAdd, this))
        .on("click", ".enable-all", $.proxy(this.enableAll, this))
        .on("click", ".disable-all", $.proxy(this.disableAll, this))
        .on("click", ".delete-all", $.proxy(this.deleteAll, this))

        .on("click", ".style .share-style", $.proxy(this.share, this))
        .on("click", ".style .show-edit-style", $.proxy(this.showEdit, this))
        .on("click", ".style .delete-style", $.proxy(this.delete, this))
        .on("click", ".style .toggle-style", $.proxy(this.toggle, this))

    $("#backup")
      .on("click", ".show-export", $.proxy(this.showExport, this))
      .on("click", ".show-import", $.proxy(this.showImport, this));

    $(document)
      .on("click", "#stylebot-modal .cancel", $.proxy(Options.modal.close, Options.modal))
      .on("click", "#stylebot-modal .add-style", $.proxy(this.add, this))
      .on("click", "#stylebot-modal .edit-style", $.proxy(this.edit, this))
      .on("click", "#stylebot-modal .edit-global", $.proxy(this.editGlobal, this))
      .on("click", "#stylebot-modal .import", $.proxy(this.import, this))
      .on("click", "#stylebot-modal .copy-to-clipboard", this.copyToClipboard);

    // Search.
    $("#style-search-field").bind("keyup", $.proxy(function(e) {
      var $target = $(e.target);
      if (e.keyCode === 27) {
        $target.val('');
        this.filter('');
      } else {
        this.filter($target.val());
      }
    }, this));

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

    for (var url in styles) {
      // Global style is shown separately.
      if (url === '*') continue;

      this.$container.prepend(this.render(url,
        backgroundPage.cache.styles.isEnabled(url)));
      this.count ++;
    }

    this.updateCount();
  },

  get: function(url) {
    return $('[data-url="' + url + '"]');
  },

  render: function(url, isEnabled) {
    return Handlebars.templates.style({
      url: url,
      enabled: isEnabled
    });
  },

  toggle: function(e) {
    var $target = $(e.target);
    var $style = $target.parents('.style');
    var url = $style.data('url');
    backgroundPage.cache.styles.toggle(url, $target.attr("checked"), true);
  },

  share: function(e) {
    var $style = $(e.target).parents('.style');
    var url = $style.data('url');
    var rules = backgroundPage.cache.styles.getRules(url);
    var socialURL = 'http://stylebot.me/post';

    CSSUtils.crunchFormattedCSS(rules, false, false, function(css) {
      // create a form and submit data
      var tempForm = $('<form>', {
        'method': 'post',
        'action': socialURL,
        'target': '_blank'
      });

      // site
      $('<input>', {
        type: 'hidden',
        name: 'site',
        value: url
      }).appendTo(tempForm);

      // css
      $('<input>', {
        type: 'hidden',
        name: 'css',
        value: css
      }).appendTo(tempForm);

      $('<submit>').appendTo(tempForm);

      tempForm.submit();
      tempForm.remove();
    });
  },

  delete: function(e) {
    var $style = $(e.target).parents('.style');
    var url = $style.data('url');

    if (!confirm('Are you sure you want to delete the style for "'
      + url + '"?')) {
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

    this.count --;
    this.updateCount();
  },

  validate: function(url, css) {
    if (url === '') {
      Options.modal.showError('Please enter a URL.');
      return false;
    }

    else if (url === '*') {
      Options.modal.showError(
        '* is used for the global stylesheet. Please enter another URL.');
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
      this.$container.prepend(this.render(url, true));

      this.count ++;
      this.updateCount();

      Options.modal.close();
    }
  },

  edit: function(e) {
    var originalUrl = $(e.target).data("original-url");
    var url = Options.modal.getURL();
    var css = Options.modal.getCode();

    if (this.save(url, css, originalUrl)) {
        this.get(originalUrl).replaceWith(this.render(url, true));
        Options.modal.close();
    }
  },

  editGlobal: function() {
    if (this.save('*', Options.modal.getCode())) {
      Options.modal.close();
    }
  },

  save: function(url, css, originalUrl) {
    if (url != '*') {
      if (!this.validate(url, css)) {
        return false;
      }
    } else if (css === '') {
      backgroundPage.cache.styles.emptyRules('*');
      return true;
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

        if (originalUrl && originalUrl != url) {
          backgroundPage.cache.styles.delete(originalUrl);
        }

        return true;
      }

      catch (e) {
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

  updateGlobalButton: function() {
    this.$globalButton.html(
      backgroundPage.cache.styles.isEnabled('*') ? 'Disable Global Stylesheet':
      'Enable Global Stylesheet');
  },

  toggleGlobal: function() {
    if (!backgroundPage.cache.styles.toggle('*', null, true)) {
      backgroundPage.cache.styles.create('*');
    }

    this.updateGlobalButton();
  },

  showEditGlobal: function(e) {
    var rules = backgroundPage.cache.styles.getRules('*');

    if (!rules) {
      backgroundPage.cache.styles.create('*');
      rules = {};
    }

    CSSUtils.crunchFormattedCSS(rules, false, false, function(css) {
      Options.modal.init({
        editor: true,
        edit: true,
        global: true,
        code:
      });
    });
  },

  showEdit: function(e) {
    var $style = $(e.target).parents(".style");
    var url = $style.data('url');
    var rules = backgroundPage.cache.styles.getRules(url);

    CSSUtils.crunchFormattedCSS(rules, false, false, function(css) {
      Options.modal.init({
        url: url,
        editor: true,
        edit: true,
        code: css
      });
    });
  },

  showAdd: function(e) {
    Options.modal.init({
      editor: true,
      add: true,
      code: ""
    });
  },

  filter: function(query) {
    var $styles = $(".style");
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
    var json = "";
    if (styles) {
      json = JSON.stringify(backgroundPage.cache.styles.get());
    }

    Options.modal.init({
      export: true,
      code: json
    });
  },

  showImport: function() {
    Options.modal.init({
      import: true,
      code: ""
    });
  },

  import: function() {
    var json = Options.modal.getText();

    if (json && json != '') {
      try {
        var imported_styles = JSON.parse(json);
        backgroundPage.cache.styles.import(imported_styles);
      }

      catch (e) {
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
    chrome.extension.sendRequest({name: 'copyToClipboard', text: text},
    function(response) {});
  }
}
