<template>
  <property-row property="font-size" :label="t('font_size')">
    <length property="font-size" />
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
});
</script>
