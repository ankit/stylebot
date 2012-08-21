/**
  * Refreshes the styles. Called during initialization and on import.
  */
function fillStyles() {
  var container = $("#styles");
  container.html('');

  var count = 0;

  // Newest styles are shown at the top
  for (var url in bg_window.cache.styles.get()) {
    // Skip the global styles
    if (url === "*") continue;

    var html = Handlebars.templates.style({
      url: url,
      enabled: bg_window.cache.styles.isEnabled(url)
    });

    container.prepend(html);
    count ++;
  }

  setStyleCount(count);
}

function getStyleCount() {
  return parseInt($("#style-count").text());
}

function setStyleCount(val) {
  $("#style-count").text(val);
}

/**
  * Update global stylesheet button to represent saved state.
  */
function updateGlobalStylesheetButton() {
  $(".toggle-global")
    .html(bg_window.cache.styles.isEnabled('*') ? 'Disable Global Stylesheet' :
      'Enable Global Stylesheet');
}

/**
  * Turn global stylesheet on/off
  */
function toggleGlobalStylesheet() {
  if (!bg_window.cache.styles.toggle('*')) {
    bg_window.cache.styles.create('*');
    bg_window.cache.styles.push();
  }

  updateGlobalStylesheetButton();
}

/**
  * Display the modal popup for editing the global stylesheet.
  */
function showEditGlobalStylesheet(e) {
  var rules = bg_window.cache.styles.getRules('*');

  if (!rules) {
    bg_window.cache.styles.create('*');
    bg_window.cache.styles.push();
    rules = {};
  }

  initializeModal({
    editor: true,
    edit: true,
    global: true,
    code: CSSUtils.crunchFormattedCSS(rules, false)
  });
}

/**
  * Displays the modal popup for editing a style
  */
function showEditStyle(e) {
  var $parent = $(e.target).parents(".style");

  var url = $.trim($parent.find(".style-url").html());
  var rules = bg_window.cache.styles.getRules(url);

  initializeModal({
    url: url,
    editor: true,
    edit: true,
    code: CSSUtils.crunchFormattedCSS(rules, false),
    closeOnBgClick: false,
    closeOnEsc: false
  });
}

/**
  * Displays the modal popup to add a new style
  */
function showAddStyle() {
  initializeModal({
    editor: true,
    add: true,
    code: "",
    closeOnBgClick: false,
    closeOnEsc: false
  });
}

/**
  * Enable all styles.
  */
function enableAllStyles() {
  $('.style input[type=checkbox]').prop('checked', true);
  bg_window.cache.styles.toggleAll(true);
  bg_window.cache.styles.push();
}

/**
  * Disable all styles.
  */
function disableAllStyles() {
  $('.style input[type=checkbox]').prop('checked', false);
  bg_window.cache.styles.toggleAll(false);
  bg_window.cache.styles.push();
}

/**
  * Toggle a style as enabled or disabled.
  */
function toggleStyle(e) {
  e.stopPropagation();
  var parent = $(e.target).parents('.style');
  var url = parent.find('.style-url').html();
  bg_window.cache.styles.toggle(url);
  bg_window.cache.styles.push();
}

/**
  * Open Stylebot Social in a new tab, with the style's
  * information filled in.
  */
function shareStyle(e) {
  var parent = $(e.target).parents('.style');
  var url = parent.find('.style-url').html();
  var rules = bg_window.cache.styles.getRules(url);
  var css = CSSUtils.crunchFormattedCSS(rules, false);

  var production_url = 'http://stylebot.me/post';

  // create a form and submit data
  var temp_form = $('<form>', {
    'method': 'post',
    'action': production_url,
    'target': '_blank'
  });

  // site
  $('<input>', {
    type: 'hidden',
    name: 'site',
    value: url
  }).appendTo(temp_form);

  // css
  $('<input>', {
    type: 'hidden',
    name: 'css',
    value: css
  }).appendTo(temp_form);

  $('<submit>').appendTo(temp_form);
  temp_form.submit();
  temp_form.remove();
}

/**
  * Delete a style.
  */
function deleteStyle(e) {
  var parent = $(e.target).parents('.style');
  var url = parent.find('.style-url');

  // remove tooltip for delete icon so that it does not lag around later
  parent.find('.close-button').attr('original-title', '');

  // wait for the tooltip to disappear, then remove the style element from DOM
  setTimeout(function() {
    parent.remove();
  }, 0);

  bg_window.cache.styles.delete(url.text());
  bg_window.cache.styles.push();
  setStyleCount(getStyleCount() - 1);
}

/**
  * Add a new style.
  */
function addStyle(e) {
  var url = $.trim(cache.modal.box.find('input').attr('value'));
  var css = cache.modal.editor.getSession().getValue();
  if (saveStyle(url, css, true)) {
      closeModal();
  }
}

/**
  * Update the global stylesheet.
  */
function editGlobal(e) {
  if (saveStyle("*", cache.modal.editor.getSession().getValue())) {
      closeModal();
  }
}

/**
  * Update an existing style.
  */
function editStyle(e) {
  var url = $.trim(cache.modal.box.find('input').attr('value'));
  var css = cache.modal.editor.getSession().getValue();

  if (url === "") {
    displayErrorMessage("Please enter a URL");
    return false;
  }

  else if (url === "*") {
    displayErrorMessage("* is used for the global stylesheet. Please enter another URL.");
    return false;
  }

  if (css === "") {
    displayErrorMessage("Please enter some CSS");
    return false;
  }

  if (saveStyle(url, css)) {
      closeModal();
  }
}

/**
  * Save or update an existing style.
  */
function saveStyle(url, css, add) {
  // if css is empty. remove the style
  if (css === "") {
    if (url === "*") {
      bg_window.cache.styles.emptyRules("*");
      bg_window.cache.styles.push();
    } else {
      if (!bg_window.cache.styles.isEmpty(url)) {
        bg_window.cache.styles.delete(url);
        bg_window.cache.styles.push();
        $(".style-url:contains(" + url + ")").parent().remove();
      }
    }

    return true;
  }

  // else try to parse the style
  var parser = new CSSParser();
  var sheet = parser.parse(css, false, true);

  if (sheet) {
    try {
      var rules = CSSUtils.getRulesFromParserObject(sheet);

      // Syntax error!
      if (rules['error']) {
        // TODO: notify user of syntax error and
        // highlight the error causing line.
        displaySyntaxError(rules['error']);
        return false;
      }

      // If we modify any style, we should overwrite
      // its metadata and their rules, not the enabled value.
      console.log(bg_window.cache.styles.isEmpty(url));

      var enabled = bg_window.cache.styles.isEmpty(url) ? true :
        bg_window.cache.styles.isEnabled(url);
      bg_window.cache.styles.create(url, rules);
      bg_window.cache.styles.toggle(url, enabled);
      bg_window.cache.styles.push();

      if (add) {
        var html = Handlebars.templates.style({
          url: url,
          enabled: bg_window.cache.styles.isEnabled(url)
        });

        $(html).prependTo($("#styles"));
        setStyleCount(getStyleCount() + 1);
      }

      return true;
    }

    catch (e) {
      // TODO: show error here instead of just true.
      return true;
    }
  }

  return true;
}

/** Filtering **/

// Attach listener to search field for filtering styles
function initFiltering() {
  $("#style-search-field").bind("search", function(e) {
    filterStyles($(this).val());
  })

  .keyup(function(e) {
    if (e.keyCode == 27) {
      $(this).val("");
      filterStyles("");
    }
  });
}

// Filter styles based on user entered text in search field
function filterStyles(value) {
  var styleDivs = $(".style");
  var urls = $(".style-url");
  var len = styleDivs.length;

  for (var i = 0; i < len; i++) {
    var $div = $(styleDivs[i]);
    if (urls[i].innerHTML.indexOf(value) == -1)
      $div.hide();
    else
      $div.show();
  }
}
