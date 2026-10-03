import type { Meta, StoryObj } from '@storybook/vue';
import { expect, waitFor, within } from '@storybook/test';

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
  name: "the page's saved style shows with its toggle on",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() =>
      expect(
        canvas.getByRole('checkbox', { name: /example\.com/ })
      ).toBeChecked()
    );
    await expect(canvas.queryByText('No style saved for this site')).toBeNull();
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

    const toggle = await canvas.findByRole('checkbox', {
      name: /example\.com/,
    });
    await expect(toggle).not.toBeChecked();
  },
};
