/**
  * stylebot.page
  *
  * Shows the editor for the entire page's CSS
  **/

stylebot.page = {
    
    BOTTOM_PADDING: 110,

    isVisible: false,

    modal: null,

    timer: null,

    cache: {
        livePreview: false,
        originalCSS: null,
        editor: null,
        error: null,
        css: null,
        // Reset CSS from http://meyerweb.com/eric/tools/css/reset/
        //
        resetCSS: 'html, body, div, span, applet, object, iframe,\n\
h1, h2, h3, h4, h5, h6, p, blockquote, pre,\n\
a, abbr, acronym, address, big, cite, code,\n\
del, dfn, em, img, ins, kbd, q, s, samp,\n\
small, strike, strong, sub, sup, tt, var,\n\
b, u, i, center,\n\
dl, dt, dd, ol, ul, li,\n\
fieldset, form, label, legend,\n\
table, caption, tbody, tfoot, thead, tr, th, td,\n\
article, aside, canvas, details, embed,\n\
figure, figcaption, footer, header, hgroup,\n\
menu, nav, output, ruby, section, summary,\n\
time, mark, audio, video {\n\
    margin: 0 !important;\n\
    padding: 0 !important;\n\
    border: 0 !important;\n\
    font-size: 100% !important;\n\
    font: inherit !important;\n\
    vertical-align: baseline !important;\n\
}\n\
\n\
article, aside, details, figcaption, figure,\n\
footer, header, hgroup, menu, nav, section {\n\
    display: block !important;\n\
}\n\
\n\
body {\n\
    line-height: 1 !important;\n\
}\n\
\n\
ol, ul {\n\
    list-style: none !important;\n\
}\n\
\n\
blockquote, q {\n\
    quotes: none !important;\n\
}\n\
\n\
blockquote:before, blockquote:after,\n\
q:before, q:after {\n\
    content: "" !important;\n\
    content: none !important;\n\
}\n\
\n\
table {\n\
    border-collapse: collapse !important;\n\
    border-spacing: 0 !important;\n\
}\n'
    },

    create: function(options) {
        var html = "<div>\
        <div style='font-size: 12px !important; line-height: 14px !important;'>Edit the CSS for <b>" + stylebot.style.cache.url + "</b>:</div>\
        </div>\
        <div style='font-size: 11px !important; margin-bottom: 10px !important;'>\
        <label>\
        <input type='checkbox' title='This may cause performance issues' class='stylebot-button' />\
        Live Preview Changes\
        </label>\
        </div>\
        <button class='stylebot-button' title='Copy to Clipboard' style='float:left !important; margin: 0px !important;' tabindex='0'>\
        Copy\
        </button>\
        <div style='float: right !important;'>\
        <button class='stylebot-button' style='margin: 0px !important; margin-right: 3px !important; float: none !important;' tabindex='0'>\
        Save\
        </button>\
        <button class='stylebot-button' style='margin: 0px !important; float: none !important;' tabindex='0'>\
        Cancel\
        </button>\
        </div>";

        this.modal = new ModalBox(html, options, function(){});

        var attachTo = stylebot.page.modal.box.find('div').get(0);

        stylebot.page.cache.editor = CodeMirror(attachTo, {
            mode: "css",
            lineNumbers: true,
            indentUnit: 4,
            tabMode: "shift",
            onKeyEvent: this.contentUpdated
            /*
            i'm not sure to update the css on keydown events only or updating for everything,
            as for now, the css is updated on any keyboard event
            function(i,e){
                if(jQuery.Event(e).type == 'keydown');
            }
            */
        });

        var buttons = stylebot.page.modal.box.find('.stylebot-button');

        var $livePreviewCheckbox = $(buttons.get(0));

        $livePreviewCheckbox.click(this.toggleLivePreview)
        .tipsy({delayIn: 100, gravity:'sw'});

        stylebot.chrome.getPreference("stylebot_page_live_preview", function(livePreview) {
            if (livePreview) {
                $livePreviewCheckbox.prop('checked', true);
            }

            stylebot.page.cache.livePreview = livePreview;
        });

        $(buttons.get(1)).click(this.copyToClipboard)
        .tipsy({delayIn: 100, gravity:'sw'});

        $(buttons.get(2)).click(this.save);
        $(buttons.get(3)).click(this.cancel);
    },

    show: function(content, prevTarget) {
        var self = this;
        
        if (!self.modal) {
            self.create({
                closeOnEsc: false,
                closeOnBgClick: false,
                bgFadeSpeed: 0,
                width: $("#stylebot").width() - 30 + "px",
                top: '0%',
                left: '0',
                height: $("#stylebot").height() - 30 + "px",
                bgOpacity: 0,
                parent: $("#stylebot"),

                onOpen: function() {
                    self.modal.box.find('.CodeMirror').css('height', $("#stylebot").height() - stylebot.page.BOTTOM_PADDING + "px !important");
                    var editor = self.cache.editor;
                    editor.setValue(self.cache.originalCSS);
                    editor.focus();
                    editor.setCursor(editor.lineCount(), 0);
                    self.clearSyntaxError();
                    stylebot.style.saveState();
                    self.cache.css = editor.getValue();
                },

                onClose: function() {
                    self.isVisible = false;
                    prevTarget.focus();
                    $(window).unbind('resize', self.onWindowResize);
                }

            });
        }

        else {
            stylebot.page.modal.reset({
                width: $("#stylebot").width() - 30 + "px",
                top: '0%',
                left: '0',
                height: $("#stylebot").height() - 30 + "px",
            });
        }

        $('.CodeMirror').css('height', $("#stylebot").height() - stylebot.page.BOTTOM_PADDING + "px");

        self.cache.originalCSS = content;

        self.modal.show();
        self.isVisible = true;
        
        $(window).bind('resize', this.onWindowResize);
    },

    copyToClipboard: function() {
        var text = stylebot.page.cache.editor.getValue();
        if (text != undefined)
            stylebot.chrome.copyToClipboard(text);
    },

    /* @not in use : Used to reset the existing CSS of page */
    applyResetCSS: function() {
        stylebot.page.modal.cache.setValue(stylebot.page.cache.resetCSS);

        if (stylebot.page.cache.livePreview) {
            stylebot.page.saveCSS(stylebot.page.cache.editor.getValue(), false);
        }
    },

    toggleLivePreview: function() {
        if (stylebot.page.cache.livePreview)
            stylebot.page.cache.livePreview = false;

        else {
            stylebot.page.cache.livePreview = true;
            stylebot.page.contentUpdated();
        }

        stylebot.chrome.savePreference("stylebot_page_live_preview", true);
    },

    contentUpdated: function() {
        if (!stylebot.page.cache.livePreview)
            return;

        if (stylebot.page.timer) {
            clearTimeout(stylebot.page.timer);
            stylebot.page.timer = null;
        }

        stylebot.page.timer = setTimeout(function() {
            try {
                stylebot.page.saveCSS(stylebot.page.cache.editor.getValue(), false);
            }
            
            catch (e) {
                //
            }
        }, 100);
    },

    cancel: function(e) {
        stylebot.page.saveCSS(stylebot.page.cache.originalCSS, true);
        stylebot.style.clearLastState();
        stylebot.page.modal.hide();
        stylebot.widget.open();
    },

    save: function(e) {
        if (stylebot.page.saveCSS(stylebot.page.cache.editor.getValue(), true)) {
            stylebot.page.modal.hide();
            stylebot.widget.open();
        }
    },

    saveCSS: function(css, save) {
        if (css === undefined)
            return true;

        if (stylebot.page.cache.css != css)
        {
            stylebot.page.cache.css = null;
            var response = stylebot.style.applyPageCSS(css, save);

            if (response != true) {
                stylebot.page.displaySyntaxError(response, save);
                return false;
            }
            
            stylebot.page.clearSyntaxError();
            stylebot.style.refreshUndoState();
        }
        
        else
            stylebot.style.clearLastState();
            
        return true;
    },

    onWindowResize: function() {
        stylebot.page.modal.reset({
            width: $("#stylebot").width() - 30 + "px",
            top: '0%',
            left: '0',
            height: $("#stylebot").height() - 30 + "px",
        });

        $('.CodeMirror').css('height', $("#stylebot").height() - stylebot.page.BOTTOM_PADDING + "px");
    },
    
    displaySyntaxError: function(error, setCursor) {
        this.cache.editor.setMarker(error.currentLine - 1, "<span class='stylebot-error-marker'>!</span> %N%");
        this.cache.editor.errorLine = error.currentLine - 1;
        if (setCursor)
            this.cache.editor.setCursor(error.currentLine - 1, 0);
    },
    
    clearSyntaxError: function() {
        if (this.cache.editor.errorLine != undefined)
            this.cache.editor.clearMarker(this.cache.editor.errorLine);
        this.cache.editor.errorLine = 0;
    }
}