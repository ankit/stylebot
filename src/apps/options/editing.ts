import type { VueConstructor } from 'vue';
import Vue from 'vue';

import { isIPhone } from '@stylebot/utils';

/**
 * What App provides to every component on the page: iPhone has no editor,
 * so nothing there edits a style's CSS or sets the editor up.
 */
export const editingProvision = (): { editingEnabled: boolean } => ({
  editingEnabled: !isIPhone(),
});

export const editingInjection = { editingEnabled: { default: true } };

/**
 * Vue, typed for a component that injects `editingEnabled`.
 */
export const VueWithEditing = Vue as VueConstructor<
  Vue & { editingEnabled: boolean }
>;
