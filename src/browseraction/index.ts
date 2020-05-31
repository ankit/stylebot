import Vue from 'vue';
import vuetify from '../plugins/vuetify';
import App from './App.vue';

new Vue({
  el: '#app',
  vuetify,
  render: (h: any) => h(App),
});
