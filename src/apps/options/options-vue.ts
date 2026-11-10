import type { VueConstructor } from 'vue';
import Vue from 'vue';

import { isIPhone } from '@stylebot/utils';

type Provided = {
  // iPhone has no editor, so nothing there edits a style's CSS or sets it up.
  supportsEditor: boolean;
};

/**
 * What App provides to every component on the Options page.
 */
export const provideOptions = (): Provided => ({
  supportsEditor: !isIPhone(),
});

/**
 * Vue for an Options page component, which injects what App provides.
 * Outside App, as in a component's own story, it gets the desktop defaults.
 */
export const OptionsVue = Vue.extend({
  inject: { supportsEditor: { default: true } },
}) as VueConstructor<Vue & Provided>;
