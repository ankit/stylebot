function handleKeyboardShortcut(e) {
    var tag = e.target.tagName.toLowerCase();
    if ((tag == "input" && e.target.type == 'text') || tag == "textarea") {
        return true;
    }
    // console.log(e.keyCode);
    // 's': shortcut to toggle selection of element
    if (e.keyCode == 115) {
        stylebot.toggleSelection();
    }
    // 'h': hide/show currently selected element(s)
    if (e.keyCode == 104) {
        if (stylebot.selectedElement) {
            $("#stylebot-display").click();
        }
    }
    // 'm': toggle basic/advanced mode
    if (e.keyCode == 109) {
        stylebot.widget.toggleMode();
    }
    // 'e': Open the edit css popup
    if (e.keyCode == 101) {
        e.stopPropagation();
        e.preventDefault();
        $("#stylebot-main-buttons button:contains(Edit CSS)").click();
    }
    
    // 'v': toggle highlight of *all* the elements for current selector
    // TODO: Add functionality to this
    
    // 'p': Toggle Stylebot's position
    if (e.keyCode == 112) {
        stylebot.widget.togglePosition();
    }
    
    // 'z': Undo last action
    if (e.keyCode == 122) {
        stylebot.style.undo();
    }
    
    /** Jump around sections **/
    
    // 't': Jump to Text
    if (e.keyCode == 116) {
        $(".stylebot-accordion-header:contains('Text')").focus();
    }
    
    // 'c': Jump to Color
    if (e.keyCode == 99) {
        $(".stylebot-accordion-header:contains('Color')").focus();
    }
    
    // 'b': Jump to Borders
    if (e.keyCode == 98) {
        $(".stylebot-accordion-header:contains('Borders')").focus();
    }
    
    // 'l': Jump to Layout
    if (e.keyCode == 108) {
        $(".stylebot-accordion-header:contains('Layout')").focus();
    }
    
    return false;
}

function attachKeyboardShortcuts() {
    document.addEventListener('keypress', handleKeyboardShortcut, true);
}

function detachKeyboardShortcuts() {
    document.removeEventListener('keypress', handleKeyboardShortcut, true);
}