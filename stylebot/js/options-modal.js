/**
  * Show a modal popup for editing a styling or
  * backing up styles.
  */
function initializeModal(options) {
  var html = Handlebars.templates["style-modal"](options);
  var modal = new ModalBox(html, {
    bgFadeSpeed: 0,
    closeOnBgClick: options.closeOnBgClick,
    closeOnEsc: options.closeOnEsc
  });

  if (options.editor) {
    modal.editor = initializeEditor(options.code);
    modal.options.onOpen = function() {
      resizeEditor();
      setTimeout(function() {
        modal.box.find("input").focus();
        modal.editor.gotoLine(
          modal.editor.getSession().getLength(), 0);
      }, 0);
    }
  }

  else {
    modal.options.onOpen = function() {
      var $textarea = modal.box.find('textarea');
      $textarea.focus();
      Utils.selectAllText($textarea.get(0));
      resizeEditor();
    }
  }

  setTimeout(function() {
    modal.show();
  }, 0);

  cache.modal = modal;
  return cache.modal;
}

/**
  * Initialize the ace editor with default options.
  */
function initializeEditor(code) {
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
}

/**
  * Resized the editor to fit the modal popup.
  */
function resizeEditor(bottomSpace) {
  if (!bottomSpace) {
    bottomSpace = 65;
  }

  var $modal = $('#stylebot-modal');
  var modalHeight = $modal.height();
  var modalWidth = $modal.width();

  $('.stylebot-css-code')
  .height(modalHeight - bottomSpace + 'px')
  .width(modalWidth + 'px');

  if (!cache.modal || !cache.modal.editor) return;

  $('#editor').height(modalHeight - bottomSpace + 'px')
  .width(modalWidth - 2 + 'px');

  cache.modal.editor.resize();
}


/**
  * Close the modal popup.
  */
function closeModal() {
  cache.modal.hide();
}


function displayBackupErrorMessage(msg) {
  var $error = cache.backupModal.box.find('#backupError');
  if ($error.length === 0) {
    $error = $('<div>', {
      id: 'backupError',
      class: 'error'
    });
    cache.backupModal.box.append($error);
  }
  $error.text(msg);
}

function displayErrorMessage(msg) {
  var $error = cache.modal.box.find('#parserError');
  if ($error.length === 0) {
    $error = $('<div>', {
      id: 'parserError',
      class: 'error'
    });

    cache.modal.box.append($error);
  }
  $error.text(msg);
}

function displaySyntaxError(error) {
  var editor = cache.modal.editor;
  var session = editor.getSession();

  var Range = require('ace/range').Range;
  var range = new Range(error.currentLine - 1, 0, error.currentLine, 0);
  cache.errorMarker = session.addMarker(range, 'warning', 'line');

  editor.gotoLine(error.currentLine, 0);
  editor.focus();

  session.on('change', clearSyntaxError);
  displayErrorMessage('Syntax Error at Line ' + error.currentLine);
}

function clearSyntaxError() {
  if (!cache.errorMarker) return;

  var editor = cache.modal.editor;
  var session = editor.getSession();

  session.removeMarker(cache.errorMarker);
  cache.errorMarker = null;
  session.removeEventListener('change', clearSyntaxError);
}
