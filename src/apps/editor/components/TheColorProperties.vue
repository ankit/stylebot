<template>
  <div>
    <color />
    <background-color />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import BackgroundColor from './color/BackgroundColor.vue';
import Color from './color/Color.vue';

export default Vue.extend({
  name: 'TheColorProperties',

  components: {
    BackgroundColor,
    Color,
  },
});
</script>
