$(document).ready(function() {
   init();
});

/* Javascript for stylebot options page */

var bg_window = null;

var cache = {
    modal: null,
    backupModal: null,
    errorMarker: null
};

// options with their default values
//
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

        if (el == undefined)
            return;

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
                if ($el.get(i).value == value)
                {
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
    updateSyncUI();
    updateGlobalStylesheetUI();
}

// Initialize tabs
function initializeTabs() {
    $('ul.menu li:first').addClass('tabActive').show();
    $('#options > div').hide();
    $('#basics').show();

    // click event for tab menu items
    $('ul.menu li').click(function() {

        $('ul.menu li').removeClass('tabActive');
        $(this).addClass('tabActive');
        $('#options > div').hide();

        // Get DIV ID for content from the href of the menu link
        var activeTab = $(this).find('a').attr('href');
        $(activeTab).fadeIn();
        return false;
    });
}

// fetches options from the datastore
function fetchOptions() {
    $.each(options, function(option, value) {
        var dataStoreValue = localStorage['stylebot_option_' + option];

        if (dataStoreValue != typeof undefined)
        {
            if (dataStoreValue === 'true' || dataStoreValue === 'false')
                options[option] = (dataStoreValue === 'true');
            else
                options[option] = dataStoreValue;
        }
    });
}

// Attaches listeners for different types of inputs that change option values
function attachListeners() {
    // checkbox
    $('#basics input[type=checkbox]').change(function(e) {
        var name = e.target.name;
        var value = translateOptionValue(name, e.target.checked);
        bg_window.saveOption(name, value);
    });

    // radio
    $('#basics input[type=radio]').change(function(e) {
        var name = e.target.name;
        var value = translateOptionValue(name, e.target.value);
        bg_window.saveOption(name, value);
    });

    // select
    $('#basics select').change(function(e) {
        bg_window.saveOption(e.target.name, e.target.value);
    });

    // textfields
    $('#basics input[type=text]').keyup(function(e) {
        if (e.target.name === 'shortcutKeyCharacter')
            option = 'shortcutKey';
        else
            option = e.target.name;
        bg_window.saveOption(option, translateOptionValue(option, e.target.value));
    });

    // on window resize, resize textarea
    $(window).resize(function(e) {
        resizeEditor();
    });

    // edit styles
    $('.style').live('click keydown', function(e) {
        var $el = $(e.target);
        var $this = $(this);

        if ($el.closest('.selected').length != 0) return true;

        if (e.type === 'keydown' && (e.keyCode != 13 || $el.hasClass('style-button'))) return true;

        setTimeout(function() {
            selectStyle($this);
        }, 0);
    });

    // Tap / to search styles
    $(document).keyup(function(e) {
        if (e.keyCode != 191)
            return true;

        if ($('#styles-container').css('display') === 'none')
            return true;

        var tag = e.target.tagName.toLowerCase();

        if (tag === 'input' || tag === 'textarea')
            return true;

        $('#style-search-field').focus();
    });
}

function translateOptionValue(name, value) {
    switch (name) {
        case 'sync': return (value === 'true') ? true : false;
        case 'shortcutKey': return $('[name=shortcutKey]').attr('value');
    }

    return value;
}

// Styles

// Refreshes the styles. Called during initialization and on import
//
function fillStyles() {
    var container = $('#styles');
    container.html('');
    // newest styles are shown at the top
    //
    for (var url in bg_window.cache.styles.get()) {
        // skip the global styles
        if (url === '*') continue;
        container.prepend(createStyleUI(url));
    }
}

// Adds a new style to the UI
function createStyleUI(url) {
    var container = $('<div>', {
        class: 'style',
        tabIndex: 0
    });

    var urlContainer = $('<span>', {
        class: 'style-url-container'
    })
    .appendTo(container);

    $('<input>', {
        type: 'checkbox',
        title: 'Enable or disable this style',
        tabIndex: -1
    })
    .prop('checked', bg_window.cache.styles.isEnabled(url))
    .tipsy({delayIn: 100, gravity: 'sw'})
    .click(changeStyleStatus)
    .appendTo(urlContainer);

    var urlEl = $('<div>', {
        html: url,
        class: 'style-url'
    })
    .data('value', url)
    .appendTo(urlContainer);

    var b_container = $('<div>', {
        class: 'buttons'
    });

    $('<a>', {
        title: 'Share on Social',
        class: 'share-button style-button',
        tabIndex: 0
    })
    .bind('click keydown', function(e) {
        if (e.type === 'keydown' && e.keyCode != 13) return true;
        e.preventDefault();
        e.stopPropagation();
        shareStyle(e);
    })
    .appendTo(b_container)
    .tipsy({delayIn: 100, gravity: 'sw'});

    $('<a>', {
        title: 'Edit',
        class: 'edit-button style-button',
        tabIndex: 0
    })
    .bind('click keydown', function(e) {
        if (e.type === 'keydown' && e.keyCode != 13) return true;
        e.preventDefault();
        e.stopPropagation();
        editStyle(e);
    })
    .appendTo(b_container)
    .tipsy({delayIn: 100, gravity: 'sw'});

    $('<a>', {
        title: 'Delete',
        class: 'close-button style-button',
        tabIndex: 0
    })
    .bind('click keydown', function(e) {
        if (e.type === 'keydown' && e.keyCode != 13) return true;
        e.preventDefault();
        e.stopPropagation();
        removeStyle(e);
    })
    .appendTo(b_container)
    .tipsy({delayIn: 100, gravity: 'sw'});

    return container.append(b_container);
}

// Called when the remove button is clicked for a style
function removeStyle(e) {
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
}

// Update Global Stylesheet UI
function updateGlobalStylesheetUI() {
    $('#global-stylesheet-button').html(bg_window.cache.styles.isEnabled('*') ? 'Disable Global Stylesheet' : 'Enable Global Stylesheet');
}

// Turn global stylesheet on/off
function toggleGlobalStylesheet() {
    if (!bg_window.cache.styles.toggle('*')) {
        // create an empty global stylesheet
        bg_window.cache.styles.create('*');
    }

    updateGlobalStylesheetUI();
}

// Displays the modal popup for editing the global stylesheet
function editGlobalStylesheet(e) {
    var rules = bg_window.cache.styles.getRules('*');

    if (!rules) {
        bg_window.cache.styles.create('*');
        rules = {};
    }

    var css = rules ? CSSUtils.crunchFormattedCSS(rules, false) : '';

    var headerHTML = 'Edit the <strong>Global Stylesheet</strong>:';

    var footerHTML = "<button onclick='onSave(\"*\");'>Save</button> \
    <button onclick='cache.modal.hide();'>Cancel</button>";

    initializeEditorModal(headerHTML, footerHTML, css);

    cache.modal.show();
}

function selectStyle($styleEl) {
    $styleEl.addClass('selected');

    var $urlEl = $styleEl.find('.style-url');

    $styleEl.data('value', $urlEl.text());

    Utils.editElement($urlEl, { editFieldClass: 'stylebot-editing-field' });

    function onEditingComplete(e) {
        var el = e.target;
        var $el = $(el);

        if (e.type === 'keydown' && !$el.hasClass('stylebot-editing-field'))
            return true;

        if (e.type === 'mousedown' && $el.closest($styleEl).length != 0)
            return true;

        if (e.type === 'keydown')
        {
            switch (e.keyCode)
            {
                case 38: // up
                    // return for multiline textarea
                    if ($el.height() > 30) return true;

                    var $nextStyle = $el.closest('.style').prev();
                    // if the target element doesn't exist, ignore this event
                    if ($nextStyle.length === 0) return true;

                    break;

                case 40: // down
                    // return for multiline textarea
                    if ($el.height() > 30) return true;

                    var $nextStyle = $el.closest('.style').next();
                    // if the target element doesn't exist, ignore this event
                    if ($nextStyle.length === 0) return true;

                    break;

                case 27:
                case 13: break;

                default:
                    return true;
            }
        }

        e.preventDefault();

        Utils.endEditing($urlEl);

        var newURL = $styleEl.text();
        editURL($styleEl.data('value'), newURL);
        $styleEl.data('value', newURL);

        $(document).unbind('keydown mousedown', onEditingComplete);

        $styleEl.removeClass('selected');

        if ($nextStyle != undefined) {
            setTimeout(function() {
                $nextStyle.click();
            }, 0);
        }

        else {
            $styleEl.focus();
        }
    }

    $(document).bind('keydown mousedown', onEditingComplete);
}

// Displays the modal popup for editing a style
function editStyle(e) {
    var parent = $(e.target).parents('.style');
    var url = parent.find('.style-url').html();
    var rules = bg_window.cache.styles.getRules(url);
    var css = CSSUtils.crunchFormattedCSS(rules, false);

    var headerHTML = 'Edit the CSS for <strong>' + url + '</strong>:';

    var footerHTML = "<button onclick='onSave(\"" + url + "\");'>Save</button> \
    <button onclick='cache.modal.hide();'>Cancel</button>";

    initializeEditorModal(headerHTML, footerHTML, css);

    cache.modal.show();
}

// Displays the modal popup to add a new style
function addStyle() {
    var headerHTML = "URL: <input type='text'></input>";

    var footerHTML = "<button onclick= 'onAdd();' >Add</button> \
    <button onclick= 'cache.modal.hide();' >Cancel</button>";

    initializeEditorModal(headerHTML, footerHTML, '');

    cache.modal.show();

    setTimeout(function() {
        cache.modal.box.find('input').focus();
    }, 40);
}

function enableAllStyles() {
    $('.style input[type=checkbox]').prop('checked', true);
    bg_window.cache.styles.toggleAll(true);
}

function disableAllStyles() {
    $('.style input[type=checkbox]').prop('checked', false);
    bg_window.cache.styles.toggleAll(false);
}

function changeStyleStatus(e) {
    e.stopPropagation();

    var parent = $(e.target).parents('.style');
    var url = parent.find('.style-url').html();

    bg_window.cache.styles.toggle(url);
}

// Called when Share button is clicked for a style
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

// Called when a style is updated (Update button is clicked)
//
function onSave(url) {
    var css = cache.modal.editor.getSession().getValue();

    if (saveStyle(url, css)) {
        cache.modal.hide();
    }
}

// Called when a new style is added (Add button is clicked)
function onAdd() {
    var url = $.trim(cache.modal.box.find('input').attr('value'));
    var css = cache.modal.editor.getSession().getValue();

    if (url === '') {
        displayErrorMessage('Please enter a URL');
        return false;
    }

    else if (url === '*') {
        displayErrorMessage('* is used for the global stylesheet. Please enter another URL.');
        return false;
    }

    if (css === '') {
        displayErrorMessage('Please enter some CSS');
        return false;
    }

    if (saveStyle(url, css, true)) {
        cache.modal.hide();
    }
}

// Saves a style and updates the UI. Called by onSave and onAdd
//
function saveStyle(url, css, add) {
    // if css is empty. remove the style
    if (css === '')
    {
        if (url === '*') {
            bg_window.cache.styles.emptyRules('*');
            bg_window.cache.styles.push();
        } else {
            if (!bg_window.cache.styles.isEmpty(url))
            {
                bg_window.cache.styles.delete(url);
                $('.style-url:contains(' + url + ')').parent().remove();

                bg_window.cache.styles.persist();
                bg_window.cache.styles.push();
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
            // syntax error!
            //
            if (rules['error'])
            {
                // todo: notify user of syntax error and highlight the error causing line
                //
                displaySyntaxError(rules['error']);
                return false;
            }

            // If we modify any style, we should overwrite its metadata and their rules, not the enabled value
            var enabled = bg_window.cache.styles.isEmpty(url) ? true : bg_window.cache.styles.isEnabled(url);
            bg_window.cache.styles.create(url, rules);
            bg_window.cache.styles.toggle(url, enabled);
            bg_window.cache.styles.push();

            if (add)
                createStyleUI(url, bg_window.cache.styles.get(url)).prependTo($('#styles'));

            return true;
        }

        catch (e) {
            // todo: show error here instead of just returning
            //
            return true;
        }
    }

    return true;
}

function displayBackupErrorMessage(msg) {
    var $error = cache.backupModal.box.find('#backupError');

    if ($error.length === 0)
    {
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

    if ($error.length === 0)
    {
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
    if (!cache.errorMarker)
        return;

    var editor = cache.modal.editor;
    var session = editor.getSession();

    session.removeMarker(cache.errorMarker);
    cache.errorMarker = null;

    session.removeEventListener('change', clearSyntaxError);
}

// Callback for edit in place for URLs
function editURL(oldValue, newValue) {
    if (oldValue == newValue || newValue == '')
        return;

    bg_window.cache.styles.replace(oldValue, newValue);
}

// Backup

// Generates JSON string for backup and displays the modal popup containing it
function export() {
    if (styles)
        json = JSON.stringify(bg_window.cache.styles.get());
    else
        json = '';

    var headerHTML = 'Copy and paste the following into a text file: ';

    var footerHTML = "<button onclick='copyToClipboard(cache.backupModal.box.find(\"textarea\").attr(\"value\"));'> Copy To Clipboard </button>";

    initializeBackupModal(headerHTML, footerHTML, json, 60);

    cache.backupModal.show();
}

// Copy text in the popup's textarea to clipboard.
function copyToClipboard(text) {
    chrome.extension.sendRequest({ name: 'copyToClipboard', text: text }, function(response) {});
}

// Displays the modal popup for importing styles from JSON string
function import() {
    var headerHTML = "Paste previously exported styles: <br><span class='note'>Note</span>: Existing styles for similar URLs will be overwritten.";

    var footerHTML = "<button onclick='importCSS();'>Import</button> \
    <button onclick='cache.backupModal.hide();'>Cancel</button>";

    initializeBackupModal(headerHTML, footerHTML, '');

    cache.backupModal.show();
}

// Import styles from JSON string
function importCSS() {
    var json = cache.backupModal.box.find('textarea').attr('value');

    if (json && json != '')
    {
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
        cache.backupModal.hide();

        return true;
    }
}

// Sync

// Initialize Sync UI based on value of the sync option
function updateSyncUI() {
    $('#sync-button').html(options.sync ? 'Disable Sync' : 'Enable Sync');
}

// Turn syncing on/off
function toggleSyncing() {
    options.sync = !options.sync;
    bg_window.saveOption('sync', options.sync);

    if (!options.sync) {
        bg_window.disableSync();
    }

    else {
        bg_window.enableSync(true);

        // todo: again, 200 is an arbitrary value to wait for bg_window to respond
        //
        setTimeout(function() {
            fillStyles();
        }, 200);
    }

    updateSyncUI();
}

// Toggle display of css icon in omnibar

function togglePageAction() {
    options.showPageAction = !options.showPageAction;
    bg_window.saveOption('showPageAction', options.showPageAction);
    if (!options.showPageAction) {
        bg_window.hidePageActions();
    }

    else {
        bg_window.showPageActions();
    }
}

// Modal popup

// Initialize editor inside a modal popup
//
function initializeEditorModal(headerHTML, footerHTML, code) {
    if (!cache.modal)
    {
        var html = "<div class='popup-content'> \
        <div class='popup-header'> \
        </div> \
        <div id='editor'></div> \
        </div> \
        <div class='popup-footer'> \
        </div>";

        cache.modal = new ModalBox(html, {
            bgFadeSpeed: 0
        });

        // set up editor
        cache.modal.editor = Utils.ace.monkeyPatch(ace.edit('editor'));
    }

    cache.modal.box.find('.popup-header').html(headerHTML);
    cache.modal.box.find('.popup-footer').html(footerHTML);

    setTimeout(function() {
        initializeEditor(code);
    }, 0);

    cache.modal.options.closeOnEsc = false;
    cache.modal.options.closeOnBgClick = false;

    cache.modal.options.onOpen = function()
    {
        setTimeout(function() {
            cache.modal.editor.focus();
            cache.modal.editor.gotoLine(cache.modal.editor.getSession().getLength(), 0);
        }, 0);
    }
}

function initializeEditor(code) {
    var editor = cache.modal.editor;
    var session = editor.getSession();

    editor.setTheme('ace/theme/dawn');

    var Mode = require('ace/mode/css').Mode;
    session.setMode(new Mode());

    session.setUseWrapMode(true);

    code = code === undefined ? '' : code;
    session.setValue(code);

    setTimeout(function() {
        resizeEditor();
    }, 0);

    // clear any syntax error notifications
    $('#parserError').html('');
}

function initializeBackupModal(headerHTML, footerHTML, code, bottomSpace) {
    if (!cache.backupModal)
    {
        var html = "<div class='popup-content'> \
        <div class='popup-header'> \
        </div> \
        <textarea class='stylebot-css-code'></textarea>\
        </div> \
        <div class='popup-footer'> \
        </div>";

        cache.backupModal = new ModalBox(html, {
            bgFadeSpeed: 0
        });
    }

    cache.backupModal.box.find('.popup-header').html(headerHTML);
    cache.backupModal.box.find('.popup-footer').html(footerHTML);

    if (!bottomSpace)
        bottomSpace = 75;

    setTimeout(function() {
        resizeEditor(bottomSpace);
    }, 0);

    cache.backupModal.options.closeOnEsc = true;
    cache.backupModal.options.closeOnBgClick = true;

    cache.backupModal.options.onOpen = function() {
        var $textarea = cache.backupModal.box.find('textarea');
        $textarea.attr('value', code);
        $textarea.focus();
        Utils.selectAllText($textarea.get(0));
    }
}

// Attach listener to search field for filtering styles
function initFiltering() {
    $('#style-search-field').bind('search', function(e) {
       filterStyles($(this).val());
    })

    .keyup(function(e) {
        if (e.keyCode == 27)
        {
            $(this).val('');
            filterStyles('');
        }
    });
}

// Filter styles based on user entered text in search field
function filterStyles(value) {
    var styleDivs = $('.style');
    var urls = $('.style-url');
    var len = styleDivs.length;

    for (var i = 0; i < len; i++) {
        var $div = $(styleDivs[i]);

        if (urls[i].innerHTML.indexOf(value) == -1)
            $div.hide();
        else
            $div.show();
    }
}

function resizeEditor(bottomSpace) {
    if (!bottomSpace) {
        bottomSpace = 60;
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
