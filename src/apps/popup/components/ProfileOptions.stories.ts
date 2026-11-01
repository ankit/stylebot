import type { Meta } from '@storybook/vue';

import ProfileOptions from './ProfileOptions.vue';
import {
  optionsStyle,
  popup,
  profiledStyle,
} from '@stylebot/storybook/fixtures/popup';

const meta: Meta = {
  title: 'Browser Action/Style Options',
  component: ProfileOptions,
  parameters: { padded: false },
};

export default meta;

export const WithOptions = popup({
  styles: [optionsStyle('example.com')],
  defaultStyle: optionsStyle('example.com'),
});

export const WithChosenOptions = popup({
  styles: [
    {
      ...optionsStyle('example.com'),
      profileOptions: {
        default: { scheme: 'dark', accentColor: 'blue', rounded: '1' },
      },
    },
  ],
  defaultStyle: optionsStyle('example.com'),
});

// The applied profile's css is the style's own; the others keep theirs.
const profiled = {
  ...profiledStyle('example.com'),
  css: optionsStyle('example.com').css,
  profiles: {
    default: { name: '', css: 'h1 { color: red; }' },
    dark: { name: 'Dark' },
  },
  activeProfile: 'dark',
};

export const WithProfilesAndOptions = popup({
  styles: [profiled],
  defaultStyle: profiled,
});
