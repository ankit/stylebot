import type { Meta } from '@storybook/vue';

import SCallout from './SCallout.vue';
import { fromTemplate, playground } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/SCallout',
  component: SCallout,
  argTypes: {
    tone: { control: 'radio', options: ['info', 'warning', 'danger'] },
    label: { control: 'text' },
  },
  args: { tone: 'info', label: 'Your styles are up to date.' },
};

export default meta;

const components = { SCallout };

export const Playground = playground(
  components,
  `<s-callout :tone="tone">{{ label }}</s-callout>`
);

export const Tones = fromTemplate(
  components,
  `
  <div style="display: flex; flex-direction: column; gap: 12px; max-width: 360px">
    <s-callout tone="info">Your styles are up to date.</s-callout>
    <s-callout tone="warning">The Gallery took these out of your CSS.</s-callout>
    <s-callout tone="danger">Couldn't reach the Gallery. Check your connection and try again.</s-callout>
    <s-callout tone="info" @dismiss="() => {}">Dismissable, with a close button.</s-callout>
  </div>
`
);
