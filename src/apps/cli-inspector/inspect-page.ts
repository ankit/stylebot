import type { ChatSuggestionContext } from '@stylebot/chat';
import { getFragileSelector } from '@stylebot/css';
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
  InspectorHost,
  PageInspection,
  PointerResult,
  StyleCheckReport,
} from '@stylebot/types';

import { usePointer } from './pointer';

/**
 * Once a saved style has applied: how many elements each selector matches,
 * what the page check found since startCheck, and fragile selectors.
 */
const finishCheck = async (
  selectors: Array<string>,
  host: InspectorHost
): Promise<StyleCheckReport> => {
  // The background's own reapply may not have landed yet.
  await host.reapplySavedStyles();

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
  inspection: PageInspection,
  host: InspectorHost
): Promise<
  | string
  | ChatSuggestionContext
  | Record<string, string>
  | Array<number | null>
  | StyleCheckReport
  | PointerResult
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
      return finishCheck(inspection.selectors, host);
    case 'pointer':
      return usePointer(inspection.action);
  }
};
