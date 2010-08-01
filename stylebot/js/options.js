/* Javascript for stylebot options page */

var bg_window = null;

var cache = {
    modal: null,
    textareaHeight: window.innerHeight * 0.5 + 'px'
}

var options = {
    useShortcutKey: null,
    shortcutKey: null,
    shortcutMetaKey: null,
    mode: null,
    sync: null
}

var styles = {};

// initialize options
function init() {
    // fetch options from datastore
    fetchOptions();
    // update UI
    var radioBt = $('[name=useShortcutKey]');
    if (options.useShortcutKey == false)
        radioBt[1].checked = true;
    else
        radioBt[0].checked = true;

    var select = $('[name=shortcutMetaKey]')[0];

    if (options.shortcutMetaKey != undefined)
        select.value = options.shortcutMetaKey;

    if (options.shortcutKey != undefined)
        $('[name=shortcutKeyHiddenField]').attr('value', options.shortcutKey);
    else
        $('[name=shortcutKeyHiddenField]').attr('value', 69);

    KeyCombo.init( $('[name=shortcutKey]')[0], $('[name=shortcutKeyHiddenField]')[0] );

    radioBt = $('[name=mode]');
    if (options.mode == "Advanced")
        radioBt[1].checked = true;
    else
        radioBt[0].checked = true;

    fillCustomStyles(localStorage['stylebot_styles']);

    bg_window = chrome.extension.getBackgroundPage();
    
    attachListeners();
    setSyncUI();
}

// fetches options from the datastore
function fetchOptions() {
    options.useShortcutKey = (localStorage['stylebot_option_useShortcutKey'] == 'true');
    options.shortcutMetaKey = localStorage['stylebot_option_shortcutMetaKey'];
    options.shortcutKey = localStorage['stylebot_option_shortcutKey'];
    options.mode = localStorage['stylebot_option_mode'];
    options.sync = (localStorage['stylebot_option_sync'] == 'true');
}

function attachListeners() {
    // radio
    $('.option-field input[type=radio]').change(function(e) {
        var name = e.target.name;
        var value = translateOptionValue(name, e.target.value);
        bg_window.saveOption(name, value);
    });
    
    // select
    $('.option-field select').change(function(e) {
        bg_window.saveOption(e.target.name, e.target.value);
    });
    
    // textfields
    $('.option-field input[type=text]').keyup(function(e) {
        bg_window.saveOption(e.target.name, translateOptionValue(e.target.name, e.target.value));
    });
}

function translateOptionValue(name, value) {
    switch(name) {
        case "useShortcutKey": 
        case "sync": return (value == "true") ? true : false;
        
        case "shortcutKey": return $('[name=shortcutKeyHiddenField]').attr('value');
    }
    return value;
}

/** custom styles **/

function fillCustomStyles(json) {
    var container = $("#custom-styles");
    try {
        styles = JSON.parse(json);
        for (var url in styles)
            container.append(createCustomStyleOption(url, styles[url]));
    }
    catch(e) {}
}

function createCustomStyleOption(url, rules) {
    var container = $('<div>', {
        class: 'custom-style'
    });
    
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
        setTimeout(function(){
            url_div.focus();
        }, 0);
    }, {fixedWidth: 400});
    
    var b_container = $('<div>', {
        class: 'button-container'
    });
    
    $('<button>', {
        html: 'edit',
        class: 'inline-button'
    })
    .click(editStyle)
    .appendTo(b_container);
    
    $('<button>', {
        html: 'remove',
        class: 'inline-button'
    })
    .click(removeStyle)
    .appendTo(b_container);
    
    return container.append(b_container);
}

function removeStyle(e) {
    var parent = $(e.target).parents('.custom-style');
    var url = parent.find('.custom-style-url');
    delete styles[url.html()];
    parent.remove();
    bg_window.saveStyles(styles);
}

function editStyle(e) {
    var parent = $(e.target).parents('.custom-style');
    var url = parent.find('.custom-style-url').html();
    var rules = styles[url];
    var css = CSSUtils.crunchFormattedCSS(rules, false);
    
    var html = "<div>Edit the CSS for <b>" + url + "</b>:</div><textarea class='stylebot-css-code' style='width: 100%; height:" + cache.textareaHeight + "'>" + css + "</textarea><button onclick='cache.modal.hide();'>Done</button>";
    
    initModal(html);
    
    cache.modal.options.onOpen = function() { 
        var textarea = cache.modal.box.find('textarea')
        textarea.focus();
        var len = textarea.attr('value').length;
        textarea[0].setSelectionRange(len, len);
    };
   
    cache.modal.options.onClose = function() {
        var url = cache.modal.box.find('div > b').html();
        var css = cache.modal.box.find('textarea').attr('value');
        saveStyle(url, css);
    };
    
    cache.modal.show();
}

function addStyle() {
    var html = "<div>URL: <input type='text'></input></div><textarea class='stylebot-css-code' style='width: 100%; height:" + cache.textareaHeight + "'></textarea><button onclick= 'cache.modal.hide();' >Cancel</button><button onclick= 'onAddClick(); cache.modal.hide();' >Add</button>";
    
    initModal(html);
    cache.modal.options.onOpen = function() { cache.modal.box.find('input').focus(); };
    cache.modal.show();
}

function onAddClick() {
    var url = cache.modal.box.find('input').attr('value');
    var css = cache.modal.box.find('textarea').attr('value');
    saveStyle(url, css);
    
    // add to list
    createCustomStyleOption(url, styles[url]).appendTo($("#custom-styles"));
}

function saveStyle(url, css) {
    var parser = new CSSParser();
    var sheet = parser.parse(css);
    var rules = CSSUtils.getRulesFromParserObject(sheet);
    styles[url] = rules;
    bg_window.saveStyles(styles);
}

function editURL(oldValue, newValue) {
    if (oldValue == newValue)
        return;
    var rules = styles[oldValue];
    delete styles[oldValue];
    styles[newValue] = rules;
    bg_window.saveStyles(styles);
}

/** end of custom styles **/

/** backup **/

function export() {
    if (styles)
        css = JSON.stringify(styles);
    else
        css = "";
    var html = "<div>Copy and paste your custom styles into a text file:</div><textarea class='stylebot-css-code' style='width: 100%; height:" + cache.textareaHeight + "'>" + css + "</textarea><button onclick='copyToClipboard()'>Copy To Clipboard</button>";
    initModal(html, {
        closeOnEsc: true,
        closeOnBgClick: true
    });
    cache.modal.options.onOpen = function() { 
        var textarea = cache.modal.box.find('textarea')
        textarea.focus();
        var len = textarea.attr('value').length;
        textarea[0].setSelectionRange(0, len);
    };
    cache.modal.show();
}

function import() {
    var html = "<div>Paste previously exported custom styles here.<div class='description' style='margin-top:10px'>Warning: It will replace all your current custom styles.</div></div><textarea class='stylebot-css-code' style='width: 100%; height:" + cache.textareaHeight + "'></textarea><button onclick='importCSS();cache.modal.hide();'>Import</button>";
    initModal(html, {
        closeOnEsc: true,
        closeOnBgClick: true
    });
    cache.modal.options.onOpen = function() {
        var textarea = cache.modal.box.find('textarea')
        textarea.focus();
        var len = textarea.attr('value').length;
        textarea[0].setSelectionRange(0, len);
    };
    cache.modal.show();
}

function copyToClipboard() {
    chrome.extension.sendRequest({name: "copyToClipboard", text: cache.modal.box.find('textarea').attr('value')}, function(response){});
}

function importCSS() {
    var json = cache.modal.box.find('textarea').attr('value');
    if (json && json != "")
    {
        $(".custom-style").html("");
        fillCustomStyles(json);
        try {
            styles = JSON.parse(json);
            bg_window.saveStyles(styles);
        }
        catch(e) {
            
        }
    }
}

/** end of backup **/

/** sync **/

function setSyncUI() {
    var status = $('#sync_status');
    if (options.sync) {
        status.html("Syncing is currently enabled.");
        $('#sync_button').html("Stop Syncing");
        $('#sync_now').show();
    }
    else {
        status.html("Syncing is currently disabled.");
        $('#sync_button').html("Start Syncing");
        $('#sync_now').hide();
    }
}

function toggleSyncing() {
    if (options.sync) {
        options.sync = false;
        bg_window.saveOption("sync", false);
        bg_window.disableSync();
    }
    else {
        options.sync = true;
        bg_window.saveOption("sync", true);
        bg_window.enableSync(true);
    }
    setSyncUI();
}

/** end of sync **/

function initModal(html, options) {
    if (!cache.modal)
    {
        cache.modal = new ModalBox(html, {
            bgFadeSpeed: 0,
            closeOnEsc: false,
            closeOnBgClick: false
        });
    }
    if (options) {
        cache.modal.options.closeOnEsc = options.closeOnEsc ? true : false;
        cache.modal.options.closeOnBgClick = options.closeOnBgClick ? true : false;
    }
    else {
        cache.modal.options.closeOnEsc = false;
        cache.modal.options.closeOnBgClick = false;
    }
    cache.modal.box.html(html);
}