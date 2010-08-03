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
        var html = "<div>Custom CSS for <b>" + stylebot.style.cache.url + "</b>:</div><textarea class='stylebot-textarea stylebot-css-code' style='width: 98%; height: " + textareaHeight + "' ></textarea><button class='stylebot-button'>Copy to Clipboard</button>";

        this.modal = new ModalBox(html, options);
        this.cache.textarea = this.modal.box.find('textarea');
        this.modal.box.find('button')
        .click(stylebot.modal.copyToClipboard);
    },
    
    fill: function(content) {
        this.cache.textarea.html(content);
    },
    
    show: function(content, options) {
        if (!this.modal)
            this.create({
                onOpen: function() {
                    Utils.selectAllText(stylebot.modal.cache.textarea[0]);
                    stylebot.modal.cache.textarea.focus();
                },
                onClose: options.onClose
            });
        this.fill(content);
        this.isVisible = true;
        this.modal.show();
    },
    
    copyToClipboard: function() {
        var text = stylebot.modal.cache.textarea.attr('value');
        stylebot.chrome.copyToClipboard(text);
    }
}