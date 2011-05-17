// Stylebot keyboard shortcuts
//

function handleKeyboardShortcut(e) {
    var tag = e.target.tagName.toLowerCase();
    
    if ((tag == "input" && e.target.type == 'text') || tag == "textarea") {
        return true;
    }
    
    if (stylebot.isKeyboardHelpVisible) {
        closeShortcutHelp(e);
        return true;
    }
    
    switch (e.keyCode) {
        case 83:    if (e.ctrlKey && e.shiftKey) {
                        // 'ctrl+shift+s': Push styles, if sync is enabled
                        stylebot.chrome.pushStyles();
                    }
                    else {
                        // 's': shortcut to toggle selection of element, keypress: 115
                        stylebot.toggleSelection();
                    }
                    return false;
        
        // 'h': hide/show currently selected element(s), keypress: 104
        case 72:    if (stylebot.selectedElement) { 
                        $("#stylebot-display").click();
                    }
                    return false;

        // 'm': toggle basic/advanced mode, keypress: 109
        case 77:    stylebot.widget.toggleMode(); return false;

        // 'e': Open the edit css popup, keypress: 101, keydown: 69
        case 69:    e.stopPropagation();
                    e.preventDefault();
                    $("#stylebot-main-buttons button:contains(Edit CSS)").click();
                    return false;
                    
        // 'p': Toggle Stylebot's position, keypress: 112
        case 80:    stylebot.widget.togglePosition(); return false;
        
        // 'z': Undo last action, keypress: 122
        case 90:    stylebot.style.undo(); return false;
        
        // 'w': Write selector manually
        case 87:    e.stopPropagation();
                    e.preventDefault();
                    stylebot.widget.cache.headerSelector.click();
                    return false;
        
        // 'd': Open selector dropdown
        case 68:    stylebot.widget.showSelectorDropdown();
                    // select first selector
                    stylebot.widget.selectNextDropdownOption();
                    return false;
        
        // ↑ when dropdown is open
        case 38:    if ($("#stylebot-dropdown").length != 0) {
                        e.stopPropagation();
                        e.preventDefault();
                        stylebot.widget.selectPreviousDropdownOption();
                        return false;
                    }
        // ↓ when dropdown is open
        case 40:    if ($("#stylebot-dropdown").length != 0) {
                        e.stopPropagation();
                        e.preventDefault();
                        stylebot.widget.selectNextDropdownOption();
                        return false;
                    }
        /** Jump around sections **/
        
        // 't': Jump to Text, keypress: 116
        case 84:    $(".stylebot-accordion-header:contains('Text')").focus(); return false;
        
        // 'c': Jump to Color, keypress: 99
        case 67:    $(".stylebot-accordion-header:contains('Color')").focus(); return false;
        
        // 'b': Jump to Borders, keypress: 98
        case 66:    $(".stylebot-accordion-header:contains('Borders')").focus(); return false;
        
        // 'l': Jump to Layout, keypress: 108
        case 76:    $(".stylebot-accordion-header:contains('Layout')").focus(); return false;
        
        // '?': Display shortcuts keypress: 63
        case 191:   if (e.shiftKey) {
                        e.stopPropagation();
                        e.preventDefault();
                        displayShortcutHelp(); return false;
                    }
                    break;
    }
    
    // 'v': toggle highlight of *all* the elements for current selector
    // TODO: Add functionality to this
    
    return true;
}

function attachKeyboardShortcuts() {
    document.addEventListener('keydown', handleKeyboardShortcut, true);
}

function detachKeyboardShortcuts() {
    document.removeEventListener('keydown', handleKeyboardShortcut, true);
}

// Keyboard shortcuts help

function displayShortcutHelp() {
    var div = $("<div>", {
        id: "stylebot-shortcuts"
    });
    
    var content = $("<div>", {
        id: "stylebot-shortcuts-content"
    }).appendTo(div);
    
    $("<h1>", {
        html: "Stylebot Keyboard shortcuts"
    }).appendTo(content);
    
    var sec1 = "<ul class='stylebot-shortcut-section'><h2>Manage Stylebot</h2> /
                <li class='stylebot-shortcut'><span class='stylebot-key'>Alt + m</span><span class='stylebot-key-desc'>Launch Stylebot</span></li> /
                <li class='stylebot-shortcut'><span class='stylebot-key'>s</span><span class='stylebot-key-desc'>Toggle ability to select an element</span></li> /
                <li class='stylebot-shortcut'><span class='stylebot-key'>m</span><span class='stylebot-key-desc'>Switch between Basic / Advanced Mode</span></li> /
                <li class='stylebot-shortcut'><span class='stylebot-key'>p</span><span class='stylebot-key-desc'>Move Panel Left / Right</span></li> /
                <li class='stylebot-shortcut'><span class='stylebot-key'>e</span><span class='stylebot-key-desc'>Open Popup to edit page's CSS</span></li> /
                <li class='stylebot-shortcut'><span class='stylebot-key'>w</span><span class='stylebot-key-desc'>Write CSS selector manually</span></li> /
                <li class='stylebot-shortcut'><span class='stylebot-key'>d</span><span class='stylebot-key-desc'>Open CSS selector dropdown</span></li> /
                <li class='stylebot-shortcut'><span class='stylebot-key'>↑↓</span><span class='stylebot-key-desc'>Navigate CSS selectors in dropdown</span></li> /
                <li class='stylebot-shortcut'><span class='stylebot-key'>Ctrl + Shift + s</span><span class='stylebot-key-desc'>Push styles <i>(if sync is enabled)</i></span></li> /
                <li class='stylebot-shortcut'><span class='stylebot-key'>?</span><span class='stylebot-key-desc'>Bring up this help</span></li> /
                <li class='stylebot-shortcut'><span class='stylebot-key'>esc</span><span class='stylebot-key-desc'>Close Stylebot</span></li></ul>";
                
    var sec2 = "<ul class='stylebot-shortcut-section'><h2>Navigate Sections</h2> /
                <li class='stylebot-shortcut'><span class='stylebot-key'>t</span><span class='stylebot-key-desc'>Move to <i>Text</i> section</span></li> /
                <li class='stylebot-shortcut'><span class='stylebot-key'>c</span><span class='stylebot-key-desc'>Move to <i>Color & Background Color</i> section</span></li> /
                <li class='stylebot-shortcut'><span class='stylebot-key'>b</span><span class='stylebot-key-desc'>Move to <i>Borders</i> section</span></li> /
                <li class='stylebot-shortcut'><span class='stylebot-key'>l</span><span class='stylebot-key-desc'>Move to <i>Layout & Visibility</i> section</span></li></ul>";
                
    var sec3 = "<ul class='stylebot-shortcut-section'><h2>Apply property values</h2> /
                <li class='stylebot-shortcut'><span class='stylebot-key'>h</span><span class='stylebot-key-desc'>Hide/Show selected element(s)</span></li> /
                <li class='stylebot-shortcut'><span class='stylebot-key'>z</span><span class='stylebot-key-desc'>Undo Last Action</span></li></ul>";
    
    var footer = $("<a href='#' id='stylebot-shortcuts-close'>Close</a>").click(closeShortcutHelp);
    content.append(sec1)
    .append(sec2)
    .append(sec3)
    .append(footer);
    div.appendTo(document.body);
    
    // darken page background
    $('<div>', {
        id: 'stylebot-background'
    })
    .css({
        height: document.height,
        opacity: "0.1",
        display: "block"
    })
    .appendTo(document.body);
    
    stylebot.isKeyboardHelpVisible = true;
}

function closeShortcutHelp(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    $("#stylebot-shortcuts").remove();
    $("#stylebot-background").remove();
    
    stylebot.isKeyboardHelpVisible = false;
}