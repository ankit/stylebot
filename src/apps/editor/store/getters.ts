import type * as postcss from 'postcss';

import type { State } from './';
import type { RoleColorGroups } from '@stylebot/css';
import {
  getRule,
  getRuleForSelector,
  withOwnDeclarationsOnly,
  getFilterEffectValueForPage,
  getAlreadyUsedColors,
} from '@stylebot/css';

export default {
  /**
   * Falls back to a grouped rule the selector belongs to, so Basic mode
   * shows its declarations before any edit splits it into its own rule.
   * Carries only the rule's own declarations, so the property controls
   * don't read values from rules nested inside it. While picking, it's the
   * previewed element's rule, so the panel shows what a pick would.
   */
  activeRule: (
    state: State,
    getters: { inspectedSelector: string }
  ): postcss.Rule | null => {
    const selector = getters.inspectedSelector;

    if (!selector) {
      return null;
    }

    const rule =
      getRule(state.css, selector) ?? getRuleForSelector(state.css, selector);

    return rule ? withOwnDeclarationsOnly(rule) : null;
  },

  /**
   * The selector the panel reads the page for: the element under the
   * inspector while picking, otherwise the active selector.
   */
  inspectedSelector: (state: State): string =>
    (state.inspecting && state.previewSelector) || state.activeSelector,

  alreadyUsedColors: (state: State): RoleColorGroups =>
    getAlreadyUsedColors(state.css),

  canUndo: (state: State): boolean => state.undoStack.past.length > 0,

  canRedo: (state: State): boolean => state.undoStack.future.length > 0,

  grayscale: (state: State): number => {
    return getFilterEffectValueForPage(
      'grayscale',
      state.css,
      state.page.bodyChildSelectors
    );
  },

  // state.readability alone can be true domain-wide while this page
  // doesn't actually qualify (e.g. a wiki's main page).
  readabilityActive: (state: State): boolean => {
    return state.readability && state.page.readerable;
  },
};
