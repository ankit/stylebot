// TODO: For now, options are stored in localStorage. Instead store them more persistently, either in DB or in a bookmark

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
    
    $('<div>', {
        html: url,
        class: 'custom-style-url'
    })
    .appendTo( container );
    
    $('<button>', {
        html: 'remove',
        class: 'inline-button custom-style-button'
    })
    .click( removeStyle )
    .appendTo( container );
    
    $('<button>', {
        html: 'edit',
        class: 'inline-button custom-style-button'
    })
    .click( editStyle )
    .appendTo( container );
    
    return container;
}

function removeStyle(e) {
    var parent = $(e.target).parent();
    var url = parent.find('.custom-style-url');
    delete styles[ url.html() ];
    parent.remove();
}

function editStyle(e) {
    var parent = $(e.target).parent();
    var url = parent.find('.custom-style-url');
    var rules = styles [ url.html() ];
}