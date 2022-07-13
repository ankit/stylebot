/**
 * Helper utility functions used by the background page
 */

class BackgroundPageUtils {
  /**
   * Check if a given string is a wildcard pattern (denoted by
   * wildcard character *)
   */
  private static isWildcard(str: string) {
    return str.indexOf('*') >= 0;
  }

  /**
   * Check if a given string is a regular expression (starts with ^)
   */
  private static isRegex(str: string) {
    return str.indexOf('^') == 0;
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
   * Check if the page url matches with a single url string.
   */
  private static matchesUrl(pageUrlString: string, url: string) {
    const exactMatchParts: (keyof URL)[] = [
      'username',
      'password',
      'port',
      'hash',
    ];

    try {
      url = url.trim();

      let protocol: null | string = null;
      const matches = url.match(/^(\w+:)\/\/(.+)$/);

      if (matches) {
        [protocol, url] = matches.slice(1);
      }

      const pageUrl = new URL(pageUrlString);
      const matcherUrl = new URL(`${protocol ?? 'http:'}//${url}`);

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
   * Check if the page url matches with the url collection
   */
  private static matchesUrlCollection(pageUrl: string, urlCollection: string) {
    return urlCollection.split(',').some(url => this.matchesUrl(pageUrl, url));
  }

  /* Check if the page url matches with the stylebot pattern */
  private static matchesWildcard(pageUrl: string, pattern: string) {
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

      const regexPattern = new RegExp(pattern, 'i');
      return regexPattern.test(pageUrl);
    } catch (e) {
      console.log('Error occured while running stylebot pattern check', e);
      return false;
    }
  }

  /**
   * Check if the given url matches with the regex
   */
  private static matchesRegex(pageUrl: string, regex: string) {
    return new RegExp(regex).test(pageUrl);
  }

  /**
   * Check if the URL matches the given pattern
   */
  static matches(pageUrl: string, pattern: string): boolean {
    if (this.isRegex(pattern)) {
      return this.matchesRegex(pageUrl, pattern);
    }

    if (this.isWildcard(pattern)) {
      return this.matchesWildcard(pageUrl, pattern);
    }

    return this.matchesUrlCollection(pageUrl, pattern);
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
