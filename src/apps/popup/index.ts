import Vue from 'vue';
import { t } from '@stylebot/i18n';

import App from './App.vue';

Vue.mixin({
  methods: {
    t,
  },
});

document.documentElement.lang = t('language_code');

new Vue({
  el: '#app',
  render: h => h(App),
});
