import * as postcss from 'postcss';

import { State } from './';
import { getFilterEffectValueForPage } from '@stylebot/css';

export default {
  activeRule: (state: State): postcss.Rule | null => {
    if (!state.activeSelector) {
      return null;
    }

    const root = postcss.parse(state.css);
    const matchingRules: Array<postcss.Rule> = [];

    root.walkRules(state.activeSelector, rule => matchingRules.push(rule));
    return matchingRules.length > 0 ? matchingRules[0] : null;
  },

  grayscale: (state: State): number => {
    return getFilterEffectValueForPage('grayscale', state.css);
  },
};
