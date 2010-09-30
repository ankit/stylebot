function handleKeyboardShortcut(e) {
    var tag = e.target.tagName.toLowerCase();
    if ((tag == "input" && e.target.type == 'text') || tag == "textarea") {
        return true;
    }
    console.log(e.keyCode);
    // 's': shortcut to toggle selection of element
    if (e.keyCode == 115) {
        stylebot.toggleSelection();
        return true;
    }
    // 'h': hide/show currently selected element
    if (e.keyCode == 104) {
        if (stylebot.selectedElement) {
            $("#stylebot-display").click();
        }
        return true;
    }
    // 'm': toggle basic/advanced mode
    if (e.keyCode == 109) {
        stylebot.widget.toggleMode();
        return true;
    }
    // 'e': Open the edit css modal popup
    if (e.keyCode == 101) {
        $("#stylebot-main-buttons button:contains(Edit CSS)").click();
        return false;
    }
    
    // 'v': toggle highlight of *all* the elements for current selector
    // TODO: Add functionality to this
    
    // 'p': Toggle Stylebot's position
    if (e.keyCode == 112) {
        stylebot.widget.togglePosition();
        return true;
    }
    
    // 'z': Undo last action
    if (e.keyCode == 122) {
        stylebot.style.undo();
        return true;
    }
    
    /** Jump around sections **/
    
    // 't': Jump to Text
    if (e.keyCode == 116) {
        $(".stylebot-accordion-header:contains('Text')").focus();
        return true;
    }
    
    // 'c': Jump to Color
    if (e.keyCode == 99) {
        $(".stylebot-accordion-header:contains('Color')").focus();
        return true;
    }
    
    // 'b': Jump to Borders
    if (e.keyCode == 98) {
        $(".stylebot-accordion-header:contains('Borders')").focus();
        return true;
    }
    
    // 'l': Jump to Layout
    if (e.keyCode == 108) {
        $(".stylebot-accordion-header:contains('Layout')").focus();
        return true;
    }
}

function attachKeyboardShortcuts() {
    document.addEventListener('keypress', handleKeyboardShortcut, true);
}

function detachKeyboardShortcuts() {
    document.removeEventListener('keypress', handleKeyboardShortcut, true);
}