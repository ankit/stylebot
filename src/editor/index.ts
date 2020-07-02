import Vue from 'vue';
import store from './store/index';
import TheStylebotApp from './components/TheStylebotApp.vue';

import './index.scss';

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
  FormCheckboxPlugin,
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

const stylebotApp = document.createElement('div');
stylebotApp.id = 'stylebot';
document.body.appendChild(stylebotApp);

new Vue({
  store,
  el: '#stylebot',
  render: (h: any) => h(TheStylebotApp),
});
