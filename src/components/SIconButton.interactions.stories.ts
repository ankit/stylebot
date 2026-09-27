import type { Meta, StoryObj } from '@storybook/vue';
import { expect, within } from '@storybook/test';

import SIconButton from './SIconButton.vue';
import { IconX } from '@stylebot/icons';
import { fromTemplate, user } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Tests/Primitives/Icon button',
  tags: ['test'],
  component: SIconButton,
};

export default meta;

const iconButton = (template: string): StoryObj =>
  fromTemplate({ SIconButton, IconX }, template);

export const TooltipLabelsButton: StoryObj = {
  ...iconButton(
    `<s-icon-button tooltip="Close" tooltip-shortcut="esc">
      <icon-x :size="14" />
    </s-icon-button>`
  ),
  name: 'a tooltip names the button and shows with its shortcut on Tab focus',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Close' });

    await user.tab();
    await expect(button).toHaveFocus();
    const tooltip = await canvas.findByRole('tooltip');

    await expect(tooltip).toHaveTextContent('Close');
    await expect(tooltip).toHaveTextContent('ESC');

    await user.keyboard('{Escape}');
    await expect(canvas.queryByRole('tooltip')).not.toBeInTheDocument();
  },
};

export const ExplicitLabelWins: StoryObj = {
  ...iconButton(
    `<s-icon-button tooltip="Close" aria-label="Close panel">
      <icon-x :size="14" />
    </s-icon-button>`
  ),
  name: 'an explicit aria-label takes precedence over the tooltip text',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Close panel' });

    await user.tab();
    await expect(button).toHaveFocus();
    await expect(await canvas.findByRole('tooltip')).toHaveTextContent('Close');
  },
};

export const NoTooltip: StoryObj = {
  ...iconButton(
    `<s-icon-button aria-label="Close"><icon-x :size="14" /></s-icon-button>`
  ),
  name: 'without a tooltip the button is the root and keeps its aria-label',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Close' });

    await expect(canvasElement.querySelector('.s-tooltip')).toBeNull();
    await user.tab();
    await expect(button).toHaveFocus();
    await expect(canvas.queryByRole('tooltip')).not.toBeInTheDocument();
  },
};
