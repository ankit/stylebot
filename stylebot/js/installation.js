$(document).ready(function(e) {
	sendAvailabilityMessage();
	
	// respond to requests from stylebot social
	var $install_divs = $('.stylebot_install_div');

	if ($install_divs.length != 0) {
		$install_divs.bind('stylebotInstallEvent', function(e) {
			console.log("Stylebot: Install event received! Dispatching request...");
			var $parent = $(e.target).closest('.post');
			var css = $.trim($(this).text());
			console.log('CSS: ' + css);
			var site = $.trim($parent.find('.post_site').text());
			console.log("Site: " + site);
			
			// let's parse the css
			var parser = new CSSParser();
			try {
				var sheet = parser.parse(css);
				var rules = CSSUtils.getRulesFromParserObject(sheet);
				console.log("Parsed Rules: %o", rules);
				stylebot.chrome.save(site, rules);
				
				// send back success message
				var customEvent = document.createEvent('Event');
				customEvent.initEvent('stylebotInstallationSuccessfulEvent', true, true);				
				this.dispatchEvent(customEvent);
			}
			catch(e) {
				console.log("Error parsing css: " + e);

				// send back error message
				var customEvent = document.createEvent('Event');
				customEvent.initEvent('stylebotInstallationErrorEvent', true, true);
				this.dispatchEvent(customEvent);
			}
		}); 
	}
});

function sendAvailabilityMessage() {
	// get first available install div
	install_div = $('.stylebot_install_div').get(0);
	// create event
	if (install_div) {
		var customEvent = document.createEvent('Event');
		customEvent.initEvent('stylebotIsAvailableEvent', true, true);
		install_div.dispatchEvent(customEvent);
	}
}