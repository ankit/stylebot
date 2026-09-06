import * as postcss from 'postcss';

import { State } from './';
import { getRule, getFilterEffectValueForPage } from '@stylebot/css';
import { isReaderable } from '@stylebot/readability';

export default {
  activeRule: (state: State): postcss.Rule | null => {
    if (!state.activeSelector) {
      return null;
    }

    return getRule(state.css, state.activeSelector);
  },

  grayscale: (state: State): number => {
    return getFilterEffectValueForPage('grayscale', state.css);
  },

  // state.readability alone can be true domain-wide while this specific
  // page doesn't actually qualify (e.g. a wiki's main page) — isReaderable()
  // also accounts for whether the reader is already mounted.
  readabilityActive: (state: State): boolean => {
    return state.readability && isReaderable();
  },
};
