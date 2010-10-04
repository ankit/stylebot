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
        // 's': shortcut to toggle selection of element, keypress: 115
        case 83:   stylebot.toggleSelection(); return false;
        
        // 'h': hide/show currently selected element(s), keypress: 104
        case 72:   if (stylebot.selectedElement) { 
                        $("#stylebot-display").click();
                    }
                    return false;

        // 'm': toggle basic/advanced mode, keypress: 109
        case 77:   stylebot.widget.toggleMode(); return false;

        // 'e': Open the edit css popup, keypress: 101, keydown: 69
        case 69:   e.stopPropagation();
                    e.preventDefault();
                    $("#stylebot-main-buttons button:contains(Edit CSS)").click();
                    return false;
                    
        // 'p': Toggle Stylebot's position, keypress: 112
        case 80:   stylebot.widget.togglePosition(); return false;
        
        // 'z': Undo last action, keypress: 122
        case 90:   stylebot.style.undo(); return false;
        
        /** Jump around sections **/
        
        // 't': Jump to Text, keypress: 116
        case 84:   $(".stylebot-accordion-header:contains('Text')").focus(); return false;
        
        // 'c': Jump to Color, keypress: 99
        case 67:    $(".stylebot-accordion-header:contains('Color')").focus(); return false;
        
        // 'b': Jump to Borders, keypress: 98
        case 66:    $(".stylebot-accordion-header:contains('Borders')").focus(); return false;
        
        // 'l': Jump to Layout, keypress: 108
        case 76:   $(".stylebot-accordion-header:contains('Layout')").focus(); return false;
        
        // '?': Display shortcuts keypress: 63
        case 191:    if (e.shiftKey) {
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

/** Keyboard shortcuts help **/

function displayShortcutHelp() {
    var div = $("<div>", {
        id: "stylebot-shortcuts"
    });
    
    $("<h1>", {
        html: "Stylebot Keyboard shorcuts"
    }).appendTo(div);
    
    var sec1 = "<ul class='stylebot-shortcut-section'><h2>Manage Stylebot</h2>"+
                "<li class='stylebot-shortcut'><span class='stylebot-key'>s:</span>Toggle ability to select an element</li>"+
                "<li class='stylebot-shortcut'><span class='stylebot-key'>m:</span>Switch between Basic / Advanced Mode</li>"+
                "<li class='stylebot-shortcut'><span class='stylebot-key'>p:</span>Move Panel Left / Right</li>"+
                "<li class='stylebot-shortcut'><span class='stylebot-key'>e:</span>Open Popup to Edit Page's CSS</li>"+
                "<li class='stylebot-shortcut'><span class='stylebot-key'>z:</span>Undo Last Action</li></ul>";
                
    var sec2 = "<ul class='stylebot-shortcut-section'><h2>Navigate Sections</h2>"+
                "<li class='stylebot-shortcut'><span class='stylebot-key'>t:</span>Move to <i>Text</i> section</li>"+
                "<li class='stylebot-shortcut'><span class='stylebot-key'>c:</span>Move to <i>Color & Background Color</i> section</li>"+
                "<li class='stylebot-shortcut'><span class='stylebot-key'>b:</span>Move to <i>Borders</i> section</li>"+
                "<li class='stylebot-shortcut'><span class='stylebot-key'>l:</span>Move to <i>Layout & Visibility</i> section</li></ul>";
                
    var sec3 = "<ul style='clear:left' class='stylebot-shortcut-section'><h2>Apply specific property values</h2>"+
                "<li class='stylebot-shortcut'><span class='stylebot-key'>h:</span>Hide/Show selected element(s)</li></ul>";
                
    var footer = $("<a href='#' id='stylebot-shortcuts-close'>Close</a>").click(closeShortcutHelp);
    div.append(sec1)
    .append(sec2)
    .append(sec3)
    .append(footer)
    .appendTo(document.body);

    // darken page background
    $('<div>', {
        id: 'stylebot-background'
    })
    .css({
        height: document.height,
        opacity: "0.7",
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