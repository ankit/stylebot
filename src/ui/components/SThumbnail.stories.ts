import type { Meta } from '@storybook/vue';

import SThumbnail from './SThumbnail.vue';
import { fromTemplate, playground } from '@stylebot/storybook/story-helpers';

const SCREENSHOT = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800"><rect width="1280" height="800" fill="#1a1b26"/><rect x="80" y="60" width="520" height="40" rx="8" fill="#7aa2f7"/><rect x="80" y="140" width="1120" height="24" rx="6" fill="#414868"/><rect x="80" y="190" width="900" height="24" rx="6" fill="#414868"/></svg>'
)}`;

const meta: Meta = {
  title: 'Primitives/SThumbnail',
  component: SThumbnail,
  argTypes: {
    width: { control: 'number' },
    height: { control: 'number' },
  },
  args: { src: SCREENSHOT, width: 52, height: 32 },
};

export default meta;

const components = { SThumbnail };

export const Playground = playground(
  components,
  `<s-thumbnail :src="src" :width="width" :height="height" />`
);

export const Sizes = fromTemplate(
  components,
  `
  <div class="sb-row" style="align-items: flex-start">
    <s-thumbnail src="${SCREENSHOT}" :width="52" :height="32" />
    <s-thumbnail src="${SCREENSHOT}" :width="69" :height="43" />
    <div style="width: 240px"><s-thumbnail src="${SCREENSHOT}" /></div>
  </div>
`
);
