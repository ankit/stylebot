// TODO: For now, options are stored in localStorage. Instead store them more persistently, either in DB or in a bookmark

var modal = null;
var uiCache = { 
    textarea: null,
    intro: null
}

var options = {
    useShortcutKey: true,
    shortcutKey: 69, //keydown code for 'e'
    shortcutMetaKey: 'ctrl',
    mode: 'Basic'
}

var styles = {};

// save options

function save() {
    options.useShortcutKey = ( $('[name=useShortcutKey]:checked').attr('value') == 'true' );
    options.shortcutKey = $('[name=shortcutKeyHiddenField]').attr('value');
    options.shortcutMetaKey = $('[name=shortcutMetaKey]:checked').attr('value');
    options.mode = $('[name=mode]:checked').attr('value');
    
    // save to datastore
    localStorage['stylebot_option_useShortcutKey'] = options.useShortcutKey;
    localStorage['stylebot_option_shortcutMetaKey'] = options.shortcutMetaKey;
    localStorage['stylebot_option_shortcutKey'] = options.shortcutKey;
    localStorage['stylebot_option_mode'] = options.mode;
    
    // save styles
    localStorage['stylebot_styles'] = JSON.stringify( styles );
    
    // update cache in background.html
    var bg_window = chrome.extension.getBackgroundPage();
    bg_window.cache.options = options;
    bg_window.cache.styles = styles;
    
    // propagate changes to all open tabs
    bg_window.propagateOptions();
}

// initialize options

function init() {
    // fetch options from datastore
    fetch();
    
    // update UI
    var radioBt = $('[name=useShortcutKey]');
    if( options.useShortcutKey == false )
        radioBt[1].checked = true;
    else
        radioBt[0].checked = true;

    radioBt = $('[name=shortcutMetaKey]');
    if ( options.shortcutMetaKey == "shift" )
        radioBt[1].checked = true;
    else if( options.shortcutMetaKey == "none")
        radioBt[2].checked = true;
    else
        radioBt[0].checked = true;
    
    if( options.shortcutKey != undefined )
        $('[name=shortcutKeyHiddenField]').attr('value', options.shortcutKey);
    else
        $('[name=shortcutKeyHiddenField]').attr('value', 69);

    KeyCombo.init( $('[name=shortcutKey]')[0], $('[name=shortcutKeyHiddenField]')[0] );
    
    radioBt = $('[name=mode]');
    if( options.mode == "Advanced" )
        radioBt[1].checked = true;
    else
        radioBt[0].checked = true;
        
    fillCustomStyles();
}

// fetches options from the datastore
function fetch() {
    options.useShortcutKey = ( localStorage['stylebot_option_useShortcutKey'] == 'true' );
    options.shortcutMetaKey = localStorage['stylebot_option_shorcutMetaKey'];
    options.shortcutKey = localStorage['stylebot_option_shortcutKey'];
    options.mode = localStorage['stylebot_option_mode'];
}

function restoreDefaults() {
    // use shortcut key = true
    $('[name=useShortcutKey]')[0].checked = true;
    
    // shortcut meta key = ctrl
    $('[name=shortcutMetaKey]')[0].checked = true;
    
    // shortcut key = 69 (e)
    $('[name=shortcutKeyHiddenField]').attr('value', 69);
    $('[name=shortcutKey]').attr('value', 'e');
    
    // mode = basic
    $('[name=mode]')[0].checked = true;
}

function fillCustomStyles() {
    var container = $("#custom-styles");
    styles = JSON.parse( localStorage['stylebot_styles'] );
    for( var url in styles )
    {
        container.append( createCustomStyleOption( url, styles[url] ) );
    }
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
    .appendTo( container );
    
    Utils.makeEditable( url_div , function(newValue) {
        editURL( url_div.data('value'), newValue );
        url_div.data('value', newValue);
        setTimeout(function(){
            url_div.focus();
        }, 0);
    });
    
    var b_container = $('<div>', {
        class: 'button-container'
    });
    
    $('<button>', {
        html: 'edit',
        class: 'inline-button'
    })
    .click( editStyle )
    .appendTo( b_container );
    
    $('<button>', {
        html: 'remove',
        class: 'inline-button'
    })
    .click( removeStyle )
    .appendTo( b_container );
    
    return container.append( b_container );
}

function removeStyle(e) {
    var parent = $(e.target).parents('.custom-style');
    var url = parent.find('.custom-style-url');
    delete styles[ url.html() ];
    parent.remove();
}

function editStyle(e) {
    var parent = $(e.target).parents('.custom-style');
    var url = parent.find('.custom-style-url');
    var rules = styles [ url.html() ];
    if(!modal)
    {
        var html = "<div>Edit the CSS for :</div><textarea class='stylebot-css-code' style='width: 100%; height: 300px'></textarea><button onclick='modal.hide();'>Close</button>";
        
        modal = new ModalBox( html, {
            onOpen: function() { 
                modal.box.find('textarea').focus();
            },
            onClose: function() { editRules( uiCache.textarea.html() ); }
        });
        
        uiCache.textarea = modal.box.find('textarea');
        uiCache.intro = modal.box.find('div');
    }
    
    uiCache.intro.html( "Edit CSS for <b>" + url.html() + "</b>: ");
    uiCache.textarea.html( crunchCSS( rules, false ) );
    modal.show();
}

function editURL(oldValue, newValue) {
    if( oldValue == newValue )
        return;
    var rules = styles[ oldValue ];
    delete styles[ oldValue ];
    styles[ newValue ] = rules;
}

function editRules(url, newRules) {
    
}