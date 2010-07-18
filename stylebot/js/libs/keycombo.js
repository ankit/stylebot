/**
  * A single character keycode generator
  * Converts a pressed character into its corresponding keydown code and stores the code in a hidden field
  *
  * Copyright (c) 2010 Ankit Ahuja
  * Dual licensed under GPL and MIT licenses.
 **/

var KeyCombo = {
    
    // el: the textfield in which key is pressed
    // codeEl: Hidden textfield which will store the keydown code
	init: function(el, codeEl) {
		el.value = KeyCombo.mapKeyDownCode(codeEl.value);
		el.addEventListener(
			"keydown",
			function(e) {
				KeyCombo.lastValue = el.value;
				if (e.keyCode == 8)
					e.preventDefault();
				if (KeyCombo.filterKeyCode(e.keyCode))
				{
					codeEl.value = e.keyCode;
					el.value = "";
				}
				if (e.keyCode == 27)
					el.blur();
			},
			false);
	},
	
	filterKeyCode: function(code) {
		// filter tab/shift/enter/esc/arrow keys
		if (code == 27 || code == 16 || code == 37 || code == 38 || code == 39 || code == 40 || code == 13 || code == 9)
			return false;
		// filter /meta/ctrl/alt/backspace
		if (code == 18 || code == 17 || code == 0 || code == 91 || code == 93 || code == 8)
			return false;
		return true;
	},
	
	mapKeyDownCode: function(code) {
	    code = Math.floor(code);
		if ((code >= 65 && code <= 90) || (code >= 48 && code <= 57))
		{
			return String.fromCharCode(code).toLowerCase();
		}
		switch (code)
		{
			case 186: return ";";
			case 187: return "=";
			case 188: return ",";
			case 189: return "-";
			case 190: return ".";
			case 191: return "/";
			case 192: return "`";
			case 219: return "[";
			case 220: return "\\";
			case 221: return "]";
			case 222: return "'";
		}
		return String.fromCharCode(code).toLowerCase();
	}
}