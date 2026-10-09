import type { Meta, StoryObj } from '@storybook/vue';

import SCopyButton from './SCopyButton.vue';
import { focusViaTab, fromTemplate } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Buttons/SCopyButton',
  component: SCopyButton,
};

export default meta;

const template = `<s-copy-button text="npm install -g @stylebot/cli" />`;

export const Default = fromTemplate({ SCopyButton }, template);

export const Focused: StoryObj = {
  ...fromTemplate({ SCopyButton }, template),
  play: ({ canvasElement }) => focusViaTab(canvasElement),
};
