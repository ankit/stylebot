import type { Meta } from '@storybook/vue';

import ThemeProvider from './ThemeProvider.vue';
import Heading from './Heading.vue';
import SText from './SText.vue';
import { fromTemplate } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Theme/ThemeProvider',
  component: ThemeProvider,
};

export default meta;

const TOKEN_GROUPS: Array<{ label: string; tokens: Array<string> }> = [
  {
    label: 'Surfaces',
    tokens: [
      'panel-surface',
      'panel-border',
      'panel-shadow',
      'card-surface',
      'tab-surface',
      'hover-tint',
      'active',
    ],
  },
  {
    label: 'Text',
    tokens: [
      'text-primary',
      'text-secondary',
      'text-muted',
      'text-faint',
      'icon-color',
    ],
  },
  {
    label: 'Accent',
    tokens: ['accent', 'accent-ink', 'accent-text'],
  },
  {
    label: 'Selection',
    tokens: ['selection', 'selection-ink'],
  },
  {
    label: 'Fields',
    tokens: [
      'field-border',
      'field-border-hover',
      'field-border-selector',
      'field-fill',
      'field-divider',
      'slider-track',
    ],
  },
  {
    label: 'Menus',
    tokens: ['menu-surface', 'menu-border', 'menu-shadow'],
  },
  {
    label: 'Status',
    tokens: [
      'info',
      'info-border',
      'danger',
      'danger-background',
      'danger-border',
    ],
  },
];

/* Every color token as a swatch — a cheap tripwire for palette changes. */
export const Tokens = fromTemplate(
  { Heading },
  `
  <div class="sb-token-groups">
    <section v-for="group in groups" :key="group.label" class="sb-token-group">
      <heading as="h2" size="sm">{{ group.label }}</heading>
      <div class="sb-tokens">
        <div v-for="token in group.tokens" :key="token" class="sb-token">
          <span class="sb-swatch" :style="{ background: 'var(--' + token + ')' }" />
          <code>--{{ token }}</code>
        </div>
      </div>
    </section>
  </div>
`,
  { data: () => ({ groups: TOKEN_GROUPS }) }
);

/* The paragraph pre-selected, so the highlight is visible in both themes. */
export const Selection = fromTemplate(
  { SText },
  `<s-text style="width: 260px">Selected text keeps its contrast in light and dark mode.</s-text>`,
  {
    play: async ({ canvasElement }) => {
      const range = document.createRange();
      range.selectNodeContents(canvasElement.querySelector('p') as Node);
      window.getSelection()?.addRange(range);
    },
  }
);
