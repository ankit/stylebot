import Vue from 'vue';
import Vuex from 'vuex';

import getters from './getters';
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
  enabled: boolean;

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
    css: '',
    enabled: true,
    url: document.domain,

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

  getters,
  actions,
  mutations,
});
