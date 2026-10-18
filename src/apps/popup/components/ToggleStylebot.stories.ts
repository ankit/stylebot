import type { Meta } from '@storybook/vue';

import ToggleStylebot from './ToggleStylebot.vue';
import { popup, style } from '@stylebot/storybook/fixtures/popup';

const longProfileStyle = {
  ...style('example.com'),
  profiles: {
    default: { name: '', css: 'h1 { color: blue; }' },
    long: {
      name: 'An Extremely Long Style Name That Tests Truncation, Anywhere',
    },
  },
  activeProfile: 'long',
};

const meta: Meta = {
  title: 'Browser Action/Editor Toggle',
  component: ToggleStylebot,
  parameters: { padded: false },
};

export default meta;

export const Closed = popup();

export const Open = popup({
  styles: [style('example.com')],
  defaultStyle: style('example.com'),
  isOpen: true,
});

export const NoShortcut = popup({ commands: { stylebot: '' } });

export const LongProfileName = popup({
  styles: [longProfileStyle],
  defaultStyle: longProfileStyle,
});
