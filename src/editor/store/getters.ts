import * as postcss from 'postcss';

import { State } from './';
import { getRule, getFilterEffectValueForPage } from '@stylebot/css';

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
};
