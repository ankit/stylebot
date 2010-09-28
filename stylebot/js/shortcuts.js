function handleKeyboardShortcut(e) {
    var tag = e.target.tagName.toLowerCase();
    if ((tag == "input" && e.target.type == 'text') || tag == "textarea") {
        return true;
    }
    console.log(e.keyCode);
    // 't': shortcut to toggle selection of element
    if (e.keyCode == 116) {
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
    //b = 98; bold
}

function attachKeyboardShortcuts() {
    $(document).bind('keypress', handleKeyboardShortcut);
}

function detachKeyboardShortcuts() {
    $(document).unbind('keypress', handleKeyboardShortcut);
}