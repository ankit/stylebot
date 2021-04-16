<template>
  <div class="window-actions">
    <the-move-action class="window-action move-window-action" />
    <the-close-action class="window-action close-window-action" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import TheMoveAction from './TheMoveAction.vue';
import TheCloseAction from './TheCloseAction.vue';

export default Vue.extend({
  name: 'TheWindowActions',

  components: {
    TheMoveAction,
    TheCloseAction,
  },
});
</script>

<style lang="scss" scoped>
.window-action {
  top: 0;
  margin: 0;
  padding: 0;
  border: none;
  font-size: 15px;
  background: none;
  position: absolute;

  &.move-window-action {
    right: 20px;
  }

  &.close-window-action {
    right: 0;
  }
}
</style>
