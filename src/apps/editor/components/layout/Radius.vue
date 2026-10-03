<template>
  <property-row property="border-radius" :label="t('radius')">
    <length property="border-radius" />
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
});
</script>
