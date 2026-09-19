import type { Meta, StoryObj } from '@storybook/vue';

import STooltip from './STooltip.vue';
import SButton from './SButton.vue';
import { focusViaTab, fromTemplate } from '@sb/story-helpers';

const meta: Meta = {
  title: 'Primitives/STooltip',
  component: STooltip,
};

export default meta;

const components = { STooltip, SButton };

const shown = (template: string): StoryObj =>
  fromTemplate(components, template, {
    play: async ({ canvasElement }) => focusViaTab(canvasElement),
  });

export const Bottom = shown(`
  <div style="padding: 8px 0 48px">
    <s-tooltip text="Reset all styles on this element">
      <s-button variant="ghost">Reset</s-button>
    </s-tooltip>
  </div>
`);

export const Top = shown(`
  <div style="padding: 48px 0 8px">
    <s-tooltip text="Hide this element" placement="top">
      <s-button variant="ghost">Hide</s-button>
    </s-tooltip>
  </div>
`);

export const WithShortcut = shown(`
  <div style="padding: 8px 0 48px">
    <s-tooltip text="Inspect an element" shortcut="i">
      <s-button variant="ghost">Inspect</s-button>
    </s-tooltip>
  </div>
`);
