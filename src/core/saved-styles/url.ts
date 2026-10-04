/**
 * Check if a given string is a wildcard pattern (denoted by
 * wildcard character *)
 */
const isWildcardPattern = (str: string): boolean => str.indexOf('*') >= 0;

/**
 * Check if a given string is a regular expression (starts with ^)
 */
const isRegexPattern = (str: string): boolean => str.indexOf('^') === 0;

/**
 * Check if the page url matches with a single url string.
 */
const matchesUrl = (pageUrlString: string, url: string): boolean => {
  const exactMatchParts: Array<keyof URL> = [
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
};

/**
 * Check if the page url matches with the url collection
 */
const matchesUrlCollection = (
  pageUrl: string,
  urlCollection: string
): boolean => urlCollection.split(',').some(url => matchesUrl(pageUrl, url));

/**
 * Check if the page url matches with the stylebot pattern
 */
const matchesWildcard = (pageUrl: string, pattern: string): boolean => {
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
      .replace(/(^|\\\.|[^.])\*/g, '$1[^/]*');
    /* Enclose the pattern in ( ) if it has several urls separated by , */
    pattern = hasComma ? '(' + pattern + ')' : pattern;

    const regexPattern = new RegExp(pattern, 'i');
    return regexPattern.test(pageUrl);
  } catch (e) {
    console.log('Error occured while running stylebot pattern check', e);
    return false;
  }
};

/**
 * Check if the given url matches with the regex
 */
const matchesRegex = (pageUrl: string, regex: string): boolean =>
  new RegExp(regex).test(pageUrl);

/**
 * Check if the URL matches the given pattern
 */
export const matchesUrlPattern = (
  pageUrl: string,
  pattern: string
): boolean => {
  if (isRegexPattern(pattern)) {
    return matchesRegex(pageUrl, pattern);
  }

  if (isWildcardPattern(pattern)) {
    return matchesWildcard(pageUrl, pattern);
  }

  return matchesUrlCollection(pageUrl, pattern);
};

/**
 * Whether a document is one Stylebot can style: a web page, as opposed to a
 * PDF, JSON or XML file, whatever its URL says.
 */
export const isStylableDocument = (contentType: string): boolean =>
  contentType === 'text/html' || contentType === 'application/xhtml+xml';
