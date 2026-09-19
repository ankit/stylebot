import type { Meta } from '@storybook/vue';

import ToggleStylebot from './ToggleStylebot.vue';
import { popup, style } from '@stylebot/storybook/mocks/popup';

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
