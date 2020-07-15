import Vue from 'vue';
import App from './App.vue';

/* @ts-ignore */
import { isProbablyReaderable } from '../../node_modules/readability/Readability-readerable';

const hostId = 'stylebot-readability';

const render = () => {
  const readabilityHost = document.createElement('div');
  const hostStyle =
    'top: 0; height: 100%; width: 100%; position: fixed; z-index: 10000;';

  readabilityHost.id = hostId;
  readabilityHost.setAttribute('style', hostStyle);
  document.body.appendChild(readabilityHost);

  const shadowRoot = readabilityHost.attachShadow({ mode: 'open' });
  const stylebotReadabilityApp = document.createElement('div');

  stylebotReadabilityApp.id = 'stylebot-readability-app';
  shadowRoot.appendChild(stylebotReadabilityApp);

  const cssUrl = chrome.extension.getURL('readability/index.css');
  fetch(cssUrl, { method: 'GET' })
    .then(response => response.text())
    .then(css => {
      const styleEl = document.createElement('style');
      styleEl.innerHTML = css;
      shadowRoot.appendChild(styleEl);

      new Vue({
        el: stylebotReadabilityApp,
        render: (h: any) => h(App),
      });

      document.body.setAttribute('style', 'position: fixed;');
    });

  document.body.setAttribute('style', 'position: fixed; display: none');
};

export const apply = () => {
  if (window === window.top) {
    if (isProbablyReaderable(document)) {
      render();
    }
  }
};

export const remove = () => {
  document.body.setAttribute('style', '');
  const host = document.getElementById(hostId);

  if (host) {
    host.remove();
  }
};
