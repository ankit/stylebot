import Vue from 'vue';
import Vuex from 'vuex';
import VueDraggableResizable from 'vue-draggable-resizable';
import { addons } from '@storybook/preview-api';
import {
  FORCE_REMOUNT,
  GLOBALS_UPDATED,
  SET_GLOBALS,
  STORY_RENDERED,
} from '@storybook/core-events';
import type { Preview } from '@storybook/vue';

import { t } from '@stylebot/i18n';
import { ThemeProvider } from '@stylebot/components';
import { installChrome } from './mocks/chrome';
import { resetHoverSettled, setInteractionDelay } from './story-helpers';
import { setPageBridge, LocalPageBridge } from '@stylebot/page-bridge';

import '../src/fonts/fonts.css';
import '../src/editor/index.scss';
import './preview.css';

Vue.use(Vuex);
Vue.component('VueDraggableResizable', VueDraggableResizable);
Vue.mixin({ methods: { t } });
installChrome();

// The canvas is the "page"; the bridge reads the mounted story's css like the
// content script reads its store's.
const mountedStoryCss = (): string => {
  const app = document.querySelector<HTMLElement & { __vue__?: Vue }>(
    '#storybook-root .stylebot-app'
  );

  return app?.__vue__?.$store?.state.css ?? '';
};

// One bridge per story, or highlighter overlays and listeners outlive it.
let pageBridge: LocalPageBridge | null = null;

const resetPageBridge = (): void => {
  pageBridge?.stopInspecting();
  pageBridge?.unhighlight();
  pageBridge = new LocalPageBridge({ getStylebotCss: mountedStoryCss });
  setPageBridge(pageBridge);
};

resetPageBridge();

/* The Vue 2 renderer only pushes args into the mounted story on re-render,
   so a toolbar theme change has to remount for the decorator and seeded
   stores to pick it up. */
const channel = addons.getChannel();
let currentStoryId: string | undefined;
let currentTheme: string | undefined;

channel.on(STORY_RENDERED, (storyId: string) => {
  currentStoryId = storyId;
});

channel.on(SET_GLOBALS, ({ globals }: { globals: { theme?: string } }) => {
  currentTheme = globals.theme;
});

channel.on(GLOBALS_UPDATED, ({ globals }: { globals: { theme?: string } }) => {
  const themeChanged = globals.theme !== currentTheme;
  currentTheme = globals.theme;

  if (themeChanged && currentStoryId) {
    channel.emit(FORCE_REMOUNT, { storyId: currentStoryId });
  }
});

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
    speed: {
      description: 'Interaction test speed',
      defaultValue: 'instant',
      toolbar: {
        icon: 'play',
        items: [
          { value: 'instant', title: 'Instant' },
          { value: 'slow', title: 'Slow motion' },
        ],
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
          ['Panel', 'ColorPickerPopover', 'TheHelpDialog'],
          'Options',
          ['Basics', 'Styles', 'Sync'],
          'Browser Action',
          [
            'Styles',
            'Editor Toggle',
            'Readability',
            'Sync',
            'Release Notification',
            'Restricted Page',
          ],
          'Tests',
        ],
      },
    },
  },

  decorators: [
    (_story, { globals, parameters }) => {
      // The editor store injects the style into the document like the
      // content script does; the previous story's must not bleed into this
      // one. Emptied rather than removed so the next injection reuses it.
      document
        .querySelectorAll('style[id^="stylebot-css-"]')
        .forEach(el => (el.textContent = ''));

      // Slow motion is for watching a play in the browser; the runner never
      // sets it, so CI stays instant.
      setInteractionDelay(globals.speed === 'slow' ? 250 : 0);
      resetHoverSettled();
      resetPageBridge();

      // Composites read their appearance from options, so the toolbar theme
      // flows through the shim as well as the outer ThemeProvider.
      installChrome({
        ...parameters.chrome,
        options: { appearance: globals.theme, ...parameters.chrome?.options },
      });

      return {
        components: { ThemeProvider },
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
