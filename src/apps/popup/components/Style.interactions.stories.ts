import type { Meta, StoryObj } from '@storybook/vue';
import { expect, within } from '@storybook/test';

import Style from './Style.vue';
import { popup, style } from '@stylebot/storybook/fixtures/popup';

const meta: Meta = {
  title: 'Tests/Browser Action/Styles',
  tags: ['test'],
  component: Style,
  parameters: { padded: false },
};

export default meta;

export const SavedStyle: StoryObj = {
  ...popup({
    styles: [style('example.com')],
    defaultStyle: style('example.com'),
  }),
  name: "the page's one style shows as a Style toggle, on, and Edit style opens it",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      await canvas.findByRole('checkbox', { name: /^Style/ })
    ).toBeChecked();
    await expect(canvas.queryByRole('radio')).toBeNull();
    await expect(
      canvas.getByRole('button', { name: /^Edit style/ })
    ).toBeVisible();
  },
};

export const NamedStyle: StoryObj = {
  ...popup({
    styles: [
      {
        ...style('example.com'),
        profiles: { default: { name: 'Dracula' } },
        activeProfile: 'default',
      },
    ],
    defaultStyle: style('example.com'),
  }),
  name: 'a renamed style shows its name instead of Style',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      await canvas.findByRole('checkbox', { name: /^Dracula/ })
    ).toBeChecked();
    await expect(
      canvas.getByRole('button', { name: /^Edit Dracula/ })
    ).toBeVisible();
  },
};

export const DisabledStyle: StoryObj = {
  ...popup({
    styles: [style('example.com', false)],
    defaultStyle: style('example.com', false),
  }),
  name: 'a turned-off style shows with its toggle off',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      await canvas.findByRole('checkbox', { name: /^Style/ })
    ).not.toBeChecked();
  },
};
