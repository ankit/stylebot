// TODO: For now, options are stored in localStorage. Instead store them more persistently, either in DB or in a bookmark

var options = {
    useShortcutKey: true,
    shortcutKey: 69, //keydown code for 'e'
    shortcutMetaKey: 'ctrl',
    mode: 'Basic'
}

// save options

function save() {
    options.useShortcutKey = ( $('[name=useShortcutKey]:checked').attr('value') == 'true' );
    options.shortcutKey = $('[name=shortcutKeyHiddenField]').attr('value');
    options.shortcutMetaKey = $('[name=shortcutMetaKey]:checked').attr('value');
    options.mode = $('[name=mode]:checked').attr('value');
    
    // save to datastore
    localStorage['stylebot_option_useShortcutKey'] = options.useShortcutKey;
    localStorage['stylebot_option_shorcutMetaKey'] = options.shortcutMetaKey;
    localStorage['stylebot_option_shortcutKey'] = options.shortcutKey;
    localStorage['stylebot_option_mode'] = options.mode;
    
    // update cache in background.html
    var bg_window = chrome.extension.getBackgroundPage();
    bg_window.cache.options = options;
    // propagate changes to all open tabs
    bg_window.propagateChanges();
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
}

// fetches options from the datastore
function fetch() {
    options.useShortcutKey = ( localStorage['stylebot_option_useShortcutKey'] == 'true' );
    options.shortcutMetaKey = localStorage['stylebot_option_shorcutMetaKey'];
    options.shortcutKey = localStorage['stylebot_option_shortcutKey'];
    options.mode = localStorage['stylebot_option_mode'];
}