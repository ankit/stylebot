import type { Meta } from '@storybook/vue';

import Readability from './Readability.vue';
import { popup, style } from '@stylebot/storybook/mocks/popup';

const meta: Meta = {
  title: 'Browser Action/Readability',
  component: Readability,
  parameters: { padded: false },
};

export default meta;

export const Available = popup({ commands: { readability: 'alt+shift+r' } });

export const Active = popup({
  defaultStyle: { ...style('example.com'), readability: true },
  styles: [{ ...style('example.com'), readability: true }],
});

export const NotReaderable = popup({ pageReaderable: false });
