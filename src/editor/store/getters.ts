import * as postcss from 'postcss';

import { State } from './';
import {
  getRule,
  getRuleForSelector,
  getFilterEffectValueForPage,
  getAlreadyUsedColors,
  RoleColorGroups,
} from '@stylebot/css';

export default {
  /**
   * Falls back to a grouped rule the selector belongs to, so Basic mode
   * shows its declarations before any edit splits it into its own rule.
   */
  activeRule: (state: State): postcss.Rule | null => {
    if (!state.activeSelector) {
      return null;
    }

    return (
      getRule(state.css, state.activeSelector) ??
      getRuleForSelector(state.css, state.activeSelector)
    );
  },

  alreadyUsedColors: (state: State): RoleColorGroups =>
    getAlreadyUsedColors(state.css),

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
