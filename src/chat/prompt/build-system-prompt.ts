import type { ChatPageContext } from '@stylebot/types';

import { INSTRUCTIONS } from './instructions';

/**
 * The system prompt for one reply: what Stylebot is and how to answer,
 * then the page as it stands, since each reply sees it anew.
 */
export const buildSystemPrompt = ({
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

  return [INSTRUCTIONS, page, pageStyles, stylesheet, picked]
    .filter(Boolean)
    .join('\n\n');
};
