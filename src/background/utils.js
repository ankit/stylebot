/**
 * Helper utility functions used by the background page
 */

// Private

/**
 * Trim a string
 * @return {String} The trimmed string.
 */
const trim = str => {
  return str.replace(/^\s+|\s+$/g, '');
};

/**
 * Check if a given string is a pattern
 * @return {Boolean} True if the string is a pattern, false otherwise.
 */
const isPattern = str => {
  // Currently, the only indicator that a string is a pattern is if
  // it has the wildcard character *
  return str.indexOf('*') >= 0;
};

/**
 * Check if a given string is a regular expression
 * @return {Boolean} True if the string is a regular expression, false otherwise.
 */
const isRegex = str => {
  // Currently, the only indicator that a string is a regular expression is if
  // it starts with a ^. The caret is unlikely to appear within a regular URL
  // and marks the beggining of a string in a regular expression.
  return str.indexOf('^') == 0;
};

/**
 * Check if the given url matches with the basic pattern.
 * @param {String} url Input URL string
 * @param {String} pattern The stylebot pattern.
 * @return {Boolean} True if the string matches the pattern
 */
const matchesBasic = (url, pattern) => {
  var isFound = false;
  var subUrls = pattern.split(',');
  var len = subUrls.length;

  for (var i = 0; i < len; i++) {
    if (url.indexOf(trim(subUrls[i])) != -1) {
      isFound = true;
      break;
    }
  }

  return isFound;
};

// Public

export const cloneObject = obj => JSON.parse(JSON.stringify(obj));

/**
 * Iterate through an object to see if it contains any keys
 */
export const isEmptyObject = obj => {
  var isEmpty = true;
  for (keys in obj) {
    isEmpty = false;
    break;
  }

  return isEmpty;
};

/**
 * Guess if the given URL is valid HTML
 * @return {Boolean} True if the URL does not have a blacklisted extension.
 */
export const isValidHTML = url => {
  const extension = url.split('.').pop();
  return ['json', 'pdf', 'xml'].indexOf(extension) === -1;
};

/**
 * Check if the URL matches the given stylebot pattern
 * @param {String} url Input URL string
 * @param {String} pattern The stylebot pattern
 * @return {Boolean} Returns true if the URL matches the pattern
 */
export const matchesPattern = (url, pattern) => {
  if (isRegex(pattern)) {
    return new RegExp(pattern).test(url);
  } else if (isPattern(pattern)) {
    try {
      var hasComma = ~pattern.indexOf(',');
      pattern = pattern
        /* Removes white spaces */
        .replace(/ /g, '')
        /* Escapes . ? | ( ) [ ] + $ ^ \ { } */
        .replace(/(\.|\?|\||\(|\)|\[|\]|\+|\$|\^|\\|\{|\})/g, '\\$1')
        /* Allows commas to be used to separate urls */
        .replace(/,/g, '|')
        /* Allows use of the ** wildcard, matches anything */
        .replace(/\*\*/g, '.*')
        /* 
          Allows use of the * wildcard, matches anything but /
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
        .replace(/(^|\\\.|[^\.])\*/g, '$1[^/]*');
      /* Enclose the pattern in ( ) if it has several urls separated by , */
      pattern = hasComma ? '(' + pattern + ')' : pattern;
      /* Matches the beginning of the url, we only consider http(s) urls */
      pattern = '^https?://' + pattern;
      pattern = new RegExp(pattern, 'i');
      return pattern.test(url);
    } catch (e) {
      console.log('Error occured while running pattern check', e);
      return false;
    }
  } else {
    return matchesBasic(url, pattern);
  }
};

/**
 * Check if Stylebot should run on a URL.
 * @return {Boolean} True if Stylebot can run on the URL
 */
export const isValidUrl = url => {
  if (url.indexOf('chrome://') !== -1) {
    return false;
  }

  if (!isValidHTML(url)) {
    return false;
  }

  const urlBlacklist = [
    'https://chrome.google.com/webstore',
    'chrome-extension://',
  ];

  for (let i = 0; i < urlBlacklist.length; i++) {
    if (url.indexOf(urlBlacklist[i]) !== -1) {
      return false;
    }
  }

  return true;
};

/**
 * Copy the given string to the clipboard
 */
export const copyToClipboard = str => {
  var copyTextarea = document.createElement('textarea');
  document.body.appendChild(copyTextarea);
  copyTextarea.value = str;
  copyTextarea.select();
  document.execCommand('copy');
  document.body.removeChild(copyTextarea);
};
