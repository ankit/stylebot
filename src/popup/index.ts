import Vue from 'vue';
import { t } from '@stylebot/i18n';

import App from './App.vue';

import { ListGroupPlugin } from 'bootstrap-vue/esm/components/list-group';
import { FormCheckboxPlugin } from 'bootstrap-vue/esm/components/form-checkbox';

Vue.use(ListGroupPlugin);
Vue.use(FormCheckboxPlugin);

Vue.mixin({
  methods: {
    t,
  },
});

new Vue({
  el: '#app',
  render: h => h(App),
});
