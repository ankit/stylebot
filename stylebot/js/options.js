$(document).ready(function() {
   init();
});

/* Javascript for stylebot options page */

var bg_window = null;

var cache = {
    modal: null,
    errorMarker: null
}

// options with their default values
//
var options = {
    useShortcutKey: true,
    contextMenu: true,
    shortcutKey: 77, // keycode for 'm'
    shortcutMetaKey: 'alt',
    mode: "Basic",
    sync: false,
    livePreviewColorPicker: false,
    showPageAction: true
}

var styles = {};

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

        if (el.type === "checkbox") {
            if (value == true)
                el.checked = true;
        }

        else if (tag === "select" || el.type === "hidden") {
            if (value != undefined)
                el.value = value;
        }

        else if (el.type === "radio") {
            var len = $el.length;
            for (var i = 0; i < len; i ++) {
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
    styles = bg_window.cache.styles;

    fillCustomStyles();
    attachListeners();
    initFiltering();
    updateSyncUI();
    updateGlobalStylesheetUI();
}

// Initialize tabs
function initializeTabs() {
    $("ul.menu li:first").addClass("tabActive").show();
    $("#options > div").hide();
    $("#basic-options").show();

    // click event for tab menu items
    $("ul.menu li").click(function() {

        $("ul.menu li").removeClass("tabActive");
        $(this).addClass("tabActive");
        $("#options > div").hide();

        // Get DIV ID for content from the href of the menu link
        var activeTab = $(this).find("a").attr("href");
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
            if (dataStoreValue === "true" || dataStoreValue === "false")
                options[option] = (dataStoreValue === "true");
            else
                options[option] = dataStoreValue;
        }
    });
}

// Attaches listeners for different types of inputs that change option values
function attachListeners() {
    // checkbox
    $('.option input[type=checkbox]').change(function(e) {
        var name = e.target.name;
        var value = translateOptionValue(name, e.target.checked);
        bg_window.saveOption(name, value);
    });

    // radio
    $('.option input[type=radio]').change(function(e) {
        var name = e.target.name;
        var value = translateOptionValue(name, e.target.value);
        bg_window.saveOption(name, value);
    });

    // select
    $('.option select').change(function(e) {
        bg_window.saveOption(e.target.name, e.target.value);
    });

    // textfields
    $('.option input[type=text]').keyup(function(e) {
        if (e.target.name == "shortcutKeyCharacter")
            option = "shortcutKey";
        else
            option = e.target.name;
        bg_window.saveOption(option, translateOptionValue(option, e.target.value));
    });

    // on window resize, resize textarea
    $(window).resize(function(e) {
        resizeEditor();
    });
}

function translateOptionValue(name, value) {
    switch(name) {
        case "sync": return (value == "true") ? true : false;
        case "shortcutKey": return $('[name=shortcutKey]').attr('value');
    }

    return value;
}

// Custom Styles

// Refreshes the custom styles. Called during initialization and on import
//
function fillCustomStyles() {
    var container = $("#custom-styles");
    container.html("");
    // newest styles are shown at the top
    //
    for (var url in styles) {
        // skip the global styles
        if(url === "*") continue;
        
        container.prepend(createCustomStyleOption(url));
    }
}

// Adds a new style to the UI
function createCustomStyleOption(url) {
    var container = $('<div>', {
        class: 'custom-style'
    });

    $('<input>', {
        type: 'checkbox',
        class: 'inline-button',
        title: 'Enable or disable this style'
    })
    .prop('checked', styles[url]['_enabled'] ? true : false)
    .tipsy({delayIn: 100, gravity:'sw'})
    .click(changeStyleStatus)
    .appendTo(container);

    var url_div = $('<div>', {
        html: url,
        class: 'custom-style-url',
        tabIndex: 0
    })
    .data('value', url)
    .appendTo(container);

    Utils.makeEditable(url_div , function(newValue) {
        editURL( url_div.data('value'), newValue);
        url_div.data('value', newValue);
    });

    var b_container = $('<div>', {
        class: 'button-container'
    });

    $('<button>', {
        html: 'Share',
        class: 'inline-button'
    })
    .click(shareStyle)
    .appendTo(b_container);

    $('<button>', {
        html: 'Edit',
        class: 'inline-button'
    })
    .click(editStyle)
    .appendTo(b_container);

    $('<button>', {
        html: 'Remove',
        class: 'inline-button'
    })
    .click(removeStyle)
    .appendTo(b_container);

    return container.append(b_container);
}

// Called when the remove button is clicked for a style
function removeStyle(e) {
    var parent = $(e.target).parents('.custom-style');
    var url = parent.find('.custom-style-url');

    delete styles[url.html()];
    parent.remove();

    bg_window.saveStyles(styles);
    bg_window.pushStyles();
}

// Update Global Stylesheet UI
function updateGlobalStylesheetUI() {
    $('#global-stylesheet-button').html(bg_window.cache.styles['*']['_enabled'] ? "Disable Global Stylesheet" : "Enable Global Stylesheet");
}

// Turn global stylesheet on/off
function toggleGlobalStylesheet() {
    bg_window.cache.styles['*']['_enabled'] = !bg_window.cache.styles['*']['_enabled'];
    bg_window.updateStylesInDataStore();
    updateGlobalStylesheetUI();
}

// Displays the modal popup for editing a style
function editStyle(e) {
    var parent = $(e.target).parents('.custom-style');
    var url = parent.find('.custom-style-url').html();
    var rules = styles[url]['_rules'];
    var css = CSSUtils.crunchFormattedCSS(rules, false);

    var html = "<div class='popup-content'> \
    <div class='header-text'> \
    Edit the CSS for <strong>" + url + "</strong>: \
    </div> \
    <div id='editor'></div> \
    </div> \
    <div id='stylebot-modal-buttons'> \
    <button onclick='onSave(\"" + url + "\");'>Save</button> \
    <button onclick='cache.modal.hide();'>Cancel</button> \
    </div>";

    initializeEditorModal(html, css);

    cache.modal.show();
}

// Displays the modal popup for editing the global stylesheet
function editGlobalStylesheet(e) {
    if (styles["*"]) {
        var rules = styles["*"]['_rules'];
        var css = CSSUtils.crunchFormattedCSS(rules, false);
    }
    else {
        var css = "";
    }

    var html = "<div class='popup-content'> \
    <div class='header-text'> \
    Edit the <strong>Global Stylesheet</strong>: \
    </div> \
    <div id='editor'></div> \
    </div> \
    <div id='stylebot-modal-buttons'> \
    <button onclick='onSave(\"*\");'>Save</button> \
    <button onclick='cache.modal.hide();'>Cancel</button> \
    </div>";

    initializeEditorModal(html, css);
    
    cache.modal.show();
}


// Displays the modal popup to add a new style
function addStyle() {
    var html = "<div class='popup-content'> \
    <div class='header-text'> \
    URL: <input type='text'></input> \
    </div> \
    <div id='editor'></div> \
    </div> \
    <div id='stylebot-modal-buttons'> \
    <button onclick= 'onAdd();' >Add</button> \
    <button onclick= 'cache.modal.hide();' >Cancel</button> \
    </div>";

    initializeAddStyleEditorModal(html);

    cache.modal.show();
}

function enableAllStyles() {
    for (var url in styles) {
        styles[url]['_enabled'] = true;
    }
    
    $('.custom-style input[type=checkbox]').prop('checked', true);
    bg_window.saveStyles(styles);
}

function disableAllStyles() {
    for (var url in styles) {
        styles[url]['_enabled'] = false;
    }
    
    $('.custom-style input[type=checkbox]').prop('checked', false);
    bg_window.saveStyles(styles);
}

function changeStyleStatus(e) {
    var parent = $(e.target).parents('.custom-style');
    var url = parent.find('.custom-style-url').html();
    
    if (styles[url] === undefined)
        return;
    
    if (styles[url]['_enabled']) {
        styles[url]['_enabled'] = false;
    }
    
    else {
        styles[url]['_enabled'] = true;
    }
    
    bg_window.saveStyles(styles);
}

// Called when Share button is clicked for a style
function shareStyle(e) {
    var parent = $(e.target).parents('.custom-style');
    var url = parent.find('.custom-style-url').html();
    var rules = styles[url]['_rules'];
    var css = CSSUtils.crunchFormattedCSS(rules, false);

    var production_url = "http://stylebot.me/post";

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
    var url = cache.modal.box.find('input').attr('value');
    var css = cache.modal.editor.getSession().getValue();

    if (css === "")
        return false;

    if (saveStyle(url, css, true)) {
        cache.modal.hide();
    }
}

// Saves a style and updates the UI. Called by onSave and onAdd
//
function saveStyle(url, css, add) {
    // if css is empty. remove the style
    if (css === "")
    {
        if (url === '*') {
            styles[url]['_rules'] = null;
            bg_window.saveStyles(styles);
            bg_window.pushStyles();
        } else {
            if (styles[url])
            {
                delete styles[url];
                $('.custom-style-url:contains(' + url + ')').parent().remove();
                bg_window.saveStyles(styles);
                bg_window.pushStyles();
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

            if (styles[url] === undefined) {
                styles[url] = {};
                styles[url]['_social'] = {};
                styles[url]['_enabled'] = true;
                styles[url]['_rules'] = rules;
            } else {
                var _social = styles[url]['_social'];
                var _enabled = styles[url]['_enabled'];
                styles[url] = {};
                styles[url]['_social'] = _social;
                styles[url]['_enabled'] = _enabled;
                styles[url]['_rules'] = rules;
            }
            
            bg_window.saveStyles(styles);
            bg_window.pushStyles();

            if (add)
                createCustomStyleOption(url, styles[url]).prependTo($("#custom-styles"));

            return true;
        }

        catch(e) {
            // todo: show error here instead of just returning
            //
            return true;
        }
    }

    return true;
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
    cache.errorMarker = session.addMarker(range, "warning", "line");
    
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
    if (oldValue == newValue || newValue == "")
        return;

    // going through a loop so that new entry is inserted at the same position
    // otherwise, on changing the url, new entry is inserted at the bottom

    var newStyles = {};

    for (var url in styles)
    {
        if (url == oldValue)
        {
            var rules = styles[oldValue];
            newStyles[newValue] = rules;
            delete styles[oldValue];
        }

        else
            newStyles[url] = styles[url];
    }

    styles = newStyles;

    bg_window.saveStyles(styles);
}

// Backup

// Generates JSON string for backup and displays the modal popup containing it
function export() {
    if (styles)
        json = JSON.stringify(styles);
    else
        json = "";

    var html = "<div class='popup-content'>Copy and paste the following into a text file: \
    <textarea class='stylebot-css-code'></textarea> \
    </div> \
    <div id='stylebot-modal-buttons'> \
    <button onclick='copyToClipboard()'> Copy To Clipboard </button> \
    </div>";

    initializeBackupModal(html, json);

    cache.modal.show();
}

// Copy text in the popup's textarea to clipboard.
function copyToClipboard() {
    chrome.extension.sendRequest( { name: "copyToClipboard", text: cache.modal.box.find('textarea').attr('value') }, function(response){});
}

// Displays the modal popup for importing styles from JSON string
function import() {
    var html = "<div class='popup-content'>Paste previously exported styles: \
    <div class='description'> \
    <span class='note'>Note</span>: Existing styles for similar URLs will be overwritten. \
    </div> \
    <textarea class='stylebot-css-code'></textarea>\
    </div> \
    <div id='stylebot-modal-buttons'> \
    <button onclick='importCSS();'>Import</button> \
    <button onclick='cache.modal.hide();'>Cancel</button> \
    </div>";

    initializeBackupModal(html);
    
    cache.modal.show();
}

// Import styles from JSON string
function importCSS() {
    var json = cache.modal.box.find('textarea').attr('value');

    if (json && json != "")
    {
        try {
            var imported_styles = JSON.parse(json);
            styles = mergeStyles(imported_styles, styles);

            bg_window.saveStyles(styles);
        }

        catch(e) {
            // show error. todo: show a more humanised message
            displayErrorMessage("" + e);
            return false;
        }

        fillCustomStyles();
        cache.modal.hide();
        return true;
    }
}

// Sync

// Initialize Sync UI based on value of the sync option
function updateSyncUI() {
    $('#sync-button').html(options.sync ? "Disable Sync" : "Enable Sync");
}

// Turn syncing on/off
function toggleSyncing() {
    options.sync = !options.sync;
    bg_window.saveOption("sync", options.sync);

    if (!options.sync) {
        bg_window.disableSync();
    }

    else {
        bg_window.enableSync(true);
        // Update the UI
        styles = bg_window.cache.styles;

        // todo: again, 200 is an arbitrary value to wait for bg_window to respond
        //
        setTimeout(function() {
            fillCustomStyles();
        }, 200);
    }

    updateSyncUI();
}

// Toggle display of css icon in omnibar

function togglePageAction() {
    options.showPageAction = !options.showPageAction;
    bg_window.saveOption("showPageAction", options.showPageAction);
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
function initializeEditorModal(html, code) {
    if (!cache.modal)
    {
        cache.modal = new ModalBox(html, {
            bgFadeSpeed: 0
        });
    }
    
    else {
        cache.modal.box.html(html);
    }
    
    initializeEditor(code);
    
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

function initializeAddStyleEditorModal(html) {
    
    if (!cache.modal)
    {
        cache.modal = new ModalBox(html, {
            bgFadeSpeed: 0
        });
    }
    
    else {
        cache.modal.box.html(html);
    }
    
    initializeEditor();

    cache.modal.options.closeOnEsc = false;
    cache.modal.options.closeOnBgClick = false;
    
    cache.modal.options.onOpen = function()
    {
        setTimeout(function() {
            cache.modal.box.find('input')
            
            .focus()

            .change(function() {
                // user cannot explicity set the URL to *, as it is used for global stylesheet
                // todo: notify user instead of bluntly clearing up the input field
                //
                if ($(this).val() === "*") { $(this).val(""); }
            });
            
        }, 0);
    }
}

function initializeEditor(code) {
    cache.modal.editor = Utils.ace.monkeyPatch(ace.edit('editor'));
    
    var editor = cache.modal.editor;
    var session = editor.getSession();
    
    editor.setTheme("ace/theme/dawn");
    
    var Mode = require('ace/mode/css').Mode;
    session.setMode(new Mode());
    
    session.setUseWrapMode(true);
    
    code = code === undefined ? "" : code;
    session.setValue(code);
    
    setTimeout(function() {
        resizeEditor();
    }, 0);
}

function initializeBackupModal(html, code) {
    if (!cache.modal)
    {
        cache.modal = new ModalBox(html, {
            bgFadeSpeed: 0
        });
    }
    
    else {
        cache.modal.box.html(html);
    }
    
    resizeEditor(75);

    cache.modal.options.closeOnEsc = true;
    cache.modal.options.closeOnBgClick = true;

    cache.modal.options.onOpen = function(){
        var $textarea = cache.modal.box.find('textarea');
        $textarea.attr('value', code);
        $textarea.focus();
        Utils.selectAllText($textarea.get(0));
    }
}

// Attach listener to search field for filtering styles
function initFiltering() {
    $("#style-search-field").bind('search', function(e) {
       filterStyles($(this).val());
    })

    .keyup(function(e){
        if(e.keyCode == 27)
        {
            $(this).val('')
            filterStyles("");
        }
    });
}

// Filter styles based on user entered text in search field
function filterStyles(value) {
    var styleDivs = $('.custom-style');
    var urls = $('.custom-style-url');
    var len = styleDivs.length;

    for (var i = 0; i < len; i++) {
        var $div = $(styleDivs[i]);

        if (urls[i].innerHTML.indexOf(value) == -1)
            $div.hide();
        else
            $div.show();
    }
}

// Merges styles from s1 into s2
function mergeStyles(s1, s2) {
    if (!s2) {
        return s1;
    }

    for (var url in s1) {
        // it's the new format
        if (s1[url]['_rules']) {
            s2[url] = s1[url];
        }

        // old format
        else {
            s2[url] = {};
            s2[url]['_rules'] = s1[url];
        }
    }

    return s2;
}

function resizeEditor(bottomSpace) {
    if (!cache.modal) return;
    
    if (!bottomSpace) {
        bottomSpace = 60;
    }
    
    $('.stylebot-css-code').height($("#stylebot-modal").height() - bottomSpace + "px");
    $('.stylebot-css-code').width($("#stylebot-modal").width() + "px");
    
    if (!cache.modal.editor) return;
    
    $('#editor').height($("#stylebot-modal").height() - bottomSpace + "px");
    $('#editor').width($("#stylebot-modal").width() + "px");
    
    cache.modal.editor.resize();
}