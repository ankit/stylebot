import Vue from 'vue';
import VueDraggableResizable from 'vue-draggable-resizable';
import { Store } from 'vuex';
import { t } from '@stylebot/i18n';

import { State } from '../store';
import TheStylebotApp from '../components/TheStylebotApp.vue';

import '../index.scss';

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
  ListGroupPlugin,
  TableSimplePlugin,
  CollapsePlugin,
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
Vue.use(TableSimplePlugin);
Vue.use(CollapsePlugin);
Vue.component('vue-draggable-resizable', VueDraggableResizable);

Vue.mixin({
  methods: {
    t,
  },
});

const injectCss = (shadowRoot: ShadowRoot): Promise<void> => {
  const url = chrome.runtime.getURL('editor/index.css');

  return fetch(url, { method: 'GET' })
    .then(response => response.text())
    .then(css => {
      const styleEl = document.createElement('style');
      styleEl.setAttribute('id', 'stylebot-editor-css');
      styleEl.innerHTML = css;
      shadowRoot.appendChild(styleEl);
    });
};

const initEditor = (store: Store<State>): void => {
  if (document.getElementById('stylebot')) {
    return;
  }

  const stylebotAppHost = document.createElement('div');
  stylebotAppHost.id = 'stylebot';

  // !important beats page rules that would hide this; fixed + max z-index
  // beats page content stacked above it. Sized 0x0, the panel is its own fixed element.
  const hostStyle = stylebotAppHost.style;
  hostStyle.setProperty('display', 'block', 'important');
  hostStyle.setProperty('position', 'fixed', 'important');
  hostStyle.setProperty('top', '0', 'important');
  hostStyle.setProperty('left', '0', 'important');
  hostStyle.setProperty('width', '0', 'important');
  hostStyle.setProperty('height', '0', 'important');
  hostStyle.setProperty('z-index', '2147483647', 'important');

  document.body.appendChild(stylebotAppHost);

  const shadowRoot = stylebotAppHost.attachShadow({ mode: 'open' });
  const stylebotApp = document.createElement('div');

  stylebotApp.id = 'stylebot-app';
  shadowRoot.appendChild(stylebotApp);

  // Wait for the stylesheet to land before mounting — otherwise Vue's
  // synchronous mount renders the unstyled markup first, causing a
  // visible flash whenever the CSS fetch is slower than the mount.
  injectCss(shadowRoot).then(() => {
    new Vue({
      store,
      el: stylebotApp,
      render: h => h(TheStylebotApp),
    });
  });
};

export { initEditor };
