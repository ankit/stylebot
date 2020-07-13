import Vue from 'vue';
import Vuex from 'vuex';
import * as postcss from 'postcss';

import actions from './actions';
import mutations from './mutations';

import { StylebotOptions, StylebotPlacement } from '../../types';

Vue.use(Vuex);

export type CssSelectorMetadata = {
  value: string;
  count: number;
};

export type State = {
  url: string;
  css: string;

  activeSelector: string;
  selectors: Array<CssSelectorMetadata>;

  visible: boolean;
  options: StylebotOptions;
  position: StylebotPlacement;
  inspecting: boolean;
  help: boolean;
};

export default new Vuex.Store<State>({
  state: {
    url: document.domain,
    css: '',

    activeSelector: '',
    selectors: [],

    options: {
      mode: 'basic',
      useShortcutKey: true,
      shortcutKey: 77,
      shortcutMetaKey: 'alt',
      contextMenu: true,
    },

    visible: false,
    position: 'right',
    inspecting: false,
    help: false,
  },

  getters: {
    activeRule: state => {
      if (!state.activeSelector) {
        return null;
      }

      const root = postcss.parse(state.css);
      const matchingRules: Array<postcss.Rule> = [];

      root.walkRules(state.activeSelector, rule => matchingRules.push(rule));
      return matchingRules.length > 0 ? matchingRules[0] : null;
    },
  },

  actions,
  mutations,
});
