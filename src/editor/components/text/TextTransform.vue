<template>
  <property-row :label="t('text_transform')">
    <css-property-value-group property="text-transform" :options="options" />
  </property-row>
</template>

<script lang="ts">
import Vue from 'vue';

import CssPropertyValueGroup from '../CssPropertyValueGroup.vue';
import PropertyRow from '../basic/PropertyRow.vue';

export default Vue.extend({
  name: 'TextTransform',

  components: {
    CssPropertyValueGroup,
    PropertyRow,
  },

  data(): {
    options: Array<{ title: string; html: string; value: string }>;
  } {
    return {
      options: [
        { title: 'Capitalize', html: 'Ab', value: 'capitalize' },
        { title: 'Uppercase', html: 'AB', value: 'uppercase' },
        { title: 'Lowercase', html: 'ab', value: 'lowercase' },
        { title: 'None', html: 'None', value: 'none' },
      ],
    };
  },
});
</script>
