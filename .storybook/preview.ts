import Vue from 'vue';
import Vuex from 'vuex';
import VueDraggableResizable from 'vue-draggable-resizable';
import type { Preview } from '@storybook/vue';

import { t } from '@stylebot/i18n';
import { ThemeProvider } from '@stylebot/components';
import { installChrome } from './mocks/chrome';

import '../src/fonts/fonts.css';
import '../src/editor/index.scss';
import './preview.css';

Vue.use(Vuex);
Vue.component('vue-draggable-resizable', VueDraggableResizable);
Vue.mixin({ methods: { t } });
installChrome();

const FONTS = [
  '400 14px Geist',
  '500 14px Geist',
  '600 14px Geist',
  '700 14px Geist',
  '400 14px "Fira Code"',
  '500 14px "Fira Code"',
  '600 14px "Fira Code"',
];

const preview: Preview = {
  // Components that measure themselves (tooltips, tab indicators) must see
  // final font metrics, so no story renders until the webfonts are in.
  loaders: [
    async () => {
      await Promise.all(FONTS.map(font => document.fonts.load(font)));
    },
  ],

  globalTypes: {
    theme: {
      description: 'Color scheme',
      defaultValue: 'light',
      toolbar: {
        icon: 'mirror',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },

  parameters: {
    layout: 'fullscreen',
    controls: { expanded: false },
    options: {
      storySort: {
        order: [
          'Primitives',
          [
            'Theme',
            'Typography',
            'Buttons',
            'Inputs',
            'Navigation',
            'Overlays',
            'Display',
          ],
          'Editor',
          'Options',
          'Browser Action',
        ],
      },
    },
  },

  decorators: [
    (story, { globals, parameters }) => {
      // Composites read their appearance from options, so the toolbar theme
      // flows through the shim as well as the outer ThemeProvider.
      installChrome({
        ...parameters.chrome,
        options: { appearance: globals.theme, ...parameters.chrome?.options },
      });

      return {
        components: { story, ThemeProvider },
        data: () => ({
          mode: globals.theme,
          padded: parameters.padded !== false,
        }),
        template: `
          <theme-provider :mode="mode" class="sb-canvas" :class="{ padded }">
            <story />
          </theme-provider>
        `,
      };
    },
  ],
};

export default preview;
