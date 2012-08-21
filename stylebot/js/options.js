/**
  * Stylebot options page
  */

$(document).ready(function() {
  init();
});

var bg_window = null;

var cache = {
  modal: null,
  backupModal: null,
  errorMarker: null
};

// options with their default values
var options = {
  useShortcutKey: true,
  contextMenu: true,
  shortcutKey: 77, // keycode for 'm'
  shortcutMetaKey: 'alt',
  mode: 'Basic',
  sync: false,
  livePreviewColorPicker: false,
  showPageAction: true
};

// initialize options
function init() {
  // initialize tabs
  initializeTabs();
  // fetch options from datastore
  fetchOptions();

  $.each(options, function(option, value) {
    var $el = $('[name=' + option + ']');
    var el = $el.get(0);

    if (el == undefined) return;

    var tag = el.tagName.toLowerCase();

    if (el.type === 'checkbox') {
      if (value == true)
      el.checked = true;
    }
    else if (tag === 'select' || el.type === 'hidden') {
      if (value != undefined)
      el.value = value;
    }

    else if (el.type === 'radio') {
      var len = $el.length;
      for (var i = 0; i < len; i++) {
        if ($el.get(i).value == value) {
          $el.get(i).checked = true;
          return true;
        }
      }
    }
  });

  KeyCombo.init($('[name=shortcutKeyCharacter]').get(0), $('[name=shortcutKey]').get(0));

  bg_window = chrome.extension.getBackgroundPage();

  fillStyles();
  attachListeners();
  initFiltering();
  updateGlobalStylesheetButton();
}

// Initialize tabs
function initializeTabs() {
  $('ul.menu li:first').addClass('tabActive').show();
  $('#options > div').hide();
  $('#basics').show();

  $("ul.menu").on("click", "li", function() {
    $('ul.menu li').removeClass('tabActive');
    $(this).addClass('tabActive');
    $('#options > div').hide();

    // Fade in the correct DIV.
    var activeTab = $($(this).find('a').attr('href')).fadeIn();
    return false;
  });
}

/**
  * Fetches options from the datastore.
  */
function fetchOptions() {
  $.each(options, function(option, value) {
    var dataStoreValue = localStorage['stylebot_option_' + option];
    if (dataStoreValue != typeof undefined) {
      if (dataStoreValue === 'true' || dataStoreValue === 'false') {
        options[option] = (dataStoreValue === 'true');
      } else {
        options[option] = dataStoreValue;
      }
    }
  });
}

/**
  * Attaches listeners for different types of inputs that change option values.
  */
function attachListeners() {
  // Checkboxes.
  $("#basics").on("change", "input[type=checkbox]", function(e) {
    var name = e.target.name;
    var value = translateOptionValue(name, e.target.checked);
    bg_window.saveOption(name, value);
  })

  // Radio buttons.
  .on("change", "input[type=radio]", function(e) {
    var name = e.target.name;
    var value = translateOptionValue(name, e.target.value);
    bg_window.saveOption(name, value);
  })

  // Select boxes.
  .on("change", "select", function(e) {
    bg_window.saveOption(e.target.name, e.target.value);
  })

  // Textfields.
  .on("keyup", "input[type=text]", function(e) {
    if (e.target.name === 'shortcutKeyCharacter') {
      option = 'shortcutKey';
    } else {
      option = e.target.name;
    }
    bg_window.saveOption(option, translateOptionValue(option, e.target.value));
  })

  .on("click", ".toggle-page-action", togglePageAction);

  $("#styles-container")
    .on("click", ".show-edit-global", showEditGlobalStylesheet)
    .on("click", ".toggle-global", toggleGlobalStylesheet)
    .on("click", ".show-add-style", showAddStyle)
    .on("click", ".enable-all", enableAllStyles)
    .on("click", ".disable-all", disableAllStyles);

  $(".style")
    .on("click", ".share-style", shareStyle)
    .on("click", ".show-edit-style", showEditStyle)
    .on("click", ".delete-style", deleteStyle)
    .on("click", ".toggle-style", toggleStyle);

  $("#backup")
    .on("click", ".show-export", showExport)
    .on("click", ".show-import", showImport);

  $(document)
    .on("click", "#stylebot-modal .cancel", closeModal)
    .on("click", "#stylebot-modal .add-style", addStyle)
    .on("click", "#stylebot-modal .edit-style", editStyle)
    .on("click", "#stylebot-modal .edit-global", editGlobal)
    .on("click", "#stylebot-modal .import", importCSS)
    .on("click", "#stylebot-modal .copy-to-clipboard", copyToClipboard);

  // Tap / to search styles.
  $(document).keyup(function(e) {
    if (e.keyCode != 191) return true;

    if ($('#styles-container').css('display') === 'none') return true;

    var tag = e.target.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea') return true;

    $('#style-search-field').focus();
  });

  // On window resize, resize CSS editors.
  $(window).resize(function(e) {
    resizeEditor();
  });
}

function translateOptionValue(name, value) {
  switch (name) {
    case 'sync': return (value === 'true') ? true : false;
    case 'shortcutKey': return $('[name=shortcutKey]').attr('value');
  }

  return value;
}

/**
  * Toggle display of css icon in omnibar.
  */
function togglePageAction() {
  options.showPageAction = !options.showPageAction;
  bg_window.saveOption('showPageAction', options.showPageAction);
  if (!options.showPageAction) {
    bg_window.hidePageActions();
  } else {
    bg_window.showPageActions();
  }
}
