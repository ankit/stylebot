/**
 * Stylebot Options
 */
var Options = {};

$(document).ready(function () {
  init();
});

var backgroundPage = null;

// Initialize options.
function init() {
  // Initialize tabs.
  initializeTabs();

  backgroundPage = chrome.extension.getBackgroundPage();
  var options = backgroundPage.cache.options;

  $.each(options, function (option, value) {
    var $el = $('[name=' + option + ']');
    var el = $el.get(0);

    if (el == undefined) return;

    var tag = el.tagName.toLowerCase();

    if (el.type === 'checkbox') {
      if (value == true) {
        el.checked = true;
      }
    } else if (tag === 'select' || el.type === 'hidden') {
      if (value != undefined) {
        el.value = value;
      }
    } else if (el.type === 'radio') {
      var len = $el.length;
      for (var i = 0; i < len; i++) {
        if ($el.get(i).value == value) {
          $el.get(i).checked = true;
          return true;
        }
      }
    }
  });

  KeyCombo.init(
    $('[name=shortcutKeyCharacter]').get(0),
    $('[name=shortcutKey]').get(0)
  );

  Options.styles.init();
  attachListeners();
}

// Initialize tabs
function initializeTabs() {
  $('ul.menu li:first').addClass('tabActive').show();
  $('#options > div').hide();
  $('#basics').show();

  $('ul.menu').on('click', 'li', function () {
    $('ul.menu li').removeClass('tabActive');
    $(this).addClass('tabActive');
    $('#options > div').hide();

    // Fade in the correct DIV.
    var activeTab = $($(this).find('a').attr('href')).fadeIn();
    return false;
  });
}

/**
 * Attaches listeners for different types of inputs that change option values.
 */
function attachListeners() {
  // Checkboxes.
  $('#basics')
    .on('change', 'input[type=checkbox]', function (e) {
      var name = e.target.name;
      var value = translateOptionValue(name, e.target.checked);
      backgroundPage.saveOption(name, value);
    })

    // Radio buttons.
    .on('change', 'input[type=radio]', function (e) {
      var name = e.target.name;
      var value = translateOptionValue(name, e.target.value);
      backgroundPage.saveOption(name, value);
    })

    // Select boxes.
    .on('change', 'select', function (e) {
      backgroundPage.saveOption(e.target.name, e.target.value);
    })

    // Textfields.
    .on('keyup', 'input[type=text]', function (e) {
      if (e.target.name === 'shortcutKeyCharacter') {
        option = 'shortcutKey';
      } else {
        option = e.target.name;
      }
      backgroundPage.saveOption(
        option,
        translateOptionValue(option, e.target.value)
      );
    });

  $(window).resize(function (e) {
    Options.modal.resize();
  });

  $('.tipsy').tipsy({
    gravity: 's',
    live: true,
  });
}

function translateOptionValue(name, value) {
  switch (name) {
    case 'sync':
      return value === 'true' ? true : false;
    case 'shortcutKey':
      return $('[name=shortcutKey]').attr('value');
  }

  return value;
}
