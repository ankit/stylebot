<template>
  <property-row property="text-transform" :label="t('case')">
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
        { title: this.t('capitalize'), html: 'Aa', value: 'capitalize' },
        { title: this.t('uppercase'), html: 'AA', value: 'uppercase' },
        { title: this.t('lowercase'), html: 'aa', value: 'lowercase' },
        { title: this.t('none'), html: this.t('none'), value: 'none' },
      ],
    };
  },
});
</script>
