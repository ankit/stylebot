import type { Meta } from '@storybook/vue';

import ThePublishView from './ThePublishView.vue';
import { editor, WITH_RULE } from '@stylebot/storybook/fixtures/editor';

const meta: Meta = {
  title: 'Editor/Publish',
  component: ThePublishView,
  parameters: { padded: false },
};

export default meta;

export const SignedOut = {
  ...editor({ ...WITH_RULE, publishing: true }),
  parameters: { chrome: { gallery: {} } },
};

export const SignedIn = {
  ...editor({ ...WITH_RULE, publishing: true }),
  parameters: {
    chrome: {
      gallery: {
        account: { id: 'me', username: 'maya', usernameConfirmed: true },
      },
    },
  },
};

const tokyoNight = {
  id: 'Xk3p9QaL2m',
  site: 'example.com',
  group: 'example.com',
  slug: 'tokyo-night',
  name: 'Tokyo Night',
  description: 'The Tokyo Night palette',
  author: { id: 'me', username: 'maya' },
  version: 1,
  installs: 120,
  createdAt: 0,
  updatedAt: 0,
  screenshot: '/screenshots/Xk3p9QaL2m/1',
  status: 'live' as const,
};

export const Update = {
  ...editor({ ...WITH_RULE, publishing: true }),
  parameters: {
    chrome: {
      gallery: {
        account: { ...tokyoNight.author, usernameConfirmed: true },
        styles: [tokyoNight],
        published: {
          styleId: tokyoNight.id,
          version: 1,
          cssHash: '',
          group: tokyoNight.group,
          slug: tokyoNight.slug,
        },
      },
    },
  },
};
