import type { StyleMap } from '@stylebot/types';

import BackgroundPageUtils from './utils';

type WithUrl<T> = T & { url: string };

/**
 * The styles whose url pattern matches the page, and the most specific
 * non-global one as its default style. Works on the stored style map and on
 * the compiled one alike.
 */
export const getStylesForPage = <T extends { css: string } = StyleMap[string]>(
  pageUrl: string,
  allStyles: { [url: string]: T }
): {
  styles: Array<WithUrl<T>>;
  defaultStyle?: WithUrl<T>;
} => {
  if (!pageUrl) {
    return { styles: [] };
  }

  if (!BackgroundPageUtils.isValidHTML(pageUrl)) {
    return { styles: [] };
  }

  const styles: Array<WithUrl<T>> = [];
  let defaultStyle: WithUrl<T> | undefined;

  for (const url in allStyles) {
    const matches = BackgroundPageUtils.matches(pageUrl, url);

    if (matches && allStyles[url]) {
      const style = { url, ...allStyles[url] };

      if (url !== '*') {
        if (!defaultStyle || url.length > defaultStyle.url.length) {
          defaultStyle = style;
        }
      }

      if (style.css) {
        styles.push(style);
      }
    }
  }

  return { styles, defaultStyle };
};
