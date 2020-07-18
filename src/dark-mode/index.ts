import * as dedent from 'dedent';
import * as postcss from 'postcss';
import * as tinycolor from 'tinycolor2';

import { getSelector } from '@stylebot/css';

declare global {
  interface Window {
    stylebotDarkModeUrl: string;
  }
}

const Theme = {
  color: tinycolor('#e8e6e3'),
  backgroundColor: tinycolor('#222'),
  borderColor: tinycolor('#736b5e'),
  placeholder: tinycolor('#b2aba1'),
  linkColor: tinycolor('#A9BAC5'),
  selectionColor: tinycolor('#fff'),
  selectionBackgroundColor: tinycolor('#68C2D0'),
};

const getDarkModeBackgroundColor = (
  color: tinycolor.Instance
): tinycolor.Instance | null => {
  if (color.getAlpha() === 0) {
    return null;
  }

  if (color.isDark()) {
    return color;
  }

  return color.darken(90);
};

const getDarkModeColor = (
  color: tinycolor.Instance
): tinycolor.Instance | null => {
  if (color.getAlpha() === 0) {
    return Theme.color;
  }

  if (color.isLight()) {
    return color;
  }

  return color.lighten(50);
};

const getDarkModeBorderColor = (
  color: tinycolor.Instance
): tinycolor.Instance | null => {
  if (color.isLight()) {
    return color.darken(70);
  }

  return color.lighten(30);
};

const getDefaultCss = (): string => {
  return dedent`
    html, body, input, textarea, select, button {
      color: ${Theme.color.toHexString()};
      border-color: ${Theme.borderColor.toHexString()};
      background-color: ${Theme.backgroundColor.toHexString()};
    }

    ::placeholder {
      color: ${Theme.placeholder.toHexString()};
    }

    a {
      color: ${Theme.linkColor.toHexString()};
    }

    ::selection {
      color: ${Theme.selectionColor.toHexString()};
      background: ${Theme.selectionBackgroundColor.toHexString()};
    }
  `;
};

const getElementCss = (el: HTMLElement, selector: string): string => {
  const computedStyle = getComputedStyle(el);
  const isLinkOrButton = el.matches('a, button');

  const color = getDarkModeColor(tinycolor(computedStyle.color));
  const backgroundColor = getDarkModeBackgroundColor(
    tinycolor(computedStyle.backgroundColor)
  );
  const borderColor = getDarkModeBorderColor(
    tinycolor(computedStyle.borderColor)
  );

  if (!color && !backgroundColor) {
    return '';
  }

  let css = `\n\n${selector} {`;

  if (color) {
    css += `\n  color: ${color.toHexString()};`;
  }

  if (backgroundColor) {
    css += `\n  background-color: ${backgroundColor.toHexString()};`;
  }

  if (borderColor) {
    css += `\n  border-color: ${borderColor.toHexString()};`;
  }

  css += `\n}`;

  if (isLinkOrButton && (color || backgroundColor)) {
    css += `\n${selector}:hover {`;

    if (color) {
      css += `\n  color: ${color.lighten(20).toHexString()};`;
    }

    if (backgroundColor) {
      css += `\n  background-color: ${backgroundColor
        .darken(30)
        .toHexString()};`;
    }

    css += `\n}`;
  }

  return css;
};

const getCss = (): string => {
  const root = postcss.parse(getDefaultCss());
  const all = document.querySelectorAll('body, body *:not(#stylebot)');
  const evaluatedSelectors: Array<string> = [];

  all.forEach(el => {
    if (!el.closest('.stylebot')) {
      const selector = getSelector(el as HTMLElement);

      try {
        if (evaluatedSelectors.indexOf(selector) === -1) {
          const css = getElementCss(el as HTMLElement, selector);
          if (css) {
            root.append(css);
          }

          evaluatedSelectors.push(selector);
        }
      } catch (e) {
        console.log(`Error analyzing ${selector}`, e);
      }
    }
  });

  root.walkDecls(decl => (decl.important = true));
  return root.toString();
};

const cacheCurrentUrl = (): void => {
  window.stylebotDarkModeUrl = window.location.href;
};

const didUrlChange = (): boolean => {
  return window.stylebotDarkModeUrl !== window.location.href;
};

const initDarkMode = () => {
  const css = getCss();
  const id = 'stylebot-dark-mode';
  const el = document.getElementById(id);

  if (el) {
    el.innerHTML = css;
    return;
  }

  const style = document.createElement('style');

  style.type = 'text/css';
  style.setAttribute('id', id);
  style.appendChild(document.createTextNode(css));

  document.documentElement.appendChild(style);
};

export const apply = (forceApply = false): void => {
  // Prevent duplicate calls for the same url if not force applying
  if (!forceApply && !didUrlChange()) {
    return;
  }
  cacheCurrentUrl();

  if (document.readyState === 'complete') {
    initDarkMode();
  } else {
    document.addEventListener('DOMContentLoaded', async () => {
      initDarkMode();
    });
  }
};

export const remove = (): void => {
  document.getElementById('stylebot-dark-mode')?.remove();
};
