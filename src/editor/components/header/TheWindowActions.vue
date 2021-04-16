<template>
  <div class="window-actions">
    <the-dock-to-right-action
      class="window-action dock-to-right-window-action"
    />
    <the-move-action class="window-action move-window-action" />
    <the-close-action class="window-action close-window-action" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import TheMoveAction from './TheMoveAction.vue';
import TheCloseAction from './TheCloseAction.vue';
import TheDockToRightAction from './TheDockToRightAction.vue';

export default Vue.extend({
  name: 'TheWindowActions',

  components: {
    TheMoveAction,
    TheCloseAction,
    TheDockToRightAction,
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

  &.dock-to-right-window-action {
    right: 40px;
  }

  &.move-window-action {
    right: 20px;
    font-size: 14px;
  }

  &.close-window-action {
    right: 0;
  }
}
</style>
