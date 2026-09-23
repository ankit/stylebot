import { Style, StyleMap } from '@stylebot/types';

import BackgroundPageUtils from './utils';

export const getStylesForPage = (
  pageUrl: string,
  allStyles: StyleMap
): {
  styles: Array<Style>;
  defaultStyle?: Style;
} => {
  if (!pageUrl) {
    return { styles: [] };
  }

  if (!BackgroundPageUtils.isValidHTML(pageUrl)) {
    return { styles: [] };
  }

  const styles = [];
  let defaultStyle: Style | undefined;

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
