// Extending the String object with utility functions

/**
  * Trims a string
  * @return {String} The trimmed string.
  */
String.prototype.trim = function() {
  return this.replace(/^\s+|\s+$/g, '');
};

/**
  * Checks if a given string is a pattern
  * @return {Boolean} True if the string is a pattern, false otherwise.
  */
String.prototype.isPattern = function() {
  // Currently, the only indicator that a string is a pattern is if
  // it has the wildcard character *
  return this.indexOf('*') >= 0;
};

/**
 * Checks if a given string is a regular expression
 * @return {Boolean} True if the string is a regular expression, false otherwise.
 */
String.prototype.isRegex = function() {
  // Currently, the only indicator that a string is a regular expression is if
  // it starts with a ^. The caret is unlikely to appear within a regular URL
  // and marks the beggining of a string in a regular expression.
  return this.indexOf('^') == 0;
};

/**
  * Checks if the string matches an stylebot pattern
  * @param {String} pattern The stylebot pattern.
  * @return {Boolean} True if the string matches the patern, false otherwise.
  */
String.prototype.matchesPattern = function(pattern) {
  if (pattern.isRegex()) {
    return new RegExp(pattern).test(this);
  } else if (pattern.isPattern()) {
    try {
      var hasComma = ~pattern.indexOf(',');
      pattern = pattern.
      /* Removes white spaces */
      replace(/ /g, '').
      /* Escapes . ? | ( ) [ ] + $ ^ \ { } */
      replace(/(\.|\?|\||\(|\)|\[|\]|\+|\$|\^|\\|\{|\})/g, '\\$1').
      /* Allows commas to be used to separate urls */
      replace(/,/g, '|').
      /* Allows use of the ** wildcard, matches anything */
      replace(/\*\*/g, '.*').
      /* Allows use of the * wildcard, matches anything but /
      Because we replace ** with .*, we have to make sure we
      don't replace an .* Therefore, we should replace an *
      if, and only if it is precedeed by anything different
      from a . except for \. (may be the beginning of a line
      too, i.e. the ^ symbol)
      Note: If we add an * before \* we are adding lazyness
      to the regexp which only reduces its performance.
      That's why I replaced the * with an ^ to check
      for patterns of the form `*something`
      */
      replace(/(^|\\\.|[^\.])\*/g, '$1[^/]*');
      /* Enclose the pattern in ( ) if it has several urls separated by , */
      pattern = (hasComma ? '(' + pattern + ')' : pattern);
      /* Matches the beginning of the url, we only consider http(s) urls */
      pattern = '^https?://' + pattern;
      pattern = new RegExp(pattern, 'i');
      return pattern.test(this);
    }

    catch (e) {
      console.log('Error occured while running pattern check', e);
      return false;
    }
  } else {
    return this.matchesBasic(pattern);
  }
};

/**
  * Checks if the given url matches with the basic pattern.
  * @param {String} pattern The stylebot pattern.
  * @return {Boolean} True if the string matches the patern, false otherwise.
  */
String.prototype.matchesBasic = function(pattern) {
  var isFound = false;
  var subUrls = pattern.split(',');
  var len = subUrls.length;
  for (var i = 0; i < len; i++) {
    if (this.indexOf(subUrls[i].trim()) != -1) {
      isFound = true;
      break;
    }
  }

  return isFound;
};

/**
  * Check if Stylebot should run on a URL.
  * @return {Boolean} True if Stylebot can run on the URL
  */
String.prototype.isValidUrl = function() {
  var blacklist = [
    "https://chrome.google.com/webstore"
  ];

  return (this.indexOf('chrome://') === -1
    && blacklist.indexOf(this) === -1
    && this.isOfHTMLType());
};

/**
  * Checks the extension of the URL to determine if it is valid HTML
  * @return {Boolean} True if the string does not have an extension json/pdf.
  */
String.prototype.isOfHTMLType = function() {
  var nonHTMLExt = ['json', 'pdf'];
  if (nonHTMLExt.indexOf(this.getExtension()) != -1) {
    return false;
  }

  return true;
};

/**
  * Returns the extension of the given filename / URL.
  * @return {String} The extension.
  */
String.prototype.getExtension = function() {
  return this.split('.').pop();
};

/**
  * Copies the string to the clipboard
  */
String.prototype.copyToClipboard = function() {
  var copyTextarea = document.createElement('textarea');
  document.body.appendChild(copyTextarea);
  copyTextarea.value = this;
  copyTextarea.select();
  document.execCommand('copy');
  document.body.removeChild(copyTextarea);
};
