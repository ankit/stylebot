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
        var textareaHeight = window.innerHeight * 0.5 + 'px';
        var html = "<div>Edit the CSS for <b>" + stylebot.style.cache.url + "</b>:</div><textarea class='stylebot-textarea stylebot-css-code' style='width: 98%; height: " + textareaHeight + "' ></textarea><button class='stylebot-button' style='float:left !important;'>Copy To Clipboard</button><button class='stylebot-button' >Cancel</button><button class='stylebot-button'>Save</button>";

        this.modal = new ModalBox(html, options);
        this.cache.textarea = this.modal.box.find('textarea');
        var buttons = this.modal.box.find('button');
        $(buttons[0]).click(stylebot.modal.copyToClipboard);
        $(buttons[1]).click(stylebot.modal.cancel);
        $(buttons[2]).click(stylebot.modal.save);
    },
    
    fill: function(content) {
        this.cache.textarea.html(content);
    },
    
    show: function(content, prevTarget) {
        if (!this.modal)
            this.create({
                closeOnEsc: false,
                closeOnBgClick: false,
                onOpen: function() {
                    Utils.moveCursorToEnd(stylebot.modal.cache.textarea[0]);
                    stylebot.modal.cache.textarea.focus();
                }
            });
        this.modal.options.onClose = function() {
            stylebot.modal.isVisible = false;
            prevTarget.focus();
        }
        this.fill(content);
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
    
    save: function() {
        stylebot.style.applyPageCSS(stylebot.modal.cache.textarea.attr('value'));
        stylebot.widget.show();
        stylebot.modal.modal.hide();
    }
}