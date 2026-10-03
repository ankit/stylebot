<template>
  <property-row property="line-height" :label="t('line_height')">
    <length property="line-height" />
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
});
</script>
