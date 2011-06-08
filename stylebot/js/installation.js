$(document).ready(function(e) {
    // let social know stylebot is installed
    sendAvailabilityMessage();

    // communication channel between stylebot social and the extension
    var $install_divs = $('.stylebot_install_div');

    if ($install_divs.length != 0) {

        // Bind listener for install event
        $install_divs.bind('stylebotInstallEvent', function(e) {
            console.log('Stylebot: Install event received. Installing style...');

            var $post = $(e.target).closest('.post');

            var url = $.trim($post.find('.post_site').text());

            // first, let's check if a style already exists for the url
            stylebot.chrome.doesStyleExist(url, function(response) {

                // if yes, warn the user
                if (response) {
                    console.log("Style for '" + url + "' already exists.");

                    var customEvent = document.createEvent('Event');
                    customEvent.initEvent('stylebotStyleExistsEvent', true, true);
                    e.target.dispatchEvent(customEvent);
                }

                // else save the style
                else
                    saveStyleFromSocial(e);
            });
        });


        // Bind listener for overwrite installation (without checking if style already exists)

        $install_divs.bind('stylebotOverwriteEvent', function(e) {
            console.log('Stylebot: Overwrite event received. Installing style...');

            var $post = $(e.target).closest('.post');

            saveStyleFromSocial(e);
        });
    }
});


// Sends stylebot social an availability message
function sendAvailabilityMessage() {
    // get the first communication DIV in DOM
    var install_div = $('.stylebot_install_div').get(0);

    // dispatch the message
    if (install_div) {
        var customEvent = document.createEvent('Event');
        customEvent.initEvent('stylebotIsAvailableEvent', true, true);
        install_div.dispatchEvent(customEvent);
    }
}


// Send request to background.html to save style along with metadata (id, timestamp, etc.)
function saveStyleFromSocial(installationEvent) {
    // @deprecated
    //
    // var $channel = $(channel);
    // var $post = $channel.closest('.post');
    //
    // var css = $channel.text();
    //
    // var url = $.trim( $post.find('.post_site').text() );
    //
    // var timestamp = $post.attr('data-timestamp');
    //
    // var id = $post.attr('id').substring(4);

    // @new stuff
    var channel = installationEvent.target;
    var $channel = $(channel);
    var data = $channel.data();

    var parser = new CSSParser();

    try {
        var sheet = parser.parse($channel.text(), false, true);
        var rules = CSSUtils.getRulesFromParserObject(sheet);

        // add the meta header
        var header = '/**\n    Title: ' + data.title
        + '\n    URL: http://stylebot.me/styles/' + data.id
        + '\n    Author: ' + data.author
        + '\n    Author URL: http://stylebot.me/users/' + data.author;

        if (data.description) {
            header += '\n    Description: ' + data.description;
        }

        header += '\n**/';

        var rulesWithMeta = { 'comment-#0' : { comment: header } };

        for (selector in rules)
            rulesWithMeta[selector] = rules[selector];

        stylebot.chrome.save(data.url, rulesWithMeta, { id: data.id, timestamp: data.timestamp });
        stylebot.chrome.pushStyles();

        // send back success message
        var customEvent = document.createEvent('Event');
        customEvent.initEvent('stylebotInstallationSuccessfulEvent', true, true);
        channel.dispatchEvent(customEvent);
    }

    catch (e) {
        console.log('Error parsing css: ' + e);

        // send back error message
        var customEvent = document.createEvent('Event');
        customEvent.initEvent('stylebotInstallationErrorEvent', true, true);
        channel.dispatchEvent(customEvent);
    }
}
