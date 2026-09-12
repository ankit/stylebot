<template>
  <property-row :label="t('line_height')">
    <length property="line-height" :sizes="sizes" />
  </property-row>
</template>

<script lang="ts">
import Vue from 'vue';

import Length from '../Length.vue';
import PropertyRow from '../basic/PropertyRow.vue';

export default Vue.extend({
  name: 'LineHeight',

  components: {
    Length,
    PropertyRow,
  },

  data(): {
    sizes: Array<string>;
  } {
    return {
      sizes: ['12', '14', '18', '24', '30', '36', '48'],
    };
  },
});
</script>
