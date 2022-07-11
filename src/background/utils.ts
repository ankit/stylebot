/**
 * Helper utility functions used by the background page
 */

class BackgroundPageUtils {
  /**
   * Check if a given string is a "url pattern"
   * Currently, the only indicator that a string is a pattern is if
   * it has the wildcard character *
   */
  private static isPattern(str: string) {
    return str.indexOf('*') >= 0;
  }

  /**
   * Check if a given string is a regular expression (starts with ^)
   * Currently, the only indicator that a string is a regular expression is if
   * it starts with a ^. The caret is unlikely to appear within a regular URL
   * and marks the beggining of a string in a regular expression.
   */
  private static isRegex(str: string) {
    return str.indexOf('^') == 0;
  }

  /**
   * Check if the url matches with an individual subUrl.
   */
  private static matchesSubUrl(url: string, subUrl: string) {
    const exactMatchParts: (keyof URL)[] = [
      'username',
      'password',
      'port',
      'hash',
    ];

    try {
      subUrl = subUrl.trim();

      let protocol: null | string = null;
      const matches = subUrl.match(/^(\w+:)\/\/(.+)$/);

      if (matches) {
        [protocol, subUrl] = matches.slice(1);
      }

      const pageUrl = new URL(url);
      const matcherUrl = new URL(`${protocol ?? 'http:'}//${subUrl}`);

      const hasPathname = matcherUrl.pathname.length > 1;
      const shouldMatchHostLoosely = !protocol && !hasPathname;

      const hostMatches = shouldMatchHostLoosely
        ? ('.' + pageUrl.hostname).endsWith('.' + matcherUrl.hostname)
        : pageUrl.host === matcherUrl.host;

      return (
        hostMatches &&
        (!hasPathname ||
          (pageUrl.pathname + '/').endsWith(matcherUrl.pathname + '/')) &&
        (!protocol || pageUrl.protocol === matcherUrl.protocol) &&
        exactMatchParts.every(
          part => !matcherUrl[part] || pageUrl[part] === matcherUrl[part]
        ) &&
        [...matcherUrl.searchParams].every(
          ([k, v]) => pageUrl.searchParams.get(k) === v
        )
      );
    } catch {
      // fall-through in case `url` or `subUrl` are malformed
      return false;
    }
  }

  /**
   * Check if the given url matches with the pattern.
   */
  private static matchesBasicPattern(url: string, pattern: string) {
    return pattern.split(',').some(subUrl => this.matchesSubUrl(url, subUrl));
  }

  /***
   * Guess if the given URL is valid HTML by comparing URL extension
   * against an extension blacklist
   */
  static isValidHTML(url: string): boolean {
    const extension = url.split('.').pop();
    if (!extension) {
      return true;
    }

    return ['json', 'pdf', 'xml'].indexOf(extension) === -1;
  }

  /**
   * Check if the URL matches the given stylebot pattern
   */
  static matchesPattern(url: string, pattern: string): boolean {
    if (this.isRegex(pattern)) {
      return new RegExp(pattern).test(url);
    } else if (this.isPattern(pattern)) {
      try {
        const hasComma = ~pattern.indexOf(',');

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

        const regexPattern = new RegExp(pattern, 'i');
        return regexPattern.test(url);
      } catch (e) {
        console.log('Error occured while running pattern check', e);
        return false;
      }
    } else {
      return this.matchesBasicPattern(url, pattern);
    }
  }

  /**
   * Check if Stylebot should run on a URL.
   */
  static isValidUrl(url: string): boolean {
    if (url.indexOf('chrome://') !== -1) {
      return false;
    }

    if (!this.isValidHTML(url)) {
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
  }
}

export default BackgroundPageUtils;
