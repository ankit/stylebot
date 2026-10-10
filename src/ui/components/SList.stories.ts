import type { Meta } from '@storybook/vue';

import SList from './SList.vue';
import SListItem from './SListItem.vue';
import SText from './SText.vue';
import SToggleSwitch from './SToggleSwitch.vue';
import { fromTemplate } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Primitives/Display/SList',
  component: SList,
};

export default meta;

const tile =
  '<span style="width: 28px; height: 28px; border: 1px solid var(--panel-border); border-radius: 7px"></span>';

export const Default = fromTemplate(
  { SList, SListItem, SText, SToggleSwitch },
  `
  <s-list style="width: 560px">
    <s-list-item as="button" type="button" interactive>
      <template #icon>${tile}</template>
      <template #title>news.ycombinator.com</template>
      <template #meta>
        <s-text as="span" variant="muted">2 profiles · about 1 hour ago</s-text>
      </template>
      <template #trailing><s-toggle-switch :value="true" /></template>
    </s-list-item>
    <s-list-item muted>
      <template #icon>${tile}</template>
      <template #title>mail.google.com</template>
      <template #meta>
        <s-text as="span" variant="muted">2 days ago</s-text>
      </template>
      <template #trailing><s-toggle-switch :value="false" /></template>
    </s-list-item>
  </s-list>
`
);

export const Compact = fromTemplate(
  { SList, SListItem, SText },
  `
  <s-list style="width: 560px">
    <s-list-item compact>
      <template #meta><s-text as="span" size="large">Edited a stylesheet</s-text></template>
    </s-list-item>
    <s-list-item compact>
      <template #meta><s-text as="span" size="large">Added a profile</s-text></template>
    </s-list-item>
  </s-list>
`
);
