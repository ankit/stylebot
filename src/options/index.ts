import Vue from 'vue';

import {
  IconsPlugin,
  TooltipPlugin,
  LayoutPlugin,
  DropdownPlugin,
  FormRadioPlugin,
  FormInputPlugin,
  InputGroupPlugin,
  ButtonPlugin,
  ButtonGroupPlugin,
  FormGroupPlugin,
  ListGroupPlugin,
  FormCheckboxPlugin,
  CardPlugin,
  AlertPlugin,
  ModalPlugin,
  FormTextareaPlugin,
} from 'bootstrap-vue';

Vue.use(IconsPlugin);
Vue.use(TooltipPlugin);
Vue.use(LayoutPlugin);
Vue.use(DropdownPlugin);
Vue.use(FormRadioPlugin);
Vue.use(FormInputPlugin);
Vue.use(InputGroupPlugin);
Vue.use(ButtonPlugin);
Vue.use(ButtonGroupPlugin);
Vue.use(FormGroupPlugin);
Vue.use(FormCheckboxPlugin);
Vue.use(ListGroupPlugin);
Vue.use(CardPlugin);
Vue.use(AlertPlugin);
Vue.use(ModalPlugin);
Vue.use(FormTextareaPlugin);

import App from './App.vue';

new Vue({
  el: '#app',
  render: (h: any) => h(App),
});
