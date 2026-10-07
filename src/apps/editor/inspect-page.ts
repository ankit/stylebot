import type { ChatSuggestionContext } from '@stylebot/chat';
import {
  countMatches,
  getComputedStyles,
  getPageOutline,
  getPageRulesCss,
  getPageSignals,
  getPageVariablesCss,
} from '@stylebot/page-bridge';
import { isReaderable } from '@stylebot/readability';
import type { PageInspection } from '@stylebot/types';

/**
 * Answers what the background asks about the page, with the same readers
 * the editor and Chat use.
 */
export const inspectPage = async (
  inspection: PageInspection
): Promise<
  string | ChatSuggestionContext | Record<string, string> | Array<number | null>
> => {
  switch (inspection.kind) {
    case 'outline':
      return getPageOutline();
    case 'suggestionContext':
      return { signals: getPageSignals(), article: isReaderable() };
    case 'cssVariables':
      return getPageVariablesCss();
    case 'pageRules':
      return getPageRulesCss(inspection.selector);
    case 'computedStyles': {
      const { styles, unwatch } = getComputedStyles(
        inspection.selector,
        inspection.properties
      );
      // Only the editor needs to hear when a hovered element is left.
      unwatch?.();
      return styles;
    }
    case 'matchCount':
      return countMatches(inspection.selectors);
  }
};
