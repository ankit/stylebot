import Vue from 'vue';
import { t } from '@stylebot/i18n';

import App from './App.vue';
import store from './store/index';

Vue.mixin({
  methods: {
    t,
  },
});

new Vue({
  store,
  el: '#app',
  render: h => h(App),
});
