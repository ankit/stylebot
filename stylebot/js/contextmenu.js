
stylebot.contextmenu = {
    cache: {
        el: null
    },
    
    initialize: function() {
        this.attachListeners();
    },
    
    attachListeners: function() {
        $(document.body).bind('contextmenu', function(e) {
            stylebot.contextmenu.cache.el = e.target;
        });
    },
    
    openWidget: function() {
        if (stylebot.contextmenu.cache.el && stylebot.contextmenu.cache.el.nodeType == 1)
        {
            stylebot.open();
            stylebot.select(stylebot.contextmenu.cache.el);
        }
    },

	searchSocial: function() {
		window.open("http://stylebot.me/search?q=" + document.domain);
	},
	
	shareStyleOnSocial: function() {
		// check if the current page has any styles
		if (stylebot.style.rules) {
			
			var css = CSSUtils.crunchFormattedCSS(stylebot.style.rules, false);
			var url = "http://stylebot.me/post";

			// create a form and submit data
			var temp_form = $('<form>', {
				'method': 'post',
				'action': url,
				'target': '_self'
			});
			
			// site
			$('<input>', {
				type: 'hidden',
				name: 'site',
				value: stylebot.style.cache.url
			}).appendTo(temp_form);

			// css
			$('<input>', {
				type: 'hidden',
				name: 'css',
				value: css
			}).appendTo(temp_form);

			$('<submit>').appendTo(temp_form);

			temp_form.submit();

			temp_form.remove();
		}
	}
}