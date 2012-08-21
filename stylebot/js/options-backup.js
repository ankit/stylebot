// Generates JSON string for backup and displays the modal popup containing it
function showExport() {
  var json = "";
  if (styles) {
    json = JSON.stringify(bg_window.cache.styles.get());
  }

  initializeModal({
    export: true,
    code: json
  });
}

// Displays the modal popup for importing styles from JSON string
function showImport() {
  initializeModal({
    import: true,
    code: ""
  });
}

// Import styles from JSON string
function importCSS() {
  var json = cache.modal.box.find('textarea').attr('value');

  if (json && json != '') {
    try {
      var imported_styles = JSON.parse(json);
      bg_window.cache.styles.import(imported_styles);
    }

    catch (e) {
      // show error. todo: show a more humanised message
      displayBackupErrorMessage('' + e);
      return false;
    }

    fillStyles();
    closeModal();

    return true;
  }
}

// Copy text in the popup's textarea to clipboard.
function copyToClipboard(text) {
  chrome.extension.sendRequest({ name: 'copyToClipboard', text: text },
    function(response) {});
}
