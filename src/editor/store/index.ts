import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    visible: false,
    options: {},
  },

  mutations: {
    toggleStylebot(state) {
      state.visible = !state.visible;
    },

    hideStylebot(state) {
      state.visible = false;
    },

    setOptions(state, options) {
      state.options = options;
    },
  },
});
