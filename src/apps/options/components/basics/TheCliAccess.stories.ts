import type { Meta } from '@storybook/vue';

import TheCliAccess from './TheCliAccess.vue';
import { cliAccessCard } from '@stylebot/storybook/fixtures/options';

const meta: Meta = {
  title: 'Options/Basics/CLI Access',
  component: TheCliAccess,
};

export default meta;

export const Off = cliAccessCard();

export const On = {
  ...cliAccessCard({ options: { cliAccess: true } }),
  parameters: { chrome: { permissions: { granted: true } } },
};

export const OnAndConnected = {
  ...cliAccessCard({ options: { cliAccess: true } }),
  parameters: {
    chrome: {
      permissions: { granted: true },
      storage: { 'cli-connected': true },
    },
  },
};
