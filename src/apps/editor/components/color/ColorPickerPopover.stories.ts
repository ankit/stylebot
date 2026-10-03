import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

import ColorPickerPopover from './ColorPickerPopover.vue';
import type { EditorStateOverrides } from '@stylebot/storybook/fixtures/editor-store';
import { createEditorStore } from '@stylebot/storybook/fixtures/editor-store';
import type { ChromeShimOptions } from '@stylebot/storybook/mocks/chrome';
import { findOpenMenu, user } from '@stylebot/storybook/story-helpers';

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

/* Rendered inside the editor's typography scope, with enough room below
   for the palette menu. */
const popover = (
  value: string,
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
        ...overrides.options,
      },
    }),
    data: () => ({ value }),
    template: `
      <div class="stylebot-app" style="padding-bottom: 160px">
        <color-picker-popover
          :value="value"
          role-label="Text color"
          @input="value = $event"
        />
      </div>
    `,
  }),
  parameters: { chrome },
});

export const NotSet = popover('', {}, {});

export const WithColor = popover('#2a5fd6', { css: RULE_CSS });

export const ChoosingAPalette: StoryObj = {
  ...popover('#e6eaf0', { css: RULE_CSS }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await user.click(canvas.getByRole('button', { name: /Neutrals/ }));
    await findOpenMenu(canvas);
  },
};

export const CustomColor: StoryObj = {
  ...popover('#8be9fd', { css: RULE_CSS }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await user.click(canvas.getByRole('button', { name: 'Custom color' }));
    await waitFor(() =>
      expect(canvasElement.querySelector('.sv-square')).toBeVisible()
    );
  },
};
