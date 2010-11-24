
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
            stylebot.enable();
            stylebot.select(stylebot.contextmenu.cache.el);
        }
    }
}