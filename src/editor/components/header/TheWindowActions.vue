<template>
  <div>
    <the-options-action class="window-action" />
    <the-move-action class="window-action move-window-action" />
    <the-close-action class="window-action close-window-action" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import TheMoveAction from './TheMoveAction.vue';
import TheCloseAction from './TheCloseAction.vue';
import TheOptionsAction from './TheOptionsAction.vue';

export default Vue.extend({
  name: 'TheWindowActions',

  components: {
    TheMoveAction,
    TheCloseAction,
    TheOptionsAction,
  },
});
</script>

<style lang="scss" scoped>
.window-action {
  margin: 0;
  padding: 0;
  border: none;
  font-size: 15px;
  background: none;
  position: absolute;
  top: 0;
  left: 5.5px;

  &.move-window-action {
    left: 24px;
  }

  &.close-window-action {
    left: 42px;
  }
}
</style>
