import type { Meta, StoryObj } from '@storybook/vue';

import STooltip from './STooltip.vue';
import SButton from './SButton.vue';
import {
  focusViaTab,
  fromTemplate,
  playground,
} from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Overlays/STooltip',
  component: STooltip,
  argTypes: {
    text: { control: 'text' },
    shortcut: { control: 'text' },
    placement: { control: 'radio', options: ['bottom', 'top'] },
  },
  args: { text: 'Inspect an element', shortcut: 'i', placement: 'bottom' },
};

export default meta;

const components = { STooltip, SButton };

const shown: StoryObj['play'] = async ({ canvasElement }) =>
  focusViaTab(canvasElement);

export const Playground = {
  ...playground(
    components,
    `
    <div style="padding: 48px 0">
      <s-tooltip :text="text" :shortcut="shortcut" :placement="placement">
        <s-button variant="ghost">Hover or focus me</s-button>
      </s-tooltip>
    </div>
  `
  ),
  play: shown,
};

export const Bottom = fromTemplate(
  components,
  `
  <div style="padding: 8px 0 48px">
    <s-tooltip text="Reset all styles on this element">
      <s-button variant="ghost">Reset</s-button>
    </s-tooltip>
  </div>
`,
  { play: shown }
);

export const Top = fromTemplate(
  components,
  `
  <div style="padding: 48px 0 8px">
    <s-tooltip text="Hide this element" placement="top">
      <s-button variant="ghost">Hide</s-button>
    </s-tooltip>
  </div>
`,
  { play: shown }
);

export const WithShortcut = fromTemplate(
  components,
  `
  <div style="padding: 8px 0 48px">
    <s-tooltip text="Inspect an element" shortcut="i">
      <s-button variant="ghost">Inspect</s-button>
    </s-tooltip>
  </div>
`,
  { play: shown }
);
