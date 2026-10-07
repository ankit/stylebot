import type { ChatSuggestionContext } from '@stylebot/chat';
import { getFragileSelector } from '@stylebot/css';
import { reapplySavedStyles } from '@stylebot/inject-css';
import {
  checkStyle,
  countMatches,
  getComputedStyles,
  getPageOutline,
  getPageRulesCss,
  getPageSignals,
  getPageVariablesCss,
  startStyleCheck,
} from '@stylebot/page-bridge';
import { isReaderable } from '@stylebot/readability';
import type {
  FragileSelector,
  PageInspection,
  StyleCheckReport,
} from '@stylebot/types';

/**
 * Once a saved style has applied: how many elements each selector matches,
 * what the page check found since startCheck, and fragile selectors.
 */
const finishCheck = async (
  selectors: Array<string>
): Promise<StyleCheckReport> => {
  // The background's own reapply may not have landed yet.
  await reapplySavedStyles();

  return {
    matchCounts: countMatches(selectors),
    styleProblems: await checkStyle(),
    fragileSelectors: selectors
      .map(getFragileSelector)
      .filter((fragile): fragile is FragileSelector => !!fragile),
  };
};

/**
 * Answers what the background asks about the page, with the same readers
 * the editor and Chat use.
 */
export const inspectPage = async (
  inspection: PageInspection
): Promise<
  | string
  | ChatSuggestionContext
  | Record<string, string>
  | Array<number | null>
  | StyleCheckReport
  | null
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
    case 'startCheck':
      startStyleCheck(inspection.edits);
      return null;
    case 'finishCheck':
      return finishCheck(inspection.selectors);
  }
};
