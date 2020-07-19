import Vue from 'vue';
import App from './App.vue';

import {
  IconsPlugin,
  ListGroupPlugin,
  FormCheckboxPlugin,
} from 'bootstrap-vue';

Vue.use(IconsPlugin);
Vue.use(ListGroupPlugin);
Vue.use(FormCheckboxPlugin);

new Vue({
  el: '#app',
  render: (h: any) => h(App),
});
