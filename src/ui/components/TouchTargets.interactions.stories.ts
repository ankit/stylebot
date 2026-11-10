import type { Meta, StoryObj } from '@storybook/vue';
import { expect, within } from '@storybook/test';

import SButton from './SButton.vue';
import SIconButton from './SIconButton.vue';
import SLinkButton from './SLinkButton.vue';
import SToggleSwitch from './SToggleSwitch.vue';
import { hasTouchTarget } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Primitives/Touch targets',
  tags: ['test'],
};

export default meta;

const controls = {
  components: { SButton, SIconButton, SLinkButton, SToggleSwitch },
  template: `
    <div style="display: grid; justify-items: start; gap: 48px; padding: 48px">
      <s-button size="small">Small button</s-button>
      <s-link-button>Link button</s-link-button>
      <s-icon-button aria-label="Close">×</s-icon-button>
      <div><s-toggle-switch aria-label="Switch" /></div>
    </div>
  `,
};

/**
 * Every control in the grid above, in order.
 */
const allControls = (root: HTMLElement): Array<HTMLElement> => {
  const canvas = within(root);

  return [
    canvas.getByRole('button', { name: 'Small button' }),
    canvas.getByRole('button', { name: 'Link button' }),
    canvas.getByRole('button', { name: 'Close' }),
    canvas.getByRole('checkbox').closest('label') as HTMLElement,
  ];
};

export const TouchTargetsOnTouchscreens: StoryObj = {
  render: () => controls,
  parameters: { touchscreen: true },
  name: 'on a touchscreen small controls take taps across a 44pt square',
  play: async ({ canvasElement }) => {
    for (const control of allControls(canvasElement)) {
      await expect(control.getBoundingClientRect().height).toBeLessThan(44);
      await expect(hasTouchTarget(control)).toBe(true);
    }
  },
};

export const NoTouchTargetsWithAMouse: StoryObj = {
  render: () => controls,
  name: 'with a mouse small controls take clicks only on themselves',
  play: async ({ canvasElement }) => {
    for (const control of allControls(canvasElement)) {
      await expect(hasTouchTarget(control)).toBe(false);
    }
  },
};
