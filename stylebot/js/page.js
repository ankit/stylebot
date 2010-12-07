/**
  * stylebot.page
  * 
  * Edit page's CSS
  **/

stylebot.page = {
    
    isVisible: false,
    
    modal: null,
    
    cache: {
        textarea: null,
        css: null
    },

    // create the DOM elements
    create: function(options) {
        var textareaHeight = window.innerHeight * 0.45 + 'px';
        var html = "<div>Edit the CSS for <b>" + stylebot.style.cache.url + "</b>:</div><textarea class='stylebot-textarea stylebot-css-code' style='height: " + textareaHeight + "' tabindex='0'></textarea><button class='stylebot-button' style='float:left !important; margin: 0px !important;' tabindex='0'>Copy To Clipboard</button><div style='float: right'><button class='stylebot-button' style='margin: 0px !important; margin-right: 3px !important; float: none;' tabindex='0'>Save</button><button class='stylebot-button' style='margin: 0px !important; float: none;' tabindex='0'>Cancel</button></div>";

        this.modal = new ModalBox(html, options, function() {
        });
        stylebot.page.cache.textarea = stylebot.page.modal.box.find('textarea');
        var buttons = stylebot.page.modal.box.find('button');
        $(buttons.get(0)).click(stylebot.page.copyToClipboard);
        $(buttons.get(1)).click(stylebot.page.save);
        $(buttons.get(2)).click(stylebot.page.cancel);
    },
    
    fill: function(content) {
        this.cache.textarea.attr('value', content);
    },
    
    show: function(content, prevTarget) {
        if (!this.modal)
            this.create({
                closeOnEsc: false,
                closeOnBgClick: false,
                bgFadeSpeed: 0,
                onOpen: function() {
                    var textarea = stylebot.page.cache.textarea.get(0);
                    Utils.moveCursorToEnd(textarea);
                    stylebot.page.cache.textarea.focus();
                    stylebot.style.saveState();
                    stylebot.page.cache.css = textarea.value;
                },
                onClose: function() {
                    stylebot.page.isVisible = false;
                    prevTarget.focus();
                }
            });
        this.fill(content);
        this.isVisible = true;
        stylebot.page.modal.show();
    },
    
    copyToClipboard: function() {
        var text = stylebot.page.cache.textarea.attr('value');
        stylebot.chrome.copyToClipboard(text);
    },
    
    cancel: function(e) {
        stylebot.page.modal.hide();
        stylebot.style.clearLastState();
    },
    
    save: function(e) {
        var css = stylebot.page.cache.textarea.attr('value');
        if (stylebot.page.cache.css != css) {
            stylebot.style.applyPageCSS(css);
            stylebot.style.refreshUndoState();
        }
        else
            stylebot.style.clearLastState();
        stylebot.page.cache.css = null;
        stylebot.widget.show();
        stylebot.page.modal.hide();
    }
}