import type { Meta } from '@storybook/vue';

import Style from './Style.vue';
import { popup, style } from '@stylebot/storybook/mocks/popup';

const meta: Meta = {
  title: 'Browser Action/Styles',
  component: Style,
  parameters: { padded: false },
};

export default meta;

export const NoStyle = popup();

export const WithStyle = popup({
  styles: [style('example.com')],
  defaultStyle: style('example.com'),
});

export const MultipleStyles = popup({
  styles: [
    style('example.com'),
    style('example.com/article', false),
    style('*.example.com'),
  ],
  defaultStyle: style('example.com'),
});

export const StyleDisabled = popup({
  styles: [style('example.com', false)],
  defaultStyle: style('example.com', false),
});
