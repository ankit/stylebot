import Vue from 'vue';
import { t } from '@stylebot/i18n';

import App from './App.vue';
import store from './store/index';
import { createRouter } from './router';

Vue.mixin({
  methods: {
    t,
  },
});

new Vue({
  store,
  router: createRouter(),
  el: '#app',
  render: h => h(App),
});
