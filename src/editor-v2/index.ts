import Vue from 'vue';
import {
  IconsPlugin,
  TooltipPlugin,
  LayoutPlugin,
  DropdownPlugin,
} from 'bootstrap-vue';

import App from './App.vue';
import './index.scss';

const stylebotApp = document.createElement('div');
stylebotApp.id = 'stylebot';
document.body.appendChild(stylebotApp);

Vue.use(IconsPlugin);
Vue.use(TooltipPlugin);
Vue.use(LayoutPlugin);
Vue.use(DropdownPlugin);

new Vue({
  el: '#stylebot',
  render: (h: any) => h(App),
});
