/**
  * Installation of styles from Stylebot Social
  */

stylebot.installation = {
  selectors: {
    style   : '.style',
    channel : '.stylebot-installation',
    button  : '.style-install-btn'
  },

  events: {
    available: 'stylebotIsAvailableEvent',
    success  : 'stylebotInstallationSuccessfulEvent',
    error    : 'stylebotInstallationErrorEvent',
    duplicate: 'stylebotStyleExistsEvent',
    overwrite: 'stylebotOverwriteEvent',
    install  : 'stylebotInstallEvent'
  },

  init: function() {
    // communication channel between stylebot social and the extension
    var $channels = $(this.selectors.channel);

    this.sendAvailabilityMessage($channels.get(0));

    if ($channels.length != 0) {

      $channels.bind(this.events.install, function(e) {
        console.log('Stylebot: Install event received. Installing style...');

        var $style = $(e.target).closest(stylebot.installation.selectors.style);
        var url    = $.trim($style.find(stylebot.installation.selectors.channel).data('url'));

        // check if a duplicate style already exists
        stylebot.chrome.doesStyleExist(url, function(response) {
          if (response) {
            console.log("Style for '" + url + "' already exists.");
            stylebot.installation.sendDuplicateWarning(e.target);
          }
          else {
            stylebot.installation.save(e);
          }
        });
      });

      // Bind listener for overwrite installation
      // (without checking if style already exists)
      $channels.bind(this.events.overwrite, function(e) {
        console.log('Stylebot: Overwrite event received. Installing style...');
        stylebot.installation.save(e);
      });
    }
  },

  save: function(event) {
    var channel  = event.target;
    var $channel = $(channel);
    var data     = $channel.data();

    var parser = new CSSParser();

    try {
      var sheet = parser.parse($channel.text(), false, true);
      var rules = CSSUtils.getRulesFromParserObject(sheet);

      stylebot.chrome.save(data.url, rules, {
        id: data.id,
        timestamp: data.timestamp
      });

      this.sendSuccessMessage(channel);
    }

    catch (e) {
      this.sendErrorMessage(channel, e);
    }
  },

  sendAvailabilityMessage: function(channel) {
    console.log("Stylebot: I'm available!");
    this.sendMessage(channel, this.events.available);
  },

  sendSuccessMessage: function(channel) {
    console.log("Stylebot: Style was successfully installed!");
    this.sendMessage(channel, this.events.success);
  },

  sendErrorMessage: function(channel, e) {
    console.log("Stylebot: Error parsing css: " + e);
    this.sendMessage(channel, this.events.error);
  },

  sendDuplicateWarning: function(channel) {
    this.sendMessage(channel, this.events.duplicate);
  },

  sendMessage: function(channel, message) {
    var customEvent = document.createEvent('Event');
    customEvent.initEvent(message, true, true);
    channel.dispatchEvent(customEvent);
  }
}

$(document).ready(function(e) {
  stylebot.installation.init();
});
