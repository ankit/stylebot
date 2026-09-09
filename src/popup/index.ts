import Vue from 'vue';
import { t } from '@stylebot/i18n';

import App from './App.vue';

Vue.mixin({
  methods: {
    t,
  },
});

new Vue({
  el: '#app',
  render: h => h(App),
});
