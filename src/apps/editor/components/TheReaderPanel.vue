<template>
  <div class="reader-panel">
    <the-readability />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import TheReadability from './reader/TheReadability.vue';

export default Vue.extend({
  name: 'TheReaderPanel',

  components: {
    TheReadability,
  },

  // Whether the page is readerable can have changed since the store looked.
  created() {
    this.$store.dispatch('refreshPage');
  },
});
</script>

<style lang="scss" scoped>
.reader-panel {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex: 1 0 auto;
  gap: 10px;
  padding: 12px var(--panel-gutter);
  background: var(--tab-surface);
}
</style>
