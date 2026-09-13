<template>
  <div>
    <color />
    <background-color />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import Color from './color/Color.vue';
import BackgroundColor from './color/BackgroundColor.vue';

export default Vue.extend({
  name: 'TheColorProperties',

  components: {
    Color,
    BackgroundColor,
  },
});
</script>
