<template>
  <property-row :label="t('text_decoration')">
    <css-property-value-group property="text-decoration" :options="options" />
  </property-row>
</template>

<script lang="ts">
import Vue from 'vue';

import CssPropertyValueGroup from '../CssPropertyValueGroup.vue';
import PropertyRow from '../basic/PropertyRow.vue';

export default Vue.extend({
  name: 'TextDecoration',

  components: {
    CssPropertyValueGroup,
    PropertyRow,
  },

  data(): {
    options: Array<{ title: string; html: string; value: string }>;
  } {
    return {
      options: [
        {
          title: 'Underline',
          html: '<span style="text-decoration: underline">U</span>',
          value: 'underline',
        },
        {
          title: 'Strikethrough',
          html: '<span style="text-decoration: line-through">S</span>',
          value: 'line-through',
        },
        {
          title: 'Overline',
          html: '<span style="text-decoration: overline">A</span>',
          value: 'overline',
        },
        { title: 'None', html: 'None', value: 'none' },
      ],
    };
  },
});
</script>
