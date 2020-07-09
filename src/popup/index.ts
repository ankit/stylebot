import Vue from 'vue';
import App from './App.vue';

import { IconsPlugin, ListGroupPlugin } from 'bootstrap-vue';

Vue.use(IconsPlugin);
Vue.use(ListGroupPlugin);

new Vue({
  el: '#app',
  render: (h: any) => h(App),
});
