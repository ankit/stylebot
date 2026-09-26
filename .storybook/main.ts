import path from 'path';
import { mergeConfig } from 'vite';
import { createVuePlugin } from 'vite-plugin-vue2';
import type { StorybookConfig } from '@storybook/vue-vite';

import localePlugin from './locale-plugin';

const src = (p: string) => path.resolve(__dirname, '../src', p);
const mock = (p: string) => path.resolve(__dirname, 'mocks', p);

const aliasedPackages = [
  'components',
  'icons',
  'css',
  'inject-css',
  'i18n',
  'sync',
  'history',
  'types',
  'utils',
  'styles',
  'settings',
  'google-fonts',
  'highlighter',
  'page-bridge',
];

const config: StorybookConfig = {
  framework: '@storybook/vue-vite',
  stories: ['../src/**/*.stories.ts'],
  // Serves what the extension reads via chrome.runtime.getURL().
  staticDirs: [{ from: '../src/google-fonts', to: '/google-fonts' }],
  addons: [
    '@storybook/addon-toolbars',
    '@storybook/addon-controls',
    '@storybook/addon-viewport',
    '@storybook/addon-interactions',
  ],
  docs: { autodocs: false },
  core: { disableTelemetry: true },

  viteFinal: config => {
    /* The framework's docgen transform appends to every *.vue-matched id,
       including SFC sub-blocks, which breaks Vite's import analysis. */
    config.plugins = (config.plugins ?? []).filter(
      plugin =>
        !(
          plugin &&
          'name' in plugin &&
          plugin.name === 'storybook:vue2-docgen-plugin'
        )
    );

    return mergeConfig(config, {
      /* vite-plugin-vue2 compiles SFCs with the same vue-template-compiler
         2.6 that webpack's vue-loader uses; @vitejs/plugin-vue2 needs Vue 2.7. */
      plugins: [createVuePlugin(), localePlugin()],
      resolve: {
        alias: [
          { find: '@stylebot/storybook', replacement: __dirname },
          // Deep paths inside src for the mocks and helpers here; stories
          // themselves keep to the package aliases below.
          { find: /^@\//, replacement: `${src('')}/` },
          {
            find: '@stylebot/readability',
            replacement: mock('readability.ts'),
          },
          {
            find: '@stylebot/monaco-editor',
            replacement: mock('monaco-editor.ts'),
          },
          {
            find: /^\.\/(code\/)?CodeEditorIframe\.vue$/,
            replacement: mock('CodeEditorIframe.vue'),
          },
          ...aliasedPackages.map(name => ({
            find: `@stylebot/${name}`,
            replacement: src(`${name}/index`),
          })),
        ],
      },
      css: {
        preprocessorOptions: {
          scss: {
            additionalData: '@import "mixins";',
            includePaths: [src('styles')],
          },
        },
      },
      server: {
        watch: {
          ignored: [
            '**/dist/**',
            '**/firefox-dist/**',
            '**/storybook-static/**',
            '**/playwright-report/**',
            '**/test-results/**',
          ],
        },
      },
      optimizeDeps: {
        include: [
          'vue-draggable-resizable',
          'tinycolor2',
          'hotkeys-js',
          'postcss',
        ],
      },
    });
  },
};

export default config;
