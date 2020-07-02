import Vue from 'vue';
import Vuex from 'vuex';

import { StylebotOptions, StylebotPlacement } from '../../types';

Vue.use(Vuex);

type State = {
  visible: boolean;
  options?: StylebotOptions;
  position: StylebotPlacement;
};

export default new Vuex.Store<State>({
  state: {
    options: {
      useShortcutKey: true,
      shortcutKey: 77,
      shortcutMetaKey: 'alt',
      mode: 'Basic',
      contextMenu: true,
    },

    visible: false,
    position: 'right',
  },

  mutations: {
    toggleStylebot(state) {
      state.visible = !state.visible;
    },

    togglePlacement(state) {
      if (state.position === 'left') {
        state.position = 'right';
      } else {
        state.position = 'left';
      }
    },

    hideStylebot(state) {
      state.visible = false;
    },

    setOptions(state, options) {
      state.options = options;
    },
  },
});
