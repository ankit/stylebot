import Vue from 'vue';
import { t } from '@stylebot/i18n';

import App from './App.vue';
import store from './store/index';

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
  FormGroupPlugin,
  AlertPlugin,
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
Vue.use(FormGroupPlugin);
Vue.use(AlertPlugin);

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
