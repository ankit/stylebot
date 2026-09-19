import type { Meta, StoryObj } from '@storybook/vue';

import ColorPickerPopover from './ColorPickerPopover.vue';
import {
  createEditorStore,
  EditorStateOverrides,
} from '@stylebot/storybook/mocks/editor-store';
import type { ChromeShimOptions } from '@stylebot/storybook/mocks/chrome';

const meta: Meta = {
  title: 'Editor/ColorPickerPopover',
  component: ColorPickerPopover,
};

export default meta;

const RULE_CSS = `h1 {
  color: #2a5fd6;
  background-color: #f4f7fe;
}

p {
  color: #191b1f;
  border-color: #b3261e;
}

.card {
  background-color: #1c1e22;
}`;

const RECENT = ['#3d7bff', '#f2726a', '#191b1f'];

/* Rendered inside the editor's typography scope, sized like the panel,
   with enough room below for the palette search dropdown. */
const popover = (
  tab: 'already-used' | 'palette' | 'custom',
  overrides: EditorStateOverrides = {},
  chrome: ChromeShimOptions = { recentColors: RECENT }
): StoryObj => ({
  render: (_args, { globals }) => ({
    components: { ColorPickerPopover },
    store: createEditorStore({
      activeSelector: 'h1',
      ...overrides,
      options: {
        appearance: globals.theme,
        lastColorPickerTab: tab,
        ...overrides.options,
      },
    }),
    template: `
      <div class="stylebot-app" style="padding-bottom: 120px">
        <color-picker-popover value="#2a5fd6" role-label="Text color" />
      </div>
    `,
  }),
  parameters: { chrome },
});

export const YourColors = popover('already-used', { css: RULE_CSS });

export const PageColors = popover('already-used');

export const NoRecentColors = popover('already-used', { css: RULE_CSS }, {});

export const Palette = popover('palette', { css: RULE_CSS });

export const Custom = popover('custom', { css: RULE_CSS });
