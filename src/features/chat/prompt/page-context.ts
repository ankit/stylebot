import type { ChatPageContext } from '../types';

/**
 * The page as it stands, sent after the thread's latest message rather
 * than in the system prompt: it changes with every reply, and anything
 * after a change can't be read from the provider's cache.
 */
export const buildPageContext = ({
  url,
  title,
  outline,
  pageCss,
  css,
  selector,
}: ChatPageContext): string => {
  const safeTitle = title.replace(/"/g, "'");
  const pageCssText = pageCss.trim() || '(none readable)';
  const stylesheetText = css.trim() || '/* empty */';

  const page = `<page url="${url}" title="${safeTitle}">\n${outline}\n</page>`;
  const pageStyles = `<page-css>\n${pageCssText}\n</page-css>`;
  const stylesheet = `<stylesheet>\n${stylesheetText}\n</stylesheet>`;
  const picked = selector
    ? `The user has picked the element matching \`${selector}\`; unless they say otherwise, the request is about it.`
    : '';

  return [page, pageStyles, stylesheet, picked].filter(Boolean).join('\n\n');
};
