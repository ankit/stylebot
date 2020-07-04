<template>
  <div>
    <dark-mode class="mt-3" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import DarkMode from './magic/DarkMode.vue';

export default Vue.extend({
  name: 'TheMagicProperties',

  components: {
    DarkMode,
  },
});
</script>
