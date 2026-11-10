import type { VueConstructor } from 'vue';
import Vue from 'vue';

import { isIPhone } from '@stylebot/utils';

/**
 * What App provides to every component on the page: iPhone has no editor,
 * so nothing there edits a style's CSS or sets the editor up.
 */
export const provideSupportsEditor = (): { supportsEditor: boolean } => ({
  supportsEditor: !isIPhone(),
});

export const injectSupportsEditor = { supportsEditor: { default: true } };

/**
 * Vue for an Options page component, typed with what App provides.
 */
export const OptionsVue = Vue as VueConstructor<
  Vue & { supportsEditor: boolean }
>;
