<template>
  <property-row :label="t('text_align')">
    <css-property-value-group property="text-align" :options="options" />
  </property-row>
</template>

<script lang="ts">
import Vue from 'vue';

import CssPropertyValueGroup from '../CssPropertyValueGroup.vue';
import PropertyRow from '../basic/PropertyRow.vue';

const icon = (paths: string): string =>
  `<svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="${paths}"></path></svg>`;

export default Vue.extend({
  name: 'TextAlign',

  components: {
    CssPropertyValueGroup,
    PropertyRow,
  },

  data(): {
    options: Array<{ title: string; html: string; value: string }>;
  } {
    return {
      options: [
        { title: 'Align Left', value: 'left', html: icon('M2 3.5h10M2 7h6.5M2 10.5h9') },
        { title: 'Align Center', value: 'center', html: icon('M2 3.5h10M3.7 7h6.5M2.5 10.5h9') },
        { title: 'Align Right', value: 'right', html: icon('M2 3.5h10M5.5 7H12M3 10.5h9') },
      ],
    };
  },
});
</script>
