import Vue from 'vue';
import Vuex from 'vuex';

import { StylebotOptions, StylebotPlacement } from '@stylebot/types';

import getters from './getters';
import actions from './actions';
import mutations from './mutations';

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
    readability: false,
    url: document.domain,

    options: {
      mode: 'basic',
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
