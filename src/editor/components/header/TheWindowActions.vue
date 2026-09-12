<template>
  <div class="window-actions">
    <the-more-action />
    <the-close-action />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import TheMoreAction from './TheMoreAction.vue';
import TheCloseAction from './TheCloseAction.vue';

export default Vue.extend({
  name: 'TheWindowActions',

  components: {
    TheMoreAction,
    TheCloseAction,
  },
});
</script>

<style lang="scss" scoped>
.window-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
