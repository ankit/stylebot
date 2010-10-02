/**
  * stylebot.modal
  * 
  * Modal window used by widget
  **/

stylebot.modal = {
    
    isVisible: false,
    
    modal: null,
    
    cache: {
        textarea: null
    },

    // create the DOM elements
    create: function(options) {
        var textareaHeight = window.innerHeight * 0.45 + 'px';
        var html = "<div>Edit the CSS for <b>" + stylebot.style.cache.url + "</b>:</div><textarea class='stylebot-textarea stylebot-css-code' style='height: " + textareaHeight + "' tabindex='0'></textarea><button class='stylebot-button' style='float:left !important; margin: 0px !important;' tabindex='0'>Copy To Clipboard</button><div style='float: right'><button class='stylebot-button' style='margin: 0px !important; margin-right: 3px !important; float: none;' tabindex='0'>Save</button><button class='stylebot-button' style='margin: 0px !important; float: none;' tabindex='0'>Cancel</button></div>";

        this.modal = new ModalBox(html, options);
        this.cache.textarea = this.modal.box.find('textarea');
        var buttons = this.modal.box.find('button');
        $(buttons[0]).click(stylebot.modal.copyToClipboard);
        $(buttons[1]).click(stylebot.modal.save);
        $(buttons[2]).click(stylebot.modal.cancel);
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
                    Utils.moveCursorToEnd(stylebot.modal.cache.textarea[0]);
                    stylebot.modal.cache.textarea.focus();
                }
            });
        this.fill(content);
        this.modal.options.onClose = function() {
            stylebot.modal.isVisible = false;
            prevTarget.focus();
        }
        this.isVisible = true;
        this.modal.show();
    },
    
    copyToClipboard: function() {
        var text = stylebot.modal.cache.textarea.attr('value');
        stylebot.chrome.copyToClipboard(text);
    },
    
    cancel: function(e) {
        stylebot.modal.modal.hide();
    },
    
    save: function(e) {
        stylebot.style.applyPageCSS(stylebot.modal.cache.textarea.attr('value'));
        stylebot.widget.show();
        stylebot.modal.modal.hide();
    }
}