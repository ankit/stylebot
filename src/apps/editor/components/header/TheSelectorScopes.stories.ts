import type { Meta, StoryObj } from '@storybook/vue';

import TheSelectorScopes from './TheSelectorScopes.vue';
import { editor } from '@stylebot/storybook/fixtures/editor';

const meta: Meta = {
  title: 'Editor/Scope pills',
  component: TheSelectorScopes,
  parameters: { padded: false },
};

export default meta;

const ALTERNATIVES = {
  selector: '.article-body',
  existing: [],
  candidates: ['.sb-page > p:first-of-type', '.article-body', '.sb-page *'],
  descriptions: { '.article-body': { role: 'similar' as const } },
};

export const AfterPick: StoryObj = editor({
  activeSelector: '.article-body',
  selectorAlternatives: ALTERNATIVES,
});

export const OnlySelected: StoryObj = editor({
  activeSelector: '.sb-page > p:first-of-type',
  selectorAlternatives: ALTERNATIVES,
});
