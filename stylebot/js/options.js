$(document).ready(function() {
   init(); 
});

/* Javascript for stylebot options page */

var bg_window = null;

var cache = {
    modal: null,
    textareaHeight: null
}

// default values for options
var defaults = {
	useShortcutKey: true,
	contextMenu: true,
	shortcutKey: 77, // keycode for 'm'
	shortcutMetaKey: 'alt',
	mode: "Basic"
}

var options = {
    useShortcutKey: null,
	contextMenu: null,
    shortcutKey: null,
    shortcutMetaKey: null,
    mode: null,
    sync: null
}

var styles = {};

// initialize options
function init() {
	// initialize tabs
	initializeTabs();
	
    // fetch options from datastore
    fetchOptions();

 	$.each(options, function(option, value) {
		var $el = $('[name=' + option + ']');
		var el = $el.get(0);
		if (el == undefined)
			return;
		var tag = el.tagName.toLowerCase();
		
		if (el.type === "checkbox") {
			if (value == true)
				el.checked = true;
		}
		
		else if (tag === "select" || el.type === "hidden") {
			if (value != undefined)
				el.value = value;
			else
				el.value = defaults[option];
		}
		
		else if (el.type === "radio") {
			var len = $el.length;
			if (value == undefined)
				value = defaults[option];
			for (var i = 0; i < len; i++) {
				if ($el.get(i).value == value)
				{
					$el.get(i).checked = true;
					return true;
				}
			}
		}
		
	});
	
    KeyCombo.init($('[name=shortcutKeyCharacter]').get(0), $('[name=shortcutKey]').get(0));

    bg_window = chrome.extension.getBackgroundPage();
    styles = bg_window.cache.styles;
    
    fillCustomStyles();
    attachListeners();
    initFiltering();
    setSyncUI();

	// hack to wait for window.innerHeight to be available
    setTimeout(function() {
        cache.textareaHeight = window.innerHeight * 0.5 + 'px';
    }, 100);
}

// Initialize tabs
function initializeTabs() {
	$("ul.menu li:first").addClass("tabActive").show(); 
	$("#options > div").hide();
	$("#basic-options").show();
	
	// click event for tab menu items
	$("ul.menu li").click(function() {

		$("ul.menu li").removeClass("tabActive"); 
		$(this).addClass("tabActive");
		$("#options > div").hide();
		
		// Get DIV ID for content from the href of the menu link
		var activeTab = $(this).find("a").attr("href");
		$(activeTab).fadeIn();
		return false;
	});
}

// fetches options from the datastore
function fetchOptions() {
	$.each(options, function(option, value) {
		var dataStoreValue = localStorage['stylebot_option_' + option];
		if (dataStoreValue == "true" || dataStoreValue == "false")
			options[option] = (dataStoreValue == "true");
		else
			options[option] = dataStoreValue;
	});
}

function attachListeners() {
	// checkbox
	$('.option-field input[type=checkbox]').change(function(e) {
        var name = e.target.name;
        var value = translateOptionValue(name, e.target.checked);
        bg_window.saveOption(name, value);
    });

    // radio
    $('.option-field input[type=radio]').change(function(e) {
        var name = e.target.name;
        var value = translateOptionValue(name, e.target.value);
        bg_window.saveOption(name, value);
    });
    
    // select
    $('.option-field select').change(function(e) {
        bg_window.saveOption(e.target.name, e.target.value);
    });
    
    // textfields
    $('.option-field input[type=text]').keyup(function(e) {
		if (e.target.name == "shortcutKeyCharacter")
			option = "shortcutKey";
		else
			option = e.target.name;
        bg_window.saveOption(option, translateOptionValue(option, e.target.value));
    });
}

function translateOptionValue(name, value) {
    switch(name) {
        case "sync": return (value == "true") ? true : false;
        case "shortcutKey": return $('[name=shortcutKey]').attr('value');
    }
    return value;
}

/** custom styles **/

function fillCustomStyles() {
    var container = $("#custom-styles");
    for (var url in styles)
        container.append(createCustomStyleOption(url, styles[url]));
}

function createCustomStyleOption(url, rules) {
    var container = $('<div>', {
        class: 'custom-style'
    });
    
    var url_div = $('<div>', {
        html: url,
        class: 'custom-style-url',
        tabIndex: 0
    })
    .data('value', url)
    .appendTo(container);
    
    Utils.makeEditable(url_div , function(newValue) {
        editURL( url_div.data('value'), newValue);
        url_div.data('value', newValue);
        setTimeout(function(){
            url_div.focus();
        }, 0);
    }, {fixedWidth: 400});
    
    var b_container = $('<div>', {
        class: 'button-container'
    });

    $('<button>', {
        html: 'share',
        class: 'inline-button'
    })
    .click(shareStyle)
    .appendTo(b_container);
    
    $('<button>', {
        html: 'edit',
        class: 'inline-button'
    })
    .click(editStyle)
    .appendTo(b_container);
    
    $('<button>', {
        html: 'remove',
        class: 'inline-button'
    })
    .click(removeStyle)
    .appendTo(b_container);
    
    return container.append(b_container);
}

function removeStyle(e) {
    var parent = $(e.target).parents('.custom-style');
    var url = parent.find('.custom-style-url');
    delete styles[url.html()];
    parent.remove();
    bg_window.saveStyles(styles);
}

function editStyle(e) {
    var parent = $(e.target).parents('.custom-style');
    var url = parent.find('.custom-style-url').html();
    var rules = styles[url];
    var css = CSSUtils.crunchFormattedCSS(rules, false);
    
    var html = "<div>Edit the CSS for <b>" + url + "</b>:</div><textarea class='stylebot-css-code' style='width: 100%; height:" + cache.textareaHeight + "'>" + css + "</textarea><button onclick='cache.modal.hide();'>Cancel</button><button onclick='onUpdate();cache.modal.hide();'>Save</button>";
    
    initModal(html);
    
    cache.modal.options.onOpen = function() { 
        var textarea = cache.modal.box.find('textarea').get(0);
        textarea.focus();
        Utils.moveCursorToEnd(textarea);
    };
    cache.modal.show();
}

function shareStyle(e) {
	var parent = $(e.target).parents('.custom-style');
    var url = parent.find('.custom-style-url').html();
    var rules = styles[url];
    var css = CSSUtils.crunchFormattedCSS(rules, false);

	var production_url = "http://stylebot.me/playground/social/post";
	var local_url = "http://localhost:8888/stylebot_social/post";
	
	// create a form and submit data
	var temp_form = $('<form>', {
		'method': 'post',
		'action': local_url,
		'target': '_blank'
	});
	// site
	$('<input>', {
		type: 'hidden',
		name: 'site',
		value: url
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

function onUpdate() {
    var url = cache.modal.box.find('div > b').html();
    var css = cache.modal.box.find('textarea').attr('value');
    saveStyle(url, css);
}

function addStyle() {
    var html = "<div>URL: <input type='text'></input></div><textarea class='stylebot-css-code' style='width: 100%; height:" + cache.textareaHeight + "'></textarea><button onclick= 'cache.modal.hide();' >Cancel</button><button onclick= 'onAdd(); cache.modal.hide();' >Add</button>";
    
    initModal(html);
    cache.modal.options.onOpen = function() { cache.modal.box.find('input').focus(); };
    cache.modal.show();
}

function onAdd() {
    var url = cache.modal.box.find('input').attr('value');
    var css = cache.modal.box.find('textarea').attr('value');
    if (css == "")
        return false;

    if (saveStyle(url, css))
        createCustomStyleOption(url, styles[url]).appendTo($("#custom-styles"));
}

function saveStyle(url, css) {
    var parser = new CSSParser();
    var sheet = parser.parse(css);
    var rules = null;
    var retVal = false;
    if (sheet) {
        try {
            styles[url] = CSSUtils.getRulesFromParserObject(sheet);
            retVal = true;
        }
        catch(e) {}
    }
    else if (styles[url]) {
        delete styles[url];
        $('.custom-style-url:contains(' + url + ')').parent().remove();
    }
    bg_window.saveStyles(styles);
    return retVal;
}

function editURL(oldValue, newValue) {
    if (oldValue == newValue || newValue == "")
        return;
    // going through a loop so that new entry is inserted at the same position
    // otherwise, on changing the url, new entry is inserted at the bottom
    var newStyles = {};
    for (var url in styles) {
        if (url == oldValue) {
            var rules = styles[oldValue];
            newStyles[newValue] = rules;
            delete styles[oldValue];
        }
        else
            newStyles[url] = styles[url];
    }
    styles = newStyles;
    bg_window.saveStyles(styles);
}

/** end of custom styles **/

/** backup **/

function export() {
    if (styles)
        css = JSON.stringify(styles);
    else
        css = "";

    var html = "<div>Copy and paste your custom styles into a text file:</div><textarea class='stylebot-css-code' style='width: 100%; height:" + cache.textareaHeight + "'>" + css + "</textarea><button onclick='copyToClipboard()'>Copy To Clipboard</button>";

    initModal(html, {
        closeOnEsc: true,
        closeOnBgClick: true
    });

    cache.modal.options.onOpen = function() {
        var textarea = cache.modal.box.find('textarea').get(0);
        textarea.focus();
        Utils.selectAllText(textarea);
    };

    cache.modal.show();
}

function import() {
    var html = "<div>Paste previously exported custom styles here.<div class='description' style='margin-top:10px'>Note: Current custom styles for similar URLs will be replaced.</div></div><textarea class='stylebot-css-code' style='width: 100%; height:" + cache.textareaHeight + "'></textarea><button onclick='importCSS();cache.modal.hide();'>Import</button>";
    initModal(html, {
        closeOnEsc: true,
        closeOnBgClick: true
    });
    cache.modal.options.onOpen = function() {
        cache.modal.box.find('textarea').get(0).focus();
    };
    cache.modal.show();
}

function copyToClipboard() {
    chrome.extension.sendRequest({name: "copyToClipboard", text: cache.modal.box.find('textarea').attr('value')}, function(response){});
}

function importCSS() {
    var json = cache.modal.box.find('textarea').attr('value');
    if (json && json != "")
    {
        $(".custom-style").html("");
        try {
            styles = mergeStyles(JSON.parse(json), styles);
            bg_window.saveStyles(styles);
        }
        catch(e) {}
        fillCustomStyles();
    }
}

/** end of backup **/

/** sync **/

function setSyncUI() {
    var status = $('#sync_status');
    if (options.sync) {
        $('#sync-button').html("Disable Sync");
        $('#sync-enabled-note').show();
        $('#sync-now').show();
    }
    else {
        $('#sync-button').html("Enable Sync");
        $('#sync-enabled-note').hide();
        $('#sync-now').hide();
    }
}

function toggleSyncing() {
    if (options.sync) {
        options.sync = false;
        bg_window.saveOption("sync", false);
        bg_window.disableSync();
    }
    else {
        options.sync = true;
        bg_window.saveOption("sync", true);
        bg_window.enableSync(true);
    }
    setSyncUI();
}

/** end of sync **/

function initModal(html, options) {
    if (!cache.modal)
    {
        cache.modal = new ModalBox(html, {
            bgFadeSpeed: 0,
            closeOnEsc: false,
            closeOnBgClick: false
        });
    }
    if (options) {
        cache.modal.options.closeOnEsc = options.closeOnEsc ? true : false;
        cache.modal.options.closeOnBgClick = options.closeOnBgClick ? true : false;
    }
    else {
        cache.modal.options.closeOnEsc = false;
        cache.modal.options.closeOnBgClick = false;
    }
    cache.modal.box.html(html);
}

/** filtering of custom styles **/
function initFiltering() {
    $("#style-search-field").bind('click focus', function(e) {
        if (e.target.value == "Search...") {
            e.target.className = "";
            e.target.value = "";
        }
        else {
            Utils.selectAllText(e.target);
        }
    })
    .keyup(function(e) {
        filterStyles(e.target.value);
    });
}

function filterStyles(value) {
    var styleDivs = $('.custom-style');
    var urls = $('.custom-style-url');
    var len = styleDivs.length;
    for (var i = 0; i < len; i++) {
        var $div = $(styleDivs[i]);
        if (urls[i].innerHTML.indexOf(value) == -1)
            $div.hide();
        else
            $div.show();
    }
}

// merges styles from s1 into s2
function mergeStyles(s1, s2) {
    if (!s2) {
        return s1;
    }
    for (var url in s1) {
        s2[url] = s1[url];
    }
    return s2;
}