import Vue from 'vue';
import App from './App.vue';

const stylebotApp = document.createElement('div');
stylebotApp.id = 'stylebot';
document.body.appendChild(stylebotApp);

new Vue({
  el: '#stylebot',
  render: (h: any) => h(App),
});
