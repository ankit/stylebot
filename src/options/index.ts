import Vue from 'vue';

import {
  IconsPlugin,
  LayoutPlugin,
  DropdownPlugin,
  FormInputPlugin,
  ButtonPlugin,
  ListGroupPlugin,
  FormCheckboxPlugin,
  ModalPlugin,
  FormTextareaPlugin,
} from 'bootstrap-vue';

Vue.use(IconsPlugin);
Vue.use(LayoutPlugin);
Vue.use(DropdownPlugin);
Vue.use(FormInputPlugin);
Vue.use(ButtonPlugin);
Vue.use(FormCheckboxPlugin);
Vue.use(ListGroupPlugin);
Vue.use(ModalPlugin);
Vue.use(FormTextareaPlugin);

import App from './App.vue';

new Vue({
  el: '#app',
  render: (h: any) => h(App),
});
