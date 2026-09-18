import * as postcss from 'postcss';

import { State } from './';
import {
  getRule,
  getRuleForSelector,
  getFilterEffectValueForPage,
  getAlreadyUsedColors,
  RoleColorGroups,
} from '@stylebot/css';
import { isReaderable } from '@stylebot/readability';

export default {
  // Falls back to a grouped rule the selector is a member of (e.g.
  // `.foo, .bar { ... }`) so the Basic editor shows those declarations as
  // already set, rather than blank, before any edit splits it into its
  // own rule (see addDeclaration/splitSelectorFromGroup).
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
    return getFilterEffectValueForPage('grayscale', state.css);
  },

  // state.readability alone can be true domain-wide while this page
  // doesn't actually qualify (e.g. a wiki's main page).
  readabilityActive: (state: State): boolean => {
    return state.readability && isReaderable();
  },
};
