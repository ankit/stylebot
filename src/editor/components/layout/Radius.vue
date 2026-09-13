<template>
  <property-row :label="t('radius')" last>
    <length property="border-radius" :sizes="sizes" />
  </property-row>
</template>

<script lang="ts">
import Vue from 'vue';

import Length from '../Length.vue';
import PropertyRow from '../basic/PropertyRow.vue';

export default Vue.extend({
  name: 'Radius',

  components: {
    Length,
    PropertyRow,
  },

  data(): {
    sizes: Array<string>;
  } {
    return {
      sizes: ['0', '2', '4', '6', '8', '12', '16', '24'],
    };
  },
});
</script>
