<template>
  <property-row property="text-decoration" :label="t('text_decoration')">
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
          title: this.t('underline'),
          html: '<span style="text-decoration: underline">U</span>',
          value: 'underline',
        },
        {
          title: this.t('strikethrough'),
          html: '<span style="text-decoration: line-through">S</span>',
          value: 'line-through',
        },
        {
          title: this.t('overline'),
          html: '<span style="text-decoration: overline">A</span>',
          value: 'overline',
        },
        { title: this.t('none'), html: this.t('none'), value: 'none' },
      ],
    };
  },
});
</script>
