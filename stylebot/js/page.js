/**
  * stylebot.page
  * 
  * Shows the editor for the entire page's CSS
  **/

stylebot.page = {
    
    isVisible: false,
    
    modal: null,

	timer: null,
    
    cache: {
		livePreview: false,
		originalCSS: null,		
        textarea: null,
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
		var html = "<div style='font-size: 12px; line-height: 14px;'>Edit the CSS for <b>" + stylebot.style.cache.url + "</b>:</div>\
		<textarea class='stylebot-textarea stylebot-css-code' tabindex='0'></textarea>\
		<div style='font-size: 11px; margin-bottom: 10px;'>\
		<input type='checkbox' title='This may cause performance issues' class='stylebot-button' />\
		Live Preview Changes\
		</div>\
		<button class='stylebot-button' title='Copy to Clipboard' style='float:left !important; margin: 0px !important;' tabindex='0'>\
		Copy\
		</button>\
		<div style='float: right'>\
		<button class='stylebot-button' style='margin: 0px !important; margin-right: 3px !important; float: none;' tabindex='0'>\
		Save\
		</button>\
		<button class='stylebot-button' style='margin: 0px !important; float: none;' tabindex='0'>\
		Cancel\
		</button>\
		</div>";
		
        this.modal = new ModalBox(html, options, function(){});

        stylebot.page.cache.textarea = stylebot.page.modal.box.find('textarea').keyup(this.contentUpdated);

        var buttons = stylebot.page.modal.box.find('.stylebot-button');

		var $livePreviewCheckbox = $(buttons.get(0));
		
		$livePreviewCheckbox.click(this.toggleLivePreview)
        .tipsy({delayIn: 100, gravity:'sw'});

		stylebot.chrome.getPreference("stylebot_page_live_preview", function(livePreview) {
			if (livePreview) {
				$livePreviewCheckbox.attr('checked', 'checked');
			}
			
			stylebot.page.cache.livePreview = livePreview;
		});
		
        $(buttons.get(1)).click(this.copyToClipboard)
        .tipsy({delayIn: 100, gravity:'sw'});

        $(buttons.get(2)).click(this.save);
        $(buttons.get(3)).click(this.cancel);
    },
    
    fill: function(content) {
        this.cache.textarea.attr('value', content);
    },
    
    show: function(content, prevTarget) {
        if (!this.modal) {
		    this.create({
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
                    var textarea = stylebot.page.cache.textarea.get(0);
                    Utils.moveCursorToEnd(textarea);
                    stylebot.page.cache.textarea.focus();
                    stylebot.style.saveState();
                    stylebot.page.cache.css = textarea.value;
                },

                onClose: function() {
                    stylebot.page.isVisible = false;
                    prevTarget.focus();
        			$(window).unbind('resize', stylebot.page.onWindowResize);
                }
            });
		}
		
		else {
			stylebot.page.modal.reset({
				width: $("#stylebot").width() - 30 + "px",
				top: '0%',
				left: '0',
				height: '100%',
			});
		}

		this.cache.textarea.css('height', $("#stylebot").height() - 125 + "px");
		
        this.fill(content);
		this.cache.originalCSS = content;
        this.isVisible = true;

        stylebot.page.modal.show();

        $(window).bind('resize', this.onWindowResize);
    },
    
    copyToClipboard: function() {
        var text = stylebot.page.cache.textarea.attr('value');
        stylebot.chrome.copyToClipboard(text);
    },

	applyResetCSS: function() {
		stylebot.page.cache.textarea.attr('value', stylebot.page.cache.resetCSS);

		if (stylebot.page.cache.livePreview) {
			stylebot.page.saveCSS(stylebot.page.cache.textarea.attr('value'));
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
			stylebot.page.saveCSS(stylebot.page.cache.textarea.attr('value'));
		}, 100);
	},
    
    cancel: function(e) {
		stylebot.page.cancelChanges();
        stylebot.style.clearLastState();
        stylebot.page.modal.hide();
    },
    
    save: function(e) {
		stylebot.page.saveCSS(stylebot.page.cache.textarea.attr('value'));
        stylebot.widget.open();
        stylebot.page.modal.hide();
    },

	cancelChanges: function() {
		stylebot.page.saveCSS(stylebot.page.cache.originalCSS);
	},

	saveCSS: function(css) {
        if (stylebot.page.cache.css != css) {
            stylebot.style.applyPageCSS(css);
            stylebot.style.refreshUndoState();
        }

        else
            stylebot.style.clearLastState();

        stylebot.page.cache.css = null;
	},
	
	onWindowResize: function() {
		stylebot.page.modal.reset({
			width: $("#stylebot").width() - 30 + "px",
			top: '0%',
			left: '0',
			height: '100%',
		});
		
		stylebot.page.cache.textarea.css('height', $("#stylebot").height() - 125 + "px");		
	}
}