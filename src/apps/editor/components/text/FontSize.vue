<template>
  <property-row :label="t('font_size')">
    <length property="font-size" :sizes="sizes" />
  </property-row>
</template>

<script lang="ts">
import Vue from 'vue';

import Length from '../Length.vue';
import PropertyRow from '../basic/PropertyRow.vue';

export default Vue.extend({
  name: 'FontSize',

  components: {
    Length,
    PropertyRow,
  },

  data(): {
    sizes: Array<string>;
  } {
    return {
      sizes: [
        '9',
        '10',
        '11',
        '12',
        '14',
        '18',
        '24',
        '30',
        '36',
        '48',
        '64',
        '72',
        '96',
      ],
    };
  },
});
</script>
