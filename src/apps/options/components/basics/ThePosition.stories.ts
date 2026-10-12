import type { Meta } from '@storybook/vue';

import ThePosition from './ThePosition.vue';
import { positionCard } from '@stylebot/storybook/fixtures/options';

const meta: Meta = {
  title: 'Options/Basics/Position',
  component: ThePosition,
};

export default meta;

export const SidePanel = positionCard();

export const Window = positionCard({
  options: {
    layout: { width: 360, adjustPageLayout: false, dockLocation: 'window' },
  },
});
