import Vue from 'vue';
import { IconsPlugin, TooltipPlugin, LayoutPlugin } from 'bootstrap-vue';

import App from './App.vue';

import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-vue/dist/bootstrap-vue.css';
import 'bootstrap-vue/dist/bootstrap-vue-icons.min.css';

import './index.css';

const stylebotApp = document.createElement('div');
stylebotApp.id = 'stylebot';
document.body.appendChild(stylebotApp);

Vue.use(IconsPlugin);
Vue.use(TooltipPlugin);
Vue.use(LayoutPlugin);

new Vue({
  el: '#stylebot',
  render: (h: any) => h(App),
});
