<template>
  <div>
    <opacity />
    <filter-control />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import Opacity from './effects/Opacity.vue';
import FilterControl from './effects/Filter.vue';

export default Vue.extend({
  name: 'TheEffectsProperties',

  components: {
    Opacity,
    FilterControl,
  },
});
</script>
