$(document).ready(function() {
  PageAction.init();
});

var PageAction = {
  styles: {},
  init: function() {
    chrome.windows.getCurrent({populate: true}, function(aWindow) {
      var tabs = aWindow.tabs;
      var len = tabs.length;
      for (var i = 0; i < len; i++) {
        var tab = tabs[i];
        if (tab.active) {
          $(".share").click(function(e) {
            PageAction.share(e, tab);
          });
          $(".open").click(function(e) {
            PageAction.open(e, tab);
          });
          $(".reset").click(function(e) {
            PageAction.reset(e, tab);
          });
          $(".options").click(function(e) {
            PageAction.options(e, tab);
          });

          chrome.tabs.sendRequest(tab.id, {name: "getURL"}, function(response) {
            $.get("http://stylebot.me/search_api?q="+response.url, function(styles_str) {
              var styles = JSON.parse(styles_str);
              var len = styles.length;
              var $menu = $("#menu");

              for (var i = 0; i < len; i++) {
                var name = styles[i].title;
                if (name.length > 30) {
                  name = name.substring(0, 30) + "...";
                }

                var title = styles[i].description;
                var url = styles[i].site;
                var id = styles[i].id;
                var link = "http://stylebot.me/styles/" + id;
                var featured = (styles[i].featured == 1);
                var timeAgo = moment(styles[i].updated_at).fromNow();
                var username = styles[i].username;
                var userLink = "http://stylebot.me/users/" + styles[i].username;
                var favCount = styles[i].favorites;

                PageAction.styles[id] = styles[i].css;

                var html = '<li class="style-item" data-title="' + name +'" data-id="' +
                id + '" data-desc="' + title +
                '" data-author="' + username +
                '" data-favcount="' + favCount +
                '" data-timeago="' + timeAgo +
                '" role="presentation">' +
                '<div role="menuitem" tabindex="-1" href="#">' +
                name + '<span class="style-meta"><a class="style-link" href="' +
                link + '">link</a>';

                if (featured) {
                  html += '<span class="style-featured">featured</span>';
                }

                html += '<span class="pull-right">by <a class="style-author" href="' +
                userLink + '">' + username +'</a></span></div></li>';

                $menu.append(html);
              }

              $('.style-link, .style-author').click(PageAction.openLink);

              $('.style-item').mouseenter(function(e) {
                setTimeout(function() {
                  PageAction.onStyleMouseenter(e, tab);
                }, 0);
              });

              $('#menu').mouseleave(function(e) {
                setTimeout(function() {
                  PageAction.onStyleMouseleave(e, tab)
                }, 100);
              });

              $('.style-item').click(function(e) {
                PageAction.install(e, tab);
              });
            });
          });

          return;
        }
      }
    });
  },

  onStyleMouseenter: function(e, tab) {
    var $el = $(e.target);
    if (!$el.hasClass('style-item')) {
      $el = $el.parent('.style-item');
    }

    var id = $el.data('id');
    var css = PageAction.styles[id];
    var title = $el.data('title');
    var description = $el.data('desc');
    var favCount = $el.data('favcount');
    var author = $el.data('author');
    var timeAgo = $el.data('timeago');

    chrome.tabs.sendRequest(tab.id, {
      name: "preview",
      description: description,
      title: title,
      author: author,
      timeAgo: timeAgo,
      favCount: favCount,
      css: css
    }, function(response){});
  },

  onStyleMouseleave: function(e, tab) {
    chrome.tabs.sendRequest(tab.id, {name: "resetPreview"}, function(response){});
  },

  install: function(e, tab) {
    var $el = $(e.target);
    if ($el.hasClass("style-link") || $el.hasClass("style-author")) {
      return;
    }

    if (!$el.hasClass('style-item')) {
      $el = $el.parent('.style-item');
    }

    var id = $el.data('id');
    var css = PageAction.styles[id];
    var title = $el.data('title');

    chrome.tabs.sendRequest(tab.id, {name: "install", title: title, css: css}, function(response){});
  },

  share: function(e, tab) {
    chrome.tabs.sendRequest(tab.id, {name: "shareOnSocial"}, function(response){});
    window.close();
  },

  open: function(e, tab) {
    chrome.tabs.sendRequest(tab.id, {name: "toggle"}, function(response){});
    window.close();
  },

  options: function(e, tab) {
    chrome.tabs.sendRequest(tab.id, {name: "viewOptions"}, function(response){});
    window.close();
  },

  reset: function(e, tab) {
    chrome.tabs.sendRequest(tab.id, {name: "reset"}, function(response){});
  },

  openLink: function(e, tab) {
    e.preventDefault();
    chrome.tabs.create({
      url: $(e.target).attr('href'),
      active: false
    })
  }
}
