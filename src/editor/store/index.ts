import Vue from 'vue';
import Vuex from 'vuex';

import getters from './getters';
import actions from './actions';
import mutations from './mutations';

import { StylebotOptions, StylebotPlacement } from '../../types';

Vue.use(Vuex);

export type CssSelectorMetadata = {
  id: number;
  value: string;
  count: number;
};

export type State = {
  url: string;
  css: string;
  enabled: boolean;
  darkMode: boolean;
  readability: boolean;
  options: StylebotOptions;

  activeSelector: string;
  selectors: Array<CssSelectorMetadata>;

  help: boolean;
  visible: boolean;
  inspecting: boolean;
  position: StylebotPlacement;
};

export default new Vuex.Store<State>({
  state: {
    css: '',
    enabled: true,
    darkMode: false,
    readability: false,
    url: document.domain,

    options: {
      mode: 'basic',
      useShortcutKey: true,
      shortcutKey: 77,
      shortcutMetaKey: 'alt',
      contextMenu: true,
    },

    activeSelector: '',
    selectors: [],

    help: false,
    visible: false,
    position: 'right',
    inspecting: false,
  },

  getters,
  actions,
  mutations,
});
