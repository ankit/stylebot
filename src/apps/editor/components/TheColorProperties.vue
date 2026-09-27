<template>
  <div>
    <background-color />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import BackgroundColor from './color/BackgroundColor.vue';

export default Vue.extend({
  name: 'TheColorProperties',

  components: {
    BackgroundColor,
  },
});
</script>
