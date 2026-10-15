import type { Meta } from '@storybook/vue';

import SExternalLink from './SExternalLink.vue';
import SText from './SText.vue';
import { fromTemplate, playground } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Links/SExternalLink',
  component: SExternalLink,
  argTypes: { label: { control: 'text' } },
  args: { label: 'Stylebot Gallery' },
};

export default meta;

const components = { SExternalLink, SText };

export const Playground = playground(
  components,
  `<s-external-link href="https://gallery.stylebot.dev">{{ label }}</s-external-link>`
);

export const InContext = fromTemplate(
  components,
  `
  <s-text size="large">
    Share this style in the
    <s-external-link href="https://gallery.stylebot.dev">Stylebot Gallery</s-external-link>,
    where anyone can install it.
  </s-text>
`
);
